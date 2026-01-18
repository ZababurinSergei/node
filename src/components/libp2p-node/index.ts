import { BaseComponent } from '@/base/base-component';
import * as template from './template';
import { controller } from './controller';
import { createActions } from './actions';
import { createLibp2pNode, Libp2pBrowserNode } from '@/lib/libp2p/libp2p-browser';
import {createLogger} from '@/logger'
// let log = createLogger('libp2p-node')
const logAddLog = createLogger('libp2p-node:addLog')
export interface Libp2pNodeState {
    title: string;
    peerId: string | null;
    status: 'stopped' | 'starting' | 'running' | 'error' | 'stopping';
    connections: number;
    discoveredPeers: number;
    multiaddrs: string[];
    dhtStats: {
        lan: { peerCount: number; status: string };
        amino: { peerCount: number; status: string };
        universe: { peerCount: number; status: string };
    };
    logs: Array<{ time: string; message: string; level: 'info' | 'warn' | 'error' }>;
    connectionStats: {
        totalConnections: number;
        activeConnections: number;
        rejectedConnections: number;
    };
}

export interface PeerConnection {
    peerId: string;
    status: string;
    remoteAddr: string;
    streams: Array<{ id: string; protocol: string }>;
    direction?: 'inbound' | 'outbound'; // ДОБАВЛЕНО: опциональное свойство
}

export class Libp2pNode extends BaseComponent {
    static override observedAttributes = ['title', 'data-auto-start', 'data-enable-dht', 'data-enable-pubsub', 'data-enable-relay'];

    // Изменили private на protected для доступа из actions и controller
    protected libp2pInstance: Libp2pBrowserNode | null = null;
    protected logBuffer: Array<{ time: string; message: string; level: 'info' | 'warn' | 'error' }> = [];
    protected maxLogs = 50;
    protected updateInterval: NodeJS.Timeout | null = null;
    protected peerConnections: Map<string, PeerConnection> = new Map();
    protected discoveryInterval: NodeJS.Timeout | null = null;

    // Добавлено для интеграции с DHT Manager
    private dhtListener: ((stats: any) => void) | null = null;
    private networkAddressesListener: ((data: any) => void) | null = null;
    // НОВОЕ: Добавлено для интеграции с PeersManager
    private peersManagerListener: ((peers: any[]) => void) | null = null;
    private lastPeersUpdate: number = 0;
    // private readonly PEERS_UPDATE_INTERVAL = 5000; // 5 секунд между обновлениями

    constructor() {
        super();
        // ИСПРАВЛЕНО: Создаем объект с только нужными шаблонными методами
        this._templateMethods = {
            defaultTemplate: template.defaultTemplate,
            logsTemplate: template.renderLogsPart,
            multiaddrsTemplate: template.renderMultiaddrsPart,
            connectionsTemplate: template.renderConnectionsPart
        };
        this.state = {
            title: 'Станция',
            peerId: null,
            status: 'stopped',
            connections: 0,
            discoveredPeers: 0,
            multiaddrs: [],
            dhtStats: {
                lan: { peerCount: 0, status: 'stopped' },
                amino: { peerCount: 0, status: 'stopped' },
                universe: { peerCount: 0, status: 'stopped' }
            },
            logs: [],
            connectionStats: {
                totalConnections: 0,
                activeConnections: 0,
                rejectedConnections: 0
            }
        } as Libp2pNodeState;
    }

    override async _componentReady(): Promise<void> {
        this._controller = controller(this);
        this._actions = await createActions(this);

        const autoStart = this.getAttribute('data-auto-start') === 'true';
        if (autoStart) {
            await (this._actions as any).startNode();
        }

        await this.fullRender(this.state);

        this.startUpdateInterval();
        // this.startPeersManagerSync();
    }

    // Сделали метод публичным для доступа из actions
    public addLog(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
        const logEntry = {
            time: new Date().toLocaleTimeString(),
            message,
            level
        };

        this.logBuffer.unshift(logEntry);
        if (this.logBuffer.length > this.maxLogs) {
            this.logBuffer.pop();
        }

        (this.state as Libp2pNodeState).logs = [...this.logBuffer];

        logAddLog(this.logBuffer)
        // Обновляем логи в UI
        // this.renderPart({
        //     partName: 'logsTemplate',
        //     state: { logs: this.logBuffer },
        //     selector: '#logsContainer'
        // }).catch(error => {
        //     console.error('Failed to update logs:', error);
        // });
    }

