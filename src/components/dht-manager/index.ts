import { BaseComponent } from '@/base/base-component';
import * as template from './template/index';
import { controller } from './controller/index';
import { createActions } from './actions/index';

const log = console.log;

export interface DHTInstanceStats {
    type: string;
    peerCount: number;
    routingTableSize: number;
    queries: {
        total: number;
        successful: number;
        failed: number;
        pending: number;
    };
    records: {
        stored: number;
        provided: number;
        received: number;
    };
    buckets: {
        total: number;
        full: number;
        depth: number;
    };
    network: {
        closestPeers: string[];
        knownPeers: number;
    };
    status: string;
    lastActivity: number | null;
    metrics: {
        queryLatency: number;
        successRate: number;
        peersPerBucket: number;
    };
    dataQuality: {
        score: number;
        issues: string[];
        lastValidated: number | null;
        status: string;
    };
}

export interface DHTStats {
    lan: DHTInstanceStats;
    amino: DHTInstanceStats;
    universe: DHTInstanceStats;
    summary: {
        totalPeers: number;
        totalQueries: number;
        totalRecords: number;
        activeDHTs: number;
        overallHealth: string;
        dataQuality: number;
    };
    lastUpdated: number;
    [key: string]: any;
}

export interface DHTManagerState {
    dhtStats: DHTStats;
    bucketsInfo: {
        lan: any | null;
        amino: any | null;
        universe: any | null;
    };
    activeDHTType: string;
    dhtStatsUpdated: boolean;
    connectionStatus: string;
    sseConnectionState: string;
    dataQuality: {
        score: number;
        lastValidation: number | null;
        issues: string[];
        status: string;
    };
}

export class DHTManager extends BaseComponent {
    static override observedAttributes = ['data-auto-refresh', 'data-default-type'];

    constructor() {
        super();
        this._templateMethods = {
            defaultTemplate: template.defaultTemplate,
            renderDHTStats: (params: { state: Record<string, any>; context: BaseComponent }) =>
                template.renderDHTStats({ state: params.state, context: params.context }),
            renderBucketInfo: (params: { state: Record<string, any>; context: BaseComponent }) =>
                template.renderBucketInfo({ state: params.state, context: params.context }),
            renderAPIResponse: (params: { state: Record<string, any>; context: BaseComponent }) =>
                template.renderAPIResponse({ state: params.state, context: params.context }),
        };
        this.state = this.initializeState();
    }

    /**
     * Инициализирует состояние компонента
     */
    initializeState(): DHTManagerState {
        return {
            dhtStats: {
                lan: this.createEmptyDHTStats('lan'),
                amino: this.createEmptyDHTStats('amino'),
                universe: this.createEmptyDHTStats('universe'),
                summary: {
                    totalPeers: 0,
                    totalQueries: 0,
                    totalRecords: 0,
                    activeDHTs: 0,
                    overallHealth: 'unknown',
                    dataQuality: 0
                },
                lastUpdated: Date.now()
            },
            bucketsInfo: {
                lan: null,
                amino: null,
                universe: null
            },
            activeDHTType: 'all',
            dhtStatsUpdated: false,
            connectionStatus: 'disconnected',
            sseConnectionState: 'disconnected',
            dataQuality: {
                score: 0,
                lastValidation: null,
                issues: [],
                status: 'unknown'
            }
        };
    }

    /**
     * Создает пустую структуру статистики DHT
     */
    createEmptyDHTStats(type: string, status = 'stopped'): DHTInstanceStats {
        return {
            type: type,
            peerCount: 0,
            routingTableSize: 0,
            queries: {
                total: 0,
                successful: 0,
                failed: 0,
                pending: 0
            },
            records: {
                stored: 0,
                provided: 0,
                received: 0
            },
            buckets: {
                total: 0,
                full: 0,
                depth: 0
            },
            network: {
                closestPeers: [],
                knownPeers: 0
            },
            status: status,
            lastActivity: null,
            metrics: {
                queryLatency: 0,
                successRate: 0,
                peersPerBucket: 0
            },
            dataQuality: {
                score: 0,
                issues: [],
                lastValidated: null,
                status: 'unknown'
            }
        };
    }

