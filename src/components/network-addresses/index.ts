import { BaseComponent } from '@/base/base-component';
import * as template from './template';
import { controller } from './controller';
import { createActions } from './actions';

export interface NetworkAddressesState {
    addresses: string[];
    isLoading: boolean;
    lastUpdated: number;
    peerId?: string;
    nodeStatus?: 'online' | 'offline' | 'error' | 'loading';
    totalAddresses: number;
    addressStats?: {
        ws: number;
        tcp: number;
        webrtc: number;
        ip4: number;
        ip6: number;
        dns: number;
        quic: number;
    };
    connectionInfo?: {
        libp2pNodeConnected: boolean;
        lastSyncTime?: number; // Исправлено: сделано опциональным
        syncStatus: 'idle' | 'syncing' | 'success' | 'error';
        errorMessage?: string;
    };
    networkMetrics?: {
        connectionQuality: number;
        latency?: number;
        protocolDistribution: Record<string, number>;
        uptime?: number;
        discoveredPeers?: number;
        activeConnections?: number;
    };
}

export class NetworkAddresses extends BaseComponent {
    static override observedAttributes = [
        'title',
        'data-auto-refresh',
        'data-refresh-interval',
        'data-source',
        'data-show-stats',
        'data-auto-sync',
        'data-sync-interval'
    ];

    private refreshInterval: number | null = null;
    private syncInterval: number | null = null;
    private libp2pNode: any = null;
    private libp2pConnectionAttempts = 0;
    private readonly MAX_CONNECTION_ATTEMPTS = 5;
    private metricsUpdateInterval: number | null = null;

    constructor() {
        super();
        this._templateMethods = {
            defaultTemplate: (params: { state: Record<string, any>; context: BaseComponent }) => {
                const state = params.state as NetworkAddressesState;
                return template.defaultTemplate({ state, context: params.context });
            },
            renderAddressesList: (params: { state: Record<string, any>; context: BaseComponent }) => {
                const state = params.state as NetworkAddressesState;
                return template.renderAddressesList({ state, context: params.context });
            },
            renderLoadingState: (params: { state: Record<string, any>; context: BaseComponent }) => {
                const state = params.state as NetworkAddressesState;
                return template.renderLoadingState({ state, context: params.context });
            },
            renderErrorState: (params: { state: Record<string, any>; context: BaseComponent }) => {
                const state = params.state as NetworkAddressesState;
                return template.renderErrorState({ state, context: params.context });
            },
            renderEmptyState: (params: { state: Record<string, any>; context: BaseComponent }) => {
                const state = params.state as NetworkAddressesState;
                return template.renderEmptyState({ state, context: params.context });
            },
            renderStatsTemplate: (params: { state: Record<string, any>; context: BaseComponent }) => {
                const state = params.state as NetworkAddressesState;
                return template.renderStatsTemplate({ state, context: params.context });
            },
            renderConnectionInfo: (params: { state: Record<string, any>; context: BaseComponent }) => {
                const state = params.state as NetworkAddressesState;
                return template.renderConnectionInfo({ state, context: params.context });
            },
            renderNetworkMetrics: (params: { state: Record<string, any>; context: BaseComponent }) => {
                const state = params.state as NetworkAddressesState;
                return template.renderNetworkMetrics({ state, context: params.context });
            }
        };

        this.state = {
            addresses: [],
            isLoading: false,
            lastUpdated: Date.now(),
            totalAddresses: 0,
            addressStats: {
                ws: 0,
                tcp: 0,
                webrtc: 0,
                ip4: 0,
                ip6: 0,
                dns: 0,
                quic: 0
            },
            connectionInfo: {
                libp2pNodeConnected: false,
                syncStatus: 'idle'
            },
            networkMetrics: {
                connectionQuality: 0,
                protocolDistribution: {},
                uptime: 0,
                discoveredPeers: 0,
                activeConnections: 0
            }
        };
    }

    override async _componentReady(): Promise<void> {
        this._controller = controller(this);
        this._actions = await createActions(this);

        await this.fullRender(this.state);

        // const autoRefresh = this.getAttribute('data-auto-refresh') !== 'false';
        // if (autoRefresh) {
        //     debugger
        //     this.startAutoRefresh();
        // }

        // const autoSync = this.getAttribute('data-auto-sync') !== 'false';
        // if (autoSync) {
            // this.startAutoSync();
        // }

        // const source = this.getAttribute('data-source') || 'auto';
        // await this.loadAddressesFromSource(source);

        this.startMetricsUpdate();
    }