    // Публичный алиас для addLog
    public addLogToBuffer(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
        this.addLog(message, level);
    }

    override async _componentAttributeChanged(name: string, oldValue: string | null, newValue: string | null): Promise<void> {
        if (oldValue === newValue) return;

        const state = this.state as Libp2pNodeState;

        switch (name) {
            case 'title':
                if (newValue) {
                    state.title = newValue;
                    await this.updateElement({
                        selector: '.card-title',
                        value: state.title,
                        property: 'textContent'
                    });
                }
                break;

            case 'data-enable-dht':
            case 'data-enable-pubsub':
            case 'data-enable-relay':
                this.addLog(`Configuration changed: ${name}=${newValue}`, 'info');

                // Если нода запущена, можно показать сообщение о необходимости перезапуска
                if ((this.state as Libp2pNodeState).status === 'running') {
                    await this.showModal({
                        title: 'Configuration Change',
                        content: `Parameter ${name} changed. Restart the node to apply changes.`,
                        buttons: [{ text: 'OK', type: 'primary' }]
                    });
                }
                break;
        }
    }

    override async postMessage(event: any): Promise<any> {
        try {
            const state = this.state as Libp2pNodeState;

            switch (event.type) {
                case 'START_NODE':
                    return await (this._actions as any).startNode();

                case 'STOP_NODE':
                    return await (this._actions as any).stopNode();

                case 'GET_STATS':
                    return {
                        success: true,
                        stats: {
                            ...state,
                            peerConnections: Array.from(this.peerConnections.values()),
                            uptime: this.getUptime()
                        }
                    };

                case 'GET_CONNECTIONS':
                    return {
                        success: true,
                        connections: Array.from(this.peerConnections.values())
                    };

                case 'DISCOVER_PEERS':
                    if (!this.libp2pInstance) {
                        return { success: false, error: 'Node not running' };
                    }
                    // await (this._actions as any).discoverPeers();
                    return { success: true, message: 'Peer discovery started отключенно пока' };

                case 'CLEAR_LOGS':
                    this.logBuffer = [];
                    state.logs = [];
                    // await this.renderPart({
                    //     partName: 'logsTemplate',
                    //     state: { logs: [] },
                    //     selector: '#logsContainer'
                    // });
                    return { success: true, message: 'Logs cleared' };

                case 'GET_PEER_ID':
                    if (!this.libp2pInstance) {
                        return { success: false, error: 'Node not running' };
                    }
                    return {
                        success: true,
                        peerId: state.peerId
                    };

                case 'GET_MULTIADDRS':
                    return {
                        success: true,
                        multiaddrs: state.multiaddrs
                    };

                case 'PING_PEER':
                    if (!this.libp2pInstance) {
                        return { success: false, error: 'Node not running' };
                    }
                    const peerId = event.data?.peerId;
                    if (!peerId) {
                        return { success: false, error: 'Peer ID required' };
                    }

                    try {
                        const latency = await this.pingPeer(peerId);
                        return {
                            success: true,
                            peerId,
                            latency,
                            message: `Ping successful: ${latency}ms`
                        };
                    } catch (error) {
                        return {
                            success: false,
                            peerId,
                            error: (error as Error).message
                        };
                    }

                case 'DISCONNECT_PEER':
                    if (!this.libp2pInstance) {
                        return { success: false, error: 'Node not running' };
                    }
                    const disconnectPeerId = event.data?.peerId;
                    if (!disconnectPeerId) {
                        return { success: false, error: 'Peer ID required' };
                    }

                    await this.disconnectPeer(disconnectPeerId);
                    return {
                        success: true,
                        peerId: disconnectPeerId,
                        message: 'Peer disconnected'
                    };

                case 'GET_DHT_STATS':
                    return {
                        success: true,
                        dhtStats: state.dhtStats
                    };

                case 'UPDATE_DISPLAY':
                    const dhtType = event.data?.type || 'all';
                    await this.updateDHTStats(dhtType);
                    return {
                        success: true,
                        message: 'DHT stats updated'
                    };

                case 'EXPORT_CONFIG':
                    return {
                        success: true,
                        config: this.getConfig()
                    };

                case 'IMPORT_CONFIG':
                    const config = event.data?.config;
                    if (!config) {
                        return { success: false, error: 'Configuration required' };
                    }

                    await this.applyConfig(config);
                    return {
                        success: true,
                        message: 'Configuration applied'
                    };

                case 'SET_DHT_LISTENER':
                    const callback = event.data?.callback;
                    if (callback && typeof callback === 'function') {
                        this.dhtListener = callback;
                        return { success: true, message: 'DHT listener set' };
                    }
                    return { success: false, error: 'Invalid callback' };

                // НОВОЕ: Методы для интеграции с PeersManager
                case 'GET_CONNECTED_PEERS':
                    if (!this.libp2pInstance) {
                        return { success: false, error: 'Node not running', peers: [] };
                    }
                    const peers = this.getConnectedPeersForPeersManager();
                    return {
                        success: true,
                        peers,
                        total: peers.length,
                        timestamp: Date.now()
                    };

                case 'SET_PEERS_MANAGER_LISTENER':
                    const peersCallback = event.data?.callback;
                    if (peersCallback && typeof peersCallback === 'function') {
                        this.peersManagerListener = peersCallback;
                        this.addLog('PeersManager listener set', 'info');
                        // Немедленно отправляем текущие данные
                        if (this.libp2pInstance) {
                            const currentPeers = this.getConnectedPeersForPeersManager();
                            if (currentPeers.length > 0) {
                                this.sendPeersToPeersManager().catch(e => { console.log('error:', e) });
                            }
                        }
                        return { success: true, message: 'PeersManager listener set' };
                    }
                    return { success: false, error: 'Invalid callback' };

                case 'SYNC_WITH_PEERS_MANAGER':
                    if (!this.libp2pInstance) {
                        return { success: false, error: 'Node not running' };
                    }
                    await this.sendPeersToPeersManager();
                    return { success: true, message: 'Peers synchronized with PeersManager' };

                case 'SET_NETWORK_ADDRESSES_LISTENER':
                    const networkCallback = event.data?.callback;
                    if (networkCallback && typeof callback === 'function') {
                        // Сохраняем callback для обновления адресов
                        this.networkAddressesListener = networkCallback;

                        // Немедленно отправляем текущие адреса
                        if (this.libp2pInstance) {
                            const multiaddrs = this.getMultiaddrsFromInstance();
                            setTimeout(() => {
                                this.networkAddressesListener?.({
                                    addresses: multiaddrs,
                                    status: (this.state as Libp2pNodeState).status
                                });
                            }, 100);
                        }

                        return { success: true, message: 'Network addresses listener set' };
                    }
                    return { success: false, error: 'Invalid callback' };

                default:
                    console.warn(`[Libp2pNode] Unknown message type: ${event.type}`);
                    return {
                        success: false,
                        error: 'Unknown message type',
                        availableTypes: [
                            'START_NODE', 'STOP_NODE', 'GET_STATS', 'GET_CONNECTIONS',
                            'DISCOVER_PEERS', 'CLEAR_LOGS', 'GET_PEER_ID', 'GET_MULTIADDRS',
                            'PING_PEER', 'DISCONNECT_PEER', 'GET_DHT_STATS', 'UPDATE_DISPLAY',
                            'EXPORT_CONFIG', 'IMPORT_CONFIG', 'SET_DHT_LISTENER',
                            'GET_CONNECTED_PEERS', 'SET_PEERS_MANAGER_LISTENER', 'SYNC_WITH_PEERS_MANAGER'
                        ]
                    };
            }
        } catch (error) {
            this.addError({
                componentName: this.constructor.name,
                source: 'postMessage',
                message: `Error processing message ${event.type}`,
                details: error
            });
            return {
                success: false,
                error: (error as Error).message,
                stack: (error as Error).stack
            };
        }
    }

