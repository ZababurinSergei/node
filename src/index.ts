import {LIBP2P_DEFAULT_BOOTSTRAP_NODES} from './lib/libp2p/libp2p-browser'
import {BaseComponent} from './base/base-component';
import './components/libp2p-node';
import './components/dht-manager';
import './components/node-identity';
import './components/peers-manager';
import './components/bootstrap-address';
import './components/network-addresses';

const isModuleFederation: boolean = false

interface ComponentConfig {
    component: string;
    id: string;
    slot: string;
    attributes?: Record<string, string>;
}

const components: Record<string, any> = {};

// interface VirtualCSSModule {
//     getCSSForComponent: (componentName: string) => string | null;
//     getCSSByPath?: (filePath: string) => string | null;
//     getAllCSS?: () => string;
//     injectCSS?: () => void;
// }

// let cssModule: VirtualCSSModule | null = null;

// async function loadCSSModule(): Promise<VirtualCSSModule | null> {
//     try {
//         return await import('virtual:css') as VirtualCSSModule;
//     } catch (e) {
//         return null;
//     }
// }
//
// let cssModuleInitialized = false;

// async function ensureCSSModule(): Promise<boolean> {
//     try {
//         console.log('dddddddddd 2222 ddddddddddd', cssModule)
//         if (!cssModuleInitialized) {
//             cssModule = await loadCSSModule();
//             console.log('dddddddddddddddddd', cssModule)
//             if (cssModule) {
//                 cssModuleInitialized = true;
//             }
//             return  true
//         } else {
//             return  false
//         }
//     } catch (e) {
//         return false
//     }
// }

const appInit = async (): Promise<any> => {
    // try {
    // await ensureCSSModule();
    // } catch (e) {
    //     console.error('ERROR', e)
    // }

    // if (cssModule && cssModule.injectCSS) {
    //     cssModule.injectCSS();
    // }

    if (isModuleFederation) {
        const componentConfigs: ComponentConfig[] = [{
            component: 'node-identity', id: 'node-identity-1', slot: 'main', attributes: {
                title: 'Browser Node',
                'data-auto-refresh': 'true',
                'data-refresh-interval': '30000',
                'data-show-details': 'true'
            }
        }, {
            component: 'libp2p-node', id: 'libp2p-node-1', slot: 'main', attributes: {
                title: 'Libp2p Browser Node', 'data-auto-start': 'false'
            }
        }, {
            component: 'dht-manager', id: 'dht-manager-1', slot: 'main', attributes: {
                title: 'DHT Manager', 'data-auto-refresh': 'true', 'data-default-type': 'all'
            }
        }, {
            component: 'peers-manager', id: 'peers-manager-1', slot: 'main', attributes: {
                title: 'Peers Manager', 'data-auto-refresh': 'true', 'data-refresh-interval': '15000'
            }
        }, {
            component: 'bootstrap-address', id: 'bootstrap-address-1', slot: 'main', attributes: {
                title: 'Bootstrap Addresses',
                'data-auto-refresh': 'true',
                'data-refresh-interval': '20000',
                'data-source': 'auto'
            }
        }, {
            component: 'network-addresses', id: 'network-addresses-1', slot: 'main', attributes: {
                title: 'Network Addresses',
                'data-auto-refresh': 'true',
                'data-refresh-interval': '30000',
                'data-source': 'auto',
                'data-show-stats': 'true'
            }
        }];

        for (const item of componentConfigs) {
            const element = document.createElement(item.component);
            element.setAttribute('id', item.id);
            element.setAttribute('slot', item.slot);

            if (item.attributes) {
                for (const key in item.attributes) {
                    const value = item.attributes[key];
                    if (typeof value === 'string') {
                        element.setAttribute(key, value);
                    }
                }
            }

            // document.body.appendChild(element);

            if (!components[item.component]) {
                components[item.component] = {
                    id: {
                        [item.id]: element
                    }
                };
            } else if (!components[item.component].id[item.id]) {
                components[item.component].id[item.id] = element;
            } else {
                console.error('Duplicate component ID', item);
            }
        }

        console.log('✅ Все компоненты инициализированы');
        console.log('📊 Загруженные компоненты:', Object.keys(components));
        console.log('componentConfigs', components);

        return {
            getAllComponents: () => {
                return components;
            }
        };
    } else {
        await setupComponentConnections();
    }
};

/**
 * Настройка соединения между всеми компонентами
 */