    /**
     * Визуализирует K-бакеты DHT
     */
    visualizeBuckets(kb: any, dhtType: string = 'DHT'): void {
        console.log(`\n📊 === ВИЗУАЛИЗАЦИЯ K-БАКЕТОВ (${dhtType}) ===`);

        function printBucket(bucket: any, indent: string = '', isLast: boolean = true) {
            const marker = isLast ? '└── ' : '├── ';

            if (bucket.peers) {
                // Листовой бакет
                const fillPercentage = (bucket.peers.length / kb.kBucketSize) * 100;
                const fillBar = '█'.repeat(Math.floor(fillPercentage / 10)) +
                    '░'.repeat(10 - Math.floor(fillPercentage / 10));

                console.log(`${indent}${marker}📂 Префикс: "${bucket.prefix || 'root'}"`);
                console.log(`${indent}    Тип: ${dhtType}`);
                console.log(`${indent}    Глубина: ${bucket.depth || 0}`);
                console.log(`${indent}    Заполненность: ${bucket.peers.length}/${kb.kBucketSize}`);
                console.log(`${indent}    ${fillBar} ${fillPercentage.toFixed(1)}%`);

                // Список пиров (первые 3)
                if (bucket.peers.length > 0) {
                    console.log(`${indent}    Пиры (первые 3):`);
                    bucket.peers.slice(0, 3).forEach((peer: any, i: number) => {
                        const age = peer.lastPing ? Math.floor((Date.now() - peer.lastPing) / 1000) : 'unknown';
                        const peerIdStr = peer.peerId?.toString() || 'unknown';
                        console.log(`${indent}      ${i+1}. ${peerIdStr.slice(-8)} (возраст: ${age}с)`);
                    });
                    if (bucket.peers.length > 3) {
                        console.log(`${indent}      ... и еще ${bucket.peers.length - 3} пиров`);
                    }
                }
            } else {
                // Внутренний узел
                console.log(`${indent}${marker}📁 Узел: "${bucket.prefix || 'root'}"`);
                console.log(`${indent}    Тип: ${dhtType}`);

                // Рекурсивно обходим детей
                const newIndent = indent + (isLast ? '    ' : '│   ');

                if (bucket.left) printBucket(bucket.left, newIndent, !bucket.right);
                if (bucket.right) printBucket(bucket.right, newIndent, true);
            }
        }

        if (kb.root) {
            printBucket(kb.root);
        }

        // Сводная статистика
        console.log(`\n📈 === СВОДНАЯ СТАТИСТИКА (${dhtType}) ===`);

        try {
            const allPeers = Array.from(kb.toIterable ? kb.toIterable() : []);
            const totalPeers = allPeers.length;
            const maxPeers = Math.pow(2, kb.prefixLength) * kb.kBucketSize;
            const fillPercentage = maxPeers > 0 ? (totalPeers / maxPeers) * 100 : 0;

            console.log(`Всего пиров: ${totalPeers}`);
            console.log(`Максимальная емкость: ${maxPeers}`);
            console.log(`Заполненность сети: ${fillPercentage.toFixed(2)}%`);
            console.log(`Размер бакета (K): ${kb.kBucketSize}`);
            console.log(`Длина префикса: ${kb.prefixLength}`);

        } catch (error) {
            console.log(`❌ Ошибка расчета статистики: ${error}`);
        }
    }