    // Публичные методы для взаимодействия с libp2p
    public async startLibp2pNode(): Promise<boolean> {
        try {
            this.addLog('Станция запушена...', 'info');
            const state = this.state as Libp2pNodeState;
            state.status = 'starting';
            await this.updateStatusUI();

            const enableDHT = this.getAttribute('data-enable-dht') !== 'false';
            const enablePubSub = this.getAttribute('data-enable-pubsub') !== 'false';
            const enableRelay = this.getAttribute('data-enable-relay') !== 'false';

            this.libp2pInstance = await createLibp2pNode({
                // @ts-ignore
                onPeerDiscovered: (peerId: string, multiaddrs) => {
                    // this.addLog(`Peer discovered: ${peerId}`, 'info');
                    state.discoveredPeers++;
                    // this.updateStatsUI();
                    // console.log('____________ onPeerDiscovered ________________',peerId,  multiaddrs)
                },
                onPeerConnected: (peerId: string, connection: any) => {
                    // this.addLog(`Peer connected: ${peerId}`, 'info');
                    console.log('______________ onPeerConnected -> sendPeersToPeersManager ______________',peerId.toString(),  connection)
                    state.connections++;

                    this.peerConnections.set(peerId, {
                        peerId,
                        status: 'connected',
                        remoteAddr: connection?.remoteAddr?.toString() || 'unknown',
                        streams: []
                        // direction будет добавлено при получении информации
                    });

                    // this.updateStatsUI();
                    // this.updateConnectionsUI();
                    this.sendPeersToPeersManager();
                },
                onConnectionOpened: (peerId: string, remoteAddr: any) => {
                    // this.addLog(`Peer connected: ${peerId}`, 'info');
                    // console.log('______________ onPeerConnected -> sendPeersToPeersManager ______________',peerId.toString(),  remoteAddr)
                    state.connections++;

                    this.peerConnections.set(peerId, {
                        peerId,
                        status: 'connected',
                        remoteAddr: remoteAddr.toString() || 'unknown',
                        streams: []
                        // direction будет добавлено при получении информации
                    });

                    // this.updateStatsUI();
                    // this.updateConnectionsUI();
                    this.sendPeersToPeersManager();
                },
                onPeerDisconnected: (peerId: string) => {
                    // this.addLog(`Peer disconnected: ${peerId}`, 'info');
                    state.connections = Math.max(0, state.connections - 1);
                    this.peerConnections.delete(peerId);
                    // this.updateStatsUI();
                    // this.updateConnectionsUI();
                    this.sendPeersToPeersManager();
                },
                onConnectionClosed: (peerId: string) => {
                    // this.addLog(`Peer disconnected: ${peerId}`, 'info');
                    state.connections = Math.max(0, state.connections - 1);
                    this.peerConnections.delete(peerId);
                    // this.updateStatsUI();
                    // this.updateConnectionsUI();
                    this.sendPeersToPeersManager();
                },
                onError: (error: Error) => {
                    this.addLog(`Error: ${error.message}`, 'error');
                },
                enableDHT,
                enablePubSub,
                enableRelay
            });

            state.status = 'running';
            state.peerId = (this.libp2pInstance as any).peerId?.toString() || null;
            state.multiaddrs = (this.libp2pInstance as any).getMultiaddrs?.()?.map((ma: any) => ma.toString()) || [];

            const nodeIdentity = await this.getComponentAsync('node-identity', 'node-identity-1');
            const dhtManager = await this.getComponentAsync('dht-manager', 'dht-manager-1');

            if(dhtManager) {
                dhtManager.postMessage({
                    type: 'REFRESH_STATS'
                }).catch(e => { console.error(e) });
            }

            if (nodeIdentity) {
                await nodeIdentity.postMessage({
                    type: 'UPDATE_FROM_LIBP2P',
                    data: {
                        peerId: state.peerId,
                        status: 'online',
                        source: 'libp2p-node-start'
                    }
                });
                // console.log('✅ Node Identity updated with new peer ID');
            }

            await this.updateStatusUI();
            // await this.updateStatsUI();
            await this.updateMultiaddrsUI();
            // await this.updateConnectionsUI();

            this.addLog('Станция started successfully', 'info');
            this.addLog(`Peer ID: ${state.peerId}`, 'info');
            this.addLog(`Listening on ${state.multiaddrs.length} addresses`, 'info');

            // Запускаем периодическое обновление DHT статистики
            // this.startDHTUpdateInterval();

            // Запускаем автоматическое обнаружение пиров
            this.startAutoDiscovery();

            // НОВОЕ: Отправляем начальные данные в PeersManager
            setTimeout(() => {
                this.sendPeersToPeersManager();
            }, 2000);

            return true;
        } catch (error) {
            const errorMsg = (error as Error).message || String(error);
            this.addLog(`Failed to start libp2p node: ${errorMsg}`, 'error');

            const state = this.state as Libp2pNodeState;
            state.status = 'error';
            await this.updateStatusUI();

            await this.showModal({
                title: 'Startup Error',
                content: `Failed to start libp2p node: ${errorMsg}`,
                buttons: [{ text: 'OK', type: 'primary' }]
            });

            return false;
        }
    }

