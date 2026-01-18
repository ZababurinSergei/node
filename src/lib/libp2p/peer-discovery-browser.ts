import { createLogger } from '@/logger';
import { multiaddr } from '@multiformats/multiaddr';

const log = createLogger('peer-discovery-browser');

export interface PeerDiscoveryBrowserOptions {
    onPeerDiscovered: (peerInfo: { peerId: string; multiaddrs: string[]; source: string }) => void;
    onPeerConnected: (peerId: string, connection: any) => void;
    onPeerDisconnected: (peerId: string) => void;
    onError: (error: Error, source: string) => void;
    autoConnect: boolean;
    maxConnectionAttempts: number;
    discoveryInterval: number;
}

export interface DiscoveredPeer {
    peerId: string;
    multiaddrs: string[];
    discoveredAt: number;
    source: string;
    status: 'discovered' | 'connecting' | 'connected' | 'failed' | 'error';
    lastStatusUpdate: number;
    lastAttempt?: number;
    connectionAttempts: number;
}

export class PeerDiscoveryBrowser {
    private discoveredPeers: Map<string, DiscoveredPeer>;
    private connectionAttempts: Map<string, number>;
    private connectedPeers: Set<string>;
    private discoveryInterval: NodeJS.Timeout | undefined;
    private libp2p: any;
    private dhtManager: any;
    private connectionManager: any;
    private sendToAllUsers: (data: any) => void;
    private options: PeerDiscoveryBrowserOptions;

    constructor(
        libp2p: any,
        dhtManager: any,
        connectionManager: any,
        sendToAllUsers: (data: any) => void,
        options: Partial<PeerDiscoveryBrowserOptions> = {}
    ) {
        this.libp2p = libp2p;
        this.dhtManager = dhtManager;
        this.connectionManager = connectionManager;
        this.sendToAllUsers = sendToAllUsers;

        this.discoveredPeers = new Map();
        this.connectionAttempts = new Map();
        this.connectedPeers = new Set();

        this.options = {
            onPeerDiscovered: () => {},
            onPeerConnected: () => {},
            onPeerDisconnected: () => {},
            onError: () => {},
            autoConnect: true,
            maxConnectionAttempts: 3,
            discoveryInterval: 30000,
            ...options
        };

        this.setupEventListeners();
        this.logDiagnostics();
    }

    private logDiagnostics(): void {
        log('🔧 Peer Discovery Browser Diagnostics:', {
            hasLibp2p: !!this.libp2p,
            hasDHTManager: !!this.dhtManager,
            hasConnectionManager: !!this.connectionManager,
            hasSendToAllUsers: !!this.sendToAllUsers,
            options: this.options
        });
    }

    setupEventListeners(): void {
        if (!this.libp2p) {
            log.warn('⚠️ Libp2p instance not available for event listeners');
            return;
        }

        try {
            this.libp2p.addEventListener('peer:discovery', (event: any) => {
                this.handlePeerDiscovery(event.detail);
            });

            this.libp2p.addEventListener('connection:open', (event: any) => {
                this.handleConnectionOpen(event.detail);
            });

            this.libp2p.addEventListener('connection:close', (event: any) => {
                this.handleConnectionClose(event.detail);
            });

            log('✅ Event listeners установлены');
        } catch (error) {
            log.error('❌ Error setting up event listeners:', error);
            this.options.onError(error as Error, 'setupEventListeners');
        }
    }