    /**
     * Визуализирует все доступные DHT
     */
    private visualizeAllDHTs(services: any): void {
        const dhtTypes = {
            'amino': 'aminoDHT',
            'lan': 'lanDHT',
            'universe': 'universeDHT'
        };

        // console.log('\n📊 === ВИЗУАЛИЗАЦИЯ ВСЕХ K-БАКЕТОВ ===\n');

        for (const [displayName, serviceName] of Object.entries(dhtTypes)) {
            const dhtInstance = services[serviceName as keyof typeof services];

            if (dhtInstance?.routingTable?.kb) {
                // console.log(`\n🌐 === ${displayName.toUpperCase()} DHT ===`);
                // this.visualizeBuckets(dhtInstance.routingTable.kb, displayName);
            } else {
                console.log(`ℹ️ ${displayName} DHT не доступен для визуализации`);
            }
        }

        // console.log('\n✅ Визуализация всех DHT завершена');
    }

    /**
     * Собирает статистику для конкретного DHT
     */
    private async collectDHTStats(dhtType: string, dhtInstance: any): Promise<DHTInstanceStats> {
        try {
            const stats: DHTInstanceStats = {
                type: dhtType,
                peerCount: 0,
                routingTableSize: 0,
                queries: { total: 0, successful: 0, failed: 0, pending: 0 },
                records: { stored: 0, provided: 0, received: 0 },
                buckets: { total: 0, full: 0, depth: 0 },
                network: { closestPeers: [], knownPeers: 0 },
                status: 'running',
                lastActivity: Date.now(),
                metrics: { queryLatency: 0, successRate: 0, peersPerBucket: 0 },
                dataQuality: { score: 0, issues: [], lastValidated: null, status: 'unknown' }
            };

            // Получаем информацию о routing table
            if (dhtInstance.routingTable) {
                try {
                    // Получаем количество пиров
                    stats.peerCount = dhtInstance.routingTable.size || 0;
                    stats.routingTableSize = stats.peerCount;

                    // Получаем информацию о бакетах
                    if (dhtInstance.routingTable.kb) {
                        const allPeers = Array.from(dhtInstance.routingTable.kb.toIterable?.() || []);
                        stats.peerCount = allPeers.length;

                        // Рассчитываем метрики
                        const totalBuckets = Math.pow(2, dhtInstance.routingTable.kb.prefixLength) || 20;
                        const avgPeersPerBucket = stats.peerCount > 0 ? stats.peerCount / totalBuckets : 0;

                        stats.buckets = {
                            total: totalBuckets,
                            full: Math.floor(stats.peerCount / (dhtInstance.routingTable.kb.kBucketSize || 20)),
                            depth: dhtInstance.routingTable.kb.prefixLength || 0
                        };

                        stats.metrics.peersPerBucket = avgPeersPerBucket;
                    }

                } catch (rtError) {
                    console.error(`❌ Ошибка получения routing table для ${dhtType}:`, rtError);
                }
            }

            // Получаем метрики запросов если доступны
            if (dhtInstance.metrics) {
                try {
                    stats.metrics.queryLatency = dhtInstance.metrics.averageLatency || 0;
                    stats.metrics.successRate = dhtInstance.metrics.successRate || 0;
                } catch (metricsError) {
                    console.error(`❌ Ошибка получения метрик для ${dhtType}:`, metricsError);
                }
            }

            // Рассчитываем качество данных
            stats.dataQuality = this.calculateDataQuality(stats);

            return stats;

        } catch (error) {
            console.error(`❌ Ошибка сбора статистики для ${dhtType}:`, error);
            return this.createEmptyDHTStats(dhtType, 'error');
        }
    }

    /**
     * Рассчитывает качество данных DHT
     */
    private calculateDataQuality(instanceStats: DHTInstanceStats): DHTInstanceStats['dataQuality'] {
        let score = 100;
        const issues: string[] = [];

        if (instanceStats.queries.total < instanceStats.queries.successful + instanceStats.queries.failed) {
            score -= 20;
            issues.push('Total queries less than sum of successful + failed');
        }

        if (instanceStats.status === 'running' &&
            instanceStats.peerCount === 0 &&
            instanceStats.queries.total === 0) {
            score -= 30;
            issues.push('Running DHT with no peers or queries');
        }

        if (instanceStats.metrics.successRate > 100 || instanceStats.metrics.successRate < 0) {
            score -= 15;
            issues.push('Invalid success rate value');
        }

        if (instanceStats.peerCount < 0 || instanceStats.queries.total < 0) {
            score -= 25;
            issues.push('Negative values detected');
        }

        return {
            score: Math.max(0, score),
            issues: issues,
            lastValidated: Date.now(),
            status: score >= 80 ? 'good' : score >= 60 ? 'fair' : 'poor'
        };
    }