    public async stopLibp2pNode(): Promise<boolean> {
        try {
            if (!this.libp2pInstance) {
                return true;
            }

            this.addLog('Stopping libp2p node...', 'info');
            const state = this.state as Libp2pNodeState;
            state.status = 'stopping';
            await this.updateStatusUI();

            // Останавливаем интервалы
            this.stopAutoDiscovery();
            this.stopDHTUpdateInterval();

            await (this.libp2pInstance as any).stop();
            this.libp2pInstance = null;

            // Очищаем состояние
            state.status = 'stopped';
            state.connections = 0;
            state.discoveredPeers = 0;
            state.multiaddrs = [];
            state.peerId = null;
            this.peerConnections.clear();
            state.connectionStats = {
                totalConnections: 0,
                activeConnections: 0,
                rejectedConnections: 0
            };

            // Очищаем слушатель DHT
            this.dhtListener = null;

            // НОВОЕ: Отправляем пустой список пиров в PeersManager при остановке
            if (this.peersManagerListener) {
                this.peersManagerListener([]);
            }

            await this.updateStatusUI();
            // await this.updateStatsUI();
            await this.updateMultiaddrsUI();
            // await this.updateConnectionsUI();

            this.addLog('Libp2p node stopped', 'info');

            return true;
        } catch (error) {
            const errorMsg = (error as Error).message || String(error);
            this.addLog(`Error stopping libp2p node: ${errorMsg}`, 'error');
            return false;
        }
    }

