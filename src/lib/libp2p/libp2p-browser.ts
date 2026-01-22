import {BaseComponent} from '@/base/base-component'
import {createLibp2p} from 'libp2p'
import {webSockets} from '@libp2p/websockets'
import {webRTC} from '@libp2p/webrtc'
import {webTransport} from '@libp2p/webtransport'
import {noise} from '@chainsafe/libp2p-noise'
import {yamux} from '@chainsafe/libp2p-yamux'
import {identify} from '@libp2p/identify'
import {ping} from '@libp2p/ping'
import {kadDHT, removePublicAddressesMapper, removePrivateAddressesMapper} from '@libp2p/kad-dht'
import {bootstrap} from '@libp2p/bootstrap'
import {gossipsub} from '@chainsafe/libp2p-gossipsub'
import type {PeerId} from '@libp2p/interface'
import {multiaddr} from '@multiformats/multiaddr'
import {peerIdFromString} from '@libp2p/peer-id'
import {circuitRelayTransport} from '@libp2p/circuit-relay-v2'
import { dcutr } from '@libp2p/dcutr';
import {simpleMetrics} from "@libp2p/simple-metrics";

export interface Libp2pBrowserOptions {
    onPeerDiscovered?: (peerId: string, multiaddrs: string[]) => void
    onPeerConnected?: (peerId: string, connection: any) => void
    onPeerDisconnected?: (peerId: string) => void
    onConnectionOpened?: (peerId: string, remoteAddr: string) => void
    onConnectionClosed?: (peerId: string) => void
    onError?: (error: Error, details?: any) => void
    onLog?: (message: string, level: 'info' | 'warn' | 'error' | 'debug') => void
    enableDHT?: boolean
    enablePubSub?: boolean
    enableRelay?: boolean
    enableMDNS?: boolean
    enableAutoNAT?: boolean
    bootstrapNodes?: string[]
    peerId?: PeerId
}

export interface Libp2pBrowserNode {
    libp2p: any
    peerId: string
    getMultiaddrs: () => string[]
    getConnections: () => any[]
    getPeers: () => string[]
    getProtocols: () => string[]
    stop: () => Promise<void>
    start: () => Promise<void>
    // discoverPeers: (options?: { timeout?: number; maxPeers?: number }) => Promise<string[]>
    connectToPeer: (peerId: string, multiaddrs?: string[]) => Promise<boolean>
    disconnectPeer: (peerId: string) => Promise<boolean>
    sendPing: (peerId: string) => Promise<number | null>
    getDHTStats: () => Promise<{
        lan: any
        amino: any
        universe: any
    }>
    publishMessage: (topic: string, message: Uint8Array) => Promise<void>
    subscribeToTopic: (topic: string, handler: (data: Uint8Array) => void) => Promise<void>
    provideData: (key: string, value: Uint8Array) => Promise<void>
    findProviders: (key: string) => Promise<string[]>
    getNodeInfo: () => {
        peerId: string
        multiaddrs: string[]
        protocols: string[]
        connections: number
        status: 'stopped' | 'starting' | 'running' | 'error'
    }
}

// Экспорт дефолтных bootstrap-адресов для использования в компонентах
export const LIBP2P_DEFAULT_BOOTSTRAP_NODES = [
    '/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star/',
    '/dns4/wrtc-star2.sjc.dwebops.pub/tcp/443/wss/p2p-webrtc-star/',
    '/dns4/webrtc-star.discovery.libp2p.io/tcp/443/wss/p2p-webrtc-star/',
    '/dns4/relay.libp2p.io/tcp/443/wss/p2p-circuit/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
    '/ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ',
    '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
    '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
    '/dnsaddr/bootstrap.libp2p.io/p2p/QmZa1sAxajnQjVM8WjWXoMbmPd7NsWhfKsPkErzpm9wGkp',
    '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
    '/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt'
]

