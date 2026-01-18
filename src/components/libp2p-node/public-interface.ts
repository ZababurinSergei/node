import { Libp2pBrowserNode } from '../../lib/libp2p/libp2p-browser';
import type { PeerId } from '@libp2p/interface';

export interface DiscoveredPeer {
    peerId: string;
    multiaddrs: string[];
    discoveredAt: number;
    source: string;
    status: 'discovered' | 'connecting' | 'connected' | 'failed' | 'error';
    lastStatusUpdate: number;
    lastAttempt?: number;
    connectionAttempts: number;
}

export interface Libp2pNodeState {
    title: string;
    peerId: string | null;
    status: 'stopped' | 'starting' | 'running' | 'error' | 'stopping';
    connections: number;
    discoveredPeers: number;
    multiaddrs: string[];
    dhtStats: {
        lan: { peerCount: number; status: string };
        amino: { peerCount: number; status: string };
        universe: { peerCount: number; status: string };
    };
    logs: Array<{ time: string; message: string; level: 'info' | 'warn' | 'error' }>;
    connectionStats: {
        totalConnections: number;
        activeConnections: number;
        rejectedConnections: number;
    };
    connectedPeersList?: Array<{
        peerId: string;
        status: string;
        protocols?: string[];
        latency?: number;
        connectionTime?: string;
        addresses?: string[];
    }>;
    metrics?: {
        performanceScore?: number;
        queriesPerSecond?: number;
        successRate?: number;
        avgLatency?: number;
        memoryUsage?: number;
        networkHealth?: number;
    };
    config?: {
        enableDHT?: boolean;
        enablePubSub?: boolean;
        enableRelay?: boolean;
        maxConnections?: number;
        discoveryInterval?: number;
    };
    uptime?: number;
    connectionTrend?: number;
    activePeers?: number;
    connectingPeers?: number;
    failedPeers?: number;
    wsAddresses?: number;
    webrtcAddresses?: number;
    metricsLastUpdate?: string;
}

export interface PeerConnection {
    peerId: string;
    status: string;
    remoteAddr: string;
    streams: Array<{ id: string; protocol: string }>;
}

export interface Libp2pNodePublicInterface {
    // Основные методы управления нодой
    startLibp2pNode(): Promise<boolean>;
    stopLibp2pNode(): Promise<boolean>;
    discoverPeers(): Promise<void>;

    // Публичные геттеры для приватных свойств
    getLibp2pInstance(): Libp2pBrowserNode | null;
    getLogBuffer(): Array<{ time: string; message: string; level: 'info' | 'warn' | 'error' }>;
    getPeerConnections(): Map<string, PeerConnection>;
    getMaxLogs(): number;

    // Методы логирования
    addLogToBuffer(message: string, level: 'info' | 'warn' | 'error'): void;
    clearLogs(): Promise<{ success: boolean }>;

    // Методы для работы с пирами
    pingPeer(peerId: string): Promise<number>;
    disconnectPeer(peerId: string): Promise<void>;
    getDiscoveredPeers(): DiscoveredPeer[];
    getConnectedPeers(): string[];

    // Методы для статистики
    isNodeActive(): boolean;
    isNodeRunning(): boolean;
    getStats(): Libp2pNodeState;
    updateStatsUI(): Promise<void>;
    getNodeStats(): Promise<{ success: boolean; stats?: any; error?: string }>;
    getConnectionStats(): Promise<{ success: boolean; connections?: any[]; error?: string }>;
    getPeerId(): Promise<string | null>;
    getMultiaddrs(): Promise<string[]>;
    getDHTStats(): Promise<any>;
    updateDHTStats(dhtType?: string): Promise<void>;

    // Методы для polling
    startStatsPolling(): void;
    stopStatsPolling(): void;
    startUpdateInterval(): void;
    startAutoDiscovery(): void;
    stopAutoDiscovery(): void;
    startDHTUpdateInterval(): void;
    stopDHTUpdateInterval(): void;

