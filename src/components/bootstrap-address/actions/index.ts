import { BootstrapAddress } from '..';

/**
 * Actions для компонента Bootstrap Address
 * @module components/bootstrap-address/actions
 * @version 1.2.0
 */

export interface ActionResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface AddressTestResult {
    address: string;
    success: boolean;
    latency?: number; // Исправлено: сделано опциональным
    error?: string;
}

/**
 * Создает экземпляр actions с привязанным контекстом
 * @async
 * @function createActions
 * @param {BootstrapAddress} context - Контекст компонента
 * @returns {Promise<Object>} Объект с методами действий
 */
export async function createActions(context: BootstrapAddress) {
    return {
        handleAddressUpdate: handleAddressUpdate.bind(context),
        handleCopyAllAddresses: handleCopyAllAddresses.bind(context),
        handleTestAllConnections: handleTestAllConnections.bind(context),
        handleSyncWithLibp2p: handleSyncWithLibp2p.bind(context),
        handleAddCustomAddress: handleAddCustomAddress.bind(context),
        handleToggleAddForm: handleToggleAddForm.bind(context),
        handleCopyPrimaryAddress: handleCopyPrimaryAddress.bind(context),
        handleRefreshAddresses: handleRefreshAddresses.bind(context),
        handleSingleAddressAction: handleSingleAddressAction.bind(context),
        handleFormSubmit: handleFormSubmit.bind(context),
        loadBootstrapAddresses: loadBootstrapAddresses.bind(context),
        fetchBootstrapAddresses: fetchBootstrapAddresses.bind(context),
        addBootstrapAddress: addBootstrapAddress.bind(context),
        removeBootstrapAddress: removeBootstrapAddress.bind(context),
        testBootstrapConnection: testBootstrapConnection.bind(context),
        validateAddress: validateAddress.bind(context),
        formatAddressForDisplay: formatAddressForDisplay.bind(context)
    };
}

/**
 * Загружает bootstrap адреса из данных
 * @async
 * @function loadBootstrapAddresses
 * @this {BootstrapAddress} Контекст компонента
 * @param {any} data - Данные с сервера
 * @returns {Promise<void>}
 */
async function loadBootstrapAddresses(this: BootstrapAddress, data: any): Promise<void> {
    try {
        const addresses = data.addresses || [];
        await this.updateAddresses(addresses, 'server');
    } catch (error) {
        console.error('Error loading bootstrap addresses:', error);
        await this.showModal({
            title: 'Ошибка загрузки',
            content: `Не удалось загрузить bootstrap адреса: ${(error as Error).message}`,
            buttons: [{ text: 'OK', type: 'primary' }]
        });
    }
}

/**
 * Загружает bootstrap адреса с сервера
 * @async
 * @function fetchBootstrapAddresses
 * @this {BootstrapAddress} Контекст компонента
 * @returns {Promise<string[]>} Массив bootstrap адресов
 */
async function fetchBootstrapAddresses(this: BootstrapAddress): Promise<string[]> {
    try {
        // В реальной реализации здесь будет запрос к серверу
        // Для демонстрации возвращаем mock данные
        return [
            '/ip4/127.0.0.1/tcp/6832/ws/p2p/12D3KooWExample1',
            '/ip4/192.168.1.1/tcp/8080/ws/p2p/12D3KooWExample2',
            '/ip6/::1/tcp/9090/ws/p2p/12D3KooWExample3'
        ];
    } catch (error) {
        console.error('Error fetching bootstrap addresses:', error);
        throw error;
    }
}

/**
 * Добавляет новый bootstrap адрес
 * @async
 * @function addBootstrapAddress
 * @this {BootstrapAddress} Контекст компонента
 * @param {string} address - Адрес для добавления
 * @returns {Promise<ActionResult>} Результат операции
 */