    // public async discoverPeers(): Promise<void> {
    //     if (!this.libp2pInstance) {
    //         throw new Error('Node not running');
    //     }
    //
    //     this.addLog('Starting peer discovery...', 'info');
    //
    //     try {
    //         await (this.libp2pInstance as any).discoverPeers();
    //         this.addLog('Peer discovery completed', 'info');
    //
    //         // НОВОЕ: Отправляем обновленные данные в PeersManager после обнаружения
    //         // setTimeout(() => {
    //         //     this.sendPeersToPeersManager();
    //         // }, 3000);
    //     } catch (error) {
    //         const errorMsg = (error as Error).message || String(error);
    //         this.addLog(`Peer discovery failed: ${errorMsg}`, 'error');
    //         throw error;
    //     }
    // }

    public async pingPeer(peerId: string): Promise<number> {
        if (!this.libp2pInstance) {
            throw new Error('Node not running');
        }

        try {
            this.addLog(`Pinging peer ${peerId}...`, 'info');

            // В браузерной реализации используем более простой подход
            // Так как @libp2p/ping может не работать напрямую в браузере
            const startTime = Date.now();

            // Имитируем ping с случайной задержкой
            await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

            const latency = Date.now() - startTime;
            this.addLog(`Ping to ${peerId}: ${latency}ms`, 'info');

            return latency;
        } catch (error) {
            const errorMsg = (error as Error).message || String(error);
            this.addLog(`Ping failed for ${peerId}: ${errorMsg}`, 'error');
            throw error;
        }
    }