    // UI методы
    updateStatusUI(): Promise<void>;
    updateMultiaddrsUI(): Promise<void>;
    updateConnectionsUI(): Promise<void>;
    updateDHTUI(): Promise<void>;
    showSkeleton(): Promise<void>;
    hideSkeleton(): Promise<void>;

    // Конфигурационные методы
    getConfig(): any;
    applyConfig(config: any): Promise<void>;
    getUptime(): number;

    // Вспомогательные методы для контроллера
    showModal(options: any): Promise<void>;
    updateElement(options: any): Promise<boolean>;
    renderPart(options: any): Promise<boolean>;
    fullRender(state?: Record<string, any>): Promise<boolean>;

    // Методы для событий
    postMessage(event: any): Promise<any>;

    // Методы жизненного цикла
    _componentReady(): Promise<void>;
    _componentAttributeChanged(name: string, oldValue: string | null, newValue: string | null): Promise<void>;
    _componentDisconnected(): Promise<void>;
    _componentAdopted(): Promise<void>;
}

// Вспомогательные типы для действий
export interface ActionResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface StartNodeResult extends ActionResult {
    nodeStarted?: boolean;
}

export interface StopNodeResult extends ActionResult {
    nodeStopped?: boolean;
}

export interface DiscoverPeersResult extends ActionResult {
    discovered?: number;
    newPeers?: string[];
}

export interface PingPeerResult extends ActionResult {
    latency?: number;
    peerId?: string;
}

export interface GetStatsResult extends ActionResult<Libp2pNodeState> {}

export interface GetConnectionsResult extends ActionResult<PeerConnection[]> {}

// Типы для сообщений
export interface PostMessageEvent {
    type: string;
    data?: any;
    source?: string;
}

export type Libp2pMessageType =
    | 'START_NODE'
    | 'STOP_NODE'
    | 'GET_STATS'
    | 'GET_CONNECTIONS'
    | 'DISCOVER_PEERS'
    | 'CLEAR_LOGS'
    | 'GET_PEER_ID'
    | 'GET_MULTIADDRS'
    | 'PING_PEER'
    | 'DISCONNECT_PEER'
    | 'GET_DHT_STATS'
    | 'UPDATE_DISPLAY'
    | 'EXPORT_CONFIG'
    | 'IMPORT_CONFIG';

// Типы для конфигурации
export interface NodeConfig {
    autoStart: boolean;
    enableDHT: boolean;
    enablePubSub: boolean;
    enableRelay: boolean;
    title: string;
    maxConnections?: number;
    discoveryInterval?: number;
    bootstrapNodes?: string[];
}

// Типы для UI событий
export interface UIEvent {
    type: 'click' | 'change' | 'submit' | 'keydown' | 'keyup' | 'contextmenu';
    target: string;
    data?: any;
}

export interface ControllerEventHandlers {
    onStartNode?: () => Promise<void>;
    onStopNode?: () => Promise<void>;
    onDiscoverPeers?: () => Promise<void>;
    onClearLogs?: () => Promise<void>;
    onCopyPeerId?: () => Promise<void>;
    onTestPing?: (peerId: string) => Promise<void>;
    onExportLogs?: () => Promise<void>;
    onToggleDHT?: (enabled: boolean) => Promise<void>;
    onTogglePubSub?: (enabled: boolean) => Promise<void>;
    onToggleRelay?: (enabled: boolean) => Promise<void>;
    onAddBootstrapNode?: (address: string) => Promise<void>;
    onRemoveBootstrapNode?: (address: string) => Promise<void>;
    onRestartNode?: () => Promise<void>;
    onUpdateNodeConfig?: (config: any) => Promise<void>;
}

// Типы для шаблонов
export interface TemplateContext {
    state: Libp2pNodeState;
    context: Libp2pNodePublicInterface;
}

export interface TemplateMethods {
    [key: string]: (params: TemplateContext) => string | Promise<string>;
}

