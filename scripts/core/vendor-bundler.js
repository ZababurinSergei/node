import { join } from 'path';
import { FileUtils, DependencyAnalyzer } from '../utils/index.js';
import { VendorIndexGenerator } from './vendor-index-generator.js';
import { ESBuildBuilder } from '../builders/index.js';

/**
 * Main vendor bundler class that orchestrates the entire vendor bundle generation process
 */
export class VendorBundler {
    /**
     * Creates a new VendorBundler instance
     * @param projectRoot - Root directory of the project to analyze
     * @param platform - Target platform (node or browser)
     */
    constructor(projectRoot, platform = 'browser') {
        this.projectRoot = projectRoot;
        this.platform = platform;
        this.dependencyAnalyzer = new DependencyAnalyzer(projectRoot);
        this.indexGenerator = new VendorIndexGenerator(projectRoot);
        this.builder = new ESBuildBuilder();

        console.log('=========================================', this)
    }

    /**
     * Generates a complete vendor bundle including analysis, index generation, and bundling
     */
    async generateVendorBundle(outputPath) {
        console.log(`🚀 Starting ${this.platform} vendor bundle generation...`);
        console.log(`📁 Project root: ${this.projectRoot}`);
        console.log(`📦 Output path: ${outputPath}`);
        console.log(`🎯 Platform: ${this.platform}`);

        const startTime = Date.now();

        try {
            // Step 1: Analyze dependencies
            console.log('🔍 Analyzing dependencies...');
            const analysis = await this.dependencyAnalyzer.analyzeDependencies(this.platform);

            if (analysis.dependencies.size === 0) {
                console.log('⚠️ No external dependencies found, creating fallback bundle');
                return this.createFallbackBundle(outputPath, startTime);
            }

            console.log(`📊 Found ${analysis.dependencies.size} external dependencies:`);
            analysis.dependencies.forEach((dep, pkgName) => {
                console.log(`  - ${pkgName}@${dep.version}`);
            });

            // Step 2: Generate vendor index file
            console.log('📝 Generating vendor index...');
            const indexContent = await this.indexGenerator.generateVendorIndex(
                new Map(Array.from(analysis.dependencies)),
                this.platform
            );

            // Используем ту же директорию, что и для output bundle
            const outputDir = FileUtils.dirname(outputPath);
            const indexPath = await this.indexGenerator.saveVendorIndexToDir(
                indexContent,
                outputDir,
                this.platform
            );

            console.log(`✅ Vendor index created: ${indexPath}`);

            // Step 3: Build vendor bundle using esbuild with browser configuration
            console.log(`🔨 Building ${this.platform} vendor bundle with esbuild...`);

            // Получаем все зависимости для анализа
            const allDependencies = Array.from(analysis.dependencies.keys());

            // Для браузера НЕ помечаем зависимости как external - мы хотим их включить в бандл
            // Для Node.js можно оставить как external
            const external = this.platform === 'node' ?
                await this.getNodeExternalDependencies(analysis) :
                [];

            // Подготавливаем конфигурацию esbuild
            const buildConfig = {
                entryPoint: indexPath,
                outfile: outputPath,
                bundle: true,
                platform: this.platform === 'browser' ? 'browser' : 'node',
                format: 'esm',
                target: this.platform === 'browser' ? ['es2020', 'chrome114', 'firefox115', 'safari14'] : 'node18',
                sourcemap: true,
                treeShaking: true,
                minify: this.platform === 'browser', // Минифицируем только для браузера
                external: external,

                // Ключевые настройки для правильного разрешения модулей
                mainFields: ['module', 'main', 'browser'],
                conditions: ['import', 'module', 'browser'],

                // Определяем глобальные переменные
                define: this.platform === 'browser' ? {
                    'global': 'window',
                    'globalThis': 'window',
                    'process.env.NODE_ENV': JSON.stringify('production'),
                    'process.browser': 'true',

                    // Обнуляем Node.js специфичные глобальные переменные
                    'Buffer': 'undefined',
                    'require': 'undefined',
                    'module': 'undefined',
                    'exports': 'undefined',
                    '__dirname': JSON.stringify(''),
                    '__filename': JSON.stringify(''),
                    'setImmediate': 'undefined',
                    'clearImmediate': 'undefined'
                } : {
                    'process.env.NODE_ENV': JSON.stringify('production')
                },

                // Включаем поддержку современных фич ES
                supported: {
                    'dynamic-import': true,
                    'import-meta': true,
                    'bigint': true,
                    'arbitrary-module-namespace-names': true
                },

                // Логирование для отладки
                logLevel: 'info',
                metafile: true
            };

            console.log('================= buildConfig ==================');
            console.log('Entry point:', indexPath);
            console.log('Output file:', outputPath);
            console.log('Platform:', buildConfig.platform);
            console.log('Format:', buildConfig.format);
            console.log('Target:', buildConfig.target);
            console.log('External dependencies:', external.length);
            console.log('Minify:', buildConfig.minify);
            console.log('===============================================');

            const buildResult = await this.builder.build(buildConfig);

            if (buildResult.success) {
                const duration = Date.now() - startTime;

                // Генерируем import map для vendor bundle
                const importMap = this.generateBrowserImportMap(analysis);
                const importMapPath = join(outputDir, 'importmap.json');
                FileUtils.writeJson(importMapPath, importMap);

                console.log(`✅ ${this.platform} vendor bundle successfully created: ${outputPath}`);
                console.log(`✅ Import map generated: ${importMapPath}`);

                if (buildResult.stats) {
                    console.log(`📊 Build statistics:`);
                    console.log(`   Size: ${(buildResult.stats.size / 1024 / 1024).toFixed(2)} MB`);
                    console.log(`   Duration: ${buildResult.stats.duration}ms`);
                    console.log(`   Dependencies processed: ${buildResult.stats.dependencies}`);

                    // Дополнительная информация о входных файлах
                    if (buildResult.stats.inputs && buildResult.stats.inputs.length > 0) {
                        console.log(`   Input files: ${buildResult.stats.inputs.length}`);
                    }
                }

                console.log(`⏱️ Total generation time: ${duration}ms`);
                console.log(`🗺️ Import map entries: ${Object.keys(importMap.imports).length}`);

                // Возвращаем полный результат
                return {
                    success: true,
                    outputPath,
                    importMapPath,
                    stats: buildResult.stats,
                    importMap
                };
            } else {
                console.error(`❌ ${this.platform} vendor bundle build failed:`, buildResult.error);
                return this.createFallbackBundle(outputPath, startTime);
            }

        } catch (error) {
            console.error(`💥 ${this.platform} vendor bundle generation failed:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error during vendor bundle generation'
            };
        }
    }

    /**
     * Получает external зависимости для браузера как esbuild CLI
     */
    async getBrowserExternalDependencies(analysis, allDependencies) {
        const external = new Set();

        // 1. Node.js built-in модули (всегда external в браузере)
        const nodeBuiltins = [
            'buffer', 'stream', 'process', 'util', 'events', 'string_decoder',
            'assert', 'crypto', 'path', 'fs', 'net', 'tls', 'child_process',
            'dgram', 'dns', 'http', 'https', 'os', 'zlib', 'vm', 'module',
            'perf_hooks', 'worker_threads', 'readline', 'repl', 'timers',
            'querystring', 'cluster', 'v8'
        ];

        nodeBuiltins.forEach(module => external.add(module));

        // 2. Проверяем package.json каждой зависимости на наличие "browser: false"
        for (const pkgName of allDependencies) {
            try {
                // Используем динамический импорт вместо require
                const { createRequire } = await import('module');
                const requireFunc = createRequire(import.meta.url);

                const pkgJsonPath = requireFunc.resolve(`${pkgName}/package.json`);
                const pkgJson = FileUtils.readJson(pkgJsonPath);

                // Если в package.json указано "browser: false", исключаем пакет
                if (pkgJson?.browser === false) {
                    console.log(`🚫 Excluding package with "browser: false": ${pkgName}`);
                    external.add(pkgName);
                    continue;
                }

                // Проверяем поле browser для специфичных исключений
                if (pkgJson?.browser && typeof pkgJson.browser === 'object') {
                    for (const [key, value] of Object.entries(pkgJson.browser)) {
                        // Если значение false, исключаем этот модуль
                        if (value === false) {
                            const moduleToExclude = key.startsWith('./')
                                ? `${pkgName}${key.substring(1)}`
                                : key;

                            console.log(`🚫 Package ${pkgName} excludes module: ${moduleToExclude}`);
                            external.add(moduleToExclude);
                        }
                    }
                }

                // Проверяем тип пакета
                if (pkgJson?.type === 'module') {
                    console.log(`📦 Package ${pkgName} is ESM module`);
                }

            } catch (error) {
                // Игнорируем ошибки при чтении package.json
                console.log(`⚠️ Could not read package.json for ${pkgName}:`, error.message);
            }
        }

        // 3. Дополнительные исключения для известных проблемных пакетов
        const problematicPackages = [
            'esbuild', 'typescript', 'webpack', 'rollup', 'vite',
            'jest', 'mocha', 'chai', 'ava', 'tape',
            'nodemon', 'pm2', 'forever'
        ];

        problematicPackages.forEach(pkg => {
            if (allDependencies.includes(pkg)) {
                external.add(pkg);
            }
        });

        return Array.from(external);
    }

    /**
     * Получает external зависимости для Node.js
     */
    async getNodeExternalDependencies(_analysis) {
        const external = new Set();

        // Для Node.js исключаем только build tools
        const buildTools = [
            'esbuild',
            'typescript',
            'webpack',
            'rollup',
            'vite',
            'jest',
            'mocha',
            'chai',
            'ava',
            'tape',
            'nodemon',
            'pm2',
            'forever'
        ];

        buildTools.forEach(tool => external.add(tool));

        return Array.from(external);
    }

    /**
     * Creates a fallback vendor bundle when no dependencies are found or build fails
     * @param outputPath - Path where the fallback bundle should be saved
     * @param startTime - Start time for duration calculation
     * @returns Build result for fallback bundle
     */
    async createFallbackBundle(outputPath, startTime) {
        try {
            const fallbackContent = `// Fallback Vendor Bundle - Auto-generated
// Generated: ${new Date().toISOString()}
// No external dependencies found or build failed

// Mock implementations for common browser dependencies
export const libp2pLogger = {
  info: (...args: unknown[]) => console.log('[libp2p]', ...args),
  warn: (...args: unknown[]) => console.warn('[libp2p]', ...args),
  error: (...args: unknown[]) => console.error('[libp2p]', ...args),
  debug: (...args: unknown[]) => console.debug('[libp2p]', ...args),
  trace: (...args: unknown[]) => console.trace('[libp2p]', ...args)
};

export const logger = libp2pLogger;

// Common utilities mock
export const utils = {
  format: (msg: string) => \`[\${new Date().toISOString()}] \${msg}\`,
  createLogger: (name: string) => ({
    info: (...args: unknown[]) => console.log(\`[\${name}]\`, ...args)
  })
};

// Vendor metadata
export const VENDOR_INFO = {
  generatedAt: '${new Date().toISOString()}',
  dependencies: [],
  totalDependencies: 0,
  isFallback: true
};

console.warn('⚠️ Using fallback vendor bundle - no external dependencies were found or build failed');
console.log('✅ Fallback vendor bundle loaded');
`;
            FileUtils.ensureDir(FileUtils.dirname(outputPath));
            FileUtils.writeFile(outputPath, fallbackContent);
            const duration = Date.now() - startTime;
            const stats = {
                size: Buffer.from(fallbackContent).length,
                duration,
                dependencies: 0,
                outputFiles: [outputPath],
                inputFiles: []
            };
            console.log(`✅ Fallback vendor bundle created: ${outputPath}`);
            console.log(`📊 Fallback bundle size: ${(stats.size / 1024).toFixed(2)} KB`);
            return {
                success: true,
                outputPath,
                stats
            };
        } catch (error) {
            console.error('💥 Failed to create fallback bundle:', error);
            return {
                success: false,
                error: 'Failed to create fallback vendor bundle'
            };
        }
    }

    /**
     * Updates HTML file with import map for vendor bundle
     * @param htmlPath - Path to HTML file
     * @param importMap - Import map to inject
     * @returns Success status
     */
    async updateHtmlImportMap(htmlPath, importMap) {
        console.log(`📄 Updating HTML import map: ${htmlPath}`);
        if (!FileUtils.exists(htmlPath)) {
            console.warn(`⚠️ HTML file not found: ${htmlPath}`);
            return false;
        }
        try {
            let htmlContent = FileUtils.readFile(htmlPath);
            const importMapTag = `    <script type="importmap">
${JSON.stringify(importMap, null, 4)}    </script>`;

            // Remove existing importmap if present
            htmlContent = htmlContent.replace(/<script type="importmap">[^<]*<\/script>/g, '');

            // Check if importmap already exists (shouldn't after removal, but just in case)
            if (htmlContent.includes('type="importmap"')) {
                console.log('ℹ️ Import map already exists in HTML, skipping update');
                return true;
            }

            // Try to insert before closing head tag
            const headCloseIndex = htmlContent.indexOf('</head>');
            if (headCloseIndex !== -1) {
                // Insert before closing head tag
                htmlContent = htmlContent.slice(0, headCloseIndex) +
                    '\n' + importMapTag + '\n' +
                    htmlContent.slice(headCloseIndex);
                console.log('✅ Import map added to <head> section');
            } else {
                // Create head section if it doesn't exist
                console.warn('⚠️ No <head> section found, creating one...');
                const bodyOpenIndex = htmlContent.indexOf('<body>');
                if (bodyOpenIndex !== -1) {
                    htmlContent = htmlContent.slice(0, bodyOpenIndex) +
                        '<head>\n' + importMapTag + '\n</head>\n' +
                        htmlContent.slice(bodyOpenIndex);
                    console.log('✅ Created <head> section with import map');
                } else {
                    // Prepend to beginning of file as last resort
                    htmlContent = '<head>\n' + importMapTag + '\n</head>\n' + htmlContent;
                    console.log('✅ Added import map at beginning of file');
                }
            }

            FileUtils.writeFile(htmlPath, htmlContent);
            console.log(`✅ HTML file successfully updated: ${htmlPath}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to update HTML import map:`, error);
            return false;
        }
    }

    /**
     * Generates only the import map without building the bundle
     * @param outputDir - Directory where importmap.json should be saved
     * @returns Generated import map
     */
    async generateImportMapOnly(outputDir) {
        console.log(`🗺️ Generating ${this.platform} import map in: ${outputDir}`);
        try {
            FileUtils.ensureDir(outputDir);
            const analysis = await this.dependencyAnalyzer.analyzeDependencies(this.platform);

            // Platform-specific import map generation
            const importMap = this.platform === 'node'
                ? this.generateNodeImportMap(analysis)
                : this.generateBrowserImportMap(analysis);

            const importMapPath = `${outputDir}/importmap.json`;
            FileUtils.writeJson(importMapPath, importMap);

            console.log(`✅ ${this.platform} import map created: ${importMapPath}`);
            console.log(`📊 Import map includes ${Object.keys(importMap.imports).length} dependencies`);

            Object.keys(importMap.imports).forEach(key => {
                if (!key.includes('/*')) {
                    console.log(`   - ${key}`);
                }
            });

            return importMap;
        } catch (error) {
            console.error(`❌ Failed to generate ${this.platform} import map:`, error);
            throw new Error(`Import map generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Generate browser-specific import map
     */
    generateBrowserImportMap(analysis) {
        const imports = {};
        for (const [pkgName] of analysis.dependencies) {
            imports[pkgName] = './vendor.bundle.mjs';
            imports[`${pkgName}/*`] = './vendor.bundle.mjs';
        }
        return {
            imports,
            scopes: {
                "./": { ...imports }
            }
        };
    }

    /**
     * Generate Node.js-specific import map
     */
    generateNodeImportMap(analysis) {
        const imports = {};
        for (const [pkgName] of analysis.dependencies) {
            // For Node.js, point to actual node_modules or bundled version
            imports[pkgName] = `./vendor.mjs`;
            imports[`${pkgName}/*`] = `./vendor.mjs`;
        }
        return {
            imports,
            scopes: {
                "./": { ...imports }
            }
        };
    }

    /**
     * Performs complete vendor bundle generation including HTML updates
     * @param bundleOutputPath - Path for vendor bundle
     * @param htmlPath - Path to HTML file to update
     * @returns Complete build result
     */
    async generateCompleteVendorSetup(bundleOutputPath, htmlPath) {
        console.log('🚀 Starting complete vendor setup...');

        // Generate vendor bundle
        const buildResult = await this.generateVendorBundle(bundleOutputPath);
        if (!buildResult.success) {
            return buildResult;
        }

        // Generate and update import map if HTML path provided
        if (htmlPath && FileUtils.exists(htmlPath)) {
            try {
                const outputDir = FileUtils.dirname(bundleOutputPath);
                const importMap = await this.generateImportMapOnly(outputDir);
                await this.updateHtmlImportMap(htmlPath, importMap);
                console.log('✅ Complete vendor setup finished successfully');
            } catch (error) {
                console.warn('⚠️ Vendor bundle created but HTML update failed:', error);
                // Don't fail the whole process if HTML update fails
            }
        } else if (htmlPath) {
            console.warn('⚠️ HTML file not found, skipping import map update');
        }

        return buildResult;
    }

    /**
     * Analyzes dependencies without generating any files
     * @returns Analysis result with dependencies and import map
     */
    async analyzeDependencies() {
        console.log('🔍 Analyzing project dependencies...');
        return await this.dependencyAnalyzer.analyzeDependencies(this.platform);
    }

    /**
     * Gets the project root path
     * @returns Current project root
     */
    getProjectRoot() {
        return this.projectRoot;
    }

    /**
     * Gets the current platform
     */
    getPlatform() {
        return this.platform;
    }

    /**
     * Sets the platform
     */
    setPlatform(platform) {
        this.platform = platform;
    }
}
//# sourceMappingURL=vendor-bundler.js.map