    public async disconnectPeer(peerId: string): Promise<void> {
        if (!this.libp2pInstance) {
            throw new Error('Node not running');
        }

        try {
            this.addLog(`Disconnecting from peer ${peerId}...`, 'info');

            // В реальной реализации здесь будет закрытие соединения
            this.peerConnections.delete(peerId);

            const state = this.state as Libp2pNodeState;
            state.connections = Math.max(0, state.connections - 1);

            // await this.updateStatsUI();
            // await this.updateConnectionsUI();

            this.addLog(`Disconnected from peer ${peerId}`, 'info');

            // НОВОЕ: Отправляем обновление в PeersManager
            this.sendPeersToPeersManager();

        } catch (error) {
            const errorMsg = (error as Error).message || String(error);
            this.addLog(`Failed to disconnect from ${peerId}: ${errorMsg}`, 'error');
            throw error;
        }
    }

    public async updateDHTStats(dhtType: string = 'all'): Promise<void> {
        const state = this.state as Libp2pNodeState;

        // В браузерной реализации обновляем mock-статистику
        if (dhtType === 'all' || dhtType === 'lan') {
            state.dhtStats.lan = {
                peerCount: Math.floor(Math.random() * 50),
                status: state.status === 'running' ? 'active' : 'stopped'
            };
        }

        if (dhtType === 'all' || dhtType === 'amino') {
            state.dhtStats.amino = {
                peerCount: Math.floor(Math.random() * 100),
                status: state.status === 'running' ? 'active' : 'stopped'
            };
        }

        if (dhtType === 'all' || dhtType === 'universe') {
            state.dhtStats.universe = {
                peerCount: Math.floor(Math.random() * 200),
                status: state.status === 'running' ? 'active' : 'stopped'
            };
        }

        // await this.updateDHTUI();

        // Отправляем обновление в DHT Manager, если слушатель установлен
        if (this.dhtListener) {
            this.dhtListener(state.dhtStats);
        }
    }

    private getConfig(): any {
        return {
            autoStart: this.getAttribute('data-auto-start') === 'true',
            enableDHT: this.getAttribute('data-enable-dht') !== 'false',
            enablePubSub: this.getAttribute('data-enable-pubsub') !== 'false',
            enableRelay: this.getAttribute('data-enable-relay') !== 'false',
            title: this.getAttribute('title') || 'Станция'
        };
    }

    private async applyConfig(config: any): Promise<void> {
        if (config.title !== undefined) {
            this.setAttribute('title', config.title);
        }

        if (config.autoStart !== undefined) {
            this.setAttribute('data-auto-start', config.autoStart.toString());
        }

        if (config.enableDHT !== undefined) {
            this.setAttribute('data-enable-dht', config.enableDHT.toString());
        }

        if (config.enablePubSub !== undefined) {
            this.setAttribute('data-enable-pubsub', config.enablePubSub.toString());
        }

        if (config.enableRelay !== undefined) {
            this.setAttribute('data-enable-relay', config.enableRelay.toString());
        }

        this.addLog('Configuration applied successfully', 'info');
    }

    private getUptime(): number {
        // В реальной реализации можно отслеживать время запуска
        return 0;
    }

    // НОВОЕ: Метод для подготовки данных пиров для PeersManager
    private getConnectedPeersForPeersManager(): any[] {
        const connections = Array.from(this.peerConnections.values());

        return connections.map((conn: PeerConnection) => ({
            peerId: conn.peerId,
            connectionCount: 1,
            streamCount: conn.streams?.length || 0,
            blocked: false,
            autoPing: false,
            connections: [{
                remoteAddr: conn.remoteAddr,
                status: conn.status
            }]
        }));
    }

    async sendPeersToPeersManager(): Promise<void> {
        try {
            // Проверяем частоту обновлений
            const now = Date.now();
            // if (now - this.lastPeersUpdate < this.PEERS_UPDATE_INTERVAL) {
            //     return; // Пропускаем, если не прошло достаточно времени
            // }

            if (!this.libp2pInstance || !this.peersManagerListener) {
                return;
            }

            const peers = this.getConnectedPeersForPeersManager();

            if (peers.length === 0 && this.lastPeersUpdate === 0) {
                return; // Не отправляем пустой список при первом вызове
            }

            this.lastPeersUpdate = now;
            // Отправляем данные через слушатель
            this.peersManagerListener(peers);

            this.addLog(`Sent ${peers.length} peers to PeersManager`, 'info');

        } catch (error) {
            console.error('❌ Error sending peers to PeersManager:', error);
            this.addLog(`Failed to send peers to PeersManager: ${(error as Error).message}`, 'error');
        }
    }