    private handlePeerDiscovery(peerInfo: any): void {
        try {
            const peerId = peerInfo.id.toString();
            const multiaddrs = peerInfo.multiaddrs
                ? peerInfo.multiaddrs.map((ma: any) => ma.toString())
                : [];

            log('🎯 Peer discovered:', {
                peerId,
                multiaddrs: multiaddrs.slice(0, 3),
                totalMultiaddrs: multiaddrs.length,
                hasPublicAddress: this.hasPublicAddress(multiaddrs)
            });

            // Обновляем или добавляем пира
            const existingPeer = this.discoveredPeers.get(peerId);
            if (existingPeer) {
                // Обновляем адреса и статус
                existingPeer.multiaddrs = [...new Set([...existingPeer.multiaddrs, ...multiaddrs])];
                existingPeer.lastStatusUpdate = Date.now();
                existingPeer.source = 'mdns';
            } else {
                // Создаем новую запись
                const newPeer: DiscoveredPeer = {
                    peerId,
                    multiaddrs,
                    discoveredAt: Date.now(),
                    source: 'mdns',
                    status: 'discovered',
                    lastStatusUpdate: Date.now(),
                    connectionAttempts: 0
                };
                this.discoveredPeers.set(peerId, newPeer);
            }

            // Вызываем колбэк
            this.options.onPeerDiscovered({
                peerId,
                multiaddrs,
                source: 'mdns'
            });

            // Отправляем обновление через SSE
            this.sendDiscoveryUpdate();

            // Автоподключение если включено
            if (this.options.autoConnect && this.shouldConnectToPeer(peerId)) {
                this.scheduleConnection(peerId, multiaddrs);
            }

        } catch (error) {
            log.error('❌ Error handling peer discovery:', error);
            this.options.onError(error as Error, 'handlePeerDiscovery');
        }
    }

    private handleConnectionOpen(connection: any): void {
        try {
            const peerId = connection.remotePeer.toString();
            const remoteAddr = connection.remoteAddr.toString();

            // log('✅ Peer connected:', { peerId, remoteAddr });

            // Обновляем статус пира
            const peer = this.discoveredPeers.get(peerId);
            if (peer) {
                peer.status = 'connected';
                peer.lastStatusUpdate = Date.now();

                // Добавляем адрес если его нет
                if (!peer.multiaddrs.includes(remoteAddr)) {
                    peer.multiaddrs.push(remoteAddr);
                }
            } else {
                // Создаем новую запись для подключенного пира
                this.discoveredPeers.set(peerId, {
                    peerId,
                    multiaddrs: [remoteAddr],
                    discoveredAt: Date.now(),
                    source: 'connection',
                    status: 'connected',
                    lastStatusUpdate: Date.now(),
                    connectionAttempts: 0
                });
            }

            this.connectedPeers.add(peerId);

            // Сбрасываем счетчик попыток
            this.connectionAttempts.delete(peerId);

            // Вызываем колбэк
            this.options.onPeerConnected(peerId, connection);

            // Отправляем обновление через SSE
            this.sendDiscoveryUpdate();

        } catch (error) {
            log.error('❌ Error handling connection open:', error);
            this.options.onError(error as Error, 'handleConnectionOpen');
        }
    }

    private handleConnectionClose(connection: any): void {
        try {
            const peerId = connection.remotePeer.toString();

            // log('❌ Peer disconnected:', { peerId });

            const peer = this.discoveredPeers.get(peerId);
            if (peer) {
                peer.status = 'discovered';
                peer.lastStatusUpdate = Date.now();
            }

            this.connectedPeers.delete(peerId);

            // Вызываем колбэк
            this.options.onPeerDisconnected(peerId);

            // Отправляем обновление через SSE
            this.sendDiscoveryUpdate();

        } catch (error) {
            log.error('❌ Error handling connection close:', error);
            this.options.onError(error as Error, 'handleConnectionClose');
        }
    }

    private hasPublicAddress(multiaddrs: string[]): boolean {
        return multiaddrs.some(addr => {
            return !addr.includes('127.0.0.1') &&
                !addr.includes('localhost') &&
                !addr.includes('192.168.') &&
                !addr.includes('10.');
        });
    }

    private shouldConnectToPeer(peerId: string): boolean {
        // Не подключаемся к себе
        if (this.libp2p.peerId.toString() === peerId) {
            return false;
        }

        // Проверяем блокировку
        if (this.connectionManager?.isPeerBlocked(peerId)) {
            log.debug(`Peer ${peerId} is blocked`);
            return false;
        }

        // Проверяем уже подключены ли
        if (this.connectedPeers.has(peerId)) {
            log.debug(`Already connected to peer ${peerId}`);
            return false;
        }

        // Проверяем лимит попыток
        const attempts = this.connectionAttempts.get(peerId) || 0;
        if (attempts >= this.options.maxConnectionAttempts) {
            log.debug(`Max connection attempts reached for peer ${peerId}`);
            return false;
        }

        // Проверяем лимит соединений
        if (this.connectionManager && !this.connectionManager.canAcceptNewConnection()) {
            log.debug(`Connection limit reached, skipping peer ${peerId}`);
            return false;
        }

        return true;
    }

