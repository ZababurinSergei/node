import type { NetworkAddresses } from './index';

export interface NetworkAddressesState {
    addresses: string[];
    isLoading: boolean;
    lastUpdated: number;
    peerId?: string;
    nodeStatus?: 'online' | 'offline' | 'error' | 'loading';
    totalAddresses: number;
    addressStats?: {
        ws: number;
        tcp: number;
        webrtc: number;
        ip4: number;
        ip6: number;
    };
    connectionInfo?: {
        libp2pNodeConnected: boolean;
        lastSyncTime?: number; // ОБНОВЛЕНО: сделано опциональным
        syncStatus: 'idle' | 'syncing' | 'success' | 'error';
        errorMessage?: string;
    };
    networkMetrics?: {
        connectionQuality: number;
        latency?: number;
        protocolDistribution: Record<string, number>;
        uptime?: number;
        discoveredPeers?: number;
        activeConnections?: number;
    };
}

export interface NetworkAddressesPublicInterface {
    // Основные методы
    updateAddresses(addresses: string[], source: string): Promise<void>;
    addAddress(address: string): Promise<boolean>;
    removeAddress(address: string): Promise<boolean>;
    copyAddress(address: string): Promise<void>;
    refreshAddresses(): Promise<void>;
    exportAddresses(): Promise<any>;
    syncWithLibp2pNode(force?: boolean): Promise<{ success: boolean; message?: string; error?: string }>; // ОБНОВЛЕНО: добавлен параметр force
    testConnection(address: string): Promise<any>;

    // Валидация
    validateAddress(address: string): boolean;

    // Геттеры
    getState(): NetworkAddressesState;

    // UI методы
    showModal(options: any): Promise<void>;
    updateElement(options: any): Promise<boolean>;
    renderPart(options: any): Promise<boolean>;
    fullRender(state?: Record<string, any>): Promise<boolean>;

    // Сообщения
    postMessage(event: any): Promise<any>;

    // Методы жизненного цикла
    _componentReady(): Promise<void>;
    _componentAttributeChanged(name: string, oldValue: string | null, newValue: string | null): Promise<void>;
    _componentDisconnected(): Promise<void>;
}

// Типы сообщений
export type NetworkAddressesMessageType =
    | 'UPDATE_ADDRESSES'
    | 'GET_ADDRESSES'
    | 'ADD_ADDRESS'
    | 'REMOVE_ADDRESS'
    | 'COPY_ADDRESS'
    | 'REFRESH_ADDRESSES'
    | 'EXPORT_ADDRESSES'
    | 'GET_STATS'
    | 'SYNC_WITH_LIBP2P'
    | 'SET_LIBP2P_LISTENER'
    | 'TEST_CONNECTION';

// Интерфейсы для ответов
export interface AddressesResponse {
    success: boolean;
    addresses?: string[];
    total?: number;
    stats?: {
        ws: number;
        tcp: number;
        webrtc: number;
        ip4: number;
        ip6: number;
    };
    error?: string;
}

export interface ActionResponse {
    success: boolean;
    message?: string;
    error?: string;
    data?: any;
}

// Константы
export const NETWORK_ADDRESSES_CONSTANTS = {
    DEFAULT_REFRESH_INTERVAL: 30000,
    MAX_ADDRESSES: 100,
    VALID_PROTOCOLS: ['/ip4/', '/ip6/', '/dns4/', '/dns6/', '/tcp/', '/ws/', '/wss/', '/p2p/'],
    ADDRESS_TYPES: {
        WS: 'ws',
        TCP: 'tcp',
        WEBRTC: 'webrtc',
        IP4: 'ip4',
        IP6: 'ip6'
    } as const
};

// Вспомогательные функции
export function formatAddressForDisplay(address: string, maxLength: number = 80): string {
    if (!address) return '';

    if (address.length > maxLength) {
        return address.substring(0, maxLength - 3) + '...';
    }

    return address;
}

export function getAddressProtocol(address: string): string {
    if (!address) return 'unknown';

    const protocols = NETWORK_ADDRESSES_CONSTANTS.VALID_PROTOCOLS;
    for (const protocol of protocols) {
        if (address.includes(protocol)) {
            // Удаляем слэши с начала и конца
            return protocol.replace(/^\//, '').replace(/\/$/, '');
        }
    }

    return 'unknown';
}

export function getProtocolIcon(address: string): string {
    const protocol = getAddressProtocol(address);

    const icons: Record<string, string> = {
        ip4: '🌐',
        ip6: '🌍',
        tcp: '🔌',
        ws: '⚡',
        wss: '🔒',
        p2p: '👥',
        dns4: '📡',
        dns6: '📡',
        unknown: '❓'
    };

    const icon = icons[protocol];
    return icon || icons.unknown || '❓';
}

// Фабрика для публичного интерфейса
export function createPublicInterface(instance: NetworkAddresses): NetworkAddressesPublicInterface {
    return {
        updateAddresses: (addresses, source) => instance.updateAddresses(addresses, source),
        addAddress: (address) => instance.addAddress(address),
        removeAddress: (address) => instance.removeAddress(address),
        copyAddress: (address) => instance.copyAddress(address),
        refreshAddresses: () => instance.refreshAddresses(),
        exportAddresses: () => instance.exportAddresses(),
        syncWithLibp2pNode: (force = false) => instance.syncWithLibp2pNode(force), // ОБНОВЛЕНО: передача параметра force
        testConnection: (address) => instance.testConnection(address),
        validateAddress: (address) => instance.validateAddress(address),
        getState: () => instance.getState(),
        showModal: (options) => instance.showModal(options),
        updateElement: (options) => instance.updateElement(options),
        renderPart: (options) => instance.renderPart(options),
        fullRender: (state) => instance.fullRender(state),
        postMessage: (event) => instance.postMessage(event),
        _componentReady: () => instance._componentReady(),
        _componentAttributeChanged: (name, oldValue, newValue) =>
            instance._componentAttributeChanged(name, oldValue, newValue),
        _componentDisconnected: () => instance._componentDisconnected()
    };
}