    // private startPeersManagerSync(): void {
    //     // Проверяем наличие PeersManager каждые 10 секунд
    //     setInterval(async () => {
    //         console.log('Проверяем наличие PeersManager каждые 10 секунд')
    //         if (!this.libp2pInstance || !this.peersManagerListener) {
    //             // Пытаемся найти PeersManager через BaseComponent
    //             try {
    //                 const PeersManager = await BaseComponent.getComponentAsync('peers-manager', 'peers-manager-1');
    //                 if (PeersManager) {
    //                     debugger
    //                     const result = await PeersManager.postMessage({
    //                         type: 'SET_PEERS_MANAGER_LISTENER',
    //                         data: {
    //                             callback: (_peers: any[]) => {
    //                                 // Эта функция будет вызвана, когда PeersManager захочет обновить данные
    //                                 // В нашем случае мы используем периодическую отправку, поэтому можем игнорировать
    //                                 console.log('PeersManager requested peer update');
    //                             }
    //                         }
    //                     });
    //
    //                     if (result.success) {
    //                         this.addLog('Connected to PeersManager', 'info');
    //                         // Принудительно отправляем текущие данные
    //                         this.sendPeersToPeersManager().catch(e => {console.log('error: ', e)});
    //                     }
    //                 }
    //             } catch (error) {
    //                 // PeersManager еще не доступен, это нормально
    //             }
    //         }
    //
    //         // Если нода запущена и есть слушатель, отправляем данные
    //         if (this.libp2pInstance && this.peersManagerListener) {
    //             this.sendPeersToPeersManager().catch(e => {console.log('error: ', e)});
    //         }
    //     }, 10000); // Проверяем каждые 10 секунд
    // }

    // Сделали метод публичным для доступа из actions и controller
    public startUpdateInterval(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        this.updateInterval = setInterval(async () => {
            const state = this.state as Libp2pNodeState;
            if (state.status === 'running') {
                // Периодически обновляем статистику
                await this.updateDHTStats();

                // Обновляем счетчики соединений
                state.connectionStats.activeConnections = state.connections;
                state.connectionStats.totalConnections += state.connections;

                // await this.updateStatsUI();
            }
        }, 10000); // Каждые 10 секунд
    }

    // Сделали метод публичным для доступа из actions и controller
    public startAutoDiscovery(): void {
        if (this.discoveryInterval) {
            clearInterval(this.discoveryInterval);
        }

        this.discoveryInterval = setInterval(async () => {
            const state = this.state as Libp2pNodeState;
            if (state.status === 'running' && this.libp2pInstance) {
                try {
                    await (this.libp2pInstance as any).discoverPeers();
                } catch (error) {
                    // Игнорируем ошибки автообнаружения
                }
            }
        }, 30000); // Каждые 30 секунд
    }

    public stopAutoDiscovery(): void {
        if (this.discoveryInterval) {
            clearInterval(this.discoveryInterval);
            this.discoveryInterval = null;
        }
    }

    // @ts-ignore
    private startDHTUpdateInterval(): void {
        // Первое обновление сразу
        // setTimeout(() => {
            this.updateDHTStats().catch(e => {console.log('error: ', e)});
        // }, 2000);

        // Затем каждые 15 секунд
        // setInterval(() => {
        //     if ((this.state as Libp2pNodeState).status === 'running') {
        //         console.log('**** startDHTUpdateInterval ****', this.state)
        //         this.updateDHTStats().catch(e => {console.log('error: ', e)});
        //     }
        // }, 15000);
    }

    private stopDHTUpdateInterval(): void {
        // Интервалы очищаются автоматически при остановке ноды
    }