    private async scheduleConnection(peerId: string, multiaddrs: string[]): Promise<void> {
        try {
            log(`🔄 Scheduling connection to peer: ${peerId}`);

            // Увеличиваем счетчик попыток
            const currentAttempts = this.connectionAttempts.get(peerId) || 0;
            this.connectionAttempts.set(peerId, currentAttempts + 1);

            // Обновляем статус пира
            const peer = this.discoveredPeers.get(peerId);
            if (peer) {
                peer.status = 'connecting';
                peer.lastAttempt = Date.now();
                peer.lastStatusUpdate = Date.now();
                peer.connectionAttempts = currentAttempts + 1;
            }

            // Отправляем обновление
            this.sendDiscoveryUpdate();

            // Запускаем подключение
            await this.connectToPeer(peerId, multiaddrs);

        } catch (error) {
            log.error(`❌ Error scheduling connection to ${peerId}:`, error);
            this.options.onError(error as Error, 'scheduleConnection');
        }
    }

    public async connectToPeer(peerId: string, multiaddrs: string[] = []): Promise<boolean> {
        try {
            log(`🔌 Connecting to peer: ${peerId}`);

            // Получаем адреса если не предоставлены
            let addresses = multiaddrs;
            if (addresses.length === 0) {
                const peerInfo = await this.findPeerInDHT(peerId);
                addresses = peerInfo?.multiaddrs || [];
            }

            if (addresses.length === 0) {
                log.warn(`⚠️ No addresses found for peer: ${peerId}`);
                this.updatePeerStatus(peerId, 'failed', 'no_addresses');
                return false;
            }

            // Фильтруем поддерживаемые адреса для браузера
            const supportedAddresses = this.filterBrowserSupportedAddresses(addresses);

            if (supportedAddresses.length === 0) {
                log.warn(`⚠️ No browser-supported addresses for peer: ${peerId}`);
                this.updatePeerStatus(peerId, 'failed', 'unsupported_protocols');
                return false;
            }

            log(`📡 Supported addresses for ${peerId}:`, supportedAddresses);

            // Пытаемся подключиться по каждому адресу
            for (const addr of supportedAddresses) {
                try {
                    log(`🔗 Attempting connection via: ${addr}`);

                    // Создаем полный MultiAddr с PeerId
                    const fullAddr = this.createFullMultiaddr(addr, peerId);
                    if (!fullAddr) {
                        continue;
                    }

                    // Подключаемся
                    await this.libp2p.dial(fullAddr);

                    log(`✅ Successfully connected to ${peerId} via ${addr}`);
                    this.updatePeerStatus(peerId, 'connected');
                    return true;

                } catch (dialError) {
                    log.warn(`❌ Failed to connect via ${addr}:`, (dialError as Error).message);
                    continue;
                }
            }

            // Все попытки не удались
            log.error(`💥 All connection attempts failed for ${peerId}`);
            this.updatePeerStatus(peerId, 'failed', 'all_attempts_failed');

            // Временно блокируем пира
            if (this.connectionManager) {
                this.connectionManager.blockPeer(peerId, 60000); // 1 минута
            }

            return false;

        } catch (error) {
            log.error(`💥 Critical error connecting to ${peerId}:`, error);
            this.updatePeerStatus(peerId, 'error', (error as Error).message);
            this.options.onError(error as Error, 'connectToPeer');
            return false;
        }
    }

    private filterBrowserSupportedAddresses(addresses: string[]): string[] {
        const supported = [];

        for (const addr of addresses) {
            // Браузер поддерживает WebSocket, WebRTC, WebTransport
            if (addr.includes('/wss/') ||
                addr.includes('/ws/') ||
                addr.includes('/webrtc/') ||
                addr.includes('/webtransport/')) {
                supported.push(addr);
            } else {
                log.debug(`🚫 Browser-unsupported protocol: ${addr}`);
            }
        }

        return supported;
    }

