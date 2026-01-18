#!/usr/bin/env node

import { build, context } from 'esbuild';
import { readFileSync, existsSync, copyFileSync, mkdirSync, statSync, readdirSync } from 'fs';
import { join, dirname, relative, extname, basename } from 'path';
import { fileURLToPath } from 'url';
import { readdir, readFile, writeFile, stat, copyFile, mkdir } from 'fs/promises'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ESBuildBuilder {
    constructor(options = {}) {
        this.projectRoot = join(__dirname, '..');
        this.sourceDir = join(this.projectRoot, 'src');
        this.distDir = join(this.projectRoot, 'dist');
        this.tsConfigPath = join(this.projectRoot, 'tsconfig.json');
        this.verbose = options.verbose || false;
        this.watch = options.watch || false;
        this.minify = options.minify || false;
        this.onlyEsm = options.onlyEsm !== undefined ? options.onlyEsm : true;
        this.webComponents = options.webComponents || false;
        this.generateIndexFiles = options.generateIndexFiles || false;
        this.copyNonTsFiles = options.copyNonTsFiles || false;

        // НОВЫЙ ПАРАМЕТР: отключение vendor bundle
        this.generateVendorBundleFlag = options.generateVendorBundle !== undefined ?
            options.generateVendorBundle : true;

        // ДОБАВЛЕНО: платформа для сборки (browser/node)
        this.platform = options.platform || 'browser';

        this.stats = {
            startTime: Date.now(),
            filesProcessed: 0,
            formatsGenerated: 0,
            errors: 0
        };
    }

    // В начало класса ESBuildBuilder после constructor добавьте:
    getAliases() {
        const aliases = {
            '@': this.sourceDir,
            '@/base': join(this.sourceDir, 'base'),
            '@/logger': join(this.sourceDir, 'logger'),
            '@/components': join(this.sourceDir, 'components'),
            '@/lib': join(this.sourceDir, 'lib')
        };

        if (this.verbose) {
            this.log(`📁 Aliases configured: ${Object.keys(aliases).join(', ')}`);
        }

        return aliases;
    }

    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = {
            info: 'ℹ️',
            warn: '⚠️',
            error: '❌',
            success: '✅'
        }[level] || '📝';

        if (this.verbose || level !== 'info') {
            console.log(`${prefix} [${timestamp}] ${message}`);
        }
    }

    async buildFormats() {
        // Проверяем существование tsconfig.json
        if (!existsSync(this.tsConfigPath)) {
            this.log(`❌ tsconfig.json not found at: ${this.tsConfigPath}`, 'error');
            throw new Error(`TypeScript configuration not found: ${this.tsConfigPath}`);
        }

        this.log(`📄 Using TypeScript config: ${relative(this.projectRoot, this.tsConfigPath)}`);

        // Для веб-компонентов используем специальную конфигурацию
        if (this.webComponents) {
            return await this.buildWebComponents();
        }

        // По умолчанию только ESM в dist
        const formats = this.onlyEsm ?
            [
                {
                    name: 'esm',
                    extension: '.js',
                    format: 'esm',
                    platform: 'browser',
                    outdir: this.distDir
                }
            ] :
            [
                {
                    name: 'esm',
                    extension: '.mjs',
                    format: 'esm',
                    platform: 'browser',
                    outdir: join(this.distDir, 'esm')
                },
                {
                    name: 'cjs',
                    extension: '.cjs',
                    format: 'cjs',
                    platform: 'browser',
                    outdir: join(this.distDir, 'cjs')
                }
            ];

        if (this.onlyEsm) {
            this.log('🎯 Building ESM format directly to dist directory');
        } else {
            this.log('📦 Building both ESM and CJS formats');
        }

        const buildPromises = formats.map(formatConfig =>
            this.buildFormat(formatConfig)
        );

        const results = await Promise.allSettled(buildPromises);

        // Анализ результатов
        results.forEach((result, index) => {
            const format = formats[index];
            if (result.status === 'fulfilled') {
                this.log(`${format.name.toUpperCase()} build completed`, 'success');
                this.stats.formatsGenerated++;
            } else {
                this.log(`${format.name.toUpperCase()} build failed: ${result.reason.message}`, 'error');
                this.stats.errors++;
            }
        });
    }

    // Специальная сборка для веб-компонентов
    async buildWebComponents() {
        this.log('🎨 Building Web Components bundle...');

        const entryPoints = await this.getWebComponentsEntryPoints();

        if (entryPoints.length === 0) {
            this.log('⚠️ No web components found to build', 'warn');
            return;
        }

        const buildOptions = {
            entryPoints,
            bundle: true,
            sourcemap: true,
            format: 'esm',
            target: ['chrome114', 'firefox115', 'safari14'],
            alias: this.getAliases(),
            platform: 'browser',
            outdir: this.distDir,
            minify: this.minify,
            keepNames: true,
            metafile: true,
            tsconfig: this.tsConfigPath,
            define: {
                global: 'window'
            },
            plugins: [
                {
                    name: 'web-components-css',
                    setup(build) {
                        // Обработка CSS файлов для веб-компонентов
                        build.onLoad({ filter: /\.css$/ }, async (args) => {
                            try {
                                const contents = await readFileSync(args.path, 'utf8');
                                return {
                                    contents: `export default ${JSON.stringify(contents)};`,
                                    loader: 'js'
                                };
                            } catch (error) {
                                return {
                                    contents: 'export default "";',
                                    loader: 'js'
                                };
                            }
                        });
                    }
                }
            ]
        };

        try {
            let result;
            if (this.watch) {
                const ctx = await context(buildOptions);
                await ctx.watch();
                this.log(`👀 Watching web components for changes...`);
                return ctx;
            } else {
                result = await build(buildOptions);
                this.stats.filesProcessed += result.outputFiles ? result.outputFiles.length : 0;
                this.stats.formatsGenerated++;
                this.log(`✅ Web components bundle created with ${entryPoints.length} entry points`, 'success');
                return result;
            }
        } catch (error) {
            this.log(`❌ Web components build failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async getWebComponentsEntryPoints() {
        const entryPoints = [];
        const componentsDir = join(this.sourceDir, 'components');

        if (!existsSync(componentsDir)) {
            return entryPoints;
        }

        const scanComponent = async (dir) => {
            try {
                const items = readdirSync(dir, { withFileTypes: true });

                for (const item of items) {
                    const fullPath = join(dir, item.name);

                    if (item.isDirectory()) {
                        // Рекурсивно сканируем поддиректории компонентов
                        await scanComponent(fullPath);
                    } else if (item.isFile() && item.name === 'index.ts') {
                        // Добавляем index.ts файлы компонентов как точки входа
                        entryPoints.push(fullPath);
                        this.log(`📦 Found web component: ${relative(this.sourceDir, fullPath)}`);
                    }
                }
            } catch (error) {
                this.log(`Cannot scan component directory ${dir}: ${error.message}`, 'warn');
            }
        };

        await scanComponent(componentsDir);

        // Также добавляем основной index.ts если он существует
        const mainIndex = join(this.sourceDir, 'index.ts');
        if (existsSync(mainIndex)) {
            entryPoints.push(mainIndex);
        }

        return entryPoints;
    }

    async buildFormat(formatConfig) {
        const buildOptions = {
            entryPoints: await this.getEntryPoints(),
            bundle: true,
            outdir: formatConfig.outdir,
            format: formatConfig.format,
            platform: formatConfig.platform,
            target: 'node18',
            alias: this.getAliases(),
            sourcemap: true,
            minify: this.minify,
            tsconfig: this.tsConfigPath,
            outExtension: { '.js': formatConfig.extension },
            preserveSymlinks: true,
            treeShaking: true,
            legalComments: 'inline',
            charset: 'utf8',
            logLevel: this.verbose ? 'debug' : 'warning'
        };

        if (this.watch) {
            const ctx = await context(buildOptions);
            await ctx.watch();
            this.log(`Watching ${formatConfig.name} format for changes...`);
            return ctx;
        } else {
            const result = await build(buildOptions);
            this.stats.filesProcessed += result.outputFiles ? result.outputFiles.length : 0;
            return result;
        }
    }

    async getEntryPoints() {
        // Находим все TypeScript/JavaScript файлы в src
        const entryPoints = [];

        const scanDirectory = async (dir) => {
            try {
                const items = await readdir(dir, { withFileTypes: true });

                for (const item of items) {
                    const fullPath = join(dir, item.name);

                    if (item.isDirectory()) {
                        // Пропускаем node_modules и скрытые директории
                        if (!item.name.startsWith('.') && item.name !== 'node_modules') {
                            await scanDirectory(fullPath);
                        }
                    } else if (this.isSourceFile(item.name)) {
                        entryPoints.push(fullPath);
                    }
                }
            } catch (error) {
                this.log(`Cannot scan directory ${dir}: ${error.message}`, 'warn');
            }
        };

        await scanDirectory(this.sourceDir);

        if (entryPoints.length === 0) {
            // Если не нашли файлов, используем основной index.ts
            const mainIndex = join(this.sourceDir, 'index.ts');
            if (existsSync(mainIndex)) {
                entryPoints.push(mainIndex);
            }
        }

        this.log(`Found ${entryPoints.length} source files to build`);
        return entryPoints;
    }

    isSourceFile(filename) {
        const ext = filename.slice(filename.lastIndexOf('.'));
        return ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'].includes(ext);
    }

    async copyDeclarationFiles() {
        // Копируем .d.ts файлы из src в dist
        try {
            const copyDeclarations = async (srcDir, destDir) => {
                const items = await readdir(srcDir, { withFileTypes: true });

                for (const item of items) {
                    const srcPath = join(srcDir, item.name);
                    const destPath = join(destDir, item.name);

                    if (item.isDirectory()) {
                        if (!item.name.startsWith('.') && item.name !== 'node_modules') {
                            await mkdir(destPath, { recursive: true });
                            await copyDeclarations(srcPath, destPath);
                        }
                    } else if (item.name.endsWith('.d.ts')) {
                        await copyFile(srcPath, destPath);
                        this.log(`Copied declaration: ${relative(this.sourceDir, srcPath)}`);
                    }
                }
            };

            if (this.onlyEsm) {
                // Для onlyEsm копируем прямо в dist
                await copyDeclarations(this.sourceDir, this.distDir);
            } else {
                // Для обычного режима копируем в поддиректории
                for (const format of ['esm', 'cjs']) {
                    const destDir = join(this.distDir, format);
                    await mkdir(destDir, { recursive: true });
                    await copyDeclarations(this.sourceDir, destDir);
                }
            }

        } catch (error) {
            this.log(`Cannot copy declaration files: ${error.message}`, 'warn');
        }
    }

    async copyStaticFiles() {
        const filesToCopy = [
            'README.md',
            'LICENSE'
        ];

        let copied = 0;

        for (const file of filesToCopy) {
            const srcPath = join(this.projectRoot, file);
            const destPath = join(this.distDir, file);

            if (existsSync(srcPath)) {
                try {
                    // Проверяем, является ли srcPath файлом
                    const srcStat = statSync(srcPath);
                    if (!srcStat.isFile()) {
                        this.log(`⚠️ ${file} is not a file, skipping`, 'warn');
                        continue;
                    }

                    mkdirSync(dirname(destPath), { recursive: true });
                    copyFileSync(srcPath, destPath);
                    copied++;
                    this.log(`Copied ${file}`, 'success');
                } catch (error) {
                    this.log(`Cannot copy ${file}: ${error.message}`, 'warn');
                }
            }
        }

        return copied;
    }

    // Копируем все не-TS файлы из src в dist
    async copyNonTypeScriptFiles() {
        if (!this.copyNonTsFiles && !this.webComponents) {
            return 0;
        }

        this.log('📁 Copying non-TypeScript files...');

        let copied = 0;

        const copyFiles = async (srcDir, destDir) => {
            try {
                const items = await readdir(srcDir, { withFileTypes: true });

                for (const item of items) {
                    const srcPath = join(srcDir, item.name);
                    const destPath = join(destDir, item.name);

                    if (item.isDirectory()) {
                        // Пропускаем node_modules и скрытые папки
                        if (!item.name.includes('node_modules') && !item.name.startsWith('.')) {
                            await mkdir(destPath, { recursive: true });
                            await copyFiles(srcPath, destPath);
                        }
                    } else if (item.isFile()) {
                        // Копируем все файлы, кроме TypeScript исходников
                        const ext = extname(item.name).toLowerCase();
                        if (!['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'].includes(ext)) {
                            await copyFile(srcPath, destPath);
                            copied++;
                            if (this.verbose) {
                                this.log(`Copied: ${relative(this.sourceDir, srcPath)}`);
                            }
                        }
                    }
                }
            } catch (error) {
                this.log(`Cannot copy files from ${srcDir}: ${error.message}`, 'warn');
            }
        };

        await copyFiles(this.sourceDir, this.distDir);

        // Копируем browser полифилы если это сборка для браузера и есть vendor bundle
        if (this.generateVendorBundleFlag && this.platform === 'browser') {
            try {
                const vendorPolyfillsPath = join(this.projectRoot, 'scripts/vendor/src/core/browser-polyfills.ts');
                const distPolyfillsPath = join(this.distDir, 'browser-polyfills.js');

                if (existsSync(vendorPolyfillsPath)) {
                    const polyfillContent = `
// Browser polyfills for Node.js modules
export const multicastDns = {
    query: () => {
        console.warn('⚠️ multicast-dns is not available in browser environment');
        return { on: () => {}, stop: () => {} };
    }
};

export const dgram = {
    createSocket: () => ({
        bind: () => console.warn('⚠️ dgram is not available in browser'),
        send: () => console.warn('⚠️ dgram is not available in browser'),
        close: () => console.warn('⚠️ dgram is not available in browser')
    })
};

export const promClient = {
    Registry: class {
        metrics() { return ''; }
        registerMetric() {}
        getMetricsAsJSON() { return []; }
    },
    Counter: class {
        inc() {}
    },
    Gauge: class {
        set() {}
        inc() {}
        dec() {}
    },
    Histogram: class {
        observe() {}
    }
};

export const streamToSocket = {
    createStream: () => ({
        pipe: () => {},
        on: () => {},
        write: () => {}
    })
};

export const WebSocket = {
    Server: class {
        constructor() {
            console.warn('⚠️ WebSocket.Server is not available in browser');
        }
    }
};

export const browserPolyfills = {
    'multicast-dns': multicastDns,
    'dgram': dgram,
    'prom-client': promClient,
    'stream-to-socket': streamToSocket,
    'ws': { Server: WebSocket.Server }
};

export default browserPolyfills;
`;

                    mkdirSync(dirname(distPolyfillsPath), { recursive: true });
                    require('fs').writeFileSync(distPolyfillsPath, polyfillContent, 'utf8');
                    this.log(`📦 Created browser polyfills in dist`);
                    copied++;
                }
            } catch (error) {
                this.log(`⚠️ Cannot create browser polyfills: ${error.message}`, 'warn');
            }
        }

        if (copied > 0) {
            this.log(`✅ Copied ${copied} non-TypeScript files`, 'success');
        } else {
            this.log('ℹ️ No non-TypeScript files found to copy');
        }

        return copied;
    }

    // Новый метод: добавляет расширения к импортам в скомпилированных файлах
    async fixImportExtensions() {
        this.log('🔧 Fixing import extensions in compiled files...');

        try {
            const files = await this.getAllJsFiles(this.distDir);
            let fixedCount = 0;

            for (const file of files) {
                try {
                    const content = await readFile(file, 'utf8');
                    const fixedContent = this.fixImportsInFile(content, file);

                    if (fixedContent !== content) {
                        await writeFile(file, fixedContent, 'utf8');
                        fixedCount++;
                        if (this.verbose) {
                            this.log(`Fixed imports in: ${relative(this.distDir, file)}`);
                        }
                    }
                } catch (error) {
                    this.log(`Cannot fix imports in ${file}: ${error.message}`, 'warn');
                }
            }

            if (fixedCount > 0) {
                this.log(`✅ Fixed import extensions in ${fixedCount} files`, 'success');
            } else {
                this.log('ℹ️ No import extensions needed fixing');
            }

            return fixedCount;
        } catch (error) {
            this.log(`Cannot fix import extensions: ${error.message}`, 'warn');
            return 0;
        }
    }

    // Получает все JS файлы в директории
    async getAllJsFiles(dir) {
        const files = [];

        const scanDirectory = async (currentDir) => {
            try {
                const items = await readdir(currentDir, { withFileTypes: true });

                for (const item of items) {
                    const fullPath = join(currentDir, item.name);

                    if (item.isDirectory()) {
                        await scanDirectory(fullPath);
                    } else if (item.isFile() &&
                        (item.name.endsWith('.js') ||
                            item.name.endsWith('.mjs') ||
                            item.name.endsWith('.cjs'))) {
                        files.push(fullPath);
                    }
                }
            } catch (error) {
                this.log(`Cannot scan directory ${currentDir}: ${error.message}`, 'warn');
            }
        };

        await scanDirectory(dir);
        return files;
    }

    // Исправляет импорты в файле
    fixImportsInFile(content, filePath) {
        // Регулярные выражения для поиска импортов
        const importPatterns = [
            // import ... from './file'
            /from\s+['"](\.\/[^'"]*?)['"]/g,
            // import ... from '../file'
            /from\s+['"](\.\.[^'"]*?)['"]/g,
            // import './file'
            /import\s+['"](\.\/[^'"]*?)['"]/g,
            // import '../file'
            /import\s+['"](\.\.[^'"]*?)['"]/g,
            // export ... from './file'
            /export\s+.*from\s+['"](\.\/[^'"]*?)['"]/g,
            // export ... from '../file'
            /export\s+.*from\s+['"](\.\.[^'"]*?)['"]/g
        ];

        let fixedContent = content;

        for (const pattern of importPatterns) {
            fixedContent = fixedContent.replace(pattern, (match, importPath) => {
                // Пропускаем импорты, которые уже имеют расширение
                if (importPath.match(/\.(js|mjs|cjs|json)$/)) {
                    return match;
                }

                // Полный путь к импортируемому файлу
                const importDir = dirname(filePath);
                const fullImportPath = join(importDir, importPath);

                try {
                    // Проверяем, существует ли файл
                    if (existsSync(fullImportPath)) {
                        const stat = statSync(fullImportPath);

                        if (stat.isDirectory()) {
                            // Если это директория, добавляем /vendor.mjs
                            return match.replace(importPath, `${importPath}/index.js`);
                        } else if (stat.isFile()) {
                            // Если это файл без расширения, добавляем .js
                            return match.replace(importPath, `${importPath}.js`);
                        }
                    } else {
                        // Проверяем существование с расширениями
                        const extensions = ['.js', '/index.js', '.mjs', '.cjs'];
                        for (const ext of extensions) {
                            const testPath = fullImportPath + (ext.startsWith('/') ? '' : ext);
                            if (existsSync(testPath)) {
                                return match.replace(importPath, importPath + ext);
                            }
                        }
                    }
                } catch (error) {
                    // Если не удалось проверить, оставляем как есть
                    this.log(`Cannot check import path ${fullImportPath}: ${error.message}`, 'warn');
                }

                return match;
            });
        }

        return fixedContent;
    }

    // Создает vendor.mjs файлы для директорий (только если включено)
    async createIndexFiles() {
        if (!this.generateIndexFiles) {
            this.log('ℹ️ Index file generation disabled');
            return 0;
        }

        this.log('📁 Creating index files for directories...');

        try {
            const { readdir, stat, writeFile } = await import('fs/promises');
            const directories = await this.getAllDirectories(this.distDir);
            let createdCount = 0;

            for (const dir of directories) {
                try {
                    // Пропускаем корневую директорию dist
                    if (dir === this.distDir) continue;

                    const indexPath = join(dir, 'index.js');

                    // Если vendor.mjs уже существует, пропускаем
                    if (existsSync(indexPath)) continue;

                    const items = await readdir(dir, { withFileTypes: true });
                    const exportableFiles = items.filter(item =>
                        item.isFile() &&
                        !item.name.endsWith('.d.ts') &&
                        !item.name.endsWith('.map') &&
                        item.name !== 'index.js'
                    );

                    if (exportableFiles.length > 0) {
                        const exports = exportableFiles.map(file => {
                            const baseName = basename(file.name, extname(file.name));
                            return `export * from './${baseName}.js';`;
                        });

                        const indexContent = `// Auto-generated index file\n${exports.join('\n')}\n`;
                        await writeFile(indexPath, indexContent, 'utf8');
                        createdCount++;

                        if (this.verbose) {
                            this.log(`Created index: ${relative(this.distDir, indexPath)}`);
                        }
                    }
                } catch (error) {
                    this.log(`Cannot create index in ${dir}: ${error.message}`, 'warn');
                }
            }

            if (createdCount > 0) {
                this.log(`✅ Created ${createdCount} index files`, 'success');
            } else {
                this.log('ℹ️ No index files needed creation');
            }

            return createdCount;
        } catch (error) {
            this.log(`Cannot create index files: ${error.message}`, 'warn');
            return 0;
        }
    }

    // Получает все поддиректории
    async getAllDirectories(dir) {
        const directories = [dir];

        const scanDirectory = async (currentDir) => {
            try {
                const { readdir } = await import('fs/promises');
                const items = await readdir(currentDir, { withFileTypes: true });

                for (const item of items) {
                    if (item.isDirectory()) {
                        const fullPath = join(currentDir, item.name);
                        directories.push(fullPath);
                        await scanDirectory(fullPath);
                    }
                }
            } catch (error) {
                this.log(`Cannot scan directory ${currentDir}: ${error.message}`, 'warn');
            }
        };

        await scanDirectory(dir);
        return directories;
    }

    // Новый метод: генерирует vendor bundle через прямой вызов VendorCLI
    async generateVendorBundle() {
        // ПРОВЕРКА НОВОГО ПАРАМЕТРА
        if (!this.generateVendorBundleFlag) {
            this.log('🚫 Vendor bundle generation disabled (--no-vendor flag)');
            return { success: true, skipped: true };
        }

        this.log('📦 Generating vendor bundle...');

        try {
            // ОБНОВЛЕНО: Используем правильный путь в зависимости от платформы
            let vendorOutputPath;
            if (this.platform === 'browser') {
                vendorOutputPath = join(this.distDir, 'vendor.bundle.mjs');
            } else {
                vendorOutputPath = join(this.distDir, 'vendor.mjs');
            }

            const htmlFilePath = join(this.distDir, 'index.html');

            // Динамически импортируем vendor.mjs
            const vendorModule = await import('./vendor.mjs');

            // Создаем экземпляр VendorCLI
            const vendorCLI = new vendorModule.VendorCLI(this.projectRoot);

            // ОБНОВЛЕНО: Устанавливаем правильную платформу
            vendorCLI.vendorBundler.setPlatform(this.platform);

            // Запускаем сборку vendor bundle
            await vendorCLI.build(vendorOutputPath, htmlFilePath);

            // Проверяем результат
            if (existsSync(vendorOutputPath)) {
                this.log(`✅ Vendor bundle created (${this.platform}): ${vendorOutputPath}`, 'success');
                return {
                    success: true,
                    vendorPath: vendorOutputPath
                };
            } else {
                this.log(`❌ Vendor bundle not created at: ${vendorOutputPath}`, 'error');
                return {
                    success: false,
                    error: 'Vendor bundle file not found'
                };
            }

        } catch (error) {
            this.log(`❌ Vendor bundle generation error: ${error.message}`, 'error');
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Метод для обновления HTML с import map
    async updateHtmlImportMap(htmlFilePath, importMap) {
        try {
            const { readFile, writeFile } = await import('fs/promises');

            let htmlContent = await readFile(htmlFilePath, 'utf8');
            const importMapScript = `\n    <script type="importmap">\n${JSON.stringify(importMap, null, 4)}    </script>`;

            // Удаляем существующий import map если есть
            htmlContent = htmlContent.replace(/<script type="importmap">[^<]*<\/script>/g, '');

            // Вставляем новый import map перед первым script тегом
            const firstScriptIndex = htmlContent.indexOf('<script');
            if (firstScriptIndex !== -1) {
                htmlContent = htmlContent.slice(0, firstScriptIndex) + importMapScript + htmlContent.slice(firstScriptIndex);
            } else {
                // Если script тегов нет, добавляем в конец head
                const headCloseIndex = htmlContent.indexOf('</head>');
                if (headCloseIndex !== -1) {
                    htmlContent = htmlContent.slice(0, headCloseIndex) + importMapScript + htmlContent.slice(headCloseIndex);
                }
            }

            await writeFile(htmlFilePath, htmlContent, 'utf8');
            return true;
        } catch (error) {
            this.log(`Cannot update HTML import map: ${error.message}`, 'warn');
            return false;
        }
    }

    printStats() {
        const duration = Date.now() - this.stats.startTime;

        console.log('\n📊 Build Statistics:');
        console.log(`   ⏱️  Duration: ${duration}ms`);
        console.log(`   📦 Formats generated: ${this.stats.formatsGenerated}/${this.onlyEsm ? '1' : '2'}`);
        console.log(`   📄 Files processed: ${this.stats.filesProcessed}`);
        console.log(`   ❌ Errors: ${this.stats.errors}`);
        console.log(`   📍 Output: ${this.distDir}`);
        console.log(`   📄 TypeScript config: ${relative(this.projectRoot, this.tsConfigPath)}`);

        if (this.webComponents) {
            console.log(`   🎨 Mode: Web Components Bundle`);
        } else if (this.onlyEsm) {
            console.log(`   🎯 Mode: ESM (direct to dist)`);
        } else {
            console.log(`   📚 Mode: ESM + CJS`);
        }

        if (this.copyNonTsFiles) {
            console.log(`   📁 Non-TS files: Copied`);
        } else {
            console.log(`   📁 Non-TS files: Not copied`);
        }

        if (this.generateIndexFiles) {
            console.log(`   📁 Index files: Enabled`);
        } else {
            console.log(`   📁 Index files: Disabled`);
        }

        if (this.generateVendorBundleFlag) {
            console.log(`   📦 Vendor bundle: Generated (${this.platform})`);
        } else {
            console.log(`   📦 Vendor bundle: Not generated`);
        }

        if (this.stats.errors === 0) {
            console.log('✅ Build completed successfully!');
        } else {
            console.log('⚠️  Build completed with errors');
        }
    }

    async build() {
        // this.log('Starting ESBuild compilation...');
        // this.log(`Project root: ${this.projectRoot}`);
        // this.log(`Source directory: ${this.sourceDir}`);
        // this.log(`Output directory: ${this.distDir}`);
        // this.log(`TypeScript config: ${this.tsConfigPath}`);
        //
        // // ДОБАВЛЕНО: логирование платформы
        // if (this.platform === 'browser') {
        //     this.log(`🌐 Platform: Browser (vendor.bundle.mjs will be generated)`);
        // } else {
        //     this.log(`🖥️ Platform: Node.js (vendor.mjs will be generated)`);
        // }
        //
        // // Проверяем существование tsconfig.json
        // if (!existsSync(this.tsConfigPath)) {
        //     this.log(`❌ TypeScript configuration not found: ${this.tsConfigPath}`, 'error');
        //     return {
        //         success: false,
        //         error: `TypeScript configuration not found: ${this.tsConfigPath}`
        //     };
        // }

        // if (this.webComponents) {
        //     this.log(`🎨 Mode: Web Components Bundle`);
        // } else if (this.onlyEsm) {
        //     this.log(`🎯 Mode: ESM (direct to dist)`);
        // } else {
        //     this.log(`📚 Mode: ESM + CJS`);
        // }
        //
        // if (this.copyNonTsFiles) {
        //     this.log(`📁 Non-TypeScript files: Will be copied`);
        // } else {
        //     this.log(`📁 Non-TypeScript files: Will not be copied`);
        // }
        //
        // if (this.generateIndexFiles) {
        //     this.log(`📁 Index file generation: Enabled`);
        // } else {
        //     this.log(`📁 Index file generation: Disabled`);
        // }
        //
        // if (this.generateVendorBundleFlag) {
        //     this.log(`📦 Vendor bundle generation: Enabled`);
        // } else {
        //     this.log(`📦 Vendor bundle generation: Disabled`);
        // }
        //
        try {
            // Создаем выходные директории
            mkdirSync(this.distDir, { recursive: true });


            // Собираем форматы
            await this.buildFormats();

            // Копируем все не-TS файлы если включено или это веб-компоненты
            await this.copyNonTypeScriptFiles();

            // Копируем declaration files
            await this.copyDeclarationFiles();

            // Копируем статические файлы (без package.json)
            await this.copyStaticFiles();

            // Исправляем расширения импортов
            await this.fixImportExtensions();

            // Создаем index файлы для директорий (только если включено)
            await this.createIndexFiles();

            // Генерируем vendor bundle (только если включено)
            const vendorResult = await this.generateVendorBundle();

            this.printStats();

            return {
                success: this.stats.errors === 0 && vendorResult.success !== false,
                duration: Date.now() - this.stats.startTime,
                formats: this.stats.formatsGenerated,
                files: this.stats.filesProcessed,
                errors: this.stats.errors,
                onlyEsm: this.onlyEsm,
                webComponents: this.webComponents,
                copyNonTsFiles: this.copyNonTsFiles,
                generateIndexFiles: this.generateIndexFiles,
                generateVendorBundle: this.generateVendorBundleFlag,
                platform: this.platform,
                vendorResult: vendorResult.success !== false ? vendorResult : null
            };

        } catch (error) {
            this.log(`Build failed: ${error.message}`, 'error');
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// CLI обработчик
async function main() {
    const args = process.argv.slice(2);
    const options = {
        verbose: args.includes('--verbose') || args.includes('-v'),
        watch: args.includes('--watch') || args.includes('-w'),
        minify: args.includes('--minify') || args.includes('-m'),
        onlyEsm: !(args.includes('--cjs') || args.includes('--both')),
        webComponents: args.includes('--web-components') || args.includes('--wc'),
        generateIndexFiles: args.includes('--generate-index') || args.includes('--gi'),
        copyNonTsFiles: args.includes('--copy') || args.includes('-c'),

        // НОВЫЙ ПАРАМЕТР: отключение vendor bundle
        generateVendorBundle: !(args.includes('--no-vendor') || args.includes('--skip-vendor')),

        // ДОБАВЛЕНО: платформа для сборки
        platform: 'browser'
    };

    // Показать справку
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
🚀 ESBuild Builder for TypeScript Projects

Usage:
  node scripts/build.js [options]

Options:
  -h, --help              Show this help message
  -v, --verbose           Enable verbose logging
  -w, --watch             Watch for changes and rebuild
  -m, --minify            Minify output files
  -c, --copy              Copy all non-TypeScript files from src to dist
  -p, --platform <name>   Target platform: browser or node (default: node)
  --no-vendor, --skip-vendor  Skip vendor bundle generation
  --vendor, --with-vendor Generate vendor bundle (external dependencies)
  --cjs                   Build CJS format (in dist/cjs)
  --both                  Build both ESM and CJS formats
  --web-components, --wc  Build web components bundle
  --generate-index, --gi  Generate index.js files for directories

Examples:
  node scripts/build.js                              # ESM only in dist (default)
  node scripts/build.js --platform browser           # Browser platform
  node scripts/build.js --platform node --no-vendor  # Node.js without vendor
  node scripts/build.js --platform browser --copy    # Browser + copy files
  node scripts/build.js --vendor                     # Node.js + vendor bundle
  node scripts/build.js --cjs --no-vendor            # CJS format without vendor
  node scripts/build.js --both --skip-vendor         # Both formats without vendor
  node scripts/build.js --web-components             # Web components bundle
  node scripts/build.js --generate-index             # With index file generation
  node scripts/build.js --verbose                    # Verbose build
  node scripts/build.js --watch                      # Watch mode
  node scripts/build.js --minify                     # Minified build

Features:
  • Default: ESM format directly in dist directory
  • Platform: Supports browser and node platforms
  • Copy: Copy CSS, HTML, JSON, fonts, etc. from src to dist
  • Vendor: Generate vendor bundle for external dependencies (default: ON)
  • No-Vendor: Skip vendor bundle generation for faster builds
  • Web Components: Bundle all components for browser
  • Index files: Optional generation (disabled by default)
  • Uses project tsconfig.json for TypeScript configuration
  • Preserves import structure (no bundling for regular builds)
  • Automatic import extension fixing
  • Declaration file copying
  • Source maps generation
  • Watch mode for development
        `.trim());
        return;
    }

    const builder = new ESBuildBuilder(options);
    const result = await builder.build();

    if (!result.success) {
        process.exit(1);
    }
}

// Запуск если файл выполняется напрямую
main().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
});

export { ESBuildBuilder };