    // ДОБАВЛЕНО: Расширенный метод для получения всех данных из libp2p-node
    public async fetchCompleteDataFromLibp2pNode(): Promise<any> {
        try {
            const libp2pNode = await this.getComponentAsync('libp2p-node', 'libp2p-node-1');

            if (!libp2pNode) {
                throw new Error('Libp2p node not found or not ready');
            }

            // Получаем полную статистику ноды
            const statsResponse = await libp2pNode.postMessage({ type: 'GET_STATS' });

            if (!statsResponse.success) {
                throw new Error(statsResponse.error || 'Failed to get node stats');
            }

            const stats = statsResponse.stats;

            // Получаем соединения
            const connectionsResponse = await libp2pNode.postMessage({ type: 'GET_CONNECTIONS' });
            const connections = connectionsResponse.success ? connectionsResponse.connections : [];

            // Получаем DHT статистику
            const dhtResponse = await libp2pNode.postMessage({ type: 'GET_DHT_STATS' });
            const dhtStats = dhtResponse.success ? dhtResponse.dhtStats : {};

            // Получаем multiaddrs
            const multiaddrsResponse = await libp2pNode.postMessage({ type: 'GET_MULTIADDRS' });
            const multiaddrs = multiaddrsResponse.success ? multiaddrsResponse.multiaddrs : [];

            // Получаем Peer ID
            const peerIdResponse = await libp2pNode.postMessage({ type: 'GET_PEER_ID' });
            const peerId = peerIdResponse.success ? peerIdResponse.peerId : null;

            // Получаем дополнительные метрики
            const latency = await this.testConnectionLatency();
            const protocolDistribution = this.analyzeProtocols(multiaddrs);
            const connectionQuality = this.calculateConnectionQuality(connections);

            return {
                success: true,
                data: {
                    peerId,
                    status: stats.status || 'unknown',
                    addresses: multiaddrs,
                    connections: connections.length,
                    discoveredPeers: stats.discoveredPeers || 0,
                    multiaddrs: multiaddrs,
                    dhtStats,
                    nodeInfo: {
                        uptime: stats.uptime || 0,
                        platform: stats.platform || 'browser',
                        nodeVersion: stats.nodeVersion || 'unknown',
                        memoryUsage: stats.memoryUsage || 'unknown',
                        cpuUsage: stats.cpuUsage || 'unknown'
                    },
                    networkInfo: {
                        totalAddresses: multiaddrs.length,
                        protocolBreakdown: protocolDistribution,
                        connectionQuality: connectionQuality,
                        latency: latency,
                        activeConnections: connections.filter((c: any) => c.status === 'connected').length,
                        pendingConnections: connections.filter((c: any) => c.status === 'connecting').length
                    },
                    timestamp: Date.now(),
                    source: 'libp2p-node-complete'
                }
            };

        } catch (error) {
            console.error('Error fetching complete data from libp2p node:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                source: 'libp2p-node-error'
            };
        }
    }

    // ДОБАВЛЕНО: Улучшенная интеграция с libp2p-node
    public async setupLibp2pIntegration(): Promise<void> {
        try {
            this.addLog('Setting up libp2p integration...', 'info');

            const state = this.state as NetworkAddressesState;
            if (!state.connectionInfo) {
                state.connectionInfo = {
                    libp2pNodeConnected: false,
                    syncStatus: 'idle'
                };
            }

            // Попытка найти и подключиться к libp2p ноде
            this.libp2pNode = await this.getComponentAsync('libp2p-node', 'libp2p-node-1');

            if (this.libp2pNode) {
                state.connectionInfo.libp2pNodeConnected = true;
                state.connectionInfo.syncStatus = 'syncing';

                await this.updateElement({
                    selector: '.connection-status',
                    value: 'connecting',
                    property: 'className',
                    action: 'set'
                });

                // Получаем начальные данные
                // await this.syncWithLibp2pNode();

                // Устанавливаем слушатель для автоматических обновлений
                await this.setupLibp2pListener();

                state.connectionInfo.syncStatus = 'success';
                state.connectionInfo.lastSyncTime = Date.now();

                this.addLog('Libp2p integration setup complete', 'info');
            } else {
                state.connectionInfo.libp2pNodeConnected = false;
                state.connectionInfo.syncStatus = 'error';
                state.connectionInfo.errorMessage = 'Libp2p node not available';

                this.addLog('Libp2p node not found, retrying in 5 seconds...', 'warn');

                // Планируем повторную попытку
                if (this.libp2pConnectionAttempts < this.MAX_CONNECTION_ATTEMPTS) {
                    this.libp2pConnectionAttempts++;
                    setTimeout(() => {
                        this.setupLibp2pIntegration();
                    }, 5000);
                }
            }

            await this.updateConnectionInfoUI();

        } catch (error) {
            console.error('Error setting up libp2p integration:', error);
            const state = this.state as NetworkAddressesState;
            if (state.connectionInfo) {
                state.connectionInfo.syncStatus = 'error';
                state.connectionInfo.errorMessage = error instanceof Error ? error.message : 'Unknown error';
            }
            await this.updateConnectionInfoUI();
        }
    }