    private createFullMultiaddr(addr: string, peerId: string): any | null {
        try {
            // Если адрес уже содержит PeerId, используем как есть
            if (addr.includes('/p2p/') || addr.includes('/ipfs/')) {
                return multiaddr(addr);
            }

            // Добавляем PeerId к адресу
            return multiaddr(addr).encapsulate(`/p2p/${peerId}`);

        } catch (error) {
            log.error(`❌ Error creating MultiAddr for ${addr}:`, error);
            return null;
        }
    }

    private async findPeerInDHT(peerId: string): Promise<{ multiaddrs: string[] } | null> {
        try {
            if (!this.dhtManager) {
                log.warn('DHTManager not available for peer lookup');
                return null;
            }

            // Пытаемся найти пира через все DHT
            const results = await this.dhtManager.findPeer(peerId, 'all');

            for (const result of results) {
                if (result.success && result.peerInfo?.addresses) {
                    return {
                        multiaddrs: result.peerInfo.addresses
                    };
                }
            }

            return null;

        } catch (error) {
            log.error(`❌ Error finding peer ${peerId} in DHT:`, error);
            return null;
        }
    }

    private updatePeerStatus(peerId: string, status: DiscoveredPeer['status'], reason?: string): void {
        const peer = this.discoveredPeers.get(peerId);
        if (!peer) {
            return;
        }

        peer.status = status;
        peer.lastStatusUpdate = Date.now();

        if (reason) {
            log.debug(`Updated peer ${peerId} status to ${status}: ${reason}`);
        }

        // Отправляем обновление
        this.sendDiscoveryUpdate();
    }

    private sendDiscoveryUpdate(): void {
        if (!this.sendToAllUsers) {
            return;
        }

        const discoveredPeers = Array.from(this.discoveredPeers.values()).map(peer => ({
            peerId: peer.peerId,
            source: peer.source,
            status: peer.status,
            discoveredAt: peer.discoveredAt,
            lastStatusUpdate: peer.lastStatusUpdate,
            lastAttempt: peer.lastAttempt,
            multiaddrs: peer.multiaddrs.slice(0, 3),
            connectionAttempts: peer.connectionAttempts
        }));

        const stats = {
            totalDiscovered: discoveredPeers.length,
            connected: discoveredPeers.filter(p => p.status === 'connected').length,
            connecting: discoveredPeers.filter(p => p.status === 'connecting').length,
            failed: discoveredPeers.filter(p => p.status === 'failed' || p.status === 'error').length,
            autoConnect: this.options.autoConnect
        };

        this.sendToAllUsers({
            type: 'peer_discovery_update',
            discoveredPeers,
            ...stats,
            timestamp: Date.now()
        });
    }

    public async performActiveDiscovery(): Promise<void> {
        try {
            log('🎯 Performing active peer discovery...');

            // Используем DHT для поиска пиров
            if (this.dhtManager) {
                const closestPeers = await this.findClosestPeers();

                for (const peerId of closestPeers) {
                    if (this.shouldConnectToPeer(peerId)) {
                        log(`🎯 Actively discovered peer via DHT: ${peerId}`);
                        await this.scheduleConnection(peerId, []);
                    }
                }
            }

            // Ретрай неудачных подключений
            await this.retryFailedConnections();

        } catch (error) {
            log.error('❌ Error performing active discovery:', error);
            this.options.onError(error as Error, 'performActiveDiscovery');
        }
    }

    private async findClosestPeers(count: number = 10): Promise<string[]> {
        try {
            if (!this.dhtManager) {
                log.warn('DHTManager not available for peer discovery');
                return [];
            }

            const peers = new Set<string>();

            // Пытаемся получить ближайших пиров через все DHT
            const dhtTypes = ['lan', 'amino', 'universe'];

            for (const dhtType of dhtTypes) {
                try {
                    const dhtInstance = this.getDHTInstance(dhtType);
                    if (!dhtInstance) {
                        continue;
                    }

                    const closest = await this.getClosestPeersFromDHT(dhtInstance, count);
                    closest.forEach(peer => peers.add(peer));

                } catch (error) {
                    log.debug(`Error searching in ${dhtType} DHT:`, (error as Error).message);
                }
            }

            return Array.from(peers).slice(0, count);

        } catch (error) {
            log.error('❌ Error finding closest peers:', error);
            return [];
        }
    }

