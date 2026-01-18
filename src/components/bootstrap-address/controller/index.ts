import { BootstrapAddress } from '..';

export interface EventListener {
    element: EventTarget;
    event: string;
    handler: EventListenerOrEventListenerObject;
}

export const controller = (context: BootstrapAddress) => {
    let eventListeners: EventListener[] = [];

    const addEventListener = (
        element: EventTarget,
        event: string,
        handler: EventListenerOrEventListenerObject
    ): void => {
        element.addEventListener(event, handler);
        eventListeners.push({ element, event, handler });
    };

    return {
        async init(): Promise<void> {
            // Делегирование кликов
            addEventListener(context.shadowRoot!, 'click', async (e: Event) => {
                const target = e.target as HTMLElement;

                // Основные кнопки
                if (target.closest('.btn-copy-all')) {
                    e.preventDefault();
                    await (context as any)._actions.handleCopyAllAddresses();
                    return;
                }

                // if (target.closest('.btn-refresh')) {
                //     e.preventDefault();
                //     await (context as any)._actions.handleRefreshAddresses();
                //     return;
                // }

                if (target.closest('.btn-test')) {
                    e.preventDefault();
                    await (context as any)._actions.handleTestAllConnections();
                    return;
                }

                if (target.closest('.btn-sync')) {
                    e.preventDefault();
                    await (context as any)._actions.handleSyncWithLibp2p();
                    return;
                }

                if (target.closest('.btn-add-custom')) {
                    e.preventDefault();
                    await (context as any)._actions.handleToggleAddForm();
                    return;
                }

                if (target.closest('.btn-cancel-form')) {
                    e.preventDefault();
                    await (context as any)._actions.handleToggleAddForm();
                    return;
                }

                if (target.closest('#copyPrimaryBtn')) {
                    e.preventDefault();
                    await (context as any)._actions.handleCopyPrimaryAddress();
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
                        await (context as any)._actions.handleSingleAddressAction(action, address);
                    }
                    return;
                }

                // Клик по самому адресу для копирования
                if (target.closest('.address-value') || target.closest('.secondary-address')) {
                    e.preventDefault();
                    const addressElement = target.closest('.address-value') || target.closest('.secondary-address');
                    const address = addressElement?.textContent?.trim();
                    if (address) {
                        await (context as any)._actions.handleSingleAddressAction('copy', address);
                    }
                }
            });

            // Обработка формы
            addEventListener(context.shadowRoot!, 'submit', async (e: Event) => {
                const target = e.target as HTMLFormElement;

                if (target.id === 'addAddressForm') {
                    e.preventDefault();
                    const formData = new FormData(target);
                    await (context as any)._actions.handleFormSubmit(formData);
                }
            });

            // Обработка клавиатуры
            addEventListener(context, 'keydown', (e: Event) => {
                const keyboardEvent = e as KeyboardEvent;

                // Ctrl+Alt+C для копирования всех адресов
                if (keyboardEvent.ctrlKey && keyboardEvent.altKey && keyboardEvent.key === 'c') {
                    e.preventDefault();
                    (context as any)._actions.handleCopyAllAddresses();
                }

                // Ctrl+R для обновления
                if (keyboardEvent.ctrlKey && keyboardEvent.key === 'r') {
                    e.preventDefault();
                    (context as any)._actions.handleRefreshAddresses();
                }

                // Ctrl+Alt+S для синхронизации
                if (keyboardEvent.ctrlKey && keyboardEvent.altKey && keyboardEvent.key === 's') {
                    e.preventDefault();
                    (context as any)._actions.handleSyncWithLibp2p();
                }

                // Escape для отмены формы
                if (keyboardEvent.key === 'Escape') {
                    const state = context.getState();
                    if (state.showAddForm) {
                        (context as any)._actions.handleToggleAddForm();
                    }
                }
            });

            // Внешние события
            addEventListener(window, 'bootstrap-address:refresh', () => {
                (context as any)._actions.handleRefreshAddresses();
            });

            addEventListener(window, 'bootstrap-address:sync', () => {
                (context as any)._actions.handleSyncWithLibp2p();
            });

            addEventListener(window, 'libp2p:multiaddrs-updated', async (e: Event) => {
                const customEvent = e as CustomEvent;
                if (customEvent.detail?.multiaddrs) {
                    await (context as any)._actions.handleAddressUpdate(
                        customEvent.detail.multiaddrs,
                        'libp2p-event'
                    );
                }
            });

            // Обновление при видимости страницы
            addEventListener(document, 'visibilitychange', () => {
                if (!document.hidden) {
                    // При возвращении на вкладку, обновляем данные
                    setTimeout(() => {
                        (context as any)._actions.handleRefreshAddresses();
                    }, 1000);
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