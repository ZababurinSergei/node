import { Libp2pNode } from '..';
import { createLogger } from '../../../logger/logger';

const log = createLogger('libp2p-node:controller');

export interface EventListener {
    element: EventTarget;
    event: string;
    handler: EventListenerOrEventListenerObject;
}

export const controller = (context: Libp2pNode) => {
    let eventListeners: EventListener[] = [];
    let updateInterval: number | null = null;

    const addEventListener = (
        element: EventTarget,
        event: string,
        handler: EventListenerOrEventListenerObject
    ): void => {
        element.addEventListener(event, handler);
        eventListeners.push({ element, event, handler });
    };

    const startStatsUpdate = (): void => {
        if (updateInterval) {
            clearInterval(updateInterval);
        }

        // Обновляем статистику каждые 5 секунд
        updateInterval = window.setInterval(async () => {
            try {
                await updateNodeStats();
            } catch (error) {
                console.error('Error updating node stats:', error);
            }
        }, 5000);
    };

    const stopStatsUpdate = (): void => {
        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }
    };

    const updateNodeStats = async (): Promise<void> => {
        // Используем публичный метод для проверки состояния
        if (!context.isNodeActive()) {
            return;
        }

        try {
            // Получаем текущие соединения из состояния через публичный метод
            const state = context.getState() as any;
            // const connections = state.connections || 0;
            // const discoveredPeers = state.discoveredPeers || 0;
            // const multiaddrs = state.multiaddrs || [];

            // Обновляем UI
            // await context.updateElement({
            //     selector: '.connections-count',
            //     value: connections.toString(),
            //     property: 'textContent'
            // });

            // await context.updateElement({
            //     selector: '.discovered-count',
            //     value: discoveredPeers.toString(),
            //     property: 'textContent'
            // });

            // await context.updateElement({
            //     selector: '.multiaddrs-count',
            //     value: multiaddrs.length.toString(),
            //     property: 'textContent'
            // });

            // // Обновляем список multiaddrs
            // await context.renderPart({
            //     partName: 'multiaddrsTemplate',
            //     state: { multiaddrs },
            //     selector: '.multiaddrs-list'
            // });

            // Обновляем DHT статистику если доступна
            try {
                // Получаем DHT статистику из состояния
                const dhtStats = state.dhtStats || {};
                if (dhtStats) {
                    // await updateDHTStatsUI(dhtStats);
                }
            } catch (dhtError) {
                log.debug('DHT stats not available:', dhtError);
            }

        } catch (error) {
            console.error('Error in stats update:', error);
        }
    };

    const updateDHTStatsUI = async (dhtStats: any): Promise<void> => {
        const dhtTypes = ['lan', 'amino', 'universe'];

        for (const dhtType of dhtTypes) {
            const stats = dhtStats[dhtType];
            if (stats) {
                // await context.updateElement({
                //     selector: `.dht-${dhtType} .dht-value`,
                //     value: stats.status || 'stopped',
                //     property: 'textContent'
                // });

                // await context.updateElement({
                //     selector: `.dht-${dhtType} .dht-peers`,
                //     value: `Peers: ${stats.peerCount || 0}`,
                //     property: 'textContent'
                // });
            }
        }
    };

    const handleStartNode = async (): Promise<void> => {
        log('Starting libp2p node...');

        // Показываем индикатор загрузки
        await context.updateElement({
            selector: '.btn-start',
            value: true,
            property: 'disabled'
        });

        await context.updateElement({
            selector: '.btn-start .btn-text',
            value: 'Starting...',
            property: 'textContent'
        });

        try {
            // Проверяем, не запущена ли уже нода
            if (context.isNodeActive()) {
                log('Node already running');
                await context.updateElement({
                    selector: '.btn-start .btn-text',
                    value: 'Already Running',
                    property: 'textContent'
                });
                await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
                await (context as any)._actions.startNode();
                // startStatsUpdate();
            }

            // Обновляем состояние кнопок
            await context.updateElement({
                selector: '.btn-start',
                value: true,
                property: 'disabled'
            });

            await context.updateElement({
                selector: '.btn-stop',
                value: false,
                property: 'disabled'
            });

            await context.updateElement({
                selector: '.btn-discover',
                value: false,
                property: 'disabled'
            });

        } catch (error) {
            log.error('Failed to start node:', error);

            // Возвращаем кнопку в исходное состояние
            await context.updateElement({
                selector: '.btn-start',
                value: false,
                property: 'disabled'
            });

            await context.updateElement({
                selector: '.btn-start .btn-text',
                value: 'Start Node',
                property: 'textContent'
            });

            // Показываем ошибку
            await context.showModal({
                title: 'Start Failed',
                content: `Failed to start node: ${error}`,
                buttons: [{ text: 'OK', type: 'primary' }]
            });
        } finally {
            // В любом случае восстанавливаем текст кнопки
            await context.updateElement({
                selector: '.btn-start .btn-text',
                value: 'Start Node',
                property: 'textContent'
            });

            await context.updateElement({
                selector: '.btn-start',
                value: false,
                property: 'disabled'
            });
        }
    };

    const handleStopNode = async (): Promise<void> => {
        log('Stopping libp2p node...');

        await context.updateElement({
            selector: '.btn-stop',
            value: true,
            property: 'disabled'
        });

        await context.updateElement({
            selector: '.btn-stop .btn-text',
            value: 'Stopping...',
            property: 'textContent'
        });

        try {
            // Проверяем, запущена ли нода
            if (!context.isNodeActive()) {
                log('Node not running');
                await context.updateElement({
                    selector: '.btn-stop .btn-text',
                    value: 'Not Running',
                    property: 'textContent'
                });
                await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
                await (context as any)._actions.stopNode();
                stopStatsUpdate();
            }

            // Обновляем состояние кнопок
            await context.updateElement({
                selector: '.btn-start',
                value: false,
                property: 'disabled'
            });

            await context.updateElement({
                selector: '.btn-stop',
                value: true,
                property: 'disabled'
            });

            await context.updateElement({
                selector: '.btn-discover',
                value: true,
                property: 'disabled'
            });

        } catch (error) {
            log.error('Failed to stop node:', error);

            // Возвращаем кнопку в исходное состояние
            await context.updateElement({
                selector: '.btn-stop',
                value: false,
                property: 'disabled'
            });

            await context.updateElement({
                selector: '.btn-stop .btn-text',
                value: 'Stop Node',
                property: 'textContent'
            });

            // Показываем ошибку
            await context.showModal({
                title: 'Stop Failed',
                content: `Failed to stop node: ${error}`,
                buttons: [{ text: 'OK', type: 'primary' }]
            });
        } finally {
            // В любом случае восстанавливаем текст кнопки
            await context.updateElement({
                selector: '.btn-stop .btn-text',
                value: 'Stop Node',
                property: 'textContent'
            });

            await context.updateElement({
                selector: '.btn-stop',
                value: false,
                property: 'disabled'
            });
        }
    };

    const handleDiscoverPeers = async (): Promise<void> => {
        log('Starting peer discovery...');

        await context.updateElement({
            selector: '.btn-discover',
            value: true,
            property: 'disabled'
        });

        await context.updateElement({
            selector: '.btn-discover .btn-text',
            value: 'Discovering...',
            property: 'textContent'
        });

        try {
            // Проверяем, запущена ли нода
            if (!context.isNodeActive()) {
                throw new Error('Node is not running. Start the node first.');
            }

            await (context as any)._actions.discoverPeers();

            // Показываем уведомление об успехе
            await context.showModal({
                title: 'Success',
                content: 'Peer discovery completed successfully',
                buttons: [{ text: 'OK', type: 'primary' }]
            });

        } catch (error) {
            log.error('Peer discovery failed:', error);

            await context.showModal({
                title: 'Error',
                content: `Peer discovery failed: ${error}`,
                buttons: [{ text: 'OK', type: 'primary' }]
            });
        } finally {
            await context.updateElement({
                selector: '.btn-discover .btn-text',
                value: 'Discover Peers',
                property: 'textContent'
            });

            await context.updateElement({
                selector: '.btn-discover',
                value: false,
                property: 'disabled'
            });
        }
    };

    const handleClearLogs = async (): Promise<void> => {
        await (context as any)._actions.clearLogs();

        // Показываем подтверждение
        await context.showModal({
            title: 'Success',
            content: 'Logs cleared successfully',
            buttons: [{ text: 'OK', type: 'primary' }]
        });
    };

    const handleCopyPeerId = async (): Promise<void> => {
        try {
            const state = context.getState() as any;
            const peerId = state.peerId;

            if (peerId) {
                await navigator.clipboard.writeText(peerId);

                await context.showModal({
                    title: 'Copied',
                    content: 'Peer ID copied to clipboard',
                    buttons: [{ text: 'OK', type: 'primary' }]
                });
            } else {
                throw new Error('Peer ID not available. Start the node first.');
            }
        } catch (error) {
            log.error('Failed to copy peer ID:', error);

            await context.showModal({
                title: 'Error',
                content: 'Failed to copy Peer ID. Make sure the node is running.',
                buttons: [{ text: 'OK', type: 'primary' }]
            });
        }
    };

    const setupKeyboardShortcuts = (): void => {
        addEventListener(window, 'keydown', (e: Event) => {
            const keyboardEvent = e as KeyboardEvent;

            // Ctrl+Alt+S для запуска ноды
            if (keyboardEvent.ctrlKey && keyboardEvent.altKey && keyboardEvent.key === 's') {
                e.preventDefault();
                if (!context.isNodeActive()) {
                    handleStartNode().catch(e => { console.log(e) });
                }
            }

            // Ctrl+Alt+Q для остановки ноды
            if (keyboardEvent.ctrlKey && keyboardEvent.altKey && keyboardEvent.key === 'q') {
                e.preventDefault();
                if (context.isNodeActive()) {
                    handleStopNode().catch(e => { console.log(e) });
                }
            }

            // Ctrl+Alt+D для поиска пиров
            if (keyboardEvent.ctrlKey && keyboardEvent.altKey && keyboardEvent.key === 'd') {
                e.preventDefault();
                if (context.isNodeActive()) {
                    handleDiscoverPeers().catch(e => { console.log(e) });
                }
            }

            // Ctrl+Alt+L для очистки логов
            if (keyboardEvent.ctrlKey && keyboardEvent.altKey && keyboardEvent.key === 'l') {
                e.preventDefault();
                handleClearLogs().catch(e => { console.log(e) });
            }

            // Ctrl+Alt+C для копирования Peer ID
            if (keyboardEvent.ctrlKey && keyboardEvent.altKey && keyboardEvent.key === 'c') {
                e.preventDefault();
                if (context.isNodeActive()) {
                    handleCopyPeerId();
                }
            }
        });
    };

    const setupContextMenu = (): void => {
        addEventListener(context.shadowRoot!, 'contextmenu', (e: Event) => {
            e.preventDefault();

            const target = e.target as HTMLElement;

            // Контекстное меню для Peer ID
            if (target.classList.contains('peer-id')) {
                const menu = document.createElement('div');
                menu.className = 'context-menu';
                menu.style.cssText = `
          position: fixed;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          box-shadow: var(--shadow-lg);
          z-index: 10000;
          min-width: 200px;
          padding: 8px 0;
        `;

                const copyItem = document.createElement('div');
                copyItem.className = 'context-menu-item';
                copyItem.textContent = 'Copy Peer ID';
                copyItem.style.cssText = `
          padding: 8px 16px;
          cursor: pointer;
          transition: var(--transition);
        `;
                copyItem.onmouseover = () => {
                    copyItem.style.background = 'var(--surface-100)';
                };
                copyItem.onmouseout = () => {
                    copyItem.style.background = 'transparent';
                };
                copyItem.onclick = async () => {
                    menu.remove();
                    await handleCopyPeerId();
                };

                menu.appendChild(copyItem);

                const rect = target.getBoundingClientRect();
                menu.style.left = `${rect.left}px`;
                menu.style.top = `${rect.bottom + 5}px`;

                document.body.appendChild(menu);

                // Закрытие меню при клике вне его
                const closeMenu = (event: MouseEvent) => {
                    if (!menu.contains(event.target as Node)) {
                        menu.remove();
                        document.removeEventListener('click', closeMenu);
                    }
                };

                setTimeout(() => {
                    document.addEventListener('click', closeMenu);
                }, 0);
            }
        });
    };

    const setupDragAndDrop = (): void => {
        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let initialX = 0;
        let initialY = 0;

        const header = context.shadowRoot!.querySelector('.header') as HTMLElement;
        if (!header) return;

        header.style.cursor = 'move';
        header.style.userSelect = 'none';

        addEventListener(header, 'mousedown', (e: Event) => {
            const mouseEvent = e as MouseEvent;
            isDragging = true;
            startX = mouseEvent.clientX;
            startY = mouseEvent.clientY;

            const rect = context.getBoundingClientRect();
            initialX = rect.left;
            initialY = rect.top;

            e.preventDefault();
        });

        addEventListener(document, 'mousemove', (e: Event) => {
            if (!isDragging) return;

            const mouseEvent = e as MouseEvent;
            const deltaX = mouseEvent.clientX - startX;
            const deltaY = mouseEvent.clientY - startY;

            context.style.position = 'fixed';
            context.style.left = `${initialX + deltaX}px`;
            context.style.top = `${initialY + deltaY}px`;
            context.style.zIndex = '1000';
        });

        addEventListener(document, 'mouseup', () => {
            isDragging = false;
        });

        addEventListener(document, 'keydown', (e: Event) => {
            const keyboardEvent = e as KeyboardEvent;
            if (keyboardEvent.key === 'Escape' && isDragging) {
                isDragging = false;
                context.style.position = '';
                context.style.left = '';
                context.style.top = '';
                context.style.zIndex = '';
            }
        });
    };

    const setupResizeHandler = (): void => {
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle';
        resizeHandle.style.cssText = `
      position: absolute;
      bottom: 0;
      right: 0;
      width: 20px;
      height: 20px;
      cursor: nwse-resize;
      background: linear-gradient(135deg, transparent 50%, var(--primary) 50%);
      opacity: 0.5;
      transition: opacity 0.2s;
    `;

        context.shadowRoot!.appendChild(resizeHandle);

        let isResizing = false;
        let startWidth = 0;
        let startHeight = 0;
        let startX = 0;
        let startY = 0;

        addEventListener(resizeHandle, 'mousedown', (e: Event) => {
            const mouseEvent = e as MouseEvent;
            isResizing = true;
            startWidth = context.offsetWidth;
            startHeight = context.offsetHeight;
            startX = mouseEvent.clientX;
            startY = mouseEvent.clientY;

            e.preventDefault();
        });

        addEventListener(document, 'mousemove', (e: Event) => {
            if (!isResizing) return;

            const mouseEvent = e as MouseEvent;
            const deltaX = mouseEvent.clientX - startX;
            const deltaY = mouseEvent.clientY - startY;

            const newWidth = Math.max(300, startWidth + deltaX);
            const newHeight = Math.max(400, startHeight + deltaY);

            context.style.width = `${newWidth}px`;
            context.style.height = `${newHeight}px`;
        });

        addEventListener(document, 'mouseup', () => {
            isResizing = false;
        });

        addEventListener(resizeHandle, 'mouseenter', () => {
            resizeHandle.style.opacity = '1';
        });

        addEventListener(resizeHandle, 'mouseleave', () => {
            if (!isResizing) {
                resizeHandle.style.opacity = '0.5';
            }
        });
    };

    return {
        async init(): Promise<void> {
            log('Initializing libp2p node controller...');

            // Делегирование кликов через shadowRoot
            addEventListener(context.shadowRoot!, 'click', async (e: Event) => {
                const target = e.target as HTMLElement;
                const button = target.closest('button[data-action]');

                if (!button) return;

                const action = button.getAttribute('data-action');

                switch (action) {
                    case 'start':
                        await handleStartNode();
                        break;

                    case 'stop':
                        await handleStopNode();
                        break;

                    case 'discover':
                        await handleDiscoverPeers();
                        break;

                    case 'clear-logs':
                        await handleClearLogs();
                        break;

                    case 'copy-peer-id':
                        await handleCopyPeerId();
                        break;
                }
            });

            // Настройка дополнительных обработчиков
            addEventListener(context.shadowRoot!, 'dblclick', (e: Event) => {
                const target = e.target as HTMLElement;

                // Двойной клик по заголовку для сброса позиции
                if (target.closest('.header')) {
                    context.style.position = '';
                    context.style.left = '';
                    context.style.top = '';
                    context.style.width = '';
                    context.style.height = '';
                    context.style.zIndex = '';
                }
            });

            // Обработка внешних событий
            addEventListener(window, 'libp2p:start', () => {
                if (!context.isNodeActive()) {
                    handleStartNode();
                }
            });

            addEventListener(window, 'libp2p:stop', () => {
                if (context.isNodeActive()) {
                    handleStopNode();
                }
            });

            addEventListener(window, 'libp2p:discover', () => {
                if (context.isNodeActive()) {
                    handleDiscoverPeers();
                }
            });

            // Обработка видимости страницы
            addEventListener(document, 'visibilitychange', () => {
                if (document.hidden && context.isNodeActive()) {
                    log('Page hidden, pausing stats updates');
                    stopStatsUpdate();
                } else if (!document.hidden && context.isNodeActive()) {
                    log('Page visible, resuming stats updates');
                    startStatsUpdate();
                }
            });

            // Обработка онлайн/офлайн статуса
            addEventListener(window, 'online', () => {
                log('Network connection restored');

                if (context.isNodeActive()) {
                    // Используем публичный метод для добавления лога
                    context.addLogToBuffer?.('Network connection restored', 'info');
                }
            });

            addEventListener(window, 'offline', () => {
                log('Network connection lost');

                if (context.isNodeActive()) {
                    // Используем публичный метод для добавления лога
                    context.addLogToBuffer?.('Network connection lost', 'warn');
                }
            });

            // Настройка дополнительных функций
            setupKeyboardShortcuts();
            setupContextMenu();
            // setupDragAndDrop();
            // setupResizeHandler();

            // Инициализация состояния кнопок
            await context.updateElement({
                selector: '.btn-start',
                value: false,
                property: 'disabled'
            });

            await context.updateElement({
                selector: '.btn-stop',
                value: true,
                property: 'disabled'
            });

            await context.updateElement({
                selector: '.btn-discover',
                value: true,
                property: 'disabled'
            });

            // Добавляем кнопку копирования Peer ID если ее нет
            if (!context.shadowRoot!.querySelector('.btn-copy-peer-id')) {
                const copyBtn = document.createElement('button');
                copyBtn.className = 'btn btn-secondary btn-copy-peer-id';
                copyBtn.setAttribute('data-action', 'copy-peer-id');
                copyBtn.innerHTML = `
          <span class="btn-icon">📋</span>
          <span class="btn-text">Copy Peer ID</span>
        `;

                const controls = context.shadowRoot!.querySelector('.controls');
                if (controls) {
                    controls.appendChild(copyBtn);

                    addEventListener(copyBtn, 'click', async () => {
                        await handleCopyPeerId();
                    });
                }
            }

            log('Libp2p node controller initialized successfully');
        },

        async destroy(): Promise<void> {
            log('Destroying libp2p node controller...');

            // Останавливаем обновление статистики
            stopStatsUpdate();

            // Автоматическая очистка всех слушателей
            eventListeners.forEach(({ element, event, handler }) => {
                element.removeEventListener(event, handler);
            });
            eventListeners = [];

            // Удаляем контекстное меню если оно существует
            const contextMenu = document.querySelector('.context-menu');
            if (contextMenu) {
                contextMenu.remove();
            }

            log('Libp2p node controller destroyed');
        }
    };
};