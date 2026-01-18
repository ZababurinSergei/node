import { BaseComponent } from '@/base/base-component';
import * as template from './template';
import { controller } from './controller';
import { createActions } from './actions';
import { createLogger } from '@/logger'
const logUpdatePeersDisplay = createLogger('peers-manager:updatePeersDisplay')

export interface PeerInfo {
    peerId: string;
    connectionCount: number;
    streamCount: number;
    blocked: boolean;
    permanentlyBlocked?: boolean;
    autoPing?: boolean;
    connections?: Array<{
        remoteAddr: string;
        status: string;
    }>;
}

export interface PeersManagerState {
    peers: PeerInfo[];
    searchQuery: string;
    filteredPeers: PeerInfo[];
    stats: {
        totalPeers: number;
        totalConnections: number;
        blockedPeers: number;
        activePeers: number;
    };
    isLoading: boolean;
    libp2pNodeConnected: boolean;
}

export class PeersManager extends BaseComponent {
    static override observedAttributes = ['data-auto-refresh', 'data-refresh-interval'];
    public timerId: ReturnType<typeof setTimeout> | null = null;
    constructor() {
        super();
        this._templateMethods = {
            defaultTemplate: template.defaultTemplate,
            renderPeersListPart: (params: { state: Record<string, any>; context: BaseComponent }) =>
                template.renderPeersListPart({ state: params.state, context: params.context }),
            renderStatsPart: (params: { state: Record<string, any>; context: BaseComponent }) =>
                template.renderStatsPart({ state: params.state, context: params.context }),
            renderSearchResults: (params: { state: Record<string, any>; context: BaseComponent }) =>
                template.renderSearchResults({ state: params.state, context: params.context }),
            renderSearchEmptyState: (params: { state: Record<string, any>; context: BaseComponent }) =>
                template.renderSearchEmptyState({ state: params.state, context: params.context }),
        };

        this.state = {
            peers: [],
            searchQuery: '',
            filteredPeers: [],
            stats: {
                totalPeers: 0,
                totalConnections: 0,
                blockedPeers: 0,
                activePeers: 0
            },
            isLoading: false,
            libp2pNodeConnected: false
        } as PeersManagerState;
    }

    override async _componentReady(): Promise<void> {
        this._controller = await controller(this);
        this._actions = await createActions(this);

        // Подключаемся к libp2p-node
        await this.connectToLibp2pNode();

        // const autoRefresh = this.getAttribute('data-auto-refresh') === 'true';
        // const refreshInterval = parseInt(this.getAttribute('data-refresh-interval') || '30000');

        // if (autoRefresh) {
        //     setTimeout(() => {
        //         this.loadPeersData();
        //     }, 1000);
        //
        //     setInterval(() => {
        //         if (document.visibilityState === 'visible') {
        //             this.loadPeersData();
        //         }
        //     }, refreshInterval);
        // }
        await this.fullRender(this.state);
    }

    override async _componentAttributeChanged(name: string, _oldValue: string | null, newValue: string | null): Promise<void> {
        if (name === 'data-auto-refresh') {
            this.showNotification(`Auto refresh ${newValue === 'true' ? 'enabled' : 'disabled'}`, 'info');
        }
    }

    async connectToLibp2pNode(): Promise<void> {
        try {
            const libp2pNode = await this.getComponentAsync('libp2p-node', 'libp2p-node-1');
            if (libp2pNode) {
                const state = this.state as PeersManagerState;
                state.libp2pNodeConnected = true;

                await libp2pNode.postMessage({
                    type: 'SET_PEERS_MANAGER_LISTENER',
                    data: {
                        callback: (peers: any[]) => {
                            if(this.timerId) {
                                clearTimeout(this.timerId)
                            }
                            this.timerId = setTimeout(() => {
                                console.log('@@@@@@@@@@@@@ SET_PEERS_MANAGER_LISTENER callback @@@@@@@@@@@@@', peers)
                                this.updateFromLibp2p(peers);
                            }, 2000)
                        }
                    }
                });

                this.showNotification('Connected to libp2p-node', 'success');
            } else {
                this.showNotification('libp2p-node not found', 'warning');
            }
        } catch (error) {
            console.error('Error connecting to libp2p-node:', error);
            this.showNotification('Failed to connect to libp2p-node', 'error');
        }
    }

