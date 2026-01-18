import { BaseComponent } from '@/base/base-component';
import * as template from './template';
import { controller } from './controller';
import { createActions } from './actions';
import {createLogger} from "@/logger";
const log = createLogger('libp2p-browser')

export interface NodeIdentityState {
    peerId: string;
    nodeStatus: 'online' | 'offline' | 'error' | 'loading';
    processId: string;
    nodePort: string;
    uptime: string;
    platform: string;
    arch: string;
    nodeVersion: string;
    nodeName: string;
    lastUpdate: number;
    memoryUsage?: string;
    cpuUsage?: string;
    networkAddress?: string;
    protocolVersion?: string;
    connectedPeers?: number;
}

export class NodeIdentity extends BaseComponent {
    static override observedAttributes = [
        'title',
        'data-auto-refresh',
        'data-refresh-interval',
        'data-show-details',
        'data-source',
        'data-peer-id',
        'data-node-port'
    ];

    constructor() {
        super();
        this._templateMethods = {
            defaultTemplate: template.defaultTemplate,
            detailsTemplate: template.detailsTemplate
        };
        this.state = {
            peerId: 'Loading...',
            nodeStatus: 'loading',
            processId: 'Unknown',
            nodePort: 'Unknown',
            uptime: '0s',
            platform: 'Unknown',
            arch: 'Unknown',
            nodeVersion: 'Unknown',
            nodeName: 'Node Identity',
            lastUpdate: Date.now(),
            memoryUsage: '0 MB',
            cpuUsage: '0%',
            networkAddress: 'Unknown',
            protocolVersion: '1.0.0',
            connectedPeers: 0
        } as NodeIdentityState;
    }

    public formatString(str, prefixLength = 4, suffixLength = 4, separator = '...') {
        if (!str || str.length <= prefixLength + suffixLength) return str;
        return str.substring(0, prefixLength) + separator + str.substring(str.length - suffixLength);
    }

    public addLog(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `${timestamp} [${level.toUpperCase()}] ${message}`;
        log(logEntry);
    }