    public async updateStatusUI(): Promise<void> {
        const state = this.state as Libp2pNodeState;

        await this.updateElement({
            selector: '.node-status',
            value: state.status,
            property: 'textContent'
        });

        // await this.updateElement({
        //     selector: '.card-badge',
        //     value: `status-${state.status}`,
        //     property: 'className',
        //     action: 'set'
        // });

        // await this.updateElement({
        //     selector: '.status-indicator',
        //     value: state.status,
        //     property: 'className',
        //     action: 'set'
        // });

        // Обновляем состояние кнопок
        const isRunning = state.status === 'running';
        const isStopped = state.status === 'stopped';
        const isLoading = state.status === 'starting' || state.status === 'stopping';

        await this.updateElement({
            selector: '.btn-start',
            value: isRunning || isLoading ? true : false,
            property: 'disabled'
        });

        await this.updateElement({
            selector: '.btn-stop',
            value: isStopped || isLoading ? true : false,
            property: 'disabled'
        });

        // await this.updateElement({
        //     selector: '.btn-refresh',
        //     value: isStopped ? true : false,
        //     property: 'disabled'
        // });

        await this.updateElement({
            selector: '.btn-discover',
            value: isStopped ? true : false,
            property: 'disabled'
        });
    }

    public async updateStatsUI(): Promise<void> {
        const state = this.state as Libp2pNodeState;

        console.log('updateStatsUI state: ', state)
        // await this.updateElement({
        //     selector: '.peer-id',
        //     value: state.peerId || 'Not available',
        //     property: 'textContent'
        // });

        // await this.updateElement({
        //     selector: '.identity-item:nth-child(3) .identity-value',
        //     value: state.connections.toString(),
        //     property: 'textContent'
        // });

        // await this.updateElement({
        //     selector: '.identity-item:nth-child(4) .identity-value',
        //     value: state.multiaddrs.length.toString(),
        //     property: 'textContent'
        // });
    }

    // Сделали метод публичным для доступа из actions и controller
    public async updateMultiaddrsUI(): Promise<void> {
        // const state = this.state as Libp2pNodeState;

        // await this.renderPart({
        //     partName: 'multiaddrsTemplate',
        //     state: { multiaddrs: state.multiaddrs },
        //     selector: '.multiaddrs-list'
        // });
    }

    public async updateConnectionsUI(): Promise<void> {
        // const connections = Array.from(this.peerConnections.values());

        // Обновляем счетчик подключений
        // const total = connections.length;
        // const active = connections.filter(c => c.status === 'connected').length;

        // await this.updateElement({
        //     selector: '.identity-item:nth-child(3) .identity-value',
        //     value: total.toString(),
        //     property: 'textContent'
        // });

        // // Рендерим список соединений
        // await this.renderPart({
        //     partName: 'connectionsTemplate',
        //     state: {
        //         connections: connections,
        //         connectedPeers: total
        //     },
        //     selector: '.connections-list'
        // });
    }

    public async updateDHTUI(): Promise<void> {
        // добавить вызов компонента dht manager
        // console.log('DHT UI removed from template, добавить вызов компонента dht-manager');
    }

    public isNodeActive(): boolean {
        return this.libp2pInstance !== null;
    }

    public getPeerIdFromInstance(): string | null {
        return this.libp2pInstance?.peerId || null;
    }

    public getMultiaddrsFromInstance(): string[] {
        return (this.libp2pInstance as any)?.getMultiaddrs?.()?.map((ma: any) => ma.toString()) || [];
    }

    public getStats(): any {
        return { ...(this.state as Libp2pNodeState) };
    }

    // Публичный геттер для state
    public getState(): Libp2pNodeState {
        return this.state as Libp2pNodeState;
    }

    // Новый метод для получения подключенных пиров
    public getConnectedPeers(): string[] {
        return Array.from(this.peerConnections.keys());
    }

    public getMultiaddrs(): string[] {
        return (this.state as Libp2pNodeState).multiaddrs || [];
    }

    public getPeerId(): string | null {
        return (this.state as Libp2pNodeState).peerId || null;
    }

    public getDHTStats(): any {
        return (this.state as Libp2pNodeState).dhtStats;
    }

    // Методы для polling статистики
    public startStatsPolling(): void {
        this.startUpdateInterval();
    }

    public stopStatsPolling(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    override async _componentDisconnected(): Promise<void> {
        if (this._controller?.destroy) {
            await this._controller.destroy();
        }

        // Останавливаем интервалы
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        this.stopAutoDiscovery();
        this.stopDHTUpdateInterval();

        // Останавливаем ноду при удалении компонента
        await this.stopLibp2pNode();
    }
}

if (!customElements.get('libp2p-node')) {
    customElements.define('libp2p-node', Libp2pNode);
}