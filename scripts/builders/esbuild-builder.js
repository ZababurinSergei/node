import * as esbuild from 'esbuild';
import { dirname, join } from 'path';
import { FileUtils } from '../utils/index.js';

export class ESBuildBuilder {

    getAliases() {
        const basePath = process.cwd();
        const aliases = {
            '@': basePath,
            '@/base': join(basePath, 'base'),
            '@/logger': join(basePath, 'logger'),
            '@/components': join(basePath, 'components'),
            '@/lib': join(basePath, 'lib')
        };

        if (this.verbose) {
            this.log(`📁 Aliases configured: ${Object.keys(aliases).join(', ')}`);
        }

        return aliases;
    }

    /**
     * Создает базовую конфигурацию сборки
     */
    createBaseBuildConfig(config) {
        return {
            entryPoints: config.entryPoint ? [config.entryPoint] : [],
            outfile: config.outfile,
            bundle: true,
            platform: config.platform || 'browser',
            format: config.format || 'esm',
            minify: config.minify !== undefined ? config.minify : true,
            sourcemap: config.sourcemap !== undefined ? config.sourcemap : true,
            external: config.external || [],
            target: config.platform === 'browser' ? 'es2020' : 'node18',
            alias: this.getAliases(),
            treeShaking: true,
            metafile: true,
            write: true,
            resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json'],
            legalComments: config.minify ? 'none' : 'inline',
            charset: 'utf8',
            keepNames: !config.minify,
            sourcesContent: config.sourcemap
        };
    }

    /**
     * Получает платформо-специфичные опции с явным undefined для exactOptionalPropertyTypes
     */
    getPlatformSpecificOptions(platform) {
        if (platform === 'browser') {
            // Точные define настройки как в esbuild CLI с --platform=browser
            const define = {
                // Глобальные объекты
                'global': 'window',
                'globalThis': 'window',
                // Process объект
                'process.env.NODE_ENV': JSON.stringify('production'),
                'process.browser': 'true',
                'process.version': JSON.stringify(''),
                'process.platform': JSON.stringify(''),
                'process.arch': JSON.stringify(''),
                // Node.js built-ins (должны быть undefined в браузере)
                'Buffer': 'undefined',
                'require': 'undefined',
                'module': 'undefined',
                'exports': 'undefined',
                // Пути (должны быть пустыми строками в браузере)
                '__dirname': JSON.stringify(''),
                '__filename': JSON.stringify(''),
                // Дополнительные Node.js глобальные объекты
                'setImmediate': 'undefined',
                'clearImmediate': 'undefined'
            };

            return {
                define,
                // ВАЖНО: Изменяем порядок - 'browser' НЕ первое поле
                // 'browser' поле часто содержит false или заглушки
                // Используем 'module' первым для ES модулей
                mainFields: ['module', 'main', 'browser'],
                // Указываем условия для Conditional Exports
                conditions: ['import', 'module', 'browser'],
                // Включаем поддержку exports field в package.json
                supported: {
                    'dynamic-import': true,
                    'import-meta': true,
                    'bigint': true,
                    'arbitrary-module-namespace-names': true
                },
                // Разрешаемые расширения
                resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json'],
                // Целевая версия для браузера
                target: ['es2020', 'chrome114', 'firefox115', 'safari14'],
                alias: this.getAliases(),
                // Важные настройки для правильного разрешения модулей
                bundle: true,
                splitting: false,
                format: 'esm',
                // Не минифицируем для отладки
                minify: false,
                // Включаем sourcemaps для отладки
                sourcemap: true,
                // Отключаем некоторые проблемные преобразования
                pure: [],
                // Отключаем dead code elimination для отладки
                treeShaking: false
            };
        }
        // Для Node.js возвращаем пустой объект
        return {};
    }

    /**
     * Создает полную конфигурацию сборки с правильными entryPoints
     */
    createFullBuildConfig(config) {
        const baseConfig = this.createBaseBuildConfig(config);
        const platformOptions = this.getPlatformSpecificOptions(config.platform);

        // Объединяем конфигурации
        const fullConfig = { ...baseConfig, ...platformOptions };

        // Обеспечиваем, что entryPoints - это массив строк
        if (config.entryPoint) {
            fullConfig.entryPoints = [config.entryPoint];
        }

        // Фильтруем undefined свойства
        const filteredConfig = {};
        for (const [key, value] of Object.entries(fullConfig)) {
            if (value !== undefined) {
                filteredConfig[key] = value;
            }
        }

        // Особые проверки для entryPoints
        if (!filteredConfig.entryPoints || !Array.isArray(filteredConfig.entryPoints)) {
            console.warn('⚠️ entryPoints is not an array, creating new array');
            filteredConfig.entryPoints = config.entryPoint ? [config.entryPoint] : [];
        }

        return filteredConfig;
    }