    private getDHTInstance(dhtType: string): any {
        if (!this.dhtManager) return null;

        switch (dhtType) {
            case 'lan': return this.dhtManager.lanDHT;
            case 'amino': return this.dhtManager.aminoDHT;
            case 'universe': return this.dhtManager.universeDHT;
            default: return null;
        }
    }

    private async getClosestPeersFromDHT(dhtInstance: any, count: number): Promise<string[]> {
        try {
            if (!dhtInstance || typeof dhtInstance.getClosestPeers !== 'function') {
                return [];
            }

            const ourPeerId = this.libp2p.peerId;
            const peers: string[] = [];

            for await (const event of dhtInstance.getClosestPeers(ourPeerId.toBytes())) {
                if (event.name === 'FINAL_PEER') {
                    const peerId = event.peer.id.toString();
                    peers.push(peerId);

                    if (peers.length >= count) {
                        break;
                    }
                }
            }

            return peers;

        } catch (error) {
            log.debug('Error getting closest peers from DHT:', (error as Error).message);
            return [];
        }
    }

    private async retryFailedConnections(): Promise<void> {
        const failedPeers = Array.from(this.discoveredPeers.entries())
            .filter(([_, peer]) => peer.status === 'failed' || peer.status === 'error')
            .filter(([peerId, _]) => {
                const attempts = this.connectionAttempts.get(peerId) || 0;
                return attempts < this.options.maxConnectionAttempts;
            });

        log.debug(`🔄 Retrying connections for ${failedPeers.length} peers`);

        for (const [peerId, peer] of failedPeers) {
            // Добавляем задержку между повторными попытками
            await this.delay(5000);

            log(`🔄 Retrying connection to ${peerId}`);
            await this.connectToPeer(peerId, peer.multiaddrs);
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    public startAutoDiscovery(): void {
        if (this.discoveryInterval) {
            clearInterval(this.discoveryInterval);
            this.discoveryInterval = undefined;
        }

        // Немедленный первый поиск
        setTimeout(() => {
            this.performActiveDiscovery();
        }, 2000);

        // Периодический поиск
        this.discoveryInterval = setInterval(async () => {
            await this.performActiveDiscovery();
        }, this.options.discoveryInterval);

        log('🔍 Auto-discovery started');
    }

    public stopAutoDiscovery(): void {
        if (this.discoveryInterval) {
            clearInterval(this.discoveryInterval);
            this.discoveryInterval = undefined;
        }

        log('🛑 Auto-discovery stopped');
    }

    public getDiscoveryStats() {
        const discoveredPeers = Array.from(this.discoveredPeers.values());

        return {
            totalDiscovered: discoveredPeers.length,
            connected: discoveredPeers.filter(p => p.status === 'connected').length,
            connecting: discoveredPeers.filter(p => p.status === 'connecting').length,
            discovered: discoveredPeers.filter(p => p.status === 'discovered').length,
            failed: discoveredPeers.filter(p => p.status === 'failed' || p.status === 'error').length,
            autoConnect: this.options.autoConnect,
            discoverySources: {
                mdns: discoveredPeers.filter(p => p.source === 'mdns').length,
                dht: discoveredPeers.filter(p => p.source.startsWith('dht')).length
            },
            connectedPeers: Array.from(this.connectedPeers)
        };
    }

    public getDiscoveredPeers(): DiscoveredPeer[] {
        return Array.from(this.discoveredPeers.values());
    }

    public async connectToSpecificPeer(peerId: string): Promise<boolean> {
        if (!peerId) {
            throw new Error('Peer ID is required');
        }

        log(`🔧 Manual connection to peer: ${peerId}`);

        // Сбрасываем счетчик попыток для ручного подключения
        this.connectionAttempts.set(peerId, 0);

        return await this.connectToPeer(peerId, []);
    }

    public clearDiscoveryList(): number {
        const count = this.discoveredPeers.size;
        this.discoveredPeers.clear();
        this.connectionAttempts.clear();
        this.connectedPeers.clear();

        log(`🧹 Cleared discovery list (${count} peers)`);
        this.sendDiscoveryUpdate();

        return count;
    }

    public stop(): void {
        this.stopAutoDiscovery();
        this.clearDiscoveryList();
        log('🛑 Peer Discovery Browser stopped');
    }
}