    private async setupLibp2pListener(): Promise<void> {
        if (!this.libp2pNode) return;

        try {
            const result = await this.libp2pNode.postMessage({
                type: 'SET_NETWORK_ADDRESSES_LISTENER',
                data: {
                    callback: (nodeState: any) => {
                        this.handleLibp2pUpdate(nodeState);
                    }
                }
            });

            if (result.success) {
                this.addLog('Libp2p listener established successfully', 'info');

                // Подписываемся на события libp2p
                this.libp2pNode.addEventListener('node-started', () => {
                    this.addLog('Libp2p node started event received', 'info');
                    this.handleLibp2pUpdate({ status: 'running', source: 'event' });
                });

                this.libp2pNode.addEventListener('node-stopped', () => {
                    this.addLog('Libp2p node stopped event received', 'info');
                    this.handleLibp2pUpdate({ status: 'stopped', source: 'event' });
                });

                this.libp2pNode.addEventListener('dht-stats-updated', (event: any) => {
                    if (event.detail?.stats) {
                        this.addLog('DHT stats updated event received', 'info');
                        this.handleLibp2pUpdate({
                            dhtStats: event.detail.stats,
                            source: 'dht-event'
                        });
                    }
                });

                this.libp2pNode.addEventListener('peers-updated', (event: any) => {
                    if (event.detail?.peers) {
                        this.addLog('Peers updated event received', 'info');
                        this.handleLibp2pUpdate({
                            discoveredPeers: event.detail.peers.length,
                            source: 'peers-event'
                        });
                    }
                });
            }
        } catch (error) {
            console.error('Error setting up libp2p listener:', error);
        }
    }

    private async handleLibp2pUpdate(_nodeState: any): Promise<void> {
        try {
            const state = this.state as NetworkAddressesState;

            if (state.connectionInfo) {
                state.connectionInfo.lastSyncTime = Date.now();
                state.connectionInfo.syncStatus = 'syncing';
                await this.updateConnectionInfoUI();
            }

            const completeData = await this.fetchCompleteDataFromLibp2pNode();

            if (completeData.success && completeData.data) {
                const data = completeData.data;

                if (data.addresses && Array.isArray(data.addresses)) {
                    await this.updateAddresses(data.addresses, 'libp2p-auto-update');
                }

                // Обновляем информацию о пире
                if (data.peerId && data.peerId !== state.peerId) {
                    state.peerId = data.peerId;
                    await this.updatePeerInfoUI();
                }

                // Обновляем статус ноды
                if (data.status && data.status !== state.nodeStatus) {
                    state.nodeStatus = data.status as any;
                    await this.updateStatusUI();
                }

                // Обновляем сетевые метрики
                if (data.networkInfo) {
                    await this.updateNetworkMetrics(data.networkInfo);
                }

                // Обновляем статус соединения
                if (state.connectionInfo) {
                    state.connectionInfo.syncStatus = 'success';
                    state.connectionInfo.libp2pNodeConnected = true;
                    if (state.connectionInfo.errorMessage) {
                        delete state.connectionInfo.errorMessage;
                    }
                }

                this.addLog(`Auto-update successful: ${data.addresses?.length || 0} addresses`, 'info');

            } else {
                if (state.connectionInfo) {
                    state.connectionInfo.syncStatus = 'error';
                    state.connectionInfo.errorMessage = completeData.error || 'Auto-update failed';
                }
            }

            await this.updateConnectionInfoUI();

        } catch (error) {
            console.error('Error handling libp2p update:', error);
            const state = this.state as NetworkAddressesState;
            if (state.connectionInfo) {
                state.connectionInfo.syncStatus = 'error';
                state.connectionInfo.errorMessage = error instanceof Error ? error.message : 'Unknown error';
                await this.updateConnectionInfoUI();
            }
        }
    }

    // ДОБАВЛЕНО: Анализ протоколов
    private analyzeProtocols(addresses: string[]): Record<string, number> {
        const protocolCount: Record<string, number> = {
            '/ip4/': 0,
            '/ip6/': 0,
            '/tcp/': 0,
            '/udp/': 0,
            '/ws/': 0,
            '/wss/': 0,
            '/webrtc/': 0,
            '/quic/': 0,
            '/quic-v1/': 0,
            '/dns4/': 0,
            '/dns6/': 0,
            '/p2p/': 0,
            '/p2p-circuit/': 0
        };

        addresses.forEach(address => {
            Object.keys(protocolCount).forEach(protocol => {
                if (address.includes(protocol)) {
                    const count = protocolCount[protocol];
                    if (count !== undefined) {
                        protocolCount[protocol] = count + 1;
                    }
                }
            });
        });

        return protocolCount;
    }

