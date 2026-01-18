import type { BootstrapAddress } from './index';

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
}

export interface BootstrapAddressPublicInterface {
    // Основные методы
    updateAddresses(addresses: string[], source: string): Promise<void>;
    addCustomAddress(address: string): Promise<boolean>;
    removeAddress(address: string): Promise<boolean>;
    testConnection(address: string): Promise<any>;
    copyAddress(address: string): Promise<void>;
    refreshAddresses(): Promise<void>;
    syncWithLibp2pNode(): Promise<{ success: boolean; message?: string; error?: string }>;

    // Валидация
    validateAddress(address: string): boolean;

    // Геттеры
    getState(): BootstrapAddressState;

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
export type BootstrapAddressMessageType =
    | 'UPDATE_BOOTSTRAP_ADDRESSES'
    | 'GET_ADDRESSES'
    | 'ADD_CUSTOM_ADDRESS'
    | 'REMOVE_ADDRESS'
    | 'TEST_CONNECTION'
    | 'COPY_ADDRESS'
    | 'REFRESH_ADDRESSES'
    | 'EXPORT_ADDRESSES'
    | 'GET_STATS'
    | 'SYNC_WITH_LIBP2P';

// Интерфейсы для ответов
export interface AddressesResponse {
    success: boolean;
    addresses?: {
        primary: string;
        secondary: string[];
        custom: string[];
        total: number;
        stats: {
            ws: number;
            tcp: number;
            webrtc: number;
            ip4: number;
            ip6: number;
        };
    };
    error?: string;
}

export interface StatsResponse {
    success: boolean;
    stats?: {
        totalAddresses: number;
        connectedNodes: number;
        addressStats: {
            ws: number;
            tcp: number;
            webrtc: number;
            ip4: number;
            ip6: number;
        };
        lastUpdated: number;
    };
    error?: string;
}

export interface ActionResponse {
    success: boolean;
    message?: string;
    error?: string;
    data?: any;
}

// Константы для компонента
export const BOOTSTRAP_ADDRESS_CONSTANTS = {
    DEFAULT_REFRESH_INTERVAL: 20000,
    MAX_ADDRESSES: 50,
    VALID_PROTOCOLS: ['/ip4/', '/ip6/', '/dns4/', '/dns6/', '/tcp/', '/ws/', '/wss/', '/p2p/'],
    STATUS_COLORS: {
        online: '#28a745',
        offline: '#dc3545',
        loading: '#ffc107',
        error: '#dc3545'
    },
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

export function extractAddressProtocol(address: string): string {
    if (!address) return '';

    const protocols = BOOTSTRAP_ADDRESS_CONSTANTS.VALID_PROTOCOLS;
    for (const protocol of protocols) {
        if (address.includes(protocol)) {
            return protocol.replace(/\//g, '');
        }
    }

    return 'unknown';
}

export function getProtocolIcon(address: string): string {
    const protocol = extractAddressProtocol(address);

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
export function createPublicInterface(instance: BootstrapAddress): BootstrapAddressPublicInterface {
    return {
        updateAddresses: (addresses, source) => instance.updateAddresses(addresses, source),
        addCustomAddress: (address) => instance.addCustomAddress(address),
        removeAddress: (address) => instance.removeAddress(address),
        testConnection: (address) => instance.testConnection(address),
        copyAddress: (address) => instance.copyAddress(address),
        refreshAddresses: () => instance.refreshAddresses(),
        syncWithLibp2pNode: () => instance.syncWithLibp2pNode(),
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

// Типы для интеграции с другими компонентами
export interface Libp2pIntegration {
    getMultiaddrs?: () => Promise<string[]>;
    subscribeToMultiaddrsUpdates?: (callback: (addresses: string[]) => void) => void;
}

export interface IntegrationOptions {
    autoSync?: boolean;
    syncInterval?: number;
    onAddressesUpdated?: (addresses: string[]) => void;
    onError?: (error: Error) => void;
}

// Утилиты для работы с адресами
export function validateMultiaddress(address: string): boolean {
    if (typeof address !== 'string' || address.trim().length === 0) {
        return false;
    }

    // Базовые проверки формата multiaddress
    if (!address.startsWith('/')) {
        return false;
    }

    // Проверяем наличие хотя бы одного валидного протокола
    return BOOTSTRAP_ADDRESS_CONSTANTS.VALID_PROTOCOLS.some(protocol => address.includes(protocol));
}

export function parseMultiaddress(address: string): {
    protocol: string;
    value: string;
    port?: number;
    transport?: string;
} | null {
    if (!validateMultiaddress(address)) {
        return null;
    }

    try {
        const parts = address.split('/').filter(part => part.trim() !== '');
        const result: any = {};

        for (let i = 0; i < parts.length; i += 2) {
            const protocol = parts[i];
            const value = parts[i + 1];

            if (protocol === 'ip4' || protocol === 'ip6') {
                result.protocol = protocol;
                result.value = value;
            } else if (protocol === 'tcp' || protocol === 'udp') {
                if (value) {
                    result.port = parseInt(value, 10);
                }
                result.transport = protocol;
            } else if (protocol === 'ws' || protocol === 'wss') {
                result.transport = protocol;
            } else if (protocol === 'p2p') {
                result.peerId = value;
            }
        }

        return result;
    } catch {
        return null;
    }
}

export function compareAddresses(address1: string, address2: string): boolean {
    return address1 === address2 ||
        parseMultiaddress(address1)?.value === parseMultiaddress(address2)?.value;
}