    /**
     * Фильтрует undefined свойства для совместимости с exactOptionalPropertyTypes
     */
    filterUndefinedProperties(obj) {
        const filtered = {};
        for (const [key, value] of Object.entries(obj)) {
            if (value !== undefined) {
                filtered[key] = value;
            }
        }
        return filtered;
    }

    async build(config) {
        const startTime = Date.now();

        try {
            console.log(`🔨 Building ${config.platform} bundle (${config.format})...`);
            console.log(`   Entry: ${config.entryPoint}`);
            console.log(`   Output: ${config.outfile}`);
            console.log(`   Minify: ${config.minify}, Sourcemap: ${config.sourcemap}`);

            // Проверяем, что entryPoint является строкой
            if (typeof config.entryPoint !== 'string') {
                throw new Error(`Entry point must be a string, got ${typeof config.entryPoint}: ${config.entryPoint}`);
            }

            // Проверяем существование entryPoint
            const fs = await import('fs');
            if (!fs.existsSync(config.entryPoint)) {
                throw new Error(`Entry point file does not exist: ${config.entryPoint}`);
            }

            // Для браузера добавляем все зависимости как external
            if (config.platform === 'browser') {
                // Получаем зависимости из package.json
                const packageJsonPath = join(dirname(config.entryPoint), '..', 'package.json');
                if (fs.existsSync(packageJsonPath)) {
                    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                    const allDeps = [
                        ...Object.keys(packageJson.dependencies || {}),
                        ...Object.keys(packageJson.devDependencies || {}),
                        ...Object.keys(packageJson.peerDependencies || {})
                    ];

                    // Фильтруем и добавляем как external
                    const filteredDeps = allDeps.filter(dep =>
                        !dep.startsWith('.') &&
                        !dep.startsWith('/') &&
                        !dep.startsWith('@types/')
                    );

                    if (!config.external) config.external = [];
                    config.external = [...new Set([...config.external, ...filteredDeps])];

                    console.log(`📦 Marking ${filteredDeps.length} dependencies as external for browser`);
                    if (filteredDeps.length > 0 && config.verbose) {
                        console.log('   External dependencies:', filteredDeps.slice(0, 10).join(', '));
                        if (filteredDeps.length > 10) console.log(`   ... and ${filteredDeps.length - 10} more`);
                    }
                }
            }

            // Используем новый метод для создания конфигурации
            const buildConfig = this.createFullBuildConfig(config);

            console.log('Build config properties:');
            console.log('  entryPoints:', buildConfig.entryPoints);
            console.log('  outfile:', buildConfig.outfile);
            console.log('  platform:', buildConfig.platform);
            console.log('  format:', buildConfig.format);
            console.log('  external:', buildConfig.external?.slice(0, 5) || 'none');
            if (buildConfig.external?.length > 5) {
                console.log('    ... and', buildConfig.external.length - 5, 'more');
            }

            // Убедимся, что entryPoints правильно сформирован
            if (!buildConfig.entryPoints || !Array.isArray(buildConfig.entryPoints) || buildConfig.entryPoints.length === 0) {
                throw new Error('No valid entry points found in build configuration');
            }

            // Проверяем каждый entry point
            for (let i = 0; i < buildConfig.entryPoints.length; i++) {
                const ep = buildConfig.entryPoints[i];
                if (typeof ep !== 'string') {
                    throw new Error(`Entry point at index ${i} must be a string, got ${typeof ep}: ${ep}`);
                }
                if (!fs.existsSync(ep)) {
                    throw new Error(`Entry point file at index ${i} does not exist: ${ep}`);
                }
            }

            console.log('Starting build...');
            const result = await esbuild.build(buildConfig);
            const duration = Date.now() - startTime;

            // Анализ метаданных сборки
            const stats = this.analyzeBuildResult(result, duration);

            return {
                success: true,
                outputPath: config.outfile,
                stats
            };

        } catch (error) {
            console.error('❌ ESBuild build failed:', error);
            console.error('Error details:', {
                entryPoint: config?.entryPoint,
                outfile: config?.outfile,
                platform: config?.platform,
                format: config?.format,
                external: config?.external?.slice(0, 5)
            });

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown build error'
            };
        }
    }

    analyzeBuildResult(result, duration) {
        const inputs = Object.keys(result.metafile?.inputs || {});
        const outputs = Object.keys(result.metafile?.outputs || {});
        let totalSize = 0;
        let entryPointSize = 0;

        // Расчет размеров
        if (result.metafile) {
            for (const output of Object.values(result.metafile.outputs)) {
                totalSize += output.bytes;
                // Определяем размер основного entry point
                if (output.entryPoint) {
                    entryPointSize = output.bytes;
                }
            }
        }

        return {
            size: totalSize,
            entryPointSize,
            duration,
            dependencies: inputs.length,
            outputFiles: outputs,
            inputFiles: inputs,
            inputs: inputs.map(input => ({
                file: input,
                size: result.metafile?.inputs?.[input]?.bytes || 0
            })),
            outputs: outputs.map(output => ({
                file: output,
                size: result.metafile?.outputs?.[output]?.bytes || 0
            }))
        };
    }

    calculateOutputSize(metafile) {
        return Object.values(metafile.outputs).reduce((total, output) => total + output.bytes, 0);
    }

    // Специализированные методы для разных платформ
    async buildBrowserBundle(config) {
        return this.build({
            ...config,
            platform: 'browser',
            format: 'esm'
        });
    }

    async buildNodeBundle(config) {
        return this.build({
            ...config,
            platform: 'node',
            format: 'esm'
        });
    }

    async buildNodeCJS(config) {
        return this.build({
            ...config,
            platform: 'node',
            format: 'cjs'
        });
    }

    // Watch mode для разработки
    async watch(config, _onRebuild) {
        // Создаем конфигурацию для watch mode
        const watchConfig = {
            ...config,
            target: config.platform === 'browser' ? 'es2022' : 'node18'
        };
        const buildConfig = this.createFullBuildConfig(watchConfig);

        try {
            const context = await esbuild.context(buildConfig);
            await context.watch();
            console.log(`👀 Watching for changes: ${config.entryPoint}`);
            // Возвращаем функцию для остановки watch
            return () => {
                context.dispose();
                console.log('🛑 Watch mode stopped');
            };
        } catch (error) {
            console.error('❌ Failed to start watch mode:', error);
            throw error;
        }
    }

    // Serve mode для разработки
    async serve(config, serveOptions) {
        const buildConfig = this.createFullBuildConfig(config);
        const serveConfig = {
            port: serveOptions?.port || 3000,
            servedir: dirname(config.outfile)
        };

        try {
            const context = await esbuild.context(buildConfig);
            const { port } = await context.serve(serveConfig);
            console.log(`🌐 Serving at http://localhost:${port}`);
            console.log(`   Serving from: ${serveConfig.servedir}`);
            // Возвращаем функцию для остановки сервера
            return () => {
                context.dispose();
                console.log('🛑 Server stopped');
            };
        } catch (error) {
            console.error('❌ Failed to start server:', error);
            throw error;
        }
    }

    // Анализ бандла без сборки
    async analyze(config) {
        try {
            // Создаем конфигурацию для анализа
            const buildConfig = this.createFullBuildConfig({
                ...config,
                target: config.platform === 'browser' ? 'es2022' : 'node18'
            });
            // Для анализа не нужно писать файлы
            buildConfig.write = false;
            // Убедимся, что метаданные включены
            buildConfig.metafile = true;

            const result = await esbuild.build(buildConfig);
            const dependencies = new Set();
            const warnings = [];

            // Анализ входных файлов
            if (result.metafile) {
                for (const [inputPath] of Object.entries(result.metafile.inputs)) {
                    if (inputPath.includes('node_modules')) {
                        const pkgMatch = inputPath.match(/node_modules\/(@[^/]+\/[^/]+|[^/]+)\//);
                        if (pkgMatch && pkgMatch[1]) {
                            dependencies.add(pkgMatch[1]);
                        }
                    }
                }
            }

            // Проверка предупреждений
            if (result.warnings.length > 0) {
                warnings.push(...result.warnings.map(w => w.text));
            }

            return {
                dependencies: Array.from(dependencies),
                sizeEstimate: this.calculateOutputSize(result.metafile),
                warnings
            };
        } catch (error) {
            console.error('❌ Bundle analysis failed:', error);
            throw error;
        }
    }

    /**
     * Проверяет поле browser в package.json зависимостей
     */
    async checkPackageBrowserFields(_entryPoint) {
        const browserFieldMap = new Map();

        try {
            // Читаем package.json текущего проекта
            const projectPackageJson = FileUtils.readJson('./package.json');

            if (projectPackageJson?.dependencies) {
                for (const [pkgName] of Object.entries(projectPackageJson.dependencies)) {
                    try {
                        // Используем createRequire для ESM
                        const { createRequire } = await import('module');
                        const requireFunc = createRequire(import.meta.url);

                        const pkgJsonPath = requireFunc.resolve(`${pkgName}/package.json`);
                        const pkgJson = FileUtils.readJson(pkgJsonPath);

                        if (pkgJson?.browser) {
                            const browserFields = [];
                            if (typeof pkgJson.browser === 'string') {
                                browserFields.push(`main: ${pkgJson.browser}`);
                            } else if (typeof pkgJson.browser === 'object') {
                                for (const [key, value] of Object.entries(pkgJson.browser)) {
                                    browserFields.push(`${key}: ${value}`);
                                }
                            }

                            if (browserFields.length > 0) {
                                browserFieldMap.set(pkgName, browserFields);
                            }
                        }
                    } catch (error) {
                        // Игнорируем ошибки при чтении package.json зависимостей
                    }
                }
            }
        } catch (error) {
            console.warn('⚠️ Could not check package browser fields:', error);
        }

        return browserFieldMap;
    }
}
//# sourceMappingURL=esbuild-builder.js.map