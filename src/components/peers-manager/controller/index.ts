import { PeersManager } from '..';

export interface EventListener {
    element: EventTarget;
    event: string;
    handler: EventListenerOrEventListenerObject;
    options?: AddEventListenerOptions;
}

export const controller = (context: PeersManager) => {
    let eventListeners: EventListener[] = [];

    const addEventListener = (
        element: EventTarget,
        event: string,
        handler: EventListenerOrEventListenerObject,
        options: AddEventListenerOptions = {}
    ): void => {
        element.addEventListener(event, handler, options);
        eventListeners.push({ element, event, handler, options });
    };

    return {
        async init(): Promise<void> {
            try {
                // Делегирование событий для кнопок действий
                addEventListener(context.shadowRoot!, 'click', (e: Event) => {
                    const target = e.target as HTMLElement;

                    // Поиск родительского элемента с действием
                    const actionElement = target.closest('[data-action]');
                    if (actionElement) {
                        e.preventDefault();
                        e.stopPropagation();

                        const action = actionElement.getAttribute('data-action');
                        const peerId = actionElement.getAttribute('data-peer-id');

                        if (!action) return;

                        switch (action) {
                            case 'refresh-peers':
                                context.refreshPeers();
                                break;
                            case 'get-all-peers':
                                (context as any)._actions.loadAllPeers();
                                break;
                            case 'get-blocked-peers':
                                context.getBlockedPeers();
                                break;
                            case 'get-ping-status':
                                context.getPingStatus();
                                break;
                            case 'disconnect-all-peers':
                                context.disconnectAllPeers();
                                break;
                            case 'clear-search':
                                context.clearSearch();
                                break;
                            case 'copy-peer-id':
                                if (peerId) {
                                    navigator.clipboard.writeText(peerId).then(() => {
                                        // Комментируем вызов, так как метод не существует
                                        // context.showNotification('Peer ID copied to clipboard', 'success');
                                        console.log('Peer ID copied to clipboard');
                                    });
                                }
                                break;
                        }
                    }

                    // Обработка действий с пирами (через class-based делегирование)
                    const peerItem = target.closest('.peer-item');
                    if (!peerItem) return;

                    const peerId = peerItem.getAttribute('data-peer-id');
                    if (!peerId) return;

                    if (target.classList.contains('peer-btn-info')) {
                        context.getSpecificPeerInfo(peerId);
                    } else if (target.classList.contains('peer-btn-ping')) {
                        context.pingSpecificPeer(peerId);
                    } else if (target.classList.contains('peer-btn-disconnect')) {
                        context.disconnectSpecificPeer(peerId);
                    } else if (target.classList.contains('peer-btn-block')) {
                        (context as any)._actions.blockPeer(peerId);
                    } else if (target.classList.contains('peer-btn-unblock')) {
                        (context as any)._actions.unblockPeer(peerId);
                    } else if (target.classList.contains('peer-btn-auto-ping-start')) {
                        context.startAutoPing(peerId);
                    } else if (target.classList.contains('peer-btn-auto-ping-stop')) {
                        context.stopAutoPing(peerId);
                    }
                });

                // Обработка поиска
                addEventListener(context.shadowRoot!, 'input', (e: Event) => {
                    const target = e.target as HTMLElement;
                    if (target.id === 'peer-search-input') {
                        context.handleSearchInput(e);
                    }
                });

                // Обработка клавиатуры
                addEventListener(document, 'keydown', (e: Event) => {
                    const keyboardEvent = e as KeyboardEvent;

                    // Ctrl+R для обновления
                    if (keyboardEvent.ctrlKey && keyboardEvent.key === 'r') {
                        e.preventDefault();
                        context.refreshPeers();
                    }

                    // Escape для очистки поиска
                    if (keyboardEvent.key === 'Escape') {
                        const searchInput = context.shadowRoot?.querySelector('#peer-search-input') as HTMLInputElement;
                        if (searchInput && searchInput.value) {
                            searchInput.value = '';
                            context.clearSearch();
                        }
                    }

                    // Поиск при нажатии /
                    if (keyboardEvent.key === '/' && !keyboardEvent.ctrlKey && !keyboardEvent.altKey) {
                        e.preventDefault();
                        const searchInput = context.shadowRoot?.querySelector('#peer-search-input') as HTMLInputElement;
                        if (searchInput) {
                            searchInput.focus();
                        }
                    }
                });

                // Обработка видимости страницы
                addEventListener(document, 'visibilitychange', () => {
                    const autoRefresh = context.getAttribute('data-auto-refresh') === 'true';
                    if (autoRefresh && !document.hidden) {
                        // Обновляем данные при возвращении на страницу
                        setTimeout(() => {
                            context.refreshPeers();
                        }, 1000);
                    }
                });

                // Обработка внешних событий
                addEventListener(window, 'peers-updated', () => {
                    context.refreshPeers();
                });

                // Интеграция с libp2p-node
                addEventListener(window, 'libp2p:peers-updated', async (e: any) => {
                    const detail = (e as CustomEvent).detail;
                    if (detail?.peers) {
                        await context.postMessage({
                            type: 'UPDATE_FROM_LIBP2P',
                            data: { peers: detail.peers }
                        });
                    }
                });

                // Автоматическое обновление данных при старте
                const autoRefresh = context.getAttribute('data-auto-refresh') === 'true';
                if (autoRefresh) {
                    setTimeout(() => {
                        context.refreshPeers();
                    }, 2000);
                }

            } catch (error) {
                console.error('Error initializing peers manager controller:', error);
                context.addError({
                    componentName: 'PeersManager',
                    source: 'controller.init',
                    message: 'Failed to initialize controller',
                    details: error
                });
            }
        },

        async destroy(): Promise<void> {
            // Очистка всех обработчиков событий
            eventListeners.forEach(({ element, event, handler, options }) => {
                element.removeEventListener(event, handler, options);
            });
            eventListeners = [];
        },

        // Вспомогательные методы для тестирования
        getEventListeners(): EventListener[] {
            return [...eventListeners];
        }
    };
};