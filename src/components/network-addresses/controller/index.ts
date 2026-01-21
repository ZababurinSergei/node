import { NetworkAddresses } from '..';

export interface EventListener {
    element: EventTarget;
    event: string;
    handler: EventListenerOrEventListenerObject;
}

export const controller = (context: NetworkAddresses) => {
    let eventListeners: EventListener[] = [];

    const addEventListener = (
        element: EventTarget,
        event: string,
        handler: EventListenerOrEventListenerObject
    ): void => {
        element.addEventListener(event, handler);
        eventListeners.push({ element, event, handler });
    };

    const loadSavedTheme = (): void => {
        const savedTheme = localStorage.getItem('network-addresses-theme');
        if (savedTheme) {
            context.updateElement({
                selector: '.network-addresses',
                value: savedTheme,
                property: 'dataset.theme'
            });
        }
    };

    return {
        async init(): Promise<void> {
            // Загружаем сохраненную тему
            loadSavedTheme();

            // Делегирование кликов
            addEventListener(context.shadowRoot!, 'click', async (e: Event) => {
                const target = e.target as HTMLElement;

                if (target.closest('.btn-copy-all')) {
                    e.preventDefault();
                    await (context as any)._actions.copyAllAddresses();
                    return;
                }

                // if (target.closest('.btn-refresh')) {
                //     e.preventDefault();
                //     await (context as any)._actions.refreshAddresses();
                //     return;
                // }

                if (target.closest('.btn-test-all')) {
                    e.preventDefault();
                    await (context as any)._actions.testAllConnections();
                    return;
                }

                if (target.closest('.btn-sync')) {
                    e.preventDefault();
                    await (context as any)._actions.syncWithLibp2p();
                    return;
                }

                if (target.closest('.btn-export')) {
                    e.preventDefault();
                    await (context as any)._actions.exportAddresses();
                    return;
                }

                if (target.closest('.btn-add-custom')) {
                    e.preventDefault();
                    await (context as any)._actions.toggleAddForm();
                    return;
                }

                if (target.closest('.reload-addresses-btn')) {
                    e.preventDefault();
                    await (context as any)._actions.loadAddresses();
                    return;
                }

                if (target.closest('.retry-addresses-btn')) {
                    e.preventDefault();

                    await (context as any)._actions.loadAddresses();
                    return;
                }

                if (target.closest('.theme-toggle-btn')) {
                    e.preventDefault();
                    await (context as any)._actions.toggleTheme();
                    return;
                }

                // Кнопки действий для отдельных адресов
                const actionBtn = target.closest('.action-btn');
                if (actionBtn) {
                    e.preventDefault();
                    const address = actionBtn.getAttribute('data-address');
                    const action = actionBtn.classList.contains('copy-btn') ? 'copy' :
                        actionBtn.classList.contains('test-btn') ? 'test' :
                            actionBtn.classList.contains('remove-btn') ? 'remove' : null;

                    if (address && action) {
                        switch (action) {
                            case 'copy':
                                await (context as any)._actions.copyAddress(address);
                                break;
                            case 'test':
                                await (context as any)._actions.testConnection(address);
                                break;
                            case 'remove':
                                await (context as any)._actions.removeAddress(address);
                                break;
                        }
                    }
                    return;
                }

                // Клик по адресу для копирования
                if (target.closest('.address-value')) {
                    e.preventDefault();
                    const addressElement = target.closest('.address-value');
                    const address = addressElement?.textContent?.trim();
                    if (address) {
                        await (context as any).copyAddress(addressElement, address);
                    }
                }
            });

            // Обработка клавиатуры
            addEventListener(context, 'keydown', (e: Event) => {
                const keyboardEvent = e as KeyboardEvent;

                // Ctrl+Alt+C для копирования всех адресов
                if (keyboardEvent.ctrlKey && keyboardEvent.altKey && keyboardEvent.key === 'c') {
                    e.preventDefault();
                    (context as any)._actions.copyAllAddresses();
                }

                // Ctrl+R для обновления
                if (keyboardEvent.ctrlKey && keyboardEvent.key === 'r') {
                    e.preventDefault();
                    // (context as any)._actions.refreshAddresses();
                }

                // Ctrl+Alt+S для синхронизации с libp2p
                if (keyboardEvent.ctrlKey && keyboardEvent.altKey && keyboardEvent.key === 's') {
                    e.preventDefault();
                    (context as any)._actions.syncWithLibp2p();
                }

                // Escape для отмены действий
                if (keyboardEvent.key === 'Escape') {
                    const activeModal = document.querySelector('.yato-modal-backdrop');
                    if (activeModal) {
                        activeModal.remove();
                    }
                }
            });

            // Внешние события
            addEventListener(window, 'network-addresses:refresh', () => {
                // (context as any)._actions.refreshAddresses();
            });

            addEventListener(window, 'network-addresses:sync', () => {
                (context as any)._actions.syncWithLibp2p();
            });

            addEventListener(window, 'libp2p:multiaddrs-updated', async (e: Event) => {
                const customEvent = e as CustomEvent;
                if (customEvent.detail?.multiaddrs) {
                    await context.postMessage({
                        type: 'UPDATE_ADDRESSES',
                        data: {
                            addresses: customEvent.detail.multiaddrs,
                            source: 'libp2p-event'
                        }
                    });
                }
            });

            // Обновление при видимости страницы
            addEventListener(document, 'visibilitychange', () => {
                if (!document.hidden) {
                    // setTimeout(() => {
                        // (context as any)._actions.refreshAddresses();
                    // }, 1000);
                }
            });
        },

        async destroy(): Promise<void> {
            // Очищаем все слушатели
            eventListeners.forEach(({ element, event, handler }) => {
                element.removeEventListener(event, handler);
            });
            eventListeners = [];
        }
    };
};