export async function createLibp2pNode(options: Libp2pBrowserOptions = {}): Promise<Libp2pBrowserNode> {
    const {
        enableDHT = true,
        enablePubSub = true,
        bootstrapNodes,
        peerId,
        // onPeerDiscovered,
        onPeerConnected,
        onPeerDisconnected,
        onConnectionOpened,
        onConnectionClosed,
        onError,
        onLog
    } = options;

    const log = (message: string, level: 'info' | 'warn' | 'error' | 'debug' = 'info') => {
        onLog?.(message, level)
        if (level === 'debug') {
            // console.debug(`[Libp2pBrowser] ${message}`);
            // console.trace()
        } else {
            // console.log(`[Libp2pBrowser] ${level.toUpperCase()}: ${message}`)
        }
    }

    try {
        const bootstrapNodesList = bootstrapNodes || LIBP2P_DEFAULT_BOOTSTRAP_NODES

        const services: any = {
            identify: identify(),
            ping: ping(),
        }

        if (enablePubSub) {
            services.pubsub = gossipsub()
        }

        if (enableDHT || true) {
            services.universeDHT = kadDHT({
                kBucketSize: 2,           // Меньше памяти
                prefixLength: 2,           // Меньше пиров (2^4 * 10 = 160)
                alpha: 2,                  // Меньше параллелизма
                disjointPaths: 2,          // Меньше путей
                protocol: '/universe/kad/1.0.0',
                peerInfoMapper: removePrivateAddressesMapper,
                clientMode: false,
                logPrefix: 'libp2p:dht-universe'
            })

            services.aminoDHT = kadDHT({
                kBucketSize: 2,           // Меньше памяти
                prefixLength: 2,           // Меньше пиров (2^4 * 10 = 160)
                alpha: 2,                  // Меньше параллелизма
                disjointPaths: 2,          // Меньше путей
                protocol: '/ipfs/kad/1.0.0',
                peerInfoMapper: removePrivateAddressesMapper,
                clientMode: false,
                logPrefix: 'libp2p:dht-amino'
            })

            services.lanDHT = kadDHT({
                kBucketSize: 2,           // Меньше памяти
                prefixLength: 2,           // Меньше пиров (2^4 * 10 = 160)
                alpha: 2,                  // Меньше параллелизма
                disjointPaths: 2,          // Меньше путей
                protocol: '/ipfs/lan/kad/1.0.0',
                peerInfoMapper: removePublicAddressesMapper,
                clientMode: false,
                logPrefix: 'libp2p:dht-lan'
            })
        }
        services.dcutr = dcutr()

        const transports = [
            webSockets(),
            webRTC(),
            webTransport(),
            circuitRelayTransport()
        ]

        const peerDiscovery = []

        peerDiscovery.push(bootstrap({
            list: bootstrapNodesList,
            timeout: 1000,
            tagName: 'bootstrap'
        }))

        const libp2p = await createLibp2p({
            ...(peerId && { peerId }),
            metrics: simpleMetrics({
                onMetrics: (metrics) => {
                    document.dispatchEvent(new CustomEvent('chat-metrics', {
                        detail: metrics
                    }))
                }
            }),
            addresses: {
                listen: [
                    '/p2p-circuit',
                    '/webrtc',
                    '/wss',
                    '/ws'
                ]
            },
            transports,
            connectionEncrypters: [noise()],
            streamMuxers: [yamux()],
            connectionGater: {
                denyDialMultiaddr: () => false
            },
            peerDiscovery,
            services,
            connectionManager: {
                maxConnections: 5,
                maxParallelDials: 5,
                dialTimeout: 30000
            }
        } as any)

        // const discoveredPeers = new Map<string, { multiaddrs: string[], discoveredAt: number }>()
        const connectedPeers = new Set<string>()


        // @ts-ignore
        libp2p.addEventListener('transport:close', async (event) => {
            console.log('!!!!!!!!!!!! transport:close !!!!!!!!!!!!!!!')
            // const addresses = libp2p.getMultiaddrs().map(addr => addr.toString());
            // await updateAllAddressesInComponent(addresses);
            const myAddrs = libp2p.getMultiaddrs();
            const myCircuitAddrs = myAddrs.filter(addr =>
                addr.toString().includes('/p2p-circuit/')
            );

            if (myCircuitAddrs.length > 0) {
                await updateNetworkAddressesComponent(myCircuitAddrs);
            }
            // log(`Transport listening close, адреса обновлены: ${addresses.length}`, 'info');
        });

        // @ts-ignore
        libp2p.addEventListener('transport:listening', async (event) => {
           // const addresses = libp2p.getMultiaddrs().map(addr => addr.toString());
            const myAddrs = libp2p.getMultiaddrs();
            const myCircuitAddrs = myAddrs.filter(addr =>
                addr.toString().includes('/p2p-circuit/')
            );

            if (myCircuitAddrs.length > 0) {
                await updateNetworkAddressesComponent(myCircuitAddrs);
            }
           // console.log('!!!!!!!!!!!! transport:listening !!!!!!!!!!!!!!!')
            // await updateAllAddressesInComponent(addresses);
            // log(`Transport listening, адреса обновлены: ${addresses.length}`, 'info');
        });

        // @ts-ignore
        libp2p.addEventListener('self:peer:update', async (event) => {
            console.log('!!!!!!!!!!!! self:peer:update !!!!!!!!!!!!!!!')
            const myAddrs = libp2p.getMultiaddrs();
            const myCircuitAddrs = myAddrs.filter(addr =>
                addr.toString().includes('/p2p-circuit/')
            );

            if (myCircuitAddrs.length > 0) {
                await updateNetworkAddressesComponent(myCircuitAddrs);
            }

            // const allAddresses = myAddrs.map(addr => addr.toString());
            // await updateAllAddressesInComponent(allAddresses);
        });

        // async function updateAllAddressesInComponent(allAddresses: string[]): Promise<void> {
        //     try {
        //         const networkAddressesComponent = await findNetworkAddressesComponent();
        //
        //         if (networkAddressesComponent) {
        //             const result = await networkAddressesComponent.postMessage({
        //                 type: 'UPDATE_ADDRESSES',
        //                 data: {
        //                     addresses: allAddresses,
        //                     source: 'libp2p-all-addresses-update'
        //                 }
        //             });
        //
        //             if (result?.success) {
        //                 log(`Все адреса обновлены в Network Addresses: ${result.count || allAddresses.length} адресов`, 'debug');
        //             }
        //         }
        //     } catch (error) {
        //         log(`Ошибка при обновлении всех адресов: ${error}`, 'warn');
        //     }
        // }

        async function updateNetworkAddressesComponent(circuitAddresses: any[]): Promise<void> {
            try {
                // Преобразуем Multiaddr объекты в строки
                const addressStrings = circuitAddresses.map(addr => addr.toString());

                log(`Обнаружены circuit адреса: ${addressStrings.join(', ')}`, 'info');

                // Получаем компонент network-addresses
                const networkAddressesComponent = await findNetworkAddressesComponent();

                if (networkAddressesComponent) {
                    const result = await networkAddressesComponent.postMessage({
                        type: 'UPDATE_ADDRESSES',
                        data: {
                            addresses: addressStrings,
                            source: 'libp2p-circuit-update'
                        }
                    });

                    if (result?.success) {
                        log(`Circuit адреса успешно обновлены в Network Addresses: ${result.count || addressStrings.length} адресов`, 'info');
                    } else {
                        log(`Ошибка обновления circuit адресов: ${result?.error || 'Unknown error'}`, 'warn');
                    }
                } else {
                    log('Компонент Network Addresses не найден, circuit адреса не обновлены', 'warn');
                }
            } catch (error) {
                log(`Ошибка при обновлении circuit адресов: ${error}`, 'error');
            }
        }

        // Функция для поиска компонента network-addresses
        async function findNetworkAddressesComponent(): Promise<any> {
            try {
                if (BaseComponent && typeof BaseComponent.getComponentAsync === 'function') {
                    return await BaseComponent.getComponentAsync('network-addresses', 'network-addresses-1');
                }

                // Альтернативный способ через document.querySelector
                return document.querySelector('network-addresses#network-addresses-1');
            } catch (error) {
                log(`Ошибка поиска компонента Network Addresses: ${error}`, 'warn');
                return null;
            }
        }

        // @ts-ignore
        libp2p.addEventListener('peer:discovery', (evt) => {
            // const peerId = evt.detail.id.toString()
            // const multiaddrs = evt.detail.multiaddrs?.map((ma: any) => ma.toString()) || []

            // discoveredPeers.set(peerId, {
            //     multiaddrs,
            //     discoveredAt: Date.now()
            // })


            // console.log('@@@@@@@@@@ onPeerDiscovered @@@@@@@@@@@@@', multiaddrs)
            // onPeerDiscovered?.(peerId, multiaddrs)
            // log(`Peer discovered: ${peerId}`, 'info')
        })

        // @ts-ignore
        libp2p.addEventListener('peer:connect', (evt) => {
            // const peerId = evt.detail.toString()
            // console.log('------------ peer:connect ------------', evt)
            // connectedPeers.add(peerId)
            // onPeerConnected?.(peerId, evt.detail)
            // log(`Peer connected: ${peerId}`, 'info')
        })

        libp2p.addEventListener('peer:disconnect', (evt) => {
            const peerId = evt.detail.toString()
            connectedPeers.delete(peerId)
            onPeerDisconnected?.(peerId)
            // log(`Peer disconnected: ${peerId}`, 'info')
        })

        libp2p.addEventListener('connection:open', (evt) => {
            const connection = evt.detail
            const peerId = connection.remotePeer.toString()
            const remoteAddr = connection.remoteAddr.toString()
            // console.log('------- connection:open ------------', remoteAddr)
            onConnectionOpened?.(peerId, remoteAddr)
            // log(`Connection opened to ${peerId} at ${remoteAddr}`, 'info')
        })

        libp2p.addEventListener('connection:close', (evt) => {
            const connection = evt.detail
            const peerId = connection.remotePeer.toString()

            // console.log('------- connection:close ------------', evt.detail)
            onConnectionClosed?.(peerId)
            // log(`Connection closed to ${peerId}`, 'info')
        })

        libp2p.addEventListener('peer:error' as any, (evt: any) => {
            const error = evt.detail
            console.log('------- peer:error ------------', evt.detail)
            onError?.(error, error)
            // log(`Error: ${error.message}`, 'error')
        })

        await libp2p.start()

        log('Libp2p browser node started', 'info')
        log(`Peer ID: ${libp2p.peerId.toString()}`, 'info')
        log(`Listening on: ${libp2p.getMultiaddrs().map(ma => ma.toString()).join(', ')}`, 'info')

        const getDHTStats = async () => {
            if (!services.dht) {
                return {
                    lan: { peerCount: 0, status: 'disabled' },
                    amino: { peerCount: 0, status: 'disabled' },
                    universe: { peerCount: 0, status: 'disabled' }
                }
            }

            try {
                // Получаем информацию о пирах в DHT
                let routingTableSize = 0;

                // Проверяем наличие routingTable
                if (services.dht.routingTable) {
                    try {
                        routingTableSize = services.dht.routingTable.size || 0;
                    } catch (e) {
                        log(`Error getting routing table size: ${e}`, 'warn');
                    }
                }

                return {
                    lan: {
                        peerCount: routingTableSize,
                        status: 'running',
                        routingTableSize,
                        queries: { total: 0, successful: 0, failed: 0 }
                    },
                    amino: {
                        peerCount: routingTableSize,
                        status: 'running',
                        routingTableSize,
                        queries: { total: 0, successful: 0, failed: 0 }
                    },
                    universe: {
                        peerCount: routingTableSize,
                        status: 'running',
                        routingTableSize,
                        queries: { total: 0, successful: 0, failed: 0 }
                    }
                };
            } catch (error) {
                log(`Error getting DHT stats: ${error}`, 'error')
                return {
                    lan: { peerCount: 0, status: 'error', error: String(error) },
                    amino: { peerCount: 0, status: 'error', error: String(error) },
                    universe: { peerCount: 0, status: 'error', error: String(error) }
                }
            }
        }

        const findProviders = async (key: string): Promise<string[]> => {
            if (!services.dht) {
                return []
            }

            try {
                const providers: string[] = []
                for await (const provider of services.dht.findProviders(key)) {
                    providers.push(provider.id.toString())
                }
                return providers
            } catch (error) {
                log(`Error finding providers for ${key}: ${error}`, 'error')
                return []
            }
        }

        const provideData = async (key: string, value: Uint8Array): Promise<void> => {
            if (!services.dht) {
                throw new Error('DHT not enabled')
            }

            try {
                await services.dht.put(key, value)
                log(`Data provided for key: ${key}`, 'info')
            } catch (error) {
                log(`Error providing data: ${error}`, 'error')
                throw error
            }
        }

        const publishMessage = async (topic: string, message: Uint8Array): Promise<void> => {
            if (!services.pubsub) {
                throw new Error('PubSub not enabled')
            }

            try {
                await services.pubsub.publish(topic, message)
                log(`Message published to topic: ${topic}`, 'info')
            } catch (error) {
                log(`Error publishing message: ${error}`, 'error')
                throw error
            }
        }

        const subscribeToTopic = async (topic: string, handler: (data: Uint8Array) => void): Promise<void> => {
            if (!services.pubsub) {
                throw new Error('PubSub not enabled')
            }

            try {
                await services.pubsub.subscribe(topic)
                services.pubsub.addEventListener('message', (evt: any) => {
                    if (evt.detail.topic === topic) {
                        handler(evt.detail.data)
                    }
                })
                log(`Subscribed to topic: ${topic}`, 'info')
            } catch (error) {
                log(`Error subscribing to topic: ${error}`, 'error')
                throw error
            }
        }

        // Возвращаем интерфейс для работы с нодой
        return {
            libp2p: libp2p,
            peerId: libp2p.peerId.toString(),

            getMultiaddrs: () => libp2p.getMultiaddrs().map(ma => ma.toString()),

            getConnections: () => libp2p.getConnections(),

            getPeers: () => Array.from(connectedPeers),

            getProtocols: () => libp2p.getProtocols(),

            start: async () => {
                try {
                    await libp2p.start()
                    log('Node started successfully', 'info')
                } catch (error) {
                    log(`Error starting node: ${error}`, 'error')
                    throw error
                }
            },

            stop: async () => {
                try {
                    await libp2p.stop()
                    // discoveredPeers.clear()
                    connectedPeers.clear()
                    log('Node stopped successfully', 'info')
                } catch (error) {
                    log(`Error stopping node: ${error}`, 'error')
                    throw error
                }
            },

            // discoverPeers: async (options = {}) => {
            //     const { timeout = 10000, maxPeers = 20 } = options;
            //
            //     log('Starting peer discovery...', 'info');
            //
            //     console.log('Используем DHT для поиска пиров, если доступен ИСПРАВИТЬ')
            //     // Используем DHT для поиска пиров, если доступен
            //     if (services.dht) {
            //         try {
            //             const startTime = Date.now();
            //             const closestPeers: string[] = [];
            //
            //             // В браузерной версии используем альтернативный подход
            //             try {
            //                 // Проверяем доступные методы DHT
            //                 const dhtMethods = Object.keys(services.dht);
            //                 log(`Available DHT methods: ${dhtMethods.join(', ')}`, 'info');
            //
            //                 // Пробуем получить ближайших пиров через routingTable если доступно
            //                 if (services.dht.routingTable) {
            //                     try {
            //                         // Получаем всех пиров из routing table
            //                         const peers = services.dht.routingTable.peers || [];
            //                         peers.forEach((peer: any) => {
            //                             if (closestPeers.length < maxPeers) {
            //                                 closestPeers.push(peer.toString());
            //                             }
            //                         });
            //
            //                         log(`Found ${closestPeers.length} peers from routing table`, 'info');
            //                     } catch (rtError) {
            //                         log(`Routing table error: ${rtError}`, 'warn');
            //                     }
            //                 }
            //
            //                 // Также используем discovery через bootstrap
            //                 for (const peerId of discoveredPeers.keys()) {
            //                     if (Date.now() - startTime > timeout) {
            //                         break;
            //                     }
            //
            //                     if (closestPeers.length >= maxPeers) {
            //                         break;
            //                     }
            //
            //                     // Добавляем пира если он не подключен
            //                     if (!connectedPeers.has(peerId)) {
            //                         closestPeers.push(peerId);
            //                     }
            //                 }
            //
            //                 log(`Collected ${closestPeers.length} peers from discovered peers`, 'info');
            //                 return closestPeers;
            //
            //             } catch (dhtError) {
            //                 log(`DHT discovery error: ${dhtError}`, 'warn');
            //                 // Продолжаем с альтернативными методами
            //             }
            //         } catch (error) {
            //             log(`DHT discovery error: ${error}`, 'error');
            //         }
            //     }
            //
            //
            //     // Возвращаем обнаруженных пиров через другие механизмы
            //     const peersFromDiscovery = Array.from(discoveredPeers.keys())
            //         .filter(peerId => !connectedPeers.has(peerId)) // Исключаем уже подключенных
            //         .slice(0, maxPeers);
            //
            //     log(`Found ${peersFromDiscovery.length} peers from discovery`, 'info');
            //     return peersFromDiscovery;
            // },

            connectToPeer: async (peerIdStr: string, multiaddrs?: string[]): Promise<boolean> => {
                try {
                    log(`Attempting to connect to peer: ${peerIdStr}`, 'info')

                    let peerId: PeerId
                    try {
                        peerId = peerIdFromString(peerIdStr)
                    } catch (error) {
                        log(`Invalid peer ID: ${peerIdStr}`, 'error')
                        return false
                    }

                    // Если указаны адреса, создаем MultiAddr с PeerId
                    if (multiaddrs && multiaddrs.length > 0) {
                        for (const addr of multiaddrs) {
                            try {
                                const fullAddr = multiaddr(addr).encapsulate(`/p2p/${peerIdStr}`)
                                await libp2p.dial(fullAddr)
                                log(`Connected to ${peerIdStr} via ${addr}`, 'info')
                                return true
                            } catch (error) {
                                log(`Failed to connect via ${addr}: ${error}`, 'warn')
                            }
                        }
                    }

                    // Пробуем подключиться через DHT
                    if (services.dht) {
                        try {
                            const peerInfo = await services.dht.findPeer(peerId)
                            if (peerInfo && peerInfo.multiaddrs.length > 0) {
                                for (const ma of peerInfo.multiaddrs) {
                                    try {
                                        const fullAddr = ma.encapsulate(`/p2p/${peerIdStr}`)
                                        await libp2p.dial(fullAddr)
                                        log(`Connected to ${peerIdStr} via DHT address`, 'info')
                                        return true
                                    } catch (error) {
                                        // Пробуем следующий адрес
                                    }
                                }
                            }
                        } catch (error) {
                            // DHT не нашел пира
                        }
                    }

                    log(`Failed to connect to ${peerIdStr}: No valid addresses`, 'warn')
                    return false
                } catch (error) {
                    log(`Error connecting to peer ${peerIdStr}: ${error}`, 'error')
                    return false
                }
            },

            disconnectPeer: async (peerIdStr: string): Promise<boolean> => {
                try {
                    const connections = libp2p.getConnections()
                    const peerConnections = connections.filter(conn =>
                        conn.remotePeer.toString() === peerIdStr
                    )

                    if (peerConnections.length === 0) {
                        log(`No connections to peer ${peerIdStr}`, 'info')
                        return true
                    }

                    await Promise.all(peerConnections.map(conn => conn.close()))
                    log(`Disconnected from peer ${peerIdStr}`, 'info')
                    return true
                } catch (error) {
                    log(`Error disconnecting from peer ${peerIdStr}: ${error}`, 'error')
                    return false
                }
            },

            sendPing: async (peerIdStr: string): Promise<number | null> => {
                try {
                    if (!services.ping) {
                        log('Ping service not available', 'error')
                        return null
                    }

                    const connections = libp2p.getConnections()
                    const connection = connections.find(conn =>
                        conn.remotePeer.toString() === peerIdStr
                    )

                    if (!connection) {
                        log(`No connection to peer ${peerIdStr}`, 'warn')
                        return null
                    }

                    const startTime = Date.now()
                    await services.ping.ping(connection.remotePeer)
                    const latency = Date.now() - startTime

                    log(`Ping to ${peerIdStr}: ${latency}ms`, 'info')
                    return latency
                } catch (error) {
                    log(`Error pinging ${peerIdStr}: ${error}`, 'error')
                    return null
                }
            },

            getDHTStats,

            publishMessage,

            subscribeToTopic,

            provideData,

            findProviders,

            getNodeInfo: () => ({
                peerId: libp2p.peerId.toString(),
                multiaddrs: libp2p.getMultiaddrs().map(ma => ma.toString()),
                protocols: libp2p.getProtocols(),
                connections: libp2p.getConnections().length,
                status: 'running'
            })
        }

    } catch (error) {
        log(`Failed to create libp2p browser node: ${error}`, 'error')
        throw error
    }
}

// Вспомогательная функция для создания ноды с дефолтными настройками
export async function createDefaultLibp2pNode(callbacks?: Partial<Libp2pBrowserOptions>): Promise<Libp2pBrowserNode> {
    return createLibp2pNode({
        enableDHT: true,
        enablePubSub: true,
        enableRelay: true,
        enableMDNS: false,
        enableAutoNAT: false,
        onLog: (message, level) => {
            if (level === 'debug') {
                console.debug(`[Libp2pBrowser] ${message}`);
            } else {
                console.log(`[Libp2pBrowser] ${level.toUpperCase()}: ${message}`);
            }
        },
        ...callbacks
    })
}

// Экспорт типов для использования в компонентах
export type { PeerId } from '@libp2p/interface'
export type { Multiaddr } from '@multiformats/multiaddr'