async function setupComponentConnections(): Promise<void> {
    try {
        const libp2pNode = await BaseComponent.getComponentAsync('libp2p-node', 'libp2p-node-1');
        const dhtManager = await BaseComponent.getComponentAsync('dht-manager', 'dht-manager-1');
        const nodeIdentity = await BaseComponent.getComponentAsync('node-identity', 'node-identity-1');
        const peersManager = await BaseComponent.getComponentAsync('peers-manager', 'peers-manager-1');
        const bootstrapAddress = await BaseComponent.getComponentAsync('bootstrap-address', 'bootstrap-address-1');
        const networkAddresses = await BaseComponent.getComponentAsync('network-addresses', 'network-addresses-1');

        if (libp2pNode && peersManager && nodeIdentity && networkAddresses && bootstrapAddress && dhtManager) {
                    const getDefaultBootstrapAddresses = async () => {
                        // Используем дефолтные адреса напрямую
                        try {
                            return await bootstrapAddress.postMessage({
                                type: 'UPDATE_BOOTSTRAP_ADDRESSES', data: {
                                    addresses: LIBP2P_DEFAULT_BOOTSTRAP_NODES, source: 'default'
                                }
                            });
                        } catch (error) {
                            console.error('Error loading default bootstrap addresses:', error);
                            return {success: false, error: 'Failed to load default addresses'};
                        }
                    };

                    await getDefaultBootstrapAddresses()

            //         const updateNodeIdentity = async () => {
            //             try {
            //                 const result = await libp2pNode.postMessage({type: 'GET_PEER_ID'});
            //                 if (result.success && result.peerId) {
            //                     await nodeIdentity.postMessage({
            //                         type: 'UPDATE_FROM_LIBP2P', data: {
            //                             peerId: result.peerId, status: 'online', source: 'libp2p-auto'
            //                         }
            //                     });
            //                 }
            //             } catch (error) {
            //                 console.error('Error updating Node Identity from Libp2p:', error);
            //             }
            //         };
            //
            //         // Слушаем события от libp2p-node
            //         libp2pNode.addEventListener('dht-stats-updated', (event: any) => {
            //             if (event.detail?.stats) {
            //                 updateNodeIdentity();
            //             }
            //         });
            //
            //         // Автоматическое обновление при запуске libp2p ноды
            //         libp2pNode.addEventListener('node-started', async () => {
            //             await updateNodeIdentity();
            //         });
            //
            //         console.log('✅ Автоматическая синхронизация Node Identity настроена');
            //
            //
            //         console.log('✅ Настройка интеграции Libp2p Node ↔ DHT Manager');
            //
            //         // Устанавливаем слушатель событий DHT в Libp2p Node
            //         const result = await libp2pNode.postMessage({
            //             type: 'SET_DHT_LISTENER', data: {
            //                 callback: (stats: any) => {
            //                     dhtManager.postMessage({
            //                         type: 'UPDATE_DISPLAY', data: {stats}, source: 'libp2p-node'
            //                     }).catch(error => {
            //                         console.error('Error sending DHT stats to DHT Manager:', error);
            //                     });
            //                 }
            //             }
            //         });
            //
            //         if (result?.success) {
            //             console.log('✅ DHT listener установлен в Libp2p Node');
            //         }
            //
            //         // Автоматически обновляем DHT статистику при запуске Libp2p Node
            //         libp2pNode.addEventListener('dht-stats-updated', (event: any) => {
            //             if (event.detail?.stats) {
            //                 dhtManager.postMessage({
            //                     type: 'UPDATE_DISPLAY', data: {stats: event.detail.stats}, source: 'libp2p-node-event'
            //                 }).catch(error => {
            //                     console.error('Error processing DHT stats event:', error);
            //                 });
            //             }
            //         });
            //
            //         console.log('✅ Настройка интеграции Libp2p Node ↔ Peers Manager');
            //
            //         // Настраиваем автоматическую передачу данных о пирах
            //         const setupPeersIntegration = async () => {
            //             try {
            //                 // Устанавливаем слушатель в Peers Manager для получения данных от Libp2p Node
            //                 const result = await libp2pNode.postMessage({
            //                     type: 'SET_PEERS_MANAGER_LISTENER', data: {
            //                         callback: async (peers: any[]) => {
            //                             if (peers && peers.length > 0) {
            //                                 await peersManager.postMessage({
            //                                     type: 'UPDATE_FROM_LIBP2P', data: {peers}, source: 'libp2p-node-auto'
            //                                 });
            //                             }
            //                         }
            //                     }
            //                 });
            //
            //                 if (result?.success) {
            //                     console.log('✅ Peers Manager listener установлен в Libp2p Node');
            //
            //                     // Инициируем начальную синхронизацию
            //                     setTimeout(async () => {
            //                         try {
            //                             const peersResult = await libp2pNode.postMessage({type: 'GET_CONNECTED_PEERS'});
            //                             if (peersResult.success && peersResult.peers) {
            //                                 await peersManager.postMessage({
            //                                     type: 'UPDATE_FROM_LIBP2P',
            //                                     data: {peers: peersResult.peers},
            //                                     source: 'libp2p-node-initial'
            //                                 });
            //                                 console.log(`✅ Начальная синхронизация пиров завершена: ${peersResult.peers.length} пиров`);
            //                             }
            //                         } catch (error) {
            //                             console.error('Error during initial peers sync:', error);
            //                         }
            //                     }, 3000);
            //                 }
            //             } catch (error) {
            //                 console.error('Error setting up peers integration:', error);
            //             }
            //         };
            //
            //         // Запускаем интеграцию при старте Libp2p Node
            //         libp2pNode.addEventListener('node-started', async () => {
            //             await setupPeersIntegration();
            //         });
            //
            //         // Если Libp2p Node уже запущен, сразу настраиваем интеграцию
            //         try {
            //             const nodeStatus = await libp2pNode.postMessage({type: 'GET_STATS'});
            //             if (nodeStatus.success && nodeStatus.stats?.status === 'running') {
            //                 await setupPeersIntegration();
            //             }
            //         } catch (error) {
            //             console.log('Libp2p Node не готов, интеграция будет настроена позже');
            //         }
            //
            //         // Слушаем события обновления пиров
            //         libp2pNode.addEventListener('peers-updated', async (event: any) => {
            //             if (event.detail?.peers) {
            //                 await peersManager.postMessage({
            //                     type: 'UPDATE_FROM_LIBP2P', data: {peers: event.detail.peers}, source: 'libp2p-node-event'
            //                 });
            //             }
            //         });
            //
            //
            //         // 4. Интеграция Peers Manager с Node Identity
            //         console.log('✅ Настройка интеграции Peers Manager ↔ Node Identity');
            //
            //         // Обновляем Node Identity при изменении количества пиров
            //         peersManager.addEventListener('peers-updated', async (event: any) => {
            //             if (event.detail?.stats) {
            //                 await nodeIdentity.postMessage({
            //                     type: 'UPDATE_METRICS', data: {
            //                         connectedPeers: event.detail.stats.totalPeers || 0
            //                     }, source: 'peers-manager'
            //                 });
            //             }
            //         });
            //
            //
            //         console.log('✅ Настройка интеграции Bootstrap Address ↔ Libp2p Node');
            //
            //         // Автоматическая передача multiaddrs из libp2p-node в bootstrap-address
            //         libp2pNode.addEventListener('multiaddrs-updated', async (event: any) => {
            //             if (event.detail?.multiaddrs) {
            //                 await bootstrapAddress.postMessage({
            //                     type: 'UPDATE_BOOTSTRAP_ADDRESSES', data: {
            //                         addresses: event.detail.multiaddrs, source: 'libp2p-node'
            //                     }
            //                 });
            //             }
            //         });
            //
            //         // Получение адресов при старте ноды
            //         libp2pNode.addEventListener('node-started', async () => {
            //             try {
            //                 const stats = await libp2pNode.postMessage({type: 'GET_STATS'});
            //                 if (stats.success && stats.stats?.multiaddrs) {
            //                     await bootstrapAddress.postMessage({
            //                         type: 'UPDATE_BOOTSTRAP_ADDRESSES', data: {
            //                             addresses: stats.stats.multiaddrs, source: 'libp2p-node-start'
            //                         }
            //                     });
            //                 }
            //             } catch (error) {
            //                 console.error('Error sending addresses to Bootstrap Address:', error);
            //             }
            //         });
            //
            //         window.getBootstrapAddresses = async () => {
            //             if (libp2pNode) {
            //                 const stats = await libp2pNode.postMessage({type: 'GET_STATS'});
            //                 if (stats.success && stats.stats?.multiaddrs) {
            //                     return await bootstrapAddress.postMessage({
            //                         type: 'UPDATE_BOOTSTRAP_ADDRESSES', data: {
            //                             addresses: stats.stats.multiaddrs
            //                         }
            //                     });
            //                 }
            //             }
            //             return {success: false, error: 'Libp2p node not available'};
            //         };
            //
            //         console.log('✅ Интеграция Bootstrap Address с Libp2p Node настроена');
            //
            //
            //         console.log('✅ Настройка интеграции Bootstrap Address ↔ Node Identity');
            //
            //         // Обновляем Node Identity при изменении bootstrap адресов
            //         bootstrapAddress.addEventListener('addresses-updated', async (event: any) => {
            //             if (event.detail?.count) {
            //                 await nodeIdentity.postMessage({
            //                     type: 'UPDATE_METRICS', data: {
            //                         bootstrapAddresses: event.detail.count
            //                     }, source: 'bootstrap-address'
            //                 });
            //             }
            //         });
            //
            //         // НОВОЕ: Если источник 'default', обновляем Node Identity
            //         bootstrapAddress.addEventListener('default-addresses-loaded', async (event: any) => {
            //             if (event.detail?.count) {
            //                 await nodeIdentity.postMessage({
            //                     type: 'UPDATE_METRICS', data: {
            //                         bootstrapAddresses: event.detail.count, source: 'default-bootstrap'
            //                     }, source: 'bootstrap-address-default'
            //                 });
            //             }
            //         });
            //
            //
            //         console.log('✅ Настройка интеграции Network Addresses ↔ Libp2p Node');
            //
            //         // Автоматическая передача multiaddrs из libp2p-node в network-addresses
            //         libp2pNode.addEventListener('multiaddrs-updated', async (event: any) => {
            //             if (event.detail?.multiaddrs) {
            //                 await networkAddresses.postMessage({
            //                     type: 'UPDATE_ADDRESSES', data: {
            //                         addresses: event.detail.multiaddrs, source: 'libp2p-node-event'
            //                     }
            //                 });
            //             }
            //         });
            //
            //         // Получение адресов при старте ноды
            //         libp2pNode.addEventListener('node-started', async () => {
            //             try {
            //                 const stats = await libp2pNode.postMessage({type: 'GET_STATS'});
            //                 if (stats.success && stats.stats?.multiaddrs) {
            //                     await networkAddresses.postMessage({
            //                         type: 'UPDATE_ADDRESSES', data: {
            //                             addresses: stats.stats.multiaddrs, source: 'libp2p-node-start'
            //                         }
            //                     });
            //                 }
            //             } catch (error) {
            //                 console.error('Error sending addresses to Network Addresses:', error);
            //             }
            //         });
            //
            //         // Устанавливаем слушатель для Network Addresses в Libp2p Node
            //         const listenerResult = await libp2pNode.postMessage({
            //             type: 'SET_LIBP2P_LISTENER', data: {
            //                 callback: (state: any) => {
            //                     if (state?.addresses) {
            //                         networkAddresses.postMessage({
            //                             type: 'UPDATE_ADDRESSES', data: {
            //                                 addresses: state.addresses, source: 'libp2p-node-listener'
            //                             }
            //                         }).catch(error => {
            //                             console.error('Error updating Network Addresses from listener:', error);
            //                         });
            //                     }
            //                 }
            //             }
            //         });
            //
            //         if (listenerResult?.success) {
            //             console.log('✅ Libp2p listener установлен для Network Addresses');
            //         }
            //
            //         // Функции для глобального доступа
            //         window.syncNetworkAddresses = async () => {
            //             if (libp2pNode) {
            //                 const stats = await libp2pNode.postMessage({type: 'GET_STATS'});
            //                 if (stats.success && stats.stats?.multiaddrs) {
            //                     return await networkAddresses.postMessage({
            //                         type: 'UPDATE_ADDRESSES', data: {
            //                             addresses: stats.stats.multiaddrs, source: 'manual-sync'
            //                         }
            //                     });
            //                 }
            //             }
            //             return {success: false, error: 'Libp2p node not available'};
            //         };
            //
            //         window.getNetworkAddressStats = async () => {
            //             if (networkAddresses) {
            //                 return await networkAddresses.postMessage({type: 'GET_STATS'});
            //             }
            //             return {success: false, error: 'Network Addresses component not found'};
            //         };
            //
            //         console.log('✅ Интеграция Network Addresses с Libp2p Node настроена');
            //
            //
            //         console.log('✅ Настройка интеграции Network Addresses ↔ Node Identity');
            //
            //         // Обновляем Node Identity при изменении адресов
            //         networkAddresses.addEventListener('addresses-updated', async (event: any) => {
            //             if (event.detail?.count) {
            //                 await nodeIdentity.postMessage({
            //                     type: 'UPDATE_METRICS', data: {
            //                         networkAddressCount: event.detail.count
            //                     }, source: 'network-addresses'
            //                 });
            //             }
            //         });
            //
            //
            //         setupGlobalEventIntegration();
            //
            //         console.log('🎯 Все интеграции между компонентами настроены');
            //     } else {
            //         console.error('❌ Ошибка подключения компонентов');
        }
    } catch (error) {
        console.error('❌ Ошибка настройки интеграции между компонентами:', error);
    }
}