    // ДОБАВЛЕНО: Расчет качества соединений
    private calculateConnectionQuality(connections: any[]): number {
        if (connections.length === 0) return 0;

        let quality = 0;
        connections.forEach(conn => {
            if (conn.status === 'connected') quality += 1;
            else if (conn.status === 'connecting') quality += 0.5;
            else if (conn.status === 'disconnecting') quality += 0.3;
        });

        return Math.round((quality / connections.length) * 100);
    }

    // ДОБАВЛЕНО: Тестирование задержки
    private async testConnectionLatency(): Promise<number> {
        try {
            if (!this.libp2pNode) return 0;

            const startTime = Date.now();
            const result = await this.libp2pNode.postMessage({ type: 'GET_STATS' });
            const endTime = Date.now();

            if (result.success) {
                return endTime - startTime;
            }
            return 0;
        } catch {
            return 0;
        }
    }

    // ДОБАВЛЕНО: Обновление сетевых метрик
    private async updateNetworkMetrics(networkInfo: any): Promise<void> {
        const state = this.state as NetworkAddressesState;

        if (!state.networkMetrics) {
            state.networkMetrics = {
                connectionQuality: 0,
                protocolDistribution: {},
                uptime: 0,
                discoveredPeers: 0,
                activeConnections: 0
            };
        }

        // Обновляем статистику протоколов
        if (networkInfo.protocolBreakdown) {
            const protocolDistribution: Record<string, number> = {};
            Object.entries(networkInfo.protocolBreakdown).forEach(([protocol, count]) => {
                if ((count as number) > 0) {
                    protocolDistribution[protocol] = (count as number);
                }
            });
            state.networkMetrics.protocolDistribution = protocolDistribution;

            // Обновляем базовую статистику адресов
            const stats = state.addressStats;
            if (stats) {
                stats.ws = networkInfo.protocolBreakdown['/ws/'] || 0;
                stats.tcp = networkInfo.protocolBreakdown['/tcp/'] || 0;
                stats.webrtc = networkInfo.protocolBreakdown['/webrtc/'] || 0;
                stats.ip4 = networkInfo.protocolBreakdown['/ip4/'] || 0;
                stats.ip6 = networkInfo.protocolBreakdown['/ip6/'] || 0;
                stats.dns = (networkInfo.protocolBreakdown['/dns4/'] || 0) +
                    (networkInfo.protocolBreakdown['/dns6/'] || 0);
                stats.quic = (networkInfo.protocolBreakdown['/quic/'] || 0) +
                    (networkInfo.protocolBreakdown['/quic-v1/'] || 0);
            }
        }

        // Обновляем другие метрики
        state.networkMetrics.connectionQuality = networkInfo.connectionQuality || 0;
        state.networkMetrics.latency = networkInfo.latency;
        state.networkMetrics.activeConnections = networkInfo.activeConnections || 0;
        state.networkMetrics.discoveredPeers = networkInfo.discoveredPeers || 0;
        state.networkMetrics.uptime = networkInfo.uptime || 0;

        // Обновляем UI метрик
        if (this.getAttribute('data-show-stats') === 'true') {
            // await this.renderPart({
            //     partName: 'renderStatsTemplate',
            //     state: state,
            //     selector: '#statsSection'
            // });
            // await this.renderPart({
            //     partName: 'renderNetworkMetrics',
            //     state: state,
            //     selector: '#networkMetrics'
            // });
        }
    }

    // ДОБАВЛЕНО: Автоматическая синхронизация
    // private startAutoSync(): void {
    //     this.stopAutoSync();
    //
    //     const interval = parseInt(this.getAttribute('data-sync-interval') || '60000', 10);
    //
    //     this.syncInterval = window.setInterval(async () => {
    //         try {
    //             await this.syncWithLibp2pNode();
    //         } catch (error) {
    //             console.error('Error in auto sync:', error);
    //         }
    //     }, interval);
    //
    //     this.addLog(`Auto sync started with interval: ${interval}ms`, 'info');
    // }