    async updateFromLibp2p(peers: any[]): Promise<void> {
        const state = this.state as PeersManagerState;

        // Преобразуем данные из формата libp2p-node в формат PeersManager
        const formattedPeers: PeerInfo[] = peers.map(peer => ({
            peerId: peer.peerId,
            connectionCount: peer.connectionCount || 1,
            streamCount: peer.streamCount || 0,
            blocked: peer.blocked || false,
            autoPing: peer.autoPing || false,
            connections: peer.connections?.map((conn: any) => ({
                remoteAddr: conn.remoteAddr,
                status: conn.status
            })) || []
        }));

        state.peers = formattedPeers;
        this.updateStats();
        await this.applySearchFilter(state.searchQuery);
        await this.updatePeersDisplay();
    }

    override async postMessage(event: any): Promise<any> {
        const state = this.state as PeersManagerState;

        try {
            switch (event.type) {
                case 'LOAD_PEERS':
                    console.log('---------- LOAD_PEERS ----------')
                    // await this.loadPeersData();
                    // return { success: true, stats: state.stats };

                case 'GET_STATS':
                    return {
                        success: true,
                        stats: state.stats,
                        state: this.state
                    };

                case 'REFRESH_PEERS':
                    console.log('---------- REFRESH_PEERS ----------')
                    // await this.loadPeersData();
                    // return { success: true, message: 'Peers refreshed' };

                case 'SEARCH_PEERS':
                    console.log('SEARCH_PEERS => updatePeersList')
                    // const query = event.data?.query || '';
                    // await this.applySearchFilter(query);
                    // await this.updatePeersList();
                    // return { success: true, results: state.filteredPeers.length };

                case 'GET_PEER_INFO':
                    const peerId = event.data?.peerId;
                    if (!peerId) {
                        return { success: false, error: 'Peer ID required' };
                    }
                    if (this._actions?.getPeerInfo) {
                        await this._actions.getPeerInfo(peerId);
                    }
                    return { success: true };

                case 'PING_PEER':
                    const pingPeerId = event.data?.peerId;
                    if (!pingPeerId) {
                        return { success: false, error: 'Peer ID required' };
                    }
                    if (this._actions?.pingPeer) {
                        const pingResult = await this._actions.pingPeer(pingPeerId);
                        return pingResult;
                    }
                    return { success: false, error: 'Actions not initialized' };

                case 'DISCONNECT_PEER':
                    const disconnectPeerId = event.data?.peerId;
                    if (!disconnectPeerId) {
                        return { success: false, error: 'Peer ID required' };
                    }
                    if (this._actions?.disconnectPeer) {
                        await this._actions.disconnectPeer(disconnectPeerId);
                    }
                    return { success: true, message: 'Peer disconnected' };

                case 'BLOCK_PEER':
                    const blockPeerId = event.data?.peerId;
                    if (!blockPeerId) {
                        return { success: false, error: 'Peer ID required' };
                    }
                    if (this._actions?.blockPeer) {
                        await this._actions.blockPeer(blockPeerId);
                    }
                    return { success: true, message: 'Peer blocked' };

                case 'UNBLOCK_PEER':
                    const unblockPeerId = event.data?.peerId;
                    if (!unblockPeerId) {
                        return { success: false, error: 'Peer ID required' };
                    }
                    if (this._actions?.unblockPeer) {
                        await this._actions.unblockPeer(unblockPeerId);
                    }
                    return { success: true, message: 'Peer unblocked' };

                case 'GET_BLOCKED_PEERS':
                    if (this._actions?.loadBlockedPeers) {
                        await this._actions.loadBlockedPeers();
                    }
                    return { success: true };

                case 'DISCONNECT_ALL_PEERS':
                    if (this._actions?.disconnectAllPeers) {
                        await this._actions.disconnectAllPeers();
                    }
                    return { success: true, message: 'All peers disconnected' };

                case 'GET_PING_STATUS':
                    if (this._actions?.updatePingStatus) {
                        await this._actions.updatePingStatus();
                    }
                    return { success: true };

                case 'START_AUTO_PING':
                    const startPeerId = event.data?.peerId;
                    if (!startPeerId) {
                        return { success: false, error: 'Peer ID required' };
                    }
                    if (this._actions?.startAutoPing) {
                        await this._actions.startAutoPing(startPeerId);
                    }
                    return { success: true, message: 'Auto ping started' };

                case 'STOP_AUTO_PING':
                    const stopPeerId = event.data?.peerId;
                    if (!stopPeerId) {
                        return { success: false, error: 'Peer ID required' };
                    }
                    if (this._actions?.stopAutoPing) {
                        await this._actions.stopAutoPing(stopPeerId);
                    }
                    return { success: true, message: 'Auto ping stopped' };

                case 'CLEAR_LOGS':
                    return { success: true, message: 'Logs cleared' };

                case 'UPDATE_FROM_LIBP2P':
                    const libp2pData = event.data;
                    if (libp2pData?.peers) {
                        await this.updateFromLibp2p(libp2pData.peers);
                    }
                    return { success: true, message: 'Data synchronized from libp2p' };

                case 'SET_PEERS_MANAGER_LISTENER':
                    const callback = event.data?.callback;
                    debugger
                    if (callback && typeof callback === 'function') {
                        const state = this.state as PeersManagerState;
                        state.libp2pNodeConnected = true;
                        return { success: true, message: 'PeersManager listener set' };
                    }

                    return { success: false, error: 'Invalid callback' };
                default:
                    console.warn(`[PeersManager] Unknown message type: ${event.type}`);
                    return {
                        success: false,
                        error: 'Unknown message type',
                        availableTypes: [
                            'LOAD_PEERS', 'GET_STATS', 'REFRESH_PEERS', 'SEARCH_PEERS',
                            'GET_PEER_INFO', 'PING_PEER', 'DISCONNECT_PEER', 'BLOCK_PEER',
                            'UNBLOCK_PEER', 'GET_BLOCKED_PEERS', 'DISCONNECT_ALL_PEERS',
                            'GET_PING_STATUS', 'START_AUTO_PING', 'STOP_AUTO_PING',
                            'CLEAR_LOGS', 'UPDATE_FROM_LIBP2P', 'SET_PEERS_MANAGER_LISTENER'
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
            return { success: false, error: (error as Error).message };
        }
    }

    async loadPeersData(): Promise<void> {
        const state = this.state as PeersManagerState;
        state.isLoading = true;

        try {
            // Не показываем скелетон при первой попытке
            if (state.peers.length === 0) {
                await this.showSkeleton();
            }

            // Даем libp2p-node время на запуск
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Получаем данные из libp2p-node
            const libp2pNode = await this.getComponentAsync('libp2p-node', 'libp2p-node-1');

            if (!libp2pNode) {
                // Если нода не найдена, показываем информативное сообщение
                await this.updateElement({
                    selector: '#peersList',
                    value: `
          <div class="info-state">
            <div class="info-icon">⏳</div>
            <p class="info-text">Libp2p Node not running</p>
            <p class="info-description">Start the Libp2p Node to see connected peers</p>
          </div>
        `,
                    property: 'innerHTML'
                });
                return;
            }

            // Проверяем статус ноды
            const statsResponse = await libp2pNode.postMessage({ type: 'GET_STATS' });

            if (!statsResponse.success || statsResponse.stats?.status !== 'running') {
                await this.updateElement({
                    selector: '#peersList',
                    value: `
          <div class="info-state">
            <div class="info-icon">⏸️</div>
            <p class="info-text">Libp2p Node is not running</p>
            <p class="info-description">Start the node to connect to peers</p>
          </div>
        `,
                    property: 'innerHTML'
                });
                return;
            }

            // Получаем подключенных пиров
            const response = await libp2pNode.postMessage({ type: 'GET_CONNECTED_PEERS' });

            if (response.success && response.peers) {
                await this.updateFromLibp2p(response.peers);
                if (response.peers.length > 0) {
                    this.showNotification(`Loaded ${state.peers.length} peers`, 'success');
                }
            } else {
                throw new Error(response.error || 'Failed to get peers');
            }

        } catch (error) {
            console.error('Error loading peers data:', error);
            // Не показываем ошибку пользователю, просто логируем
        } finally {
            state.isLoading = false;
            await this.hideSkeleton();
        }
    }

    updateStats(): void {
        const state = this.state as PeersManagerState;

        state.stats = {
            totalPeers: state.peers.length,
            totalConnections: state.peers.reduce((sum, peer) => sum + (peer.connectionCount || 0), 0),
            blockedPeers: state.peers.filter(p => p.blocked).length,
            activePeers: state.peers.filter(p => !p.blocked && (p.connectionCount || 0) > 0).length
        };
    }

    async applySearchFilter(searchQuery: string): Promise<void> {
        const state = this.state as PeersManagerState;
        state.searchQuery = searchQuery;

        if (!searchQuery.trim()) {
            state.filteredPeers = [...state.peers];
        } else {
            const query = searchQuery.toLowerCase();
            state.filteredPeers = state.peers.filter(peer =>
                peer.peerId.toLowerCase().includes(query) ||
                (peer.connections?.some(conn =>
                    conn.remoteAddr.toLowerCase().includes(query)
                ))
            );
        }
    }

    async updatePeersDisplay(): Promise<void> {
        logUpdatePeersDisplay('------ updatePeersDisplay -------')
        const state = this.state as PeersManagerState;
        await this.updateElement({
            selector: '.card-badge',
            value: state.stats.totalPeers.toString(),
            property: 'textContent'
        });
        await this.updateStatsDisplay();
        await this.updatePeersList();
    }

    async updateStatsDisplay(): Promise<void> {
        const state = this.state as PeersManagerState;

        await this.renderPart({
            partName: 'renderStatsPart',
            state: {
                totalPeers: state.stats.totalPeers,
                totalConnections: state.stats.totalConnections,
                blockedPeersCount: state.stats.blockedPeers
            },
            selector: '.stats-section .stats-grid'
        });
    }

    async updatePeersList(): Promise<void> {
        const state = this.state as PeersManagerState;

        if (state.filteredPeers.length === 0) {
            if (state.searchQuery) {
                await this.renderPart({
                    partName: 'renderSearchEmptyState',
                    state: { searchQuery: state.searchQuery },
                    selector: '#peersList'
                });
            } else {
                await this.updateElement({
                    selector: '#peersList',
                    value: template.renderPeersListPart({ state: { peers: [] } }),
                    property: 'innerHTML'
                });
            }
            return;
        }

        await this.renderPart({
            partName: 'renderPeersListPart',
            state: { peers: state.filteredPeers },
            selector: '#peersList'
        });
    }

    async refreshPeers(): Promise<void> {
        // await this.loadPeersData();
    }

    async getSpecificPeerInfo(peerId: string): Promise<void> {
        if (this._actions?.getPeerInfo) {
            await this._actions.getPeerInfo(peerId);
        }
    }

    async pingSpecificPeer(peerId: string): Promise<void> {
        if (this._actions?.pingPeer) {
            await this._actions.pingPeer(peerId);
        }
    }

    async disconnectSpecificPeer(peerId: string): Promise<void> {
        if (this._actions?.disconnectPeer) {
            await this._actions.disconnectPeer(peerId);
        }
    }

    async startAutoPing(peerId: string): Promise<void> {
        if (this._actions?.startAutoPing) {
            await this._actions.startAutoPing(peerId);
        }
    }

    async stopAutoPing(peerId: string): Promise<void> {
        if (this._actions?.stopAutoPing) {
            await this._actions.stopAutoPing(peerId);
        }
    }

    async getBlockedPeers(): Promise<void> {
        if (this._actions?.loadBlockedPeers) {
            await this._actions.loadBlockedPeers();
        }
    }

    async getPingStatus(): Promise<void> {
        if (this._actions?.updatePingStatus) {
            await this._actions.updatePingStatus();
        }
    }

    async disconnectAllPeers(): Promise<void> {
        if (this._actions?.disconnectAllPeers) {
            await this._actions.disconnectAllPeers();
        }
    }

    async handleSearchInput(event: Event): Promise<void> {
        const input = event.target as HTMLInputElement;
        const query = input.value;

        await this.applySearchFilter(query);
        await this.updatePeersList();
    }

    async clearSearch(): Promise<void> {
        const state = this.state as PeersManagerState;
        state.searchQuery = '';

        await this.applySearchFilter('');
        await this.updatePeersList();

        const searchInput = this.shadowRoot?.querySelector('#peer-search-input') as HTMLInputElement;
        if (searchInput) {
            await this.updateElement({
                selector: '#peer-search-input',
                value: '',
                property: 'value'
            });
        }
    }

    // Публичный метод для показа уведомлений
    public showNotification(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info'): void {
        window.dispatchEvent(new CustomEvent('show-notification', {
            detail: {
                message: message,
                type: type
            }
        }));
    }

    // Вспомогательные методы
    escapeHtml(text: string): string {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    override async _componentDisconnected(): Promise<void> {
        if (this._controller?.destroy) {
            await this._controller.destroy();
        }
        clearTimeout(this.timerId)
    }
}

if (!customElements.get('peers-manager')) {
    customElements.define('peers-manager', PeersManager);
}