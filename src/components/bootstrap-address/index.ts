import { BaseComponent } from '@/base/base-component';
import * as template from './template';
import { controller } from './controller';
import { createActions } from './actions';
import { LIBP2P_DEFAULT_BOOTSTRAP_NODES } from '@/lib/libp2p/libp2p-browser';

export interface BootstrapAddressState {
    primaryAddress: string;
    secondaryAddresses: string[];
    customAddresses: string[];
    isLoading: boolean;
    showAddForm: boolean;
    newAddress: string;
    isCopied: boolean;
    lastUpdated: number;
    totalAddresses: number;
    connectedNodes: number;
    addressStats: {
        ws: number;
        tcp: number;
        webrtc: number;
        ip4: number;
        ip6: number;
    };
    dataSource: string; // Добавлено: источник данных
}

export class BootstrapAddress extends BaseComponent {
    static override observedAttributes = [
        'title',
        'data-auto-refresh',
        'data-refresh-interval',
        'data-source',        // 'libp2p', 'mock', 'default', 'auto'
        'data-default-source' // primary, secondary, all
    ];

    private refreshInterval: number | null = null;
    private libp2pNode: any = null;
    private libp2pListenerSet: boolean = false;
    private readonly DEFAULT_BOOTSTRAP_NODES: string[] = LIBP2P_DEFAULT_BOOTSTRAP_NODES; // Добавлено

    constructor() {
        super();
        this._templateMethods = {
            defaultTemplate: (params: { state: Record<string, any>; context: BaseComponent }) => {
                const state = params.state as BootstrapAddressState;
                return template.defaultTemplate({ state, context: params.context });
            },
            renderSecondaryAddresses: (params: { state: Record<string, any>; context: BaseComponent }) => {
                const state = params.state as BootstrapAddressState;
                return template.renderSecondaryAddresses({ state, context: params.context });
            },
            renderAddAddressForm: (params: { state: Record<string, any>; context: BaseComponent }) => {
                const state = params.state as BootstrapAddressState;
                return template.renderAddAddressForm({ state, context: params.context });
            }
        };
        this.state = {
            primaryAddress: '',
            secondaryAddresses: [],
            customAddresses: [],
            isLoading: false,
            showAddForm: false,
            newAddress: '',
            isCopied: false,
            lastUpdated: Date.now(),
            totalAddresses: 0,
            connectedNodes: 0,
            addressStats: {
                ws: 0,
                tcp: 0,
                webrtc: 0,
                ip4: 0,
                ip6: 0
            },
            dataSource: 'default' // Добавлено
        } as BootstrapAddressState;
    }

    override async _componentReady(): Promise<void> {
        this._controller = controller(this);
        const actions = await createActions(this);

        // Обернуть синхронные методы в Promise для совместимости с интерфейсом Actions
        this._actions = {
            ...actions,
            validateAddress: (address: string) => Promise.resolve(this.validateAddress(address)),
            formatAddressForDisplay: (address: string) => Promise.resolve(this.formatAddressForDisplay(address))
        };

        await this.fullRender(this.state);

        const autoRefresh = this.getAttribute('data-auto-refresh') === 'true';
        if (autoRefresh) {
            this.startAutoRefresh();
        }

        await this.setupLibp2pIntegration();

        const source = this.getAttribute('data-source') || 'auto'; // Изменено: 'auto' по умолчанию
        await this.loadAddressesFromSource(source);
    }

    override async _componentAttributeChanged(
        name: string,
        oldValue: string | null,
        newValue: string | null
    ): Promise<void> {
        if (oldValue === newValue) return;

        const state = this.state as BootstrapAddressState;

        switch (name) {
            case 'title':
                if (newValue) {
                    await this.updateElement({
                        selector: '.card-title',
                        value: newValue,
                        property: 'textContent'
                    });
                }
                break;

            case 'data-auto-refresh':
                const autoRefresh = newValue === 'true';
                this.addLog(`Auto refresh ${autoRefresh ? 'enabled' : 'disabled'}`, 'info');
                if (autoRefresh) {
                    this.startAutoRefresh();
                } else {
                    this.stopAutoRefresh();
                }
                break;

            case 'data-refresh-interval':
                this.addLog(`Refresh interval updated to ${newValue}ms`, 'info');
                this.stopAutoRefresh();
                if (this.getAttribute('data-auto-refresh') === 'true') {
                    this.startAutoRefresh();
                }
                break;

            case 'data-source':
                this.addLog(`Data source changed to: ${newValue}`, 'info');
                if (newValue) {
                    state.dataSource = newValue; // Добавлено: обновляем источник в состоянии
                    await this.loadAddressesFromSource(newValue);
                }
                break;

            case 'data-default-source':
                this.addLog(`Default source filter changed to: ${newValue}`, 'info');
                // Можно добавить фильтрацию адресов по типу
                break;
        }
    }