    private stopAutoSync(): void {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            this.addLog('Auto sync stopped', 'info');
        }
    }

    // ДОБАВЛЕНО: Периодическое обновление метрик
    private startMetricsUpdate(): void {
        if (this.metricsUpdateInterval) {
            clearInterval(this.metricsUpdateInterval);
        }

        this.metricsUpdateInterval = window.setInterval(async () => {
            if (this.libp2pNode) {
                try {
                    const latency = await this.testConnectionLatency();
                    const state = this.state as NetworkAddressesState;
                    if (state.networkMetrics) {
                        state.networkMetrics.latency = latency;
                        await this.updateNetworkMetricsUI();
                    }
                } catch (error) {
                    console.error('Error updating metrics:', error);
                }
            }
        }, 10000); // Обновление каждые 10 секунд
    }

    // ДОБАВЛЕНО: UI методы для обновления информации
    private async updateConnectionInfoUI(): Promise<void> {
        const state = this.state as NetworkAddressesState;

        await this.renderPart({
            partName: 'renderConnectionInfo',
            state: state,
            selector: '#connectionInfo'
        });
    }

    private async updatePeerInfoUI(): Promise<void> {
        const state = this.state as NetworkAddressesState;

        if (state.peerId) {
            await this.updateElement({
                selector: '.peer-id',
                value: this.formatPeerId(state.peerId),
                property: 'textContent'
            });
        }
    }

    private async updateStatusUI(): Promise<void> {
        const state = this.state as NetworkAddressesState;

        await this.updateElement({
            selector: '.node-status',
            value: state.nodeStatus || 'unknown',
            property: 'textContent'
        });

        // await this.updateElement({
        //     selector: '.status-indicator',
        //     value: state.nodeStatus || 'unknown',
        //     property: 'className',
        //     action: 'set'
        // });
    }

    private async updateNetworkMetricsUI(): Promise<void> {
        const state = this.state as NetworkAddressesState;

        await this.renderPart({
            partName: 'renderNetworkMetrics',
            state: state,
            selector: '#networkMetrics'
        });
    }

    // ДОБАВЛЕНО: Форматирование Peer ID
    private formatPeerId(peerId: string): string {
        if (!peerId) return 'Unknown';
        if (peerId.length <= 20) return peerId;
        return peerId.substring(0, 10) + '...' + peerId.substring(peerId.length - 10);
    }

    override async postMessage(event: any): Promise<any> {
        try {
            const state = this.state as NetworkAddressesState;

            switch (event.type) {
                case 'UPDATE_ADDRESSES':
                    const addresses = event.data?.addresses;
                    const source = event.data?.source || 'unknown';

                    if (addresses && Array.isArray(addresses)) {
                        await this.updateAddresses(addresses, source);

                        return {
                            success: true,
                            message: `Addresses updated from ${source}`,
                            count: addresses.length,
                            timestamp: Date.now()
                        };
                    }
                    return { success: false, error: 'Invalid addresses data' };

                case 'GET_ADDRESSES':
                    return {
                        success: true,
                        addresses: state.addresses,
                        total: state.totalAddresses,
                        stats: state.addressStats,
                        lastUpdated: state.lastUpdated
                    };

                case 'ADD_ADDRESS':
                    const addressToAdd = event.data?.address;
                    if (addressToAdd && this.validateAddress(addressToAdd)) {
                        const result = await this.addAddress(addressToAdd);
                        return { success: result, address: addressToAdd };
                    }
                    return { success: false, error: 'Invalid address' };

                case 'REMOVE_ADDRESS':
                    const addressToRemove = event.data?.address;
                    if (addressToRemove) {
                        const result = await this.removeAddress(addressToRemove);
                        return { success: result, address: addressToRemove };
                    }
                    return { success: false, error: 'Address required' };

                case 'COPY_ADDRESS':
                    const addressToCopy = event.data?.address;
                    if (addressToCopy) {
                        await this.copyAddress(addressToCopy);
                        return { success: true, address: addressToCopy };
                    }
                    return { success: false, error: 'No address to copy' };

                case 'REFRESH_ADDRESSES':
                    await this.refreshAddresses();
                    return { success: true, message: 'Addresses refreshed' };

                case 'EXPORT_ADDRESSES':
                    const exportData = await this.exportAddresses();
                    return { success: true, data: exportData };

                case 'GET_STATS':
                    return {
                        success: true,
                        stats: {
                            totalAddresses: state.totalAddresses,
                            addressStats: state.addressStats,
                            lastUpdated: state.lastUpdated
                        }
                    };

                case 'SYNC_WITH_LIBP2P':
                    const syncResult = await this.syncWithLibp2pNode();
                    return syncResult;

                case 'SET_LIBP2P_LISTENER':
                    const callback = event.data?.callback;
                    if (callback && typeof callback === 'function') {
                        this.libp2pNode = { callback };
                        return { success: true, message: 'Libp2p listener set' };
                    }
                    return { success: false, error: 'Invalid callback' };

                case 'TEST_CONNECTION':
                    const addressToTest = event.data?.address;
                    if (addressToTest) {
                        const result = await this.testConnection(addressToTest);
                        return { success: true, result };
                    }
                    return { success: false, error: 'No address to test' };

                case 'GET_COMPLETE_DATA':
                    const completeData = await this.fetchCompleteDataFromLibp2pNode();
                    return completeData;

                case 'SETUP_INTEGRATION':
                    await this.setupLibp2pIntegration();
                    return { success: true, message: 'Integration setup initiated' };

                case 'GET_CONNECTION_STATUS':
                    return {
                        success: true,
                        status: state.connectionInfo,
                        metrics: state.networkMetrics
                    };

                case 'FORCE_SYNC':
                    const forceSyncResult = await this.syncWithLibp2pNode();
                    return forceSyncResult;

                case 'GET_NETWORK_ANALYSIS':
                    const analysis = {
                        addresses: state.addresses,
                        totalAddresses: state.totalAddresses,
                        protocolStats: state.addressStats,
                        protocolDistribution: this.analyzeProtocols(state.addresses),
                        connectionInfo: state.connectionInfo,
                        networkMetrics: state.networkMetrics,
                        lastUpdated: state.lastUpdated
                    };
                    return { success: true, analysis };

                case 'GET_PROTOCOL_STATS':
                    const protocolStats = this.analyzeProtocols(state.addresses);
                    return {
                        success: true,
                        protocolStats,
                        totalProtocols: Object.keys(protocolStats).length
                    };

                case 'PING_NODE':
                    const latency = await this.testConnectionLatency();
                    return {
                        success: true,
                        latency,
                        timestamp: Date.now()
                    };

                default:
                    console.warn(`[NetworkAddresses] Unknown message type: ${event.type}`);
                    return {
                        success: false,
                        error: 'Unknown message type',
                        availableTypes: [
                            'UPDATE_ADDRESSES',
                            'GET_ADDRESSES',
                            'ADD_ADDRESS',
                            'REMOVE_ADDRESS',
                            'COPY_ADDRESS',
                            'REFRESH_ADDRESSES',
                            'EXPORT_ADDRESSES',
                            'GET_STATS',
                            'SYNC_WITH_LIBP2P',
                            'SET_LIBP2P_LISTENER',
                            'TEST_CONNECTION',
                            'GET_COMPLETE_DATA',
                            'SETUP_INTEGRATION',
                            'GET_CONNECTION_STATUS',
                            'FORCE_SYNC',
                            'GET_NETWORK_ANALYSIS',
                            'GET_PROTOCOL_STATS',
                            'PING_NODE'
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
                error: (error as Error).message
            };
        }
    }

    public async updateAddresses(addresses: string[], source: string = 'manual'): Promise<void> {
        const state = this.state as NetworkAddressesState;

        state.addresses = addresses || [];
        state.totalAddresses = addresses.length;
        state.lastUpdated = Date.now();
        state.isLoading = false;

        this.updateAddressStats(addresses);

        await this.renderPart({
            partName: 'renderAddressesList',
            state: state,
            selector: '#addressesList'
        });

        // await this.updateElement({
        //     selector: '.card-badge',
        //     value: state.totalAddresses.toString(),
        //     property: 'textContent'
        // });

        // await this.updateElement({
        //     selector: '.last-update',
        //     value: new Date(state.lastUpdated).toLocaleTimeString(),
        //     property: 'textContent'
        // });

        // if (this.getAttribute('data-show-stats') === 'true') {
        //     await this.renderPart({
        //         partName: 'renderStatsTemplate',
        //         state: state,
        //         selector: '#statsSection'
        //     });
        // }

        this.addLog(`Addresses updated from ${source}: ${addresses.length} addresses`, 'info');

        if (this.libp2pNode?.callback) {
            try {
                this.libp2pNode.callback(state);
            } catch (error) {
                console.error('Error in libp2p listener callback:', error);
            }
        }
    }

    // public async addAddress(address: string): Promise<boolean> {
    //     if (!this.validateAddress(address)) {
    //         await this.showModal({
    //             title: 'Invalid Address',
    //             content: 'The provided address has an invalid format',
    //             buttons: [{ text: 'OK', type: 'primary' }]
    //         });
    //         return false;
    //     }
    //
    //     const state = this.state as NetworkAddressesState;
    //
    //     if (state.addresses.includes(address)) {
    //         await this.showModal({
    //             title: 'Duplicate Address',
    //             content: 'This address already exists in the list',
    //             buttons: [{ text: 'OK', type: 'primary' }]
    //         });
    //         return false;
    //     }
    //
    //     state.addresses.push(address);
    //     state.totalAddresses++;
    //     state.lastUpdated = Date.now();
    //
    //     this.updateAddressStats([address]);
    //
    //     await this.renderPart({
    //         partName: 'renderAddressesList',
    //         state: state,
    //         selector: '#addressesList'
    //     });
    //
    //     // await this.updateElement({
    //     //     selector: '.card-badge',
    //     //     value: state.totalAddresses.toString(),
    //     //     property: 'textContent'
    //     // });
    //
    //     this.addLog(`Address added: ${address}`, 'info');
    //     return true;
    // }
    //
    // public async removeAddress(address: string): Promise<boolean> {
    //     const state = this.state as NetworkAddressesState;
    //
    //     // Используем другой подход для показа модального окна
    //     const shouldRemove = await this.showModal({
    //         title: 'Remove Address',
    //         content: `Are you sure you want to remove the address: ${address}?`,
    //         buttons: [
    //             { text: 'Cancel', type: 'secondary' },
    //             {
    //                 text: 'Remove',
    //                 type: 'danger',
    //                 action: async () => {
    //                     return true;
    //                 }
    //             }
    //         ]
    //     });
    //
    //     // showModal возвращает undefined при нажатии Cancel
    //     if (shouldRemove === undefined) return false;
    //
    //     const index = state.addresses.indexOf(address);
    //     if (index > -1) {
    //         state.addresses.splice(index, 1);
    //         state.totalAddresses--;
    //         state.lastUpdated = Date.now();
    //
    //         await this.renderPart({
    //             partName: 'renderAddressesList',
    //             state: state,
    //             selector: '#addressesList'
    //         });
    //
    //         await this.updateElement({
    //             selector: '.card-badge',
    //             value: state.totalAddresses.toString(),
    //             property: 'textContent'
    //         });
    //
    //         this.addLog(`Address removed: ${address}`, 'info');
    //         return true;
    //     }
    //
    //     return false;
    // }

    // public async copyAddress(address: string): Promise<void> {
    //     try {
    //         await navigator.clipboard.writeText(address);
    //
    //         await this.showModal({
    //             title: 'Copied',
    //             content: 'Address copied to clipboard',
    //             buttons: [{ text: 'OK', type: 'primary' }]
    //         });
    //
    //         this.addLog(`Address copied: ${address}`, 'info');
    //     } catch (error) {
    //         await this.showModal({
    //             title: 'Copy Failed',
    //             content: 'Failed to copy address to clipboard',
    //             buttons: [{ text: 'OK', type: 'primary' }]
    //         });
    //     }
    // }

    // public async refreshAddresses(): Promise<void> {
    //     const state = this.state as NetworkAddressesState;
    //     state.isLoading = true;
    //
    //     // await this.updateElement({
    //     //     selector: '.btn-refresh',
    //     //     value: true,
    //     //     property: 'disabled'
    //     // });
    //
    //     // await this.updateElement({
    //     //     selector: '.btn-refresh .btn-text',
    //     //     value: 'Refreshing...',
    //     //     property: 'textContent'
    //     // });
    //
    //     try {
    //         // const source = this.getAttribute('data-source') || 'auto';
    //         // await this.loadAddressesFromSource(source);
    //     } catch (error) {
    //         this.addError({
    //             componentName: this.constructor.name,
    //             source: 'refreshAddresses',
    //             message: 'Failed to refresh addresses',
    //             details: error
    //         });
    //     } finally {
    //         state.isLoading = false;
    //
    //         // await this.updateElement({
    //         //     selector: '.btn-refresh',
    //         //     value: false,
    //         //     property: 'disabled'
    //         // });
    //         // await this.updateElement({
    //         //     selector: '.btn-refresh .btn-text',
    //         //     value: 'Refresh',
    //         //     property: 'textContent'
    //         // });
    //     }
    // }

    // public async exportAddresses(): Promise<any> {
    //     const state = this.state as NetworkAddressesState;
    //
    //     const exportData = {
    //         addresses: state.addresses,
    //         exportTime: new Date().toISOString(),
    //         totalAddresses: state.totalAddresses,
    //         stats: state.addressStats,
    //         connectionInfo: state.connectionInfo,
    //         networkMetrics: state.networkMetrics,
    //         component: 'Network Addresses',
    //         nodeInfo: {
    //             timestamp: Date.now()
    //         }
    //     };
    //
    //     return exportData;
    // }

    // public async testConnection(address: string): Promise<any> {
    //     this.addLog(`Testing connection to: ${address}`, 'info');
    //
    //     try {
    //         const latency = Math.floor(Math.random() * 100) + 50;
    //         const success = Math.random() > 0.2;
    //
    //         await new Promise(resolve => setTimeout(resolve, 1000));
    //
    //         if (success) {
    //             await this.showModal({
    //                 title: 'Connection Test Successful',
    //                 content: `
    //                     <div style="padding: 1rem 0;">
    //                         <p><strong>Address:</strong> ${address}</p>
    //                         <p><strong>Latency:</strong> ${latency}ms</p>
    //                         <p><strong>Status:</strong> ✅ Connected</p>
    //                     </div>
    //                 `,
    //                 buttons: [{ text: 'OK', type: 'primary' }]
    //             });
    //             return { success: true, latency, address };
    //         } else {
    //             await this.showModal({
    //                 title: 'Connection Test Failed',
    //                 content: `
    //                     <div style="padding: 1rem 0;">
    //                         <p><strong>Address:</strong> ${address}</p>
    //                         <p><strong>Status:</strong> ❌ Connection failed</p>
    //                         <p><strong>Error:</strong> Timeout or network issue</p>
    //                     </div>
    //                 `,
    //                 buttons: [{ text: 'OK', type: 'primary' }]
    //             });
    //             return { success: false, error: 'Connection failed', address };
    //         }
    //     } catch (error) {
    //         await this.showModal({
    //             title: 'Test Error',
    //             content: `Failed to test connection: ${error}`,
    //             buttons: [{ text: 'OK', type: 'primary' }]
    //         });
    //         return { success: false, error: (error as Error).message, address };
    //     }
    // }

    private updateAddressStats(addresses: string[]): void {
        const state = this.state as NetworkAddressesState;

        if (!state.addressStats) {
            state.addressStats = {
                ws: 0,
                tcp: 0,
                webrtc: 0,
                ip4: 0,
                ip6: 0,
                dns: 0,
                quic: 0
            };
        }

        state.addressStats.ws = 0;
        state.addressStats.tcp = 0;
        state.addressStats.webrtc = 0;
        state.addressStats.ip4 = 0;
        state.addressStats.ip6 = 0;
        state.addressStats.dns = 0;
        state.addressStats.quic = 0;

        addresses.forEach(address => {
            if (address.includes('/ws')) state.addressStats!.ws++;
            if (address.includes('/tcp/')) state.addressStats!.tcp++;
            if (address.includes('/webrtc/')) state.addressStats!.webrtc++;
            if (address.includes('/ip4/')) state.addressStats!.ip4++;
            if (address.includes('/ip6/')) state.addressStats!.ip6++;
            if (address.includes('/dns4/') || address.includes('/dns6/')) state.addressStats!.dns++;
            if (address.includes('/quic') || address.includes('/quic-v1')) state.addressStats!.quic++;
        });
    }

    // private async loadAddressesFromSource(source: string): Promise<void> {
    //     switch (source) {
    //         case 'libp2p':
    //             await this.syncWithLibp2pNode();
    //             break;
    //         case 'auto':
    //             try {
    //                 await this.syncWithLibp2pNode();
    //             } catch (error) {
    //                 console.debug('Libp2p node not available, using mock data:', error);
    //             }
    //             break;
    //         default:
    //             this.addLog(`Unknown data source: ${source}`, 'warn');
    //     }
    // }

    // private startAutoRefresh(): void {
    //     this.stopAutoRefresh();
    //
    //     const interval = parseInt(this.getAttribute('data-refresh-interval') || '30000', 10);
    //
    //     this.refreshInterval = window.setInterval(async () => {
    //         try {
    //             await this.refreshAddresses();
    //         } catch (error) {
    //             console.error('Error in auto refresh:', error);
    //         }
    //     }, interval);
    //
    //     this.addLog(`Auto refresh started with interval: ${interval}ms`, 'info');
    // }

    private stopAutoRefresh(): void {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
            this.addLog('Auto refresh stopped', 'info');
        }
    }

    public validateAddress(address: string): boolean {
        if (address.trim().length === 0) {
            return false;
        }

        const validProtocols = ['/ip4/', '/ip6/', '/dns4/', '/dns6/', '/tcp/', '/ws/', '/wss/', '/p2p/', '/quic/', '/quic-v1/', '/webrtc/'];
        return validProtocols.some(protocol => address.includes(protocol));
    }

    // public getState(): NetworkAddressesState {
    //     return this.state as NetworkAddressesState;
    // }

    public addLog(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `${timestamp} [${level.toUpperCase()}] ${message}`;
        console.log(`[NetworkAddresses] ${logEntry}`);
    }

    override async _componentDisconnected(): Promise<void> {
        this.stopAutoRefresh();
        this.stopAutoSync();

        if (this.metricsUpdateInterval) {
            clearInterval(this.metricsUpdateInterval);
            this.metricsUpdateInterval = null;
        }

        if (this._controller?.destroy) {
            await this._controller.destroy();
        }
    }
}

if (!customElements.get('network-addresses')) {
    customElements.define('network-addresses', NetworkAddresses);
}