    /**
     * Рассчитывает summary статистику для всех DHT
     */
    private calculateSummary(stats: DHTStats): DHTStats['summary'] {
        const activeDHTs = ['lan', 'amino', 'universe'].filter(
            type => stats[type]?.status === 'running'
        ).length;

        const totalPeers = ['lan', 'amino', 'universe'].reduce(
            (sum, type) => sum + (stats[type]?.peerCount || 0), 0
        );

        const totalQueries = ['lan', 'amino', 'universe'].reduce(
            (sum, type) => sum + (stats[type]?.queries?.total || 0), 0
        );

        const totalRecords = ['lan', 'amino', 'universe'].reduce(
            (sum, type) => sum + (stats[type]?.records?.stored || 0), 0
        );

        return {
            totalPeers: totalPeers,
            totalQueries: totalQueries,
            totalRecords: totalRecords,
            activeDHTs: activeDHTs,
            overallHealth: this.calculateOverallHealth(stats),
            dataQuality: this.calculateSummaryDataQuality(stats)
        };
    }

    /**
     * Рассчитывает общее состояние здоровья DHT
     */
    private calculateOverallHealth(stats: DHTStats): string {
        const activeDHTs = ['lan', 'amino', 'universe'].filter(type =>
            stats[type]?.status === 'running'
        ).length;

        if (activeDHTs === 0) return 'critical';
        if (activeDHTs === 3) return 'excellent';
        if (activeDHTs >= 2) return 'good';
        return 'fair';
    }

    /**
     * Рассчитывает общее качество данных
     */
    private calculateSummaryDataQuality(stats: DHTStats): number {
        const scores = ['lan', 'amino', 'universe']
            .map(type => stats[type]?.dataQuality?.score || 0)
            .filter(score => score > 0);

        if (scores.length === 0) return 0;
        return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }

    /**
     * Обновляет общее качество данных
     */
    private updateOverallDataQuality(stats: DHTStats): void {
        const dhtTypes = ['lan', 'amino', 'universe'];
        const qualityScores = dhtTypes
            .map(type => stats[type]?.dataQuality?.score || 0)
            .filter(score => score > 0);

        const avgScore = qualityScores.length > 0
            ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
            : 0;

        const state = this.state as DHTManagerState;
        state.dataQuality = {
            score: Math.round(avgScore),
            lastValidation: Date.now(),
            issues: dhtTypes.flatMap(type =>
                (stats[type]?.dataQuality?.issues || []).map((issue: string) => `${type}: ${issue}`)
            ),
            status: avgScore >= 80 ? 'good' : avgScore >= 60 ? 'fair' : 'poor'
        };
    }

    override async _componentReady(): Promise<void> {
        await this.fullRender(this.state);
        this._controller = await controller(this);
        this._actions = await createActions(this);

        this.refreshData('all').catch(e => {console.error('error: ', e)});

        // Установка типа по умолчанию
        // const defaultType = this.getAttribute('data-default-type');
        // if (defaultType && ['all', 'lan', 'amino', 'universe'].includes(defaultType)) {
        //     (this.state as DHTManagerState).activeDHTType = defaultType;
        //     await this.switchDHTType(defaultType);
        // }
    }