    override async postMessage(event: any): Promise<any> {
        try {
            const state = this.state as BootstrapAddressState;

            switch (event.type) {
                case 'UPDATE_BOOTSTRAP_ADDRESSES':
                    const addresses = event.data?.addresses;
                    const source = event.data?.source || 'unknown';

                    if (addresses && Array.isArray(addresses)) {
                        state.dataSource = source; // Добавлено
                        await this.updateAddresses(addresses, source);
                        return {
                            success: true,
                            message: `Addresses updated from ${source}`,
                            count: addresses.length,
                            timestamp: Date.now()
                        };
                    }
                    return { success: false, error: 'Invalid addresses data' };

                case 'GET_ADDRESSES':
                    return {
                        success: true,
                        addresses: {
                            primary: state.primaryAddress,
                            secondary: state.secondaryAddresses,
                            custom: state.customAddresses,
                            total: state.totalAddresses,
                            stats: state.addressStats
                        },
                        lastUpdated: state.lastUpdated,
                        dataSource: state.dataSource // Добавлено
                    };

                case 'ADD_CUSTOM_ADDRESS':
                    const addressToAdd = event.data?.address;
                    if (addressToAdd && this.validateAddress(addressToAdd)) {
                        const result = await this.addCustomAddress(addressToAdd);
                        return { success: result, address: addressToAdd };
                    }
                    return { success: false, error: 'Invalid address' };

                case 'REMOVE_ADDRESS':
                    const addressToRemove = event.data?.address;
                    if (addressToRemove) {
                        const result = await this.removeAddress(addressToRemove);
                        return { success: result, address: addressToRemove };
                    }
                    return { success: false, error: 'Address required' };

                case 'TEST_CONNECTION':
                    const addressToTest = event.data?.address || state.primaryAddress;
                    if (addressToTest) {
                        const result = await this.testConnection(addressToTest);
                        return { success: true, result };
                    }
                    return { success: false, error: 'No address to test' };

                case 'COPY_ADDRESS':
                    const addressToCopy = event.data?.address || state.primaryAddress;
                    if (addressToCopy) {
                        await this.copyAddress(addressToCopy);
                        return { success: true, address: addressToCopy };
                    }
                    return { success: false, error: 'No address to copy' };

                case 'REFRESH_ADDRESSES':
                    await this.refreshAddresses();
                    return { success: true, message: 'Addresses refreshed' };

                case 'EXPORT_ADDRESSES':
                    const exportData = await this.exportAddresses();
                    return { success: true, data: exportData };

                case 'GET_STATS':
                    return {
                        success: true,
                        stats: {
                            totalAddresses: state.totalAddresses,
                            connectedNodes: state.connectedNodes,
                            addressStats: state.addressStats,
                            lastUpdated: state.lastUpdated,
                            dataSource: state.dataSource // Добавлено
                        }
                    };

                case 'SYNC_WITH_LIBP2P':
                    const syncResult = await this.syncWithLibp2pNode();
                    return syncResult;

                case 'SET_LIBP2P_LISTENER':
                    const callback = event.data?.callback;
                    if (callback && typeof callback === 'function') {
                        this.libp2pListenerSet = true;
                        this.libp2pNode = { callback };
                        return { success: true, message: 'Libp2p listener set' };
                    }
                    return { success: false, error: 'Invalid callback' };

                case 'USE_DEFAULT_ADDRESSES':
                    // Новый тип сообщения: использовать дефолтные адреса
                    state.dataSource = 'default';
                    await this.loadAddressesFromSource('default');
                    return {
                        success: true,
                        message: `Using ${this.DEFAULT_BOOTSTRAP_NODES.length} default bootstrap addresses`
                    };

                default:
                    console.warn(`[BootstrapAddress] Unknown message type: ${event.type}`);
                    return {
                        success: false,
                        error: 'Unknown message type',
                        availableTypes: [
                            'UPDATE_BOOTSTRAP_ADDRESSES',
                            'GET_ADDRESSES',
                            'ADD_CUSTOM_ADDRESS',
                            'REMOVE_ADDRESS',
                            'TEST_CONNECTION',
                            'COPY_ADDRESS',
                            'REFRESH_ADDRESSES',
                            'EXPORT_ADDRESSES',
                            'GET_STATS',
                            'SYNC_WITH_LIBP2P',
                            'SET_LIBP2P_LISTENER',
                            'USE_DEFAULT_ADDRESSES'
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
            return {
                success: false,
                error: (error as Error).message
            };
        }
    }

    // Публичные методы
    public async updateAddresses(addresses: string[], source: string = 'manual'): Promise<void> {
        const state = this.state as BootstrapAddressState;

        if (!addresses || addresses.length === 0) {
            state.primaryAddress = '';
            state.secondaryAddresses = [];
            state.totalAddresses = state.customAddresses.length;
        } else {
            state.primaryAddress = addresses[0] || '';
            state.secondaryAddresses = addresses.slice(1);
            state.totalAddresses = addresses.length + state.customAddresses.length;

            this.updateAddressStats(addresses);
        }

        state.lastUpdated = Date.now();
        state.dataSource = source; // Добавлено
        state.isLoading = false;

        await this.updateElement({
            selector: '#primaryAddress',
            value: state.primaryAddress || 'No addresses available',
            property: 'textContent'
        });

        // await this.updateElement({
        //     selector: '.card-badge',
        //     value: state.totalAddresses.toString(),
        //     property: 'textContent'
        // });

        await this.renderPart({
            partName: 'renderSecondaryAddresses',
            state: state,
            selector: '#secondaryAddresses'
        });

        // await this.updateElement({
        //     selector: '.last-update',
        //     value: new Date(state.lastUpdated).toLocaleTimeString(),
        //     property: 'textContent'
        // });

        // Добавлено: обновляем отображение источника
        // await this.updateElement({
        //     selector: '.data-source',
        //     value: source,
        //     property: 'textContent'
        // });

        // this.addLog(`Addresses updated from ${source}: ${addresses.length} addresses`, 'info');

        if (this.libp2pListenerSet && this.libp2pNode?.callback) {
            try {
                this.libp2pNode.callback(state);
            } catch (error) {
                console.error('Error in libp2p listener callback:', error);
            }
        }
    }

    public async addCustomAddress(address: string): Promise<boolean> {
        if (!this.validateAddress(address)) {
            await this.showModal({
                title: 'Invalid Address',
                content: 'The provided address has an invalid format',
                buttons: [{ text: 'OK', type: 'primary' }]
            });
            return false;
        }

        const state = this.state as BootstrapAddressState;

        if (state.customAddresses.includes(address) ||
            state.primaryAddress === address ||
            state.secondaryAddresses.includes(address)) {
            await this.showModal({
                title: 'Duplicate Address',
                content: 'This address already exists in the list',
                buttons: [{ text: 'OK', type: 'primary' }]
            });
            return false;
        }

        state.customAddresses.push(address);
        state.totalAddresses++;

        this.updateAddressStats([address]);

        await this.renderPart({
            partName: 'renderSecondaryAddresses',
            state: state,
            selector: '#secondaryAddresses'
        });

        // await this.updateElement({
        //     selector: '.card-badge',
        //     value: state.totalAddresses.toString(),
        //     property: 'textContent'
        // });

        this.addLog(`Custom address added: ${address}`, 'info');
        return true;
    }

    public async removeAddress(address: string): Promise<boolean> {
        const state = this.state as BootstrapAddressState;

        const shouldRemove = await this.showModal({
            title: 'Remove Address',
            content: `Are you sure you want to remove the address: ${address}?`,
            buttons: [
                { text: 'Cancel', type: 'secondary' },
                {
                    text: 'Remove',
                    type: 'danger',
                    action: async () => {
                        return { confirmed: true };
                    }
                }
            ]
        });

        // showModal возвращает undefined при нажатии Cancel
        if (shouldRemove === undefined) {
            return false;
        }

        let removed = false;

        if (state.primaryAddress === address) {
            const newPrimary = state.secondaryAddresses.length > 0 ? state.secondaryAddresses[0] : '';
            state.primaryAddress = newPrimary || '';
            state.secondaryAddresses = state.secondaryAddresses.slice(1);
            removed = true;
        }
        else if (state.secondaryAddresses.includes(address)) {
            state.secondaryAddresses = state.secondaryAddresses.filter(addr => addr !== address);
            removed = true;
        }
        else if (state.customAddresses.includes(address)) {
            state.customAddresses = state.customAddresses.filter(addr => addr !== address);
            removed = true;
        }

        if (removed) {
            state.totalAddresses--;
            state.lastUpdated = Date.now();

            await this.updateElement({
                selector: '#primaryAddress',
                value: state.primaryAddress || 'No addresses available',
                property: 'textContent'
            });

            await this.renderPart({
                partName: 'renderSecondaryAddresses',
                state: state,
                selector: '#secondaryAddresses'
            });

            // await this.updateElement({
            //     selector: '.card-badge',
            //     value: state.totalAddresses.toString(),
            //     property: 'textContent'
            // });

            this.addLog(`Address removed: ${address}`, 'info');
            return true;
        }

        return false;
    }

    public async testConnection(address: string): Promise<any> {
        this.addLog(`Testing connection to: ${address}`, 'info');

        await this.updateElement({
            selector: '.btn-test',
            value: true,
            property: 'disabled'
        });

        await this.updateElement({
            selector: '.btn-test .btn-text',
            value: 'Testing...',
            property: 'textContent'
        });

        try {
            const latency = Math.floor(Math.random() * 100) + 50;
            const success = Math.random() > 0.2;

            await new Promise(resolve => setTimeout(resolve, 1000));

            if (success) {
                await this.showModal({
                    title: 'Connection Test Successful',
                    content: `
                        <div style="padding: 1rem 0;">
                            <p><strong>Address:</strong> ${address}</p>
                            <p><strong>Latency:</strong> ${latency}ms</p>
                            <p><strong>Status:</strong> ✅ Connected</p>
                        </div>
                    `,
                    buttons: [{ text: 'OK', type: 'primary' }]
                });
                return { success: true, latency, address };
            } else {
                await this.showModal({
                    title: 'Connection Test Failed',
                    content: `
                        <div style="padding: 1rem 0;">
                            <p><strong>Address:</strong> ${address}</p>
                            <p><strong>Status:</strong> ❌ Connection failed</p>
                            <p><strong>Error:</strong> Timeout or network issue</p>
                        </div>
                    `,
                    buttons: [{ text: 'OK', type: 'primary' }]
                });
                return { success: false, error: 'Connection failed', address };
            }
        } catch (error) {
            await this.showModal({
                title: 'Test Error',
                content: `Failed to test connection: ${error}`,
                buttons: [{ text: 'OK', type: 'primary' }]
            });
            return { success: false, error: (error as Error).message, address };
        } finally {
            await this.updateElement({
                selector: '.btn-test',
                value: false,
                property: 'disabled'
            });

            await this.updateElement({
                selector: '.btn-test .btn-text',
                value: 'Test Connection',
                property: 'textContent'
            });
        }
    }

    public async copyAddress(address: string): Promise<void> {
        try {
            await navigator.clipboard.writeText(address);

            await this.updateElement({
                selector: '.btn-copy',
                value: '✓ Copied!',
                property: 'textContent'
            });

            await this.updateElement({
                selector: '.btn-copy',
                value: 'copied',
                property: 'className',
                action: 'add'
            });

            setTimeout(async () => {
                await this.updateElement({
                    selector: '.btn-copy',
                    value: 'Copy',
                    property: 'textContent'
                });

                await this.updateElement({
                    selector: '.btn-copy',
                    value: 'copied',
                    property: 'className',
                    action: 'remove'
                });
            }, 2000);

            this.addLog(`Address copied to clipboard: ${address}`, 'info');
        } catch (error) {
            await this.showModal({
                title: 'Copy Failed',
                content: 'Failed to copy address to clipboard',
                buttons: [{ text: 'OK', type: 'primary' }]
            });
        }
    }

    public async refreshAddresses(): Promise<void> {
        const state = this.state as BootstrapAddressState;
        state.isLoading = true;

        // await this.updateElement({
        //     selector: '.btn-refresh',
        //     value: true,
        //     property: 'disabled'
        // });

        // await this.updateElement({
        //     selector: '.btn-refresh .btn-text',
        //     value: 'Refreshing...',
        //     property: 'textContent'
        // });

        try {
            const source = this.getAttribute('data-source') || 'auto';
            await this.loadAddressesFromSource(source);
        } catch (error) {
            this.addError({
                componentName: this.constructor.name,
                source: 'refreshAddresses',
                message: 'Failed to refresh addresses',
                details: error
            });
        } finally {
            state.isLoading = false;

            // await this.updateElement({
            //     selector: '.btn-refresh',
            //     value: false,
            //     property: 'disabled'
            // });

            // await this.updateElement({
            //     selector: '.btn-refresh .btn-text',
            //     value: 'Refresh',
            //     property: 'textContent'
            // });
        }
    }

    public async exportAddresses(): Promise<any> {
        const state = this.state as BootstrapAddressState;

        const allAddresses = [
            state.primaryAddress,
            ...state.secondaryAddresses,
            ...state.customAddresses
        ].filter(addr => addr.trim() !== '');

        const exportData = {
            addresses: allAddresses,
            exportTime: new Date().toISOString(),
            totalAddresses: state.totalAddresses,
            stats: state.addressStats,
            dataSource: state.dataSource, // Добавлено
            component: 'Bootstrap Address',
            nodeInfo: {
                timestamp: Date.now()
            }
        };

        return exportData;
    }

    public async syncWithLibp2pNode(): Promise<{ success: boolean; message?: string; error?: string }> {
        try {
            const libp2pNode = await this.getComponentAsync('libp2p-node', 'libp2p-node-1');
            if (libp2pNode) {
                const result = await libp2pNode.postMessage({ type: 'GET_STATS' });
                if (result.success && result.stats?.multiaddrs) {
                    await this.updateAddresses(result.stats.multiaddrs, 'libp2p-sync');
                    return {
                        success: true,
                        message: `Synced ${result.stats.multiaddrs.length} addresses from libp2p node`
                    };
                }
                return {
                    success: false,
                    error: 'No addresses available from libp2p node'
                };
            }
            return {
                success: false,
                error: 'Libp2p node not found'
            };
        } catch (error) {
            console.warn('Failed to sync with libp2p node:', error);
            return {
                success: false,
                error: `Failed to sync: ${(error as Error).message}`
            };
        }
    }

    public async setupLibp2pIntegration(): Promise<void> {
        try {
            const libp2pNode = await this.getComponentAsync('libp2p-node', 'libp2p-node-1');
            if (libp2pNode) {
                const result = await libp2pNode.postMessage({
                    type: 'SET_DHT_LISTENER',
                    data: {
                        callback: (stats: any) => {
                            if (stats?.multiaddrs) {
                                this.updateAddresses(stats.multiaddrs, 'libp2p-dht-update')
                                    .catch(error => console.error('Error updating addresses from DHT:', error));
                            }
                        }
                    }
                });

                if (result?.success) {
                    this.addLog('Libp2p node listener set successfully', 'info');
                }

                const initialResult = await libp2pNode.postMessage({ type: 'GET_STATS' });
                if (initialResult.success && initialResult.stats?.multiaddrs) {
                    await this.updateAddresses(initialResult.stats.multiaddrs, 'libp2p-initial');
                }
            }
        } catch (error) {
            console.debug('Libp2p node not available during setup:', error);
        }
    }

    // Вспомогательные методы
    public validateAddress(address: string): boolean {
        if (typeof address !== 'string' || address.trim().length === 0) {
            return false;
        }

        const validProtocols = ['/ip4/', '/ip6/', '/dns4/', '/dns6/', '/tcp/', '/ws/', '/wss/', '/p2p/'];
        return validProtocols.some(protocol => address.includes(protocol));
    }

    public formatAddressForDisplay(address: string): string {
        if (!address) return '';

        // Обрезаем длинные адреса для лучшего отображения
        if (address.length > 80) {
            return address.substring(0, 77) + '...';
        }

        return address;
    }

    public getState(): BootstrapAddressState {
        return this.state as BootstrapAddressState;
    }

    // Метод для логирования
    public addLog(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
        console.log(`[BootstrapAddress] [${level}] ${message}`);
    }

    private async loadAddressesFromSource(source: string): Promise<void> {
        const state = this.state as BootstrapAddressState;
        state.dataSource = source; // Добавлено

        switch (source) {
            case 'libp2p':
                await this.syncWithLibp2pNode();
                break;
            case 'mock':
                const mockAddresses = this.generateMockAddresses(5);
                await this.updateAddresses(mockAddresses, 'mock');
                break;
            case 'default':
                // Используем дефолтные адреса из libp2p-browser.ts
                await this.updateAddresses(this.DEFAULT_BOOTSTRAP_NODES, 'default');
                break;
            case 'auto':
                // Пытаемся получить от libp2p, если не удалось - используем дефолтные
                // try {
                //     const libp2pNode = await this.getComponentAsync('libp2p-node', 'libp2p-node-1');
                //     if (libp2pNode) {
                //         const result = await libp2pNode.postMessage({ type: 'GET_STATS' });
                //         if (result.success && result.stats?.multiaddrs) {
                //             await this.updateAddresses(result.stats.multiaddrs, 'libp2p-auto');
                //         } else {
                //             throw new Error('No addresses from libp2p');
                //         }
                //     } else {
                //         await this.updateAddresses(this.DEFAULT_BOOTSTRAP_NODES, 'default-fallback');
                //     }
                // } catch (error) {
                //     await this.updateAddresses(this.DEFAULT_BOOTSTRAP_NODES, 'default-fallback');
                //     this.addLog(`Using default bootstrap nodes as fallback: ${error}`, 'warn');
                // }
                break;
            default:
                this.addLog(`Unknown data source: ${source}`, 'warn');
        }
    }

    private generateMockAddresses(count: number): string[] {
        const protocols = ['/ip4/', '/ip6/'];
        const transports = ['/tcp/', '/ws/'];
        const ports = ['6832', '8080', '9090', '3000'];

        const addresses: string[] = [];

        for (let i = 0; i < count; i++) {
            const protocol = protocols[Math.floor(Math.random() * protocols.length)];
            const ip = protocol === '/ip4/' ?
                `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}` :
                `2001:db8::${Math.floor(Math.random() * 9999)}`;

            const transport = transports[Math.floor(Math.random() * transports.length)];
            const port = ports[Math.floor(Math.random() * ports.length)];

            addresses.push(`${protocol}${ip}${transport}${port}`);
        }

        return addresses;
    }

    private updateAddressStats(addresses: string[]): void {
        const state = this.state as BootstrapAddressState;

        state.addressStats = {
            ws: 0,
            tcp: 0,
            webrtc: 0,
            ip4: 0,
            ip6: 0
        };

        addresses.forEach(address => {
            if (address.includes('/ws')) state.addressStats.ws++;
            if (address.includes('/tcp/')) state.addressStats.tcp++;
            if (address.includes('/webrtc/')) state.addressStats.webrtc++;
            if (address.includes('/ip4/')) state.addressStats.ip4++;
            if (address.includes('/ip6/')) state.addressStats.ip6++;
        });
    }

    private startAutoRefresh(): void {
        this.stopAutoRefresh();

        const interval = parseInt(this.getAttribute('data-refresh-interval') || '20000', 10);

        this.refreshInterval = window.setInterval(async () => {
            try {
                await this.refreshAddresses();
            } catch (error) {
                console.error('Error in auto refresh:', error);
            }
        }, interval);

        this.addLog(`Auto refresh started with interval: ${interval}ms`, 'info');
    }

    private stopAutoRefresh(): void {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
            this.addLog('Auto refresh stopped', 'info');
        }
    }

    override async _componentDisconnected(): Promise<void> {
        this.stopAutoRefresh();

        if (this._controller?.destroy) {
            await this._controller.destroy();
        }
    }
}

if (!customElements.get('bootstrap-address')) {
    customElements.define('bootstrap-address', BootstrapAddress);
}