async function addBootstrapAddress(this: BootstrapAddress, address: string): Promise<ActionResult> {
    try {
        if (!validateAddress.call(this, address)) {
            return { success: false, error: 'Invalid bootstrap address format' };
        }

        // В реальной реализации здесь будет запрос к серверу
        await new Promise(resolve => setTimeout(resolve, 500)); // Симуляция задержки

        return { success: true, data: { address } };
    } catch (error) {
        console.error('Error adding bootstrap address:', error);
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Удаляет bootstrap адрес
 * @async
 * @function removeBootstrapAddress
 * @this {BootstrapAddress} Контекст компонента
 * @param {string} address - Адрес для удаления
 * @returns {Promise<ActionResult>} Результат операции
 */
async function removeBootstrapAddress(this: BootstrapAddress, address: string): Promise<ActionResult> {
    try {
        // В реальной реализации здесь будет запрос к сервера
        await new Promise(resolve => setTimeout(resolve, 500)); // Симуляция задержки

        return { success: true, data: { address } };
    } catch (error) {
        console.error('Error removing bootstrap address:', error);
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Тестирует соединение с bootstrap адресом
 * @async
 * @function testBootstrapConnection
 * @this {BootstrapAddress} Контекст компонента
 * @param {string} address - Адрес для тестирования
 * @returns {Promise<ActionResult>} Результат теста
 */
async function testBootstrapConnection(this: BootstrapAddress, address: string): Promise<ActionResult> {
    try {
        // В реальной реализации здесь будет запрос к серверу
        await new Promise(resolve => setTimeout(resolve, 800)); // Симуляция задержки

        const success = Math.random() > 0.3;
        const latency = success ? Math.floor(Math.random() * 100) + 50 : undefined;

        return {
            success: true,
            data: {
                address,
                success,
                latency, // Теперь это number | undefined, что совместимо с AddressTestResult
                error: success ? undefined : 'Connection timeout'
            }
        };
    } catch (error) {
        console.error('Error testing bootstrap connection:', error);
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Валидирует bootstrap адрес
 * @function validateAddress
 * @this {BootstrapAddress} Контекст компонента
 * @param {string} address - Адрес для валидации
 * @returns {boolean} true если адрес валиден
 */
function validateAddress(this: BootstrapAddress, address: string): boolean {
    if (typeof address !== 'string' || address.trim().length === 0) {
        return false;
    }

    // Простая валидация формата multiaddress
    const validProtocols = ['/ip4/', '/ip6/', '/dns4/', '/dns6/', '/tcp/', '/ws/', '/wss/', '/p2p/'];
    return validProtocols.some(protocol => address.includes(protocol));
}

/**
 * Форматирует адрес для отображения
 * @function formatAddressForDisplay
 * @this {BootstrapAddress} Контекст компонента
 * @param {string} address - Адрес для форматирования
 * @returns {string} Отформатированный адрес
 */
function formatAddressForDisplay(this: BootstrapAddress, address: string): string {
    if (!address) return '';

    // Обрезаем длинные адреса для лучшего отображения
    if (address.length > 80) {
        return address.substring(0, 77) + '...';
    }

    return address;
}

/**
 * Обрабатывает обновление адресов
 * @async
 * @function handleAddressUpdate
 * @this {BootstrapAddress} Контекст компонента
 * @param {string[]} newAddresses - Новые адреса
 * @param {string} source - Источник адресов
 * @returns {Promise<void>}
 */
async function handleAddressUpdate(this: BootstrapAddress, newAddresses: string[], source: string = 'manual'): Promise<void> {
    await this.updateAddresses(newAddresses, source);
}

/**
 * Копирует все адреса в буфер обмена
 * @async
 * @function handleCopyAllAddresses
 * @this {BootstrapAddress} Контекст компонента
 * @returns {Promise<void>}
 */
async function handleCopyAllAddresses(this: BootstrapAddress): Promise<void> {
    const state = this.getState();

    const allAddresses = [
        state.primaryAddress,
        ...state.secondaryAddresses,
        ...state.customAddresses
    ].filter(addr => addr.trim() !== '');

    if (allAddresses.length === 0) {
        await this.showModal({
            title: 'No Addresses',
            content: 'There are no addresses to copy',
            buttons: [{ text: 'OK', type: 'primary' }]
        });
        return;
    }

    const addressesText = allAddresses.join('\n');

    try {
        await navigator.clipboard.writeText(addressesText);

        await this.showModal({
            title: 'Copied',
            content: `All ${allAddresses.length} addresses copied to clipboard`,
            buttons: [{ text: 'OK', type: 'primary' }]
        });
    } catch (error) {
        await this.showModal({
            title: 'Copy Failed',
            content: 'Failed to copy addresses to clipboard',
            buttons: [{ text: 'OK', type: 'primary' }]
        });
    }
}

/**
 * Тестирует все соединения
 * @async
 * @function handleTestAllConnections
 * @this {BootstrapAddress} Контекст компонента
 * @returns {Promise<AddressTestResult[]>} Результаты тестов
 */
async function handleTestAllConnections(this: BootstrapAddress): Promise<AddressTestResult[]> {
    const state = this.getState();

    const allAddresses = [
        state.primaryAddress,
        ...state.secondaryAddresses,
        ...state.customAddresses
    ].filter(addr => addr.trim() !== '');

    if (allAddresses.length === 0) {
        await this.showModal({
            title: 'No Addresses',
            content: 'There are no addresses to test',
            buttons: [{ text: 'OK', type: 'primary' }]
        });
        return [];
    }

    // Показываем модальное окно с прогрессом
    const modalResult = await this.showModal({
        title: 'Testing Connections',
        content: `
            <div style="padding: 1rem 0;">
                <p>Testing ${allAddresses.length} connections...</p>
                <div class="test-progress" style="margin-top: 1rem;">
                    <div class="progress-bar" style="width: 0%; height: 4px; background: var(--primary); border-radius: 2px; transition: width 0.3s ease;"></div>
                </div>
                <div class="test-results" style="margin-top: 1rem; max-height: 200px; overflow-y: auto; font-size: 0.9em;"></div>
            </div>
        `,
        buttons: [
            {
                text: 'Cancel',
                type: 'secondary'
            }
        ],
        closeOnBackdropClick: false
    });

    if (modalResult === undefined) {
        // Пользователь нажал Cancel
        return [];
    }

    const results: AddressTestResult[] = [];
    let successful = 0;

    // Тестируем каждый адрес
    for (let i = 0; i < allAddresses.length; i++) {
        const address = allAddresses[i];

        // Симуляция задержки тестирования
        await new Promise(resolve => setTimeout(resolve, 500));

        // Симуляция результата теста
        const success = Math.random() > 0.3;
        const latency = success ? Math.floor(Math.random() * 100) + 50 : undefined;

        if (success) successful++;

        results.push({
            address,
            success,
            latency: latency || 0, // Исправлено: всегда number, по умолчанию 0
            error: success ? undefined : 'Connection failed'
        } as AddressTestResult); // ИСПРАВЛЕНИЕ: явное приведение типа

        // Обновляем прогресс в UI
        const progress = ((i + 1) / allAddresses.length) * 100;
        await this.updateElement({
            selector: '.progress-bar',
            value: `${progress}%`,
            property: 'style.width'
        });

        // Добавляем результат в список
        await this.updateElement({
            selector: '.test-results',
            value: `
                <div style="padding: 0.5rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-family: monospace; font-size: 0.85em;">${address.substring(0, 50)}${address.length > 50 ? '...' : ''}</span>
                    <span style="color: ${success ? 'var(--success)' : 'var(--danger)'}; font-weight: 600;">
                        ${success ? '✅' : '❌'} ${latency ? `${latency}ms` : ''}
                    </span>
                </div>
            `,
            property: 'innerHTML',
            action: 'append'
        });
    }

    // Показываем итоговые результаты
    await this.showModal({
        title: 'Test Results',
        content: `
            <div style="padding: 1rem 0;">
                <p><strong>Summary:</strong></p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
                    <div style="background: rgba(34, 197, 94, 0.1); padding: 1rem; border-radius: 8px; text-align: center;">
                        <div style="font-size: 2em; color: var(--success);">✅ ${successful}</div>
                        <div style="font-size: 0.9em; color: var(--text-secondary);">Successful</div>
                    </div>
                    <div style="background: rgba(239, 68, 68, 0.1); padding: 1rem; border-radius: 8px; text-align: center;">
                        <div style="font-size: 2em; color: var(--danger);">❌ ${allAddresses.length - successful}</div>
                        <div style="font-size: 0.9em; color: var(--text-secondary);">Failed</div>
                    </div>
                </div>
                <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border);">
                    <p style="font-size: 0.9em; color: var(--text-secondary);">
                        Success rate: <strong>${Math.round((successful / allAddresses.length) * 100)}%</strong>
                    </p>
                </div>
            </div>
        `,
        buttons: [{ text: 'OK', type: 'primary' }]
    });

    return results;
}

/**
 * Синхронизируется с libp2p нодой
 * @async
 * @function handleSyncWithLibp2p
 * @this {BootstrapAddress} Контекст компонента
 * @returns {Promise<void>}
 */
async function handleSyncWithLibp2p(this: BootstrapAddress): Promise<void> {
    await this.syncWithLibp2pNode();
}

/**
 * Добавляет кастомный адрес
 * @async
 * @function handleAddCustomAddress
 * @this {BootstrapAddress} Контекст компонента
 * @param {string} address - Адрес для добавления
 * @returns {Promise<boolean>}
 */
async function handleAddCustomAddress(this: BootstrapAddress, address: string): Promise<boolean> {
    return await this.addCustomAddress(address);
}

/**
 * Переключает форму добавления адреса
 * @async
 * @function handleToggleAddForm
 * @this {BootstrapAddress} Контекст компонента
 * @returns {Promise<void>}
 */
async function handleToggleAddForm(this: BootstrapAddress): Promise<void> {
    const state = this.getState();
    const newState = { ...state, showAddForm: !state.showAddForm };

    await this.renderPart({
        partName: 'renderAddAddressForm',
        state: newState,
        selector: '#addAddressSection'
    });
}

/**
 * Копирует основной адрес
 * @async
 * @function handleCopyPrimaryAddress
 * @this {BootstrapAddress} Контекст компонента
 * @returns {Promise<void>}
 */
async function handleCopyPrimaryAddress(this: BootstrapAddress): Promise<void> {
    const state = this.getState();
    if (state.primaryAddress) {
        await this.copyAddress(state.primaryAddress);
    } else {
        await this.showModal({
            title: 'No Primary Address',
            content: 'Primary address is not available',
            buttons: [{ text: 'OK', type: 'primary' }]
        });
    }
}

/**
 * Обновляет адреса
 * @async
 * @function handleRefreshAddresses
 * @this {BootstrapAddress} Контекст компонента
 * @returns {Promise<void>}
 */
async function handleRefreshAddresses(this: BootstrapAddress): Promise<void> {
    await this.refreshAddresses();
}

/**
 * Обрабатывает действие с одиночным адресом
 * @async
 * @function handleSingleAddressAction
 * @this {BootstrapAddress} Контекст компонента
 * @param {string} action - Действие (copy/test/remove)
 * @param {string} address - Адрес
 * @returns {Promise<void>}
 */
async function handleSingleAddressAction(this: BootstrapAddress, action: string, address: string): Promise<void> {
    switch (action) {
        case 'copy':
            await this.copyAddress(address);
            break;
        case 'test':
            await this.testConnection(address);
            break;
        case 'remove':
            await this.removeAddress(address);
            break;
    }
}

/**
 * Обрабатывает отправку формы
 * @async
 * @function handleFormSubmit
 * @this {BootstrapAddress} Контекст компонента
 * @param {FormData} formData - Данные формы
 * @returns {Promise<void>}
 */
async function handleFormSubmit(this: BootstrapAddress, formData: FormData): Promise<void> {
    const newAddress = formData.get('newAddress') as string;

    if (newAddress && newAddress.trim()) {
        const success = await this.addCustomAddress(newAddress.trim());
        if (success) {
            // Очищаем форму и скрываем её
            const state = this.getState();
            await this.renderPart({
                partName: 'renderAddAddressForm',
                state: { ...state, showAddForm: false, newAddress: '' },
                selector: '#addAddressSection'
            });
        }
    } else {
        await this.showModal({
            title: 'Invalid Input',
            content: 'Please enter a valid address',
            buttons: [{ text: 'OK', type: 'primary' }]
        });
    }
}

// Вспомогательные типы
declare module '../index' {
    interface BootstrapAddress {
        getState(): any;
        updateAddresses(addresses: string[], source: string): Promise<void>;
        addCustomAddress(address: string): Promise<boolean>;
        removeAddress(address: string): Promise<boolean>;
        testConnection(address: string): Promise<any>;
        copyAddress(address: string): Promise<void>;
        refreshAddresses(): Promise<void>;
        syncWithLibp2pNode(): Promise<{ success: boolean; message?: string; error?: string }>; // Исправлено: добавлен тип возвращаемого значения
    }
}