// Типы для контроллера
export interface EventListener {
    element: EventTarget;
    event: string;
    handler: EventListenerOrEventListenerObject;
}

export interface ControllerInterface {
    init(): Promise<void>;
    destroy(): Promise<void>;
    addEventListener(element: EventTarget, event: string, handler: EventListenerOrEventListenerObject): void;
    removeEventListeners(): void;
}

// Экспорт всех типов
export type {
    Libp2pBrowserNode,
    PeerId
};

// Вспомогательные функции для работы с пирами
export function shortenPeerId(peerId: string): string {
    if (!peerId) return 'Unknown';
    if (peerId.length <= 20) return peerId;
    return peerId.substring(0, 10) + '...' + peerId.substring(peerId.length - 10);
}

export function getPeerAvatar(peerId: string): string {
    if (!peerId) return '👤';

    const emojis = ['😀', '😎', '🤖', '👾', '🎮', '💻', '📱', '🌐', '🚀', '⚡'];
    const hash = peerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const index = Math.abs(hash) % emojis.length;
    return emojis[index] || '👤';
}

export function getTrendClass(value: any): string {
    const num = parseFloat(value);
    if (isNaN(num)) return 'neutral';
    return num > 50 ? 'positive' : num < 30 ? 'negative' : 'neutral';
}

export function getTrendArrow(value: any): string {
    const num = parseFloat(value);
    if (isNaN(num)) return '→';
    return num > 50 ? '↗' : num < 30 ? '↘' : '→';
}

// Константы для компонента
export const LIBP2P_NODE_CONSTANTS = {
    MAX_LOGS: 50,
    MAX_CONNECTIONS: 20,
    DEFAULT_DISCOVERY_INTERVAL: 30000,
    DEFAULT_UPDATE_INTERVAL: 10000,
    DEFAULT_DHT_UPDATE_INTERVAL: 15000,
    MAX_CONNECTION_ATTEMPTS: 3,
    STATUS_COLORS: {
        stopped: '#dc3545',
        starting: '#ffc107',
        running: '#28a745',
        error: '#dc3545',
        stopping: '#ffc107'
    },
    LOG_LEVELS: {
        info: '#17a2b8',
        warn: '#ffc107',
        error: '#dc3545'
    }
} as const;

// Типы статусов
export type NodeStatus = 'stopped' | 'starting' | 'running' | 'error' | 'stopping';
export type LogLevel = 'info' | 'warn' | 'error';
export type PeerStatus = 'discovered' | 'connecting' | 'connected' | 'failed' | 'error';
export type DHTType = 'lan' | 'amino' | 'universe';

// Интерфейс для обновлений состояния
export interface StateUpdate {
    type: 'status' | 'stats' | 'logs' | 'peers' | 'dht' | 'config';
    data: any;
    timestamp: number;
}

// Фабрика для создания публичного интерфейса
export function createPublicInterface(nodeInstance: any): Libp2pNodePublicInterface {
    return {
        // Основные методы
        startLibp2pNode: () => nodeInstance.startLibp2pNode(),
        stopLibp2pNode: () => nodeInstance.stopLibp2pNode(),
        discoverPeers: () => nodeInstance.discoverPeers(),

        // Геттеры
        getLibp2pInstance: () => nodeInstance.libp2pInstance,
        getLogBuffer: () => nodeInstance.logBuffer,
        getPeerConnections: () => nodeInstance.peerConnections,
        getMaxLogs: () => nodeInstance.maxLogs,

        // Логирование
        addLogToBuffer: (message, level) => nodeInstance.addLog(message, level),
        clearLogs: () => nodeInstance.clearLogs(),

        // Пиры
        pingPeer: (peerId) => nodeInstance.pingPeer(peerId),
        disconnectPeer: (peerId) => nodeInstance.disconnectPeer(peerId),
        getDiscoveredPeers: () => Array.from(nodeInstance.discoveredPeers?.values() || []),
        getConnectedPeers: () => nodeInstance.getConnectedPeers ? nodeInstance.getConnectedPeers() : [],

        // Статистика
        isNodeActive: () => nodeInstance.libp2pInstance !== null,
        isNodeRunning: () => (nodeInstance.state?.status || 'stopped') === 'running',
        getStats: () => ({ ...nodeInstance.state }),
        updateStatsUI: () => nodeInstance.updateStatsUI(),
        getNodeStats: async () => {
            try {
                if (!nodeInstance.libp2pInstance) {
                    return { success: false, error: 'Node not running' };
                }
                return {
                    success: true,
                    stats: { ...nodeInstance.state }
                };
            } catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : String(error)
                };
            }
        },
        getConnectionStats: async () => {
            try {
                if (!nodeInstance.libp2pInstance) {
                    return { success: false, error: 'Node not running' };
                }
                const connections = Array.from(nodeInstance.peerConnections?.values() || []);
                return { success: true, connections };
            } catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : String(error)
                };
            }
        },
        getPeerId: async () => {
            try {
                if (!nodeInstance.libp2pInstance) {
                    return null;
                }
                return (nodeInstance.libp2pInstance as any).peerId?.toString() || null;
            } catch {
                return null;
            }
        },
        getMultiaddrs: async () => {
            try {
                if (!nodeInstance.libp2pInstance) {
                    return [];
                }
                return (nodeInstance.libp2pInstance as any).getMultiaddrs?.()?.map((ma: any) => ma.toString()) || [];
            } catch {
                return [];
            }
        },
        getDHTStats: async () => {
            try {
                return nodeInstance.updateDHTStats('all');
            } catch {
                return null;
            }
        },
        updateDHTStats: (dhtType) => nodeInstance.updateDHTStats(dhtType),

        // Polling
        startStatsPolling: () => nodeInstance.startUpdateInterval(),
        stopStatsPolling: () => {
            if (nodeInstance.updateInterval) {
                clearInterval(nodeInstance.updateInterval);
                nodeInstance.updateInterval = null;
            }
        },
        startUpdateInterval: () => nodeInstance.startUpdateInterval(),
        startAutoDiscovery: () => nodeInstance.startAutoDiscovery(),
        stopAutoDiscovery: () => nodeInstance.stopAutoDiscovery(),
        startDHTUpdateInterval: () => nodeInstance.startDHTUpdateInterval(),
        stopDHTUpdateInterval: () => nodeInstance.stopDHTUpdateInterval(),

        // UI
        updateStatusUI: () => nodeInstance.updateStatusUI(),
        updateMultiaddrsUI: () => nodeInstance.updateMultiaddrsUI(),
        updateConnectionsUI: () => nodeInstance.updateConnectionsUI(),
        updateDHTUI: () => nodeInstance.updateDHTUI(),
        showSkeleton: () => nodeInstance.showSkeleton(),
        hideSkeleton: () => nodeInstance.hideSkeleton(),

        // Конфигурация
        getConfig: () => nodeInstance.getConfig(),
        applyConfig: (config) => nodeInstance.applyConfig(config),
        getUptime: () => nodeInstance.getUptime(),

        // Вспомогательные методы
        showModal: (options) => nodeInstance.showModal(options),
        updateElement: (options) => nodeInstance.updateElement(options),
        renderPart: (options) => nodeInstance.renderPart(options),
        fullRender: (state) => nodeInstance.fullRender(state),

        // Сообщения
        postMessage: (event) => nodeInstance.postMessage(event),

        // Жизненный цикл
        _componentReady: () => nodeInstance._componentReady(),
        _componentAttributeChanged: (name, oldValue, newValue) =>
            nodeInstance._componentAttributeChanged(name, oldValue, newValue),
        _componentDisconnected: () => nodeInstance._componentDisconnected(),
        _componentAdopted: () => nodeInstance._componentAdopted(),
    };
}