    /**
     * Обновляет данные DHT
     */
    async refreshData(type: 'amino' | 'all' | 'lan' | 'universe'): Promise<void> {
        try {
            const libp2pNode = await this.getComponentAsync('libp2p-node', 'libp2p-node-1');

            if ((libp2pNode as any)?.libp2pInstance?.libp2p?.services) {
                const services = (libp2pNode as any).libp2pInstance.libp2p.services;

                // Определяем какие DHT нужно обновить
                const dhtConfig = {
                    'all': {
                        services: ['aminoDHT', 'lanDHT', 'universeDHT'],
                        types: ['amino', 'lan', 'universe']
                    },
                    'amino': {
                        services: ['aminoDHT'],
                        types: ['amino']
                    },
                    'lan': {
                        services: ['lanDHT'],
                        types: ['lan']
                    },
                    'universe': {
                        services: ['universeDHT'],
                        types: ['universe']
                    }
                };

                const config = dhtConfig[type];
                const state = this.state as DHTManagerState;

                // Обновляем каждый выбранный DHT
                for (let i = 0; i < config.services.length; i++) {
                    const serviceName = config.services[i];
                    const dhtType = config.types[i];
                    const dhtInstance = services[serviceName as keyof typeof services];
                    if (dhtInstance) {
                        try {
                            // Визуализация бакетов (только для отладки)
                            if (dhtInstance.routingTable?.kb) {
                                if (type === 'all') {
                                    // Для режима 'all' используем общую визуализацию
                                    if (i === 0) this.visualizeAllDHTs(services);
                                } else {
                                    // this.visualizeBuckets(dhtInstance.routingTable.kb, dhtType);
                                }
                            }

                            // Собираем статистику
                            const stats = await this.collectDHTStats(dhtType!, dhtInstance);
                            state.dhtStats[dhtType!] = stats;

                        } catch (dhtError) {
                            console.error(`❌ Ошибка обработки ${serviceName}:`, dhtError);
                            state.dhtStats[dhtType!] = this.createEmptyDHTStats(dhtType!, 'error');
                        }
                    } else {
                        state.dhtStats[dhtType!] = this.createEmptyDHTStats(dhtType!, 'stopped');
                    }
                }

                // Обновляем summary
                state.dhtStats.summary = this.calculateSummary(state.dhtStats);
                state.dhtStats.lastUpdated = Date.now();

                // Обновляем общее качество данных
                this.updateOverallDataQuality(state.dhtStats);

                // Обновляем UI
                await this.updateDHTDisplay();

                // console.log(`✅ DHT данные обновлены для типа: ${type}`);
            } else {
                await this.generateMockDHTStats();
            }

        } catch (error) {
            console.error('❌ Error refreshing DHT data:', error);

            // Показываем ошибку пользователю
            await this.showModal({
                title: 'Ошибка обновления DHT',
                content: `Не удалось обновить данные DHT: ${error}`,
                buttons: [{ text: 'Закрыть', type: 'primary' }]
            });
        }
    }

    /**
     * Обработчик обновления статистики DHT
     */
    handleDHTStatsUpdate(data: any): void {
        try {
            if (data.stats) {
                // Обновляем состояние соединения
                const state = this.state as DHTManagerState;
                state.connectionStatus = 'connected';
                state.sseConnectionState = 'active';

                // Обрабатываем и нормализуем данные
                const processedData = this.processDHTStatsData(data.stats);

                state.dhtStats = processedData;
                state.dhtStatsUpdated = true;

                // Обновляем общее качество данных
                this.updateOverallDataQuality(processedData);

                // Обновляем UI через postMessage
                this.postMessage({
                    type: 'UPDATE_DISPLAY',
                    data: { stats: processedData }
                });

                // Логируем успешное обновление
                this.logStatsUpdate(processedData);
            }
        } catch (dhtError) {
            console.error('❌ Error processing DHT SSE:', dhtError);
            this.handleDataProcessingError(dhtError as Error, data);
        }
    }

