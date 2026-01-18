import { NetworkAddresses } from '..';

/**
 * Actions для компонента Network Addresses
 * @module components/network-addresses/actions
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
 */
export async function createActions(context: NetworkAddresses) {
    return {
        loadAddresses: loadAddresses.bind(context),
        copyAllAddresses: copyAllAddresses.bind(context),
        refreshAddresses: refreshAddresses.bind(context),
        exportAddresses: exportAddresses.bind(context),
        syncWithLibp2p: syncWithLibp2p.bind(context),
        testAllConnections: testAllConnections.bind(context),
        addCustomAddress: addCustomAddress.bind(context),
        removeAddress: removeAddress.bind(context),
        copyAddress: copyAddress.bind(context),
        testConnection: testConnection.bind(context),
        toggleTheme: toggleTheme.bind(context),
        toggleAddForm: toggleAddForm.bind(context),
        handleFormSubmit: handleFormSubmit.bind(context)
    };
}

/**
 * Загружает сетевые адреса
 */
async function loadAddresses(this: NetworkAddresses, source?: string): Promise<void> {
    try {
        const dataSource = source || this.getAttribute('data-source') || 'auto';
        await (this as any).loadAddressesFromSource(dataSource);
    } catch (error) {
        console.error('Error loading addresses:', error);
        await this.showModal({
            title: 'Error',
            content: `Failed to load addresses: ${(error as Error).message}`,
            buttons: [{ text: 'OK', type: 'primary' }]
        });
    }
}

/**
 * Копирует все адреса в буфер обмена
 */
async function copyAllAddresses(this: NetworkAddresses): Promise<void> {
    const state = (this as any).getState();
    const addresses = state.addresses || [];

    if (addresses.length === 0) {
        await this.showModal({
            title: 'No Addresses',
            content: 'There are no addresses to copy',
            buttons: [{ text: 'OK', type: 'primary' }]
        });
        return;
    }

    const addressesText = addresses.join('\n');

    try {
        await navigator.clipboard.writeText(addressesText);

        await this.showModal({
            title: 'Copied',
            content: `All ${addresses.length} addresses copied to clipboard`,
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
 * Обновляет адреса
 */
async function refreshAddresses(this: NetworkAddresses): Promise<void> {
    await (this as any).refreshAddresses();
}

/**
 * Экспортирует адреса в файл
 */
async function exportAddresses(this: NetworkAddresses): Promise<void> {
    await (this as any).exportAddresses();
}

/**
 * Синхронизируется с libp2p нодой
 */
async function syncWithLibp2p(this: NetworkAddresses, force: boolean = false): Promise<void> {
    await (this as any).syncWithLibp2pNode(force);
}

/**
 * Тестирует все соединения
 */
async function testAllConnections(this: NetworkAddresses): Promise<AddressTestResult[]> {
    const state = (this as any).getState();
    const addresses = state.addresses || [];

    if (addresses.length === 0) {
        await this.showModal({
            title: 'No Addresses',
            content: 'There are no addresses to test',
            buttons: [{ text: 'OK', type: 'primary' }]
        });
        return [];
    }

    const results: AddressTestResult[] = [];
    let successful = 0;

    // Показываем прогресс
    await this.showModal({
        title: 'Testing Connections',
        content: `
            <div style="padding: 1rem 0;">
                <p>Testing ${addresses.length} connections...</p>
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

    // Тестируем каждый адрес
    for (let i = 0; i < addresses.length; i++) {
        const address = addresses[i];
        const result = await (this as any).testConnection(address);
        results.push(result);

        if (result.success) successful++;

        // Обновляем прогресс
        const progress = ((i + 1) / addresses.length) * 100;
        await this.updateElement({
            selector: '.progress-bar',
            value: `${progress}%`,
            property: 'style.width'
        });

        // Добавляем результат
        await this.updateElement({
            selector: '.test-results',
            value: `
                <div style="padding: 0.5rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-family: monospace; font-size: 0.85em;">${address.substring(0, 50)}${address.length > 50 ? '...' : ''}</span>
                    <span style="color: ${result.success ? 'var(--success)' : 'var(--danger)'}; font-weight: 600;">
                        ${result.success ? '✅' : '❌'} ${result.latency ? `${result.latency}ms` : ''}
                    </span>
                </div>
            `,
            property: 'innerHTML',
            action: 'append'
        });
    }

    // Показываем итоги
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
                        <div style="font-size: 2em; color: var(--danger);">❌ ${addresses.length - successful}</div>
                        <div style="font-size: 0.9em; color: var(--text-secondary);">Failed</div>
                    </div>
                </div>
                <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border);">
                    <p style="font-size: 0.9em; color: var(--text-secondary);">
                        Success rate: <strong>${Math.round((successful / addresses.length) * 100)}%</strong>
                    </p>
                </div>
            </div>
        `,
        buttons: [{ text: 'OK', type: 'primary' }]
    });

    return results;
}

/**
 * Добавляет кастомный адрес
 */
async function addCustomAddress(this: NetworkAddresses, address: string): Promise<boolean> {
    return await (this as any).addAddress(address);
}

/**
 * Удаляет адрес
 */
async function removeAddress(this: NetworkAddresses, address: string): Promise<boolean> {
    return await (this as any).removeAddress(address);
}

/**
 * Копирует адрес
 */
async function copyAddress(this: NetworkAddresses, address: string): Promise<void> {
    await (this as any).copyAddress(address);
}

/**
 * Тестирует соединение
 */
async function testConnection(this: NetworkAddresses, address: string): Promise<any> {
    return await (this as any).testConnection(address);
}

/**
 * Переключает тему
 */
async function toggleTheme(this: NetworkAddresses): Promise<void> {
    const currentTheme = this.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    await this.updateElement({
        selector: '.network-addresses',
        value: newTheme,
        property: 'dataset.theme'
    });

    localStorage.setItem('network-addresses-theme', newTheme);
}

/**
 * Переключает форму добавления
 */
async function toggleAddForm(this: NetworkAddresses): Promise<void> {
    const state = (this as any).getState();
    const showAddForm = !(state as any).showAddForm;

    // Здесь можно добавить логику для отображения формы добавления
    // Пока просто логируем
    console.log('Toggle add form:', showAddForm);
}

/**
 * Обрабатывает отправку формы
 */
async function handleFormSubmit(this: NetworkAddresses, formData: FormData): Promise<void> {
    const newAddress = formData.get('newAddress') as string;

    if (newAddress && newAddress.trim()) {
        const success = await (this as any).addAddress(newAddress.trim());
        if (success) {
            // Здесь можно скрыть форму
            console.log('Address added successfully');
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
    interface NetworkAddresses {
        getState(): any;
        // УДАЛЕН НЕСОВМЕСТИМЫЙ МЕТОД - loadAddressesFromSource объявлен как private в основном классе
        // loadAddressesFromSource(source: string): Promise<void>;
        refreshAddresses(): Promise<void>;
        exportAddresses(): Promise<any>;
        syncWithLibp2pNode(force?: boolean): Promise<{ success: boolean; message?: string; error?: string }>;
        addAddress(address: string): Promise<boolean>;
        removeAddress(address: string): Promise<boolean>;
        copyAddress(address: string): Promise<void>;
        testConnection(address: string): Promise<any>;
    }
}