    public updateUptime(): void {
        try {
            if (!window.startTime) {
                window.startTime = Date.now();
            }

            const seconds = Math.floor((Date.now() - window.startTime) / 1000);
            const days = Math.floor(seconds / 86400);
            const hours = Math.floor((seconds % 86400) / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;

            let uptime = '';
            if (days > 0) uptime = `${days}d ${hours}h`;
            else if (hours > 0) uptime = `${hours}h ${minutes}m`;
            else if (minutes > 0) uptime = `${minutes}m ${secs}s`;
            else uptime = `${secs}s`;

            const state = this.state as NodeIdentityState;
            if (state.uptime !== uptime) {
                state.uptime = uptime;
                this.updateElement({
                    selector: '.uptime',
                    value: uptime,
                    property: 'textContent'
                }).catch(error => {
                    log.error('Error updating uptime:', error);
                });
            }
        } catch (error) {
            log.error('Error in updateUptime:', error);
        }
    }

    public getState(): NodeIdentityState {
        return this.state as NodeIdentityState;
    }

    override async _componentReady(): Promise<void> {
        this._controller = controller(this);
        this._actions = await createActions(this);
        await this.fullRender(this.state);

        // Загружаем данные из атрибутов если указаны
        await this.loadFromAttributes();

        // Автоматическое обновление данных
        const autoRefresh = this.getAttribute('data-auto-refresh') === 'true';
        if (autoRefresh) {
            const interval = parseInt(this.getAttribute('data-refresh-interval') || '5000', 10);
            setTimeout(() => {
                this.refreshData('auto').catch(error => {
                    log.error('Error in auto refresh:', error);
                });
            }, interval);
        }

        // Установка заголовка документа
        await this.updateDocumentTitle();

        // Пытаемся получить данные из libp2p-node если доступен
        await this.tryConnectToLibp2pNode();
    }

    override async _componentAttributeChanged(
        name: string,
        oldValue: string | null,
        newValue: string | null
    ): Promise<void> {
        if (oldValue === newValue) return;

        const state = this.state as NodeIdentityState;

        switch (name) {
            case 'title':
                if (newValue) {
                    state.nodeName = newValue;
                    await this.updateElement({
                        selector: '.node-name',
                        value: newValue,
                        property: 'textContent'
                    });
                    await this.updateDocumentTitle();
                }
                break;

            case 'data-auto-refresh':
                const autoRefresh = newValue === 'true';
                this.addLog(`Auto refresh ${autoRefresh ? 'enabled' : 'disabled'}`, 'info');
                if (this._controller && typeof (this._controller as any).setupAutoRefresh === 'function') {
                    (this._controller as any).setupAutoRefresh();
                }
                break;

            case 'data-refresh-interval':
                this.addLog(`Refresh interval updated to ${newValue}ms`, 'info');
                if (this._controller && typeof (this._controller as any).setupAutoRefresh === 'function') {
                    (this._controller as any).setupAutoRefresh();
                }
                break;

            case 'data-show-details':
                const showDetails = newValue === 'true';
                await this.updateElement({
                    selector: '.details-section',
                    value: showDetails ? 'block' : 'none',
                    property: 'style.display',
                    action: 'set'
                });
                await this.updateElement({
                    selector: '.btn-toggle-details .btn-text',
                    value: showDetails ? 'Hide Details' : 'Show Details',
                    property: 'textContent'
                });
                break;

            case 'data-peer-id':
                if (newValue) {
                    state.peerId = newValue;
                    console.log('&&&&&&&&&&&&& state &&&&&&&&&&&&&', state)
                    // await this.updateElement({
                    //     selector: '.peer-id',
                    //     value: state.peerId,
                    //     property: 'textContent'
                    // });
                    await this.updateDocumentTitle();
                }
                break;

            case 'data-node-port':
                if (newValue) {
                    state.nodePort = newValue;
                    await this.updateElement({
                        selector: '.node-port',
                        value: state.nodePort,
                        property: 'textContent'
                    });
                }
                break;

            case 'data-source':
                this.addLog(`Data source updated to: ${newValue}`, 'info');
                if (newValue === 'libp2p') {
                    await this.tryConnectToLibp2pNode();
                }
                break;
        }
    }

    override async postMessage(event: any): Promise<any> {
        try {
            const state = this.state as NodeIdentityState;

            switch (event.type) {
                case 'GET_IDENTITY':
                    return {
                        success: true,
                        identity: {
                            peerId: state.peerId,
                            nodeStatus: state.nodeStatus,
                            nodeName: state.nodeName,
                            uptime: state.uptime,
                            platform: state.platform,
                            arch: state.arch,
                            nodeVersion: state.nodeVersion,
                            processId: state.processId,
                            nodePort: state.nodePort,
                            memoryUsage: state.memoryUsage,
                            cpuUsage: state.cpuUsage,
                            networkAddress: state.networkAddress,
                            protocolVersion: state.protocolVersion,
                            connectedPeers: state.connectedPeers || 0
                        }
                    };

                case 'REFRESH_DATA':
                    await this.refreshData(event.data?.source || 'message');
                    return {
                        success: true,
                        message: 'Identity data refreshed',
                        timestamp: Date.now(),
                        state: { ...state }
                    };

                case 'UPDATE_PEER_ID':
                    if (event.data?.peerId) {
                        state.peerId = event.data.peerId;
                        console.log('$$$$ state $$$$', state)
                        // await this.updateElement({
                        //     selector: '.peer-id',
                        //     value: state.peerId,
                        //     property: 'textContent'
                        // });
                        await this.updateDocumentTitle();

                        // Сохраняем в атрибуте для сохранения состояния
                        this.setAttribute('data-peer-id', state.peerId);

                        return { success: true, peerId: state.peerId };
                    }
                    return { success: false, error: 'Peer ID required' };

                case 'UPDATE_STATUS':
                    const status = event.data?.status;
                    if (status && ['online', 'offline', 'error', 'loading'].includes(status)) {
                        state.nodeStatus = status;
                        await this.updateStatusUI();
                        return { success: true, status: state.nodeStatus };
                    }
                    return { success: false, error: 'Invalid status' };

                case 'GET_NODE_INFO':
                    return {
                        success: true,
                        info: {
                            processId: state.processId,
                            nodePort: state.nodePort,
                            platform: state.platform,
                            arch: state.arch,
                            nodeVersion: state.nodeVersion,
                            uptime: state.uptime,
                            memoryUsage: state.memoryUsage,
                            cpuUsage: state.cpuUsage,
                            networkAddress: state.networkAddress
                        }
                    };

                case 'COPY_PEER_ID':
                    await this.copyPeerId();
                    return { success: true, message: 'Peer ID copied to clipboard' };

                case 'SET_DOCUMENT_TITLE':
                    const title = event.data?.title;
                    if (title) {
                        document.title = title;
                        return { success: true, title };
                    }
                    return { success: false, error: 'Title required' };

                case 'UPDATE_FROM_LIBP2P':
                    return await this.updateFromLibp2p(event.data);

                case 'UPDATE_METRICS':
                    if (event.data) {
                        await this.updateMetrics(event.data);
                        return { success: true };
                    }
                    return { success: false, error: 'Metrics data required' };

                case 'UPDATE_NETWORK_INFO':
                    if (event.data) {
                        await this.updateNetworkInfo(event.data);
                        return { success: true };
                    }
                    return { success: false, error: 'Network info required' };

                case 'RESET_IDENTITY':
                    await this.resetIdentity();
                    return { success: true, message: 'Identity reset to default' };

                case 'EXPORT_IDENTITY':
                    return {
                        success: true,
                        identity: { ...state },
                        exportTime: Date.now(),
                        format: 'json'
                    };

                case 'IMPORT_IDENTITY':
                    if (event.data?.identity) {
                        await this.importIdentity(event.data.identity);
                        return { success: true, message: 'Identity imported successfully' };
                    }
                    return { success: false, error: 'Identity data required' };

                default:
                    log.warn(`[NodeIdentity] Unknown message type: ${event.type}`);
                    return {
                        success: false,
                        error: 'Unknown message type',
                        availableTypes: [
                            'GET_IDENTITY',
                            'REFRESH_DATA',
                            'UPDATE_PEER_ID',
                            'UPDATE_STATUS',
                            'GET_NODE_INFO',
                            'COPY_PEER_ID',
                            'SET_DOCUMENT_TITLE',
                            'UPDATE_FROM_LIBP2P',
                            'UPDATE_METRICS',
                            'UPDATE_NETWORK_INFO',
                            'RESET_IDENTITY',
                            'EXPORT_IDENTITY',
                            'IMPORT_IDENTITY'
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

    // Публичные методы
    public async refreshData(source?: string): Promise<void> {
        try {
            // Установка состояния загрузки
            // await this.updateElement({
            //     selector: '.btn-refresh',
            //     value: true,
            //     property: 'disabled'
            // });

            // await this.updateElement({
            //     selector: '.btn-refresh .btn-text',
            //     value: 'Refreshing...',
            //     property: 'textContent'
            // });

            // Проверяем указанный источник данных
            const dataSource = this.getAttribute('data-source');

            if (dataSource === 'libp2p') {
                // Получаем данные из libp2p-node
                await this.fetchFromLibp2pNode();
            } else if (dataSource === 'mock') {
                // Используем mock данные
                await this.updateWithMockData(source);
            } else {
                // Автоматическое определение
                await this.tryConnectToLibp2pNode();
            }

            // Обновляем время последнего обновления
            (this.state as NodeIdentityState).lastUpdate = Date.now();
            // await this.updateElement({
            //     selector: '.last-update',
            //     value: new Date().toLocaleTimeString(),
            //     property: 'textContent'
            // });

            this.addLog(`Data refreshed from ${source || 'auto'} source`, 'info');

        } catch (error) {
            log.error('Error refreshing data:', error);

            await this.updateElement({
                selector: '.node-status',
                value: 'error',
                property: 'textContent'
            });

            // await this.updateElement({
            //     selector: '.status-indicator',
            //     value: 'status-error',
            //     property: 'className',
            //     action: 'set'
            // });

            this.addError({
                componentName: this.constructor.name,
                source: 'refreshData',
                message: 'Failed to refresh identity data',
                details: error
            });

        } finally {
            // Восстанавливаем кнопку
            // await this.updateElement({
            //     selector: '.btn-refresh',
            //     value: false,
            //     property: 'disabled'
            // });

            // await this.updateElement({
            //     selector: '.btn-refresh .btn-text',
            //     value: 'Refresh',
            //     property: 'textContent'
            // });
        }
    }

    public async copyPeerId(): Promise<void> {
        const state = this.state as NodeIdentityState;

        if (state.peerId && state.peerId !== 'Loading...') {
            try {
                await navigator.clipboard.writeText(state.peerId);

                // Показываем временное уведомление
                await this.showModal({
                    title: 'Success',
                    content: 'Peer ID copied to clipboard',
                    buttons: [{ text: 'OK', type: 'primary' }]
                });

                this.addLog('Peer ID copied to clipboard', 'info');
            } catch (error) {
                console.error('Failed to copy peer ID:', error);

                await this.showModal({
                    title: 'Error',
                    content: 'Failed to copy Peer ID to clipboard. Please check browser permissions.',
                    buttons: [{ text: 'OK', type: 'primary' }]
                });
            }
        } else {
            await this.showModal({
                title: 'Error',
                content: 'No Peer ID available to copy. Please wait for data to load.',
                buttons: [{ text: 'OK', type: 'primary' }]
            });
        }
    }

    public async updateStatusUI(): Promise<void> {
        const state = this.state as NodeIdentityState;

        try {
            // Проверяем существование элементов перед обновлением
            const statusElement = this.shadowRoot?.querySelector('.node-status');
            const indicatorElement = this.shadowRoot?.querySelector('.status-indicator');
            const badgeElement = this.shadowRoot?.querySelector('.card-badge');

            if (statusElement) {
                await this.updateElement({
                    selector: '.node-status',
                    value: state.nodeStatus,
                    property: 'textContent'
                });
            }

            if (indicatorElement) {
                await this.updateElement({
                    selector: '.status-indicator',
                    value: `status-${state.nodeStatus}`,
                    property: 'className',
                    action: 'set'
                });
            }

            if (badgeElement) {
                // await this.updateElement({
                //     selector: '.card-badge',
                //     value: state.nodeStatus === 'online' ? 'Active' : 'Inactive',
                //     property: 'textContent'
                // });

                // Обновляем цвет баджа в зависимости от статуса
                const badgeColor = state.nodeStatus === 'online' ? 'var(--success)' :
                    state.nodeStatus === 'error' ? 'var(--error)' :
                        state.nodeStatus === 'loading' ? 'var(--warning)' : 'var(--text-secondary)';

                await this.updateElement({
                    selector: '.card-badge',
                    value: badgeColor,
                    property: 'style.backgroundColor',
                    action: 'set'
                });
            }
        } catch (error) {
            console.warn('Warning: Error updating status UI, elements may not be rendered yet:', error);
        }
    }

    public async updateDocumentTitle(): Promise<void> {
        const state = this.state as NodeIdentityState;

        if (state.peerId && state.peerId !== 'Loading...') {
            const shortPeerId = state.peerId.length > 20
                ? `${state.peerId.substring(0, 10)}...${state.peerId.substring(state.peerId.length - 10)}`
                : state.peerId;

            document.title = `${state.nodeName} - ${shortPeerId}`;
        } else {
            document.title = state.nodeName;
        }
    }

    public async updateMetrics(metrics: any): Promise<void> {
        const state = this.state as NodeIdentityState;

        if (metrics.memoryUsage) {
            state.memoryUsage = metrics.memoryUsage;
            await this.updateElement({
                selector: '.memory-usage',
                value: state.memoryUsage,
                property: 'textContent'
            });
        }

        if (metrics.cpuUsage) {
            state.cpuUsage = metrics.cpuUsage;
            await this.updateElement({
                selector: '.cpu-usage',
                value: state.cpuUsage,
                property: 'textContent'
            });
        }

        if (metrics.connectedPeers !== undefined) {
            state.connectedPeers = metrics.connectedPeers;
            await this.updateElement({
                selector: '.connected-peers',
                value: (state.connectedPeers || 0).toString(),
                property: 'textContent'
            });
        }
    }

    public async updateNetworkInfo(networkInfo: any): Promise<void> {
        const state = this.state as NodeIdentityState;

        if (networkInfo.networkAddress) {
            state.networkAddress = networkInfo.networkAddress;
            await this.updateElement({
                selector: '.network-address',
                value: state.networkAddress,
                property: 'textContent'
            });
        }

        if (networkInfo.protocolVersion) {
            state.protocolVersion = networkInfo.protocolVersion;
            await this.updateElement({
                selector: '.protocol-version',
                value: state.protocolVersion,
                property: 'textContent'
            });
        }
    }

    // Приватные вспомогательные методы
    private async loadFromAttributes(): Promise<void> {
        const state = this.state as NodeIdentityState;

        // Загружаем данные из атрибутов если указаны
        const peerId = this.getAttribute('data-peer-id');
        if (peerId) {
            state.peerId = peerId;
        }

        const nodePort = this.getAttribute('data-node-port');
        if (nodePort) {
            state.nodePort = nodePort;
        }

        const title = this.getAttribute('title');
        if (title) {
            state.nodeName = title;
        }
    }

    private async tryConnectToLibp2pNode(): Promise<void> {
        try {
            const libp2pNode = await this.getComponentAsync('libp2p-node', 'libp2p-node-1');
            if (libp2pNode) {
                await this.fetchFromLibp2pNode();
                this.addLog('Connected to libp2p-node', 'info');
            } else {
                // Fallback на mock данные
                await this.updateWithMockData('auto-detection');
            }
        } catch (error) {
            console.debug('Libp2p node not available, using mock data:', error);
            await this.updateWithMockData('fallback');
        }
    }

    private async fetchFromLibp2pNode(): Promise<void> {
        const libp2pNode = await this.getComponentAsync('libp2p-node', 'libp2p-node-1');
        if (!libp2pNode) {
            throw new Error('Libp2p node not found. Please start the libp2p node first.');
        }

        // Получаем данные из libp2p-node
        const [peerResult, statsResult] = await Promise.all([
            libp2pNode.postMessage({ type: 'GET_PEER_ID' }),
            libp2pNode.postMessage({ type: 'GET_STATS' })
        ]);

        const state = this.state as NodeIdentityState;

        // Обновляем Peer ID
        if (peerResult.success && peerResult.peerId) {
            state.peerId = peerResult.peerId;
        } else if (peerResult.peerId) {
            // Если peerId есть в ответе, даже если success = false
            state.peerId = peerResult.peerId;
        }

        // Обновляем статус
        if (statsResult.success && statsResult.stats?.status) {
            state.nodeStatus = statsResult.stats.status === 'running' ? 'online' : 'offline';
        } else {
            state.nodeStatus = 'online'; // Предполагаем что нода работает
        }

        await this.updateElement({
            selector: '.peer-id',
            value: this.formatString(state.peerId) || 'Not available',
            property: 'textContent'
        });

        await this.updateStatusUI();

        if (statsResult.success && statsResult.stats) {
            const stats = statsResult.stats;

            // Обновляем детальный раздел
            await this.renderPart({
                partName: 'detailsTemplate',
                state: {
                    ...state,
                    processId: stats.processId || 'Browser',
                    nodePort: stats.nodePort || 'N/A',
                    platform: stats.platform || navigator.platform,
                    arch: this.detectArchitecture(),
                    nodeVersion: stats.nodeVersion || 'Browser',
                    uptime: stats.uptime || '0s',
                    memoryUsage: stats.memoryUsage || 'Browser',
                    cpuUsage: stats.cpuUsage || 'N/A',
                    connectedPeers: stats.connections || 0
                },
                selector: '.details-section .details-grid'
            });
        }

        await this.updateDocumentTitle();
    }

    private async updateFromLibp2p(data: any): Promise<{ success: boolean }> {
        const state = this.state as NodeIdentityState;
        if (data.peerId) {
            state.peerId = data.peerId;
            await this.updateElement({
                selector: '.peer-id',
                value: this.formatString(state.peerId),
                property: 'textContent'
            });
        }

        if (data.status) {
            state.nodeStatus = data.status;
            await this.updateStatusUI();
        }

        // Обновляем системную информацию из data если доступна
        if (data.processId) state.processId = data.processId;
        if (data.nodePort) state.nodePort = data.nodePort;
        if (data.platform) state.platform = data.platform;
        if (data.arch) state.arch = data.arch;
        if (data.nodeVersion) state.nodeVersion = data.nodeVersion;

        // Обновляем uptime если доступно
        if (data.uptime !== undefined) {
            state.uptime = this.formatUptime(data.uptime);
            await this.updateElement({
                selector: '.uptime',
                value: state.uptime,
                property: 'textContent'
            });
        }

        // Обновляем метрики если доступны
        if (data.metrics) {
            await this.updateMetrics(data.metrics);
        }

        // Обновляем сетевую информацию если доступна
        if (data.networkInfo) {
            await this.updateNetworkInfo(data.networkInfo);
        }

        // Обновляем все поля через renderPart для детального раздела
        await this.renderPart({
            partName: 'detailsTemplate',
            state: state,
            selector: '.details-section .details-grid'
        });

        await this.updateDocumentTitle();

        return { success: true };
    }

    private async updateWithMockData(source?: string): Promise<void> {
        const state = this.state as NodeIdentityState;

        // Генерируем mock данные только если они не были установлены ранее
        if (state.peerId === 'Loading...') {
            state.peerId = `12D3KooW${Math.random().toString(36).substring(2, 22)}`;
        }

        state.nodeStatus = Math.random() > 0.2 ? 'online' : 'offline';
        state.processId = Math.floor(Math.random() * 10000).toString();
        state.nodePort = Math.floor(Math.random() * 10000 + 3000).toString();
        state.platform = navigator.platform;
        state.arch = this.detectArchitecture();
        state.nodeVersion = '18.0.0';
        state.memoryUsage = `${Math.floor(Math.random() * 1024)} MB`;
        state.cpuUsage = `${Math.floor(Math.random() * 100)}%`;
        state.networkAddress = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
        state.protocolVersion = '1.0.0';
        state.connectedPeers = Math.floor(Math.random() * 50);

        // Mock uptime
        const uptimeSeconds = Math.floor(Math.random() * 86400); // до 24 часов
        state.uptime = this.formatUptime(uptimeSeconds);

        console.log('$$$$$ !! state !! $$$$$', state)
        // Обновляем основной UI
        // await this.updateElement({
        //     selector: '.peer-id',
        //     value: state.peerId,
        //     property: 'textContent'
        // });

        await this.updateStatusUI();

        await this.updateElement({
            selector: '.process-id',
            value: state.processId,
            property: 'textContent'
        });

        await this.updateElement({
            selector: '.node-port',
            value: state.nodePort,
            property: 'textContent'
        });

        await this.updateElement({
            selector: '.platform',
            value: state.platform,
            property: 'textContent'
        });

        await this.updateElement({
            selector: '.arch',
            value: state.arch,
            property: 'textContent'
        });

        await this.updateElement({
            selector: '.node-version',
            value: state.nodeVersion,
            property: 'textContent'
        });

        await this.updateElement({
            selector: '.uptime',
            value: state.uptime,
            property: 'textContent'
        });

        await this.updateElement({
            selector: '.memory-usage',
            value: state.memoryUsage,
            property: 'textContent'
        });

        await this.updateElement({
            selector: '.cpu-usage',
            value: state.cpuUsage,
            property: 'textContent'
        });

        await this.updateElement({
            selector: '.connected-peers',
            value: (state.connectedPeers || 0).toString(),
            property: 'textContent'
        });

        await this.updateElement({
            selector: '.network-address',
            value: state.networkAddress,
            property: 'textContent'
        });

        await this.updateElement({
            selector: '.protocol-version',
            value: state.protocolVersion,
            property: 'textContent'
        });

        await this.updateDocumentTitle();

        this.addLog(`Data loaded from ${source || 'mock'} source`, 'info');
    }

    private async resetIdentity(): Promise<void> {
        this.state = {
            peerId: 'Loading...',
            nodeStatus: 'loading',
            processId: 'Unknown',
            nodePort: 'Unknown',
            uptime: '0s',
            platform: 'Unknown',
            arch: 'Unknown',
            nodeVersion: 'Unknown',
            nodeName: this.getAttribute('title') || 'Node Identity',
            lastUpdate: Date.now(),
            memoryUsage: '0 MB',
            cpuUsage: '0%',
            networkAddress: 'Unknown',
            protocolVersion: '1.0.0',
            connectedPeers: 0
        } as NodeIdentityState;

        await this.fullRender(this.state);
        await this.updateDocumentTitle();

        // Очищаем атрибуты
        this.removeAttribute('data-peer-id');
        this.removeAttribute('data-node-port');
    }

    private async importIdentity(identity: any): Promise<void> {
        const state = this.state as NodeIdentityState;

        // Обновляем только существующие поля
        if (identity.peerId) state.peerId = identity.peerId;
        if (identity.nodeStatus) state.nodeStatus = identity.nodeStatus;
        if (identity.processId) state.processId = identity.processId;
        if (identity.nodePort) state.nodePort = identity.nodePort;
        if (identity.uptime) state.uptime = identity.uptime;
        if (identity.platform) state.platform = identity.platform;
        if (identity.arch) state.arch = identity.arch;
        if (identity.nodeVersion) state.nodeVersion = identity.nodeVersion;
        if (identity.nodeName) state.nodeName = identity.nodeName;
        if (identity.memoryUsage) state.memoryUsage = identity.memoryUsage;
        if (identity.cpuUsage) state.cpuUsage = identity.cpuUsage;
        if (identity.networkAddress) state.networkAddress = identity.networkAddress;
        if (identity.protocolVersion) state.protocolVersion = identity.protocolVersion;
        if (identity.connectedPeers !== undefined) state.connectedPeers = identity.connectedPeers;

        state.lastUpdate = Date.now();

        // Обновляем UI
        await this.fullRender(state);
        await this.updateDocumentTitle();

        // Сохраняем важные данные в атрибутах
        if (identity.peerId) {
            this.setAttribute('data-peer-id', identity.peerId);
        }
        if (identity.nodePort) {
            this.setAttribute('data-node-port', identity.nodePort);
        }
    }

    private formatUptime(seconds: number): string {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        if (minutes > 0) return `${minutes}m ${secs}s`;
        return `${secs}s`;
    }

    private detectArchitecture(): string {
        const userAgent = navigator.userAgent;

        if (userAgent.includes('x64') || userAgent.includes('x86_64') || userAgent.includes('Win64') || userAgent.includes('WOW64')) {
            return 'x64';
        } else if (userAgent.includes('x86') || userAgent.includes('Win32')) {
            return 'x86';
        } else if (userAgent.includes('arm') || userAgent.includes('aarch64')) {
            return 'ARM';
        } else if (userAgent.includes('Linux')) {
            return 'Linux';
        } else if (userAgent.includes('Mac')) {
            return 'Darwin';
        }

        return 'Unknown';
    }

    override async _componentDisconnected(): Promise<void> {
        if (this._controller?.destroy) {
            await this._controller.destroy();
        }
    }
}

if (!customElements.get('node-identity')) {
    customElements.define('node-identity', NodeIdentity);
}