// /**
//  * Настройка глобальной интеграции через события
//  */
// function setupGlobalEventIntegration(): void {
//     console.log('🌐 Настройка глобальной интеграции через события');
//
//     // Глобальные события для синхронизации компонентов
//     window.addEventListener('libp2p:node-started', async () => {
//         console.log('🔔 Глобальное событие: Libp2p Node запущен');
//
//         try {
//             const peersManager = await BaseComponent.getComponentAsync('peers-manager', 'peers-manager-1');
//             if (peersManager) {
//                 await peersManager.postMessage({type: 'REFRESH_PEERS'});
//             }
//
//             const bootstrapAddress = await BaseComponent.getComponentAsync('bootstrap-address', 'bootstrap-address-1');
//             if (bootstrapAddress) {
//                 // Автоматически загружаем адреса с учетом источника 'auto'
//                 await bootstrapAddress.postMessage({type: 'REFRESH_ADDRESSES'});
//             }
//
//             const networkAddresses = await BaseComponent.getComponentAsync('network-addresses', 'network-addresses-1');
//             if (networkAddresses) {
//                 await networkAddresses.postMessage({type: 'REFRESH_ADDRESSES'});
//             }
//         } catch (error) {
//             console.error('Error refreshing components after node start:', error);
//         }
//     });
//
//     // НОВОЕ: Событие для загрузки дефолтных адресов
//     window.addEventListener('bootstrap:load-default', async () => {
//         console.log('🔔 Глобальное событие: Загрузка дефолтных bootstrap адресов');
//
//         try {
//             const bootstrapAddress = document.querySelector('bootstrap-address#bootstrap-address-1');
//             if (bootstrapAddress) {
//                 // Переключаем источник на 'default'
//                 bootstrapAddress.setAttribute('data-source', 'default');
//
//                 // Инициируем загрузку
//                 await (bootstrapAddress as any).postMessage({type: 'REFRESH_ADDRESSES'});
//             }
//         } catch (error) {
//             console.error('Error loading default bootstrap addresses:', error);
//         }
//     });
//
//     window.addEventListener('network-addresses:updated', (event: any) => {
//         console.log('🔔 Глобальное событие: Network Addresses обновлены', event.detail);
//     });
//
//     window.addEventListener('peers:updated', (event: any) => {
//         console.log('🔔 Глобальное событие: Пиры обновлены', event.detail);
//     });
//
//     window.addEventListener('dht:stats-updated', (event: any) => {
//         console.log('🔔 Глобальное событие: DHT статистика обновлена', event.detail);
//     });
//
//     window.addEventListener('bootstrap-addresses:updated', (event: any) => {
//         console.log('🔔 Глобальное событие: Bootstrap адреса обновлены', event.detail);
//
//         // НОВОЕ: Определяем тип источника для логирования
//         if (event.detail?.source === 'default') {
//             console.log('✅ Использованы дефолтные адреса libp2p');
//         } else if (event.detail?.source === 'libp2p') {
//             console.log('✅ Использованы адреса из libp2p ноды');
//         } else if (event.detail?.source === 'default-fallback') {
//             console.log('⚠️ Использованы дефолтные адресы как fallback');
//         }
//     });
//
//     // Функция для ручной синхронизации всех компонентов
//     window.syncAllComponents = async () => {
//         console.log('🔄 Ручная синхронизация всех компонентов');
//
//         const BaseComponent = (await import('./base/base-component')).BaseComponent;
//
//         const components = [{name: 'node-identity', id: 'node-identity-1', type: 'REFRESH_DATA'}, {
//             name: 'libp2p-node', id: 'libp2p-node-1', type: 'GET_STATS'
//         }, {name: 'dht-manager', id: 'dht-manager-1', type: 'REFRESH_STATS'}, {
//             name: 'peers-manager', id: 'peers-manager-1', type: 'REFRESH_PEERS'
//         }, {
//             name: 'bootstrap-address', id: 'bootstrap-address-1', type: 'REFRESH_ADDRESSES'
//         }, {name: 'network-addresses', id: 'network-addresses-1', type: 'REFRESH_ADDRESSES'}];
//
//         for (const comp of components) {
//             try {
//                 const component = await BaseComponent.getComponentAsync(comp.name, comp.id);
//                 if (component) {
//                     await component.postMessage({type: comp.type});
//                     console.log(`✅ ${comp.name} синхронизирован`);
//                 }
//             } catch (error) {
//                 console.error(`❌ Ошибка синхронизации ${comp.name}:`, error);
//             }
//         }
//
//         console.log('✅ Все компоненты синхронизированы');
//     };
//
//     // Глобальные функции управления компонентами
//     window.refreshNetworkAddresses = async () => {
//         const networkAddresses = document.querySelector('network-addresses#network-addresses-1');
//         if (networkAddresses) {
//             return await (networkAddresses as any).postMessage({type: 'REFRESH_ADDRESSES'});
//         }
//         return {success: false, error: 'Network Addresses component not found'};
//     };
//
//     window.getNetworkAddressStats = async () => {
//         const networkAddresses = document.querySelector('network-addresses#network-addresses-1');
//         if (networkAddresses) {
//             return await (networkAddresses as any).postMessage({type: 'GET_STATS'});
//         }
//         return {success: false, error: 'Network Addresses component not found'};
//     };
//
//     window.syncNetworkAddresses = async () => {
//         const networkAddresses = document.querySelector('network-addresses#network-addresses-1');
//         if (networkAddresses) {
//             return await (networkAddresses as any).postMessage({type: 'SYNC_WITH_LIBP2P'});
//         }
//         return {success: false, error: 'Network Addresses component not found'};
//     };
//
//     // НОВОЕ: Функции для управления источником bootstrap адресов
//     window.setBootstrapSource = async (source: 'auto' | 'libp2p' | 'default' | 'mock') => {
//         const bootstrapAddress = document.querySelector('bootstrap-address#bootstrap-address-1');
//         if (bootstrapAddress) {
//             bootstrapAddress.setAttribute('data-source', source);
//
//             // Даем время на обработку атрибута
//             await new Promise(resolve => setTimeout(resolve, 100));
//
//             return await (bootstrapAddress as any).postMessage({type: 'REFRESH_ADDRESSES'});
//         }
//         return {success: false, error: 'Bootstrap Address component not found'};
//     };
//
//     window.getCurrentBootstrapSource = () => {
//         const bootstrapAddress = document.querySelector('bootstrap-address#bootstrap-address-1');
//         if (bootstrapAddress) {
//             return bootstrapAddress.getAttribute('data-source') || 'auto';
//         }
//         return null;
//     };
//
//     // НОВОЕ: Надежная функция загрузки дефолтных адресов
//     window.loadDefaultBootstrapAddresses = async () => {
//         const bootstrapAddress = document.querySelector('bootstrap-address#bootstrap-address-1');
//         if (bootstrapAddress) {
//             bootstrapAddress.setAttribute('data-source', 'default');
//
//             // Даем время на обработку атрибута
//             await new Promise(resolve => setTimeout(resolve, 100));
//
//             return await (bootstrapAddress as any).postMessage({type: 'REFRESH_ADDRESSES'});
//         }
//         return {success: false, error: 'Bootstrap Address component not found'};
//     };
// }

// Добавляем BaseComponent в глобальную область видимости для доступа из HTML
declare global {
    interface Window {
        BaseComponent?: any;
        syncAllComponents?: () => Promise<void>;
        getDefaultBootstrapAddresses?: () => Promise<any>;
        getBootstrapAddresses?: () => Promise<any>;
        refreshBootstrapAddresses?: () => Promise<any>;
        getBootstrapAddressStats?: () => Promise<any>;
        syncBootstrapWithLibp2p?: () => Promise<any>;
        refreshNetworkAddresses?: () => Promise<any>;
        getNetworkAddressStats?: () => Promise<any>;
        syncNetworkAddresses?: () => Promise<any>;
        // НОВОЕ: Функции управления источником
        setBootstrapSource?: (source: 'auto' | 'libp2p' | 'default' | 'mock') => Promise<any>;
        getCurrentBootstrapSource?: () => string | null;
        loadDefaultBootstrapAddresses?: () => Promise<any>;
    }
}

await appInit()
// Экспортируем app для использования
export {appInit};
export default appInit;