    /**
     * Обработка и нормализация данных статистики
     */
    processDHTStatsData(stats: any): DHTStats {
        const processed: DHTStats = { ...stats } as DHTStats;

        // Нормализуем данные для каждого типа DHT
        ['lan', 'amino', 'universe'].forEach(type => {
            if (processed[type]) {
                processed[type] = this.normalizeDHTInstanceStats(processed[type]);
            }
        });

        // Обновляем summary
        processed.summary = this.calculateSummary(processed);
        processed.lastUpdated = Date.now();

        return processed;
    }

    /**
     * Нормализация статистики отдельного экземпляра DHT
     */
    normalizeDHTInstanceStats(instanceStats: any): DHTInstanceStats {
        const normalized: DHTInstanceStats = {
            ...instanceStats,
            peerCount: Math.max(0, parseInt(instanceStats.peerCount) || 0),
            routingTableSize: Math.max(0, parseInt(instanceStats.routingTableSize) || 0),
            queries: {
                total: Math.max(0, parseInt(instanceStats.queries?.total) || 0),
                successful: Math.max(0, parseInt(instanceStats.queries?.successful) || 0),
                failed: Math.max(0, parseInt(instanceStats.queries?.failed) || 0),
                pending: Math.max(0, parseInt(instanceStats.queries?.pending) || 0)
            },
            records: {
                stored: Math.max(0, parseInt(instanceStats.records?.stored) || 0),
                provided: Math.max(0, parseInt(instanceStats.records?.provided) || 0),
                received: Math.max(0, parseInt(instanceStats.records?.received) || 0)
            },
            buckets: {
                total: Math.max(0, parseInt(instanceStats.buckets?.total) || 0),
                full: Math.max(0, parseInt(instanceStats.buckets?.full) || 0),
                depth: Math.max(0, parseInt(instanceStats.buckets?.depth) || 0)
            },
            metrics: {
                queryLatency: Math.max(0, parseFloat(instanceStats.metrics?.queryLatency) || 0),
                successRate: Math.max(0, Math.min(100, parseFloat(instanceStats.metrics?.successRate) || 0)),
                peersPerBucket: Math.max(0, parseFloat(instanceStats.metrics?.peersPerBucket) || 0)
            },
            dataQuality: {
                score: 0,
                issues: [],
                lastValidated: null,
                status: 'unknown'
            }
        };

        // Добавляем оценку качества данных
        normalized.dataQuality = this.calculateDataQuality(normalized);

        return normalized;
    }

    logStatsUpdate(stats: DHTStats): void {
        const summary = stats.summary;
        const state = this.state as DHTManagerState;
        log('✅ DHT Stats Updated:', {
            totalPeers: summary.totalPeers,
            totalQueries: summary.totalQueries,
            activeDHTs: summary.activeDHTs,
            overallHealth: summary.overallHealth,
            dataQuality: state.dataQuality.score,
            timestamp: new Date(stats.lastUpdated).toLocaleTimeString()
        });
    }

    /**
     * Обработка ошибок обработки данных
     */
    handleDataProcessingError(error: Error, data: any): void {
        console.error('❌ Data processing error:', error);

        // Создаем структуру данных по умолчанию при ошибке
        const state = this.state as DHTManagerState;
        state.dhtStats = {
            lan: this.createEmptyDHTStats('lan', 'error'),
            amino: this.createEmptyDHTStats('amino', 'error'),
            universe: this.createEmptyDHTStats('universe', 'error'),
            summary: {
                totalPeers: 0,
                totalQueries: 0,
                totalRecords: 0,
                activeDHTs: 0,
                overallHealth: 'error',
                dataQuality: 0
            },
            lastUpdated: Date.now()
        };

        state.dataQuality = {
            score: 0,
            lastValidation: Date.now(),
            issues: [`Data processing error: ${error.message}`],
            status: 'error'
        };

        this.addError({
            componentName: 'DHTManager',
            source: 'handleDHTStatsUpdate',
            message: `Ошибка обработки данных DHT: ${error.message}`,
            details: { error, originalData: data }
        });
    }

    override async postMessage(event: any): Promise<any> {
        try {
            const state = this.state as DHTManagerState;

            switch (event.type) {
                case 'REFRESH_STATS':
                    await this.refreshData('all');
                    return { success: true, message: 'DHT stats refresh initiated' };
                case 'GET_STATS':
                    return {
                        success: true,
                        stats: state.dhtStats,
                        state: this.state
                    };

                case 'GET_BUCKETS':
                    const dhtType = event.data?.type || 'lan';
                    if (dhtType === 'all') {
                        const buckets = ['lan', 'amino', 'universe'].map(type => ({
                            type: type,
                            totalBuckets: 10,
                            fullBuckets: Math.floor(Math.random() * 3),
                            totalPeers: state.dhtStats[type]?.peerCount || 0,
                            averagePeersPerBucket: Math.round((state.dhtStats[type]?.peerCount || 0) / 10),
                            routingTableDepth: 5
                        }));
                        return { success: true, buckets: buckets };
                    } else {
                        const bucketInfo = {
                            totalBuckets: 10,
                            fullBuckets: Math.floor(Math.random() * 3),
                            totalPeers: state.dhtStats[dhtType]?.peerCount || 0,
                            averagePeersPerBucket: Math.round((state.dhtStats[dhtType]?.peerCount || 0) / 10),
                            routingTableDepth: 5,
                            metrics: {
                                successRate: state.dhtStats[dhtType]?.metrics?.successRate || '0%'
                            },
                            buckets: Array.from({ length: 10 }, (_, i) => ({
                                index: i,
                                size: Math.floor(Math.random() * 5),
                                capacity: 20,
                                full: false,
                                peers: []
                            }))
                        };
                        return { success: true, buckets: bucketInfo };
                    }

                case 'FIND_PEER':
                    const peerId = event.data?.peerId;
                    const findDHTType = event.data?.dhtType || 'all';
                    if (!peerId) {
                        return { success: false, error: 'Peer ID required' };
                    }
                    return {
                        success: true,
                        result: {
                            status: true,
                            results: [
                                {
                                    success: Math.random() > 0.5,
                                    peerId: peerId,
                                    addresses: ['/ip4/127.0.0.1/tcp/4001/p2p/' + peerId],
                                    metadata: { foundIn: findDHTType }
                                }
                            ]
                        }
                    };

                case 'FIND_PROVIDERS':
                    const cid = event.data?.cid;
                    const maxProviders = event.data?.maxProviders || 20;
                    if (!cid) {
                        return { success: false, error: 'CID required' };
                    }
                    // Возвращаем mock-данные для браузерной версии
                    return {
                        success: true,
                        result: {
                            status: true,
                            totalProviders: Math.floor(Math.random() * maxProviders),
                            providers: Array.from({ length: Math.min(5, maxProviders) }, (_, i) => ({
                                peerId: `12D3KooWProvider${i}`,
                                addresses: [`/ip4/192.168.${i}.1/tcp/4001/p2p/12D3KooWProvider${i}`]
                            }))
                        }
                    };

                case 'PROVIDE_CONTENT':
                    const provideCid = event.data?.cid;
                    const provideDHTType = event.data?.dhtType || 'all';
                    if (!provideCid) {
                        return { success: false, error: 'CID required' };
                    }
                    // Возвращаем mock-данные для браузерной версии
                    return {
                        success: true,
                        result: {
                            status: true,
                            results: [
                                {
                                    success: true,
                                    dhtType: provideDHTType,
                                    message: `Content ${provideCid} provided successfully`
                                }
                            ]
                        }
                    };

                case 'SWITCH_TYPE':
                    const type = event.data?.type || 'all';
                    if (['all', 'lan', 'amino', 'universe'].includes(type)) {
                        state.activeDHTType = type;
                        await this.switchDHTType(type);
                        return { success: true, activeType: type };
                    }
                    return { success: false, error: 'Invalid DHT type' };

                case 'GET_DIAGNOSTICS':
                    return {
                        success: true,
                        diagnostics: this.getDiagnostics()
                    };

                case 'UPDATE_DISPLAY':
                    await this.updateDHTDisplay(event.data);
                    return { success: true, message: 'Display updated' };
                default:
                    console.warn(`[DHTManager] Unknown message type: ${event.type}`);
                    return {
                        success: false,
                        error: 'Unknown message type',
                        availableTypes: [
                            'REFRESH_STATS', 'GET_STATS', 'GET_BUCKETS', 'FIND_PEER',
                            'FIND_PROVIDERS', 'PROVIDE_CONTENT', 'SWITCH_TYPE',
                            'GET_DIAGNOSTICS', 'UPDATE_DISPLAY'
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
            return { success: false, error: (error as Error).message };
        }
    }

    async generateMockDHTStats(): Promise<void> {
        const state = this.state as DHTManagerState;

        const now = Date.now();
        const mockStats: DHTStats = {
            lan: this.createEmptyDHTStats('lan', 'error'),
            amino: this.createEmptyDHTStats('amino', 'error'),
            universe: this.createEmptyDHTStats('universe', 'error'),
            summary: {
                totalPeers: 0,
                totalQueries: 0,
                totalRecords: 0,
                activeDHTs: 0,
                overallHealth: 'good',
                dataQuality: 0
            },
            lastUpdated: now
        };

        mockStats.summary = this.calculateSummary(mockStats);

        state.dhtStats = mockStats;
        state.dhtStatsUpdated = true;

        await this.updateDHTDisplay({ stats: mockStats });

        this.showNotification('DHT stats refreshed with mock data', 'info');
    }

    async switchDHTType(dhtType: string): Promise<void> {
        const state = this.state as DHTManagerState;
        state.activeDHTType = dhtType;

        const buttons = ['all', 'lan', 'amino', 'universe'];
        for (const type of buttons) {
            const isActive = type === dhtType;
            await this.updateElement({
                selector: `#dhtBtn-${type}`,
                value: isActive ? 'btn-primary dht-type-btn ' : 'btn-secondary dht-type-btn ',
                property: 'className',
                action: 'set'
            });
        }

        await this.updateDHTDisplay();
    }

    async updateDHTDisplay(data?: any): Promise<void> {
        try {
            if (data?.stats) {
                const state = this.state as DHTManagerState;
                state.dhtStats = data.stats;
                state.dhtStatsUpdated = true;
            }

            console.log('@@@@@@@@@@ renderPart @@@@@@@@@@ 8')
            console.trace()
            await this.renderPart({
                partName: 'renderDHTStats',
                state: this.state,
                selector: '#dhtStatsContainer'
            });
        } catch (renderError) {
            console.error('❌ Render error in updateDHTDisplay:', renderError);
        }
    }

    async getDHTStats(): Promise<DHTStats> {
        return (this.state as DHTManagerState).dhtStats;
    }

    override async _componentDisconnected(): Promise<void> {
        if (this._controller?.destroy) {
            await this._controller.destroy();
        }
    }

    getDiagnostics(): any {
        const state = this.state as DHTManagerState;
        return {
            component: 'DHTManager',
            state: {
                connectionStatus: state.connectionStatus,
                sseConnectionState: state.sseConnectionState,
                activeDHTType: state.activeDHTType,
                dataQuality: state.dataQuality,
                lastUpdate: state.dhtStats.lastUpdated
            },
            stats: {
                totalPeers: state.dhtStats.summary.totalPeers,
                activeDHTs: state.dhtStats.summary.activeDHTs,
                overallHealth: state.dhtStats.summary.overallHealth
            },
            timestamp: Date.now()
        };
    }

    showNotification(message: string, type = 'info'): void {
        window.dispatchEvent(new CustomEvent('show-notification', {
            detail: {
                message: message,
                type: type
            }
        }));
    }
}

if (!customElements.get('dht-manager')) {
    customElements.define('dht-manager', DHTManager);
}