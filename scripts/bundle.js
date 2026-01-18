#!/usr/bin/env node

import { build } from 'esbuild';
import { writeFileSync, mkdirSync, existsSync, readFileSync, statSync, readdirSync } from 'fs';
import { join, dirname, relative, extname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class CSSBundler {
    constructor(basePath) {
        this.basePath = basePath;
        this.cssContent = new Map();
        this.componentCSSMap = new Map();
        this.fileDependencies = new Map();
    }

    // Находим все CSS файлы в проекте, включая @import
    async findCSSFiles(dir) {
        const files = new Set();
        const importedFiles = new Set();

        const scanCSSImports = (content, baseDir) => {
            const importRegex = /@import\s+(?:url\()?['"]([^'"]+\.css)['"]\)?/g;
            let match;
            while ((match = importRegex.exec(content)) !== null) {
                const importPath = match[1];
                let resolvedPath;

                if (importPath.startsWith('./') || importPath.startsWith('../')) {
                    resolvedPath = join(baseDir, importPath);
                } else {
                    resolvedPath = join(dir, importPath);
                }

                const normalizedPath = resolve(resolvedPath);
                if (!importedFiles.has(normalizedPath)) {
                    importedFiles.add(normalizedPath);
                    if (existsSync(normalizedPath)) {
                        try {
                            const importContent = readFileSync(normalizedPath, 'utf-8');
                            scanCSSImports(importContent, dirname(normalizedPath));
                            files.add(normalizedPath);
                        } catch (error) {
                            console.warn(`⚠️ Cannot read imported CSS file ${normalizedPath}:`, error.message);
                        }
                    }
                }
            }
        };

        const scanDirectory = (currentDir) => {
            try {
                const entries = readdirSync(currentDir, { withFileTypes: true });

                for (const entry of entries) {
                    const fullPath = join(currentDir, entry.name);

                    if (entry.isDirectory()) {
                        if (!entry.name.includes('node_modules') && !entry.name.startsWith('.')) {
                            scanDirectory(fullPath);
                        }
                    } else if (entry.isFile() && extname(entry.name) === '.css') {
                        files.add(fullPath);

                        try {
                            const content = readFileSync(fullPath, 'utf-8');
                            scanCSSImports(content, dirname(fullPath));
                        } catch (error) {
                            console.warn(`⚠️ Cannot read CSS file ${fullPath}:`, error.message);
                        }
                    }
                }
            } catch (error) {
                console.warn(`⚠️ Cannot scan directory ${currentDir}:`, error.message);
            }
        };

        scanDirectory(dir);

        const allFiles = Array.from(files);
        console.log(`🎨 Found ${allFiles.length} CSS files (including imports)`);

        return allFiles;
    }

    // Обрабатываем CSS файлы и создаем карту компонентов
    async processCSSFiles(cssFiles) {
        const processedFiles = new Set();

        const processFile = async (filePath) => {
            if (processedFiles.has(filePath)) {
                return;
            }

            try {
                let content = readFileSync(filePath, 'utf-8');
                const relativePath = relative(this.basePath, filePath);

                content = await this.processCSSImports(content, dirname(filePath));

                this.cssContent.set(relativePath, content);
                processedFiles.add(filePath);

                const componentName = this.extractComponentName(relativePath);
                if (componentName) {
                    if (!this.componentCSSMap.has(componentName)) {
                        this.componentCSSMap.set(componentName, []);
                    }
                    this.componentCSSMap.get(componentName).push(relativePath);
                }

                console.log(`  📄 Processed CSS: ${relativePath}`);
            } catch (error) {
                console.warn(`⚠️ Cannot process CSS file ${filePath}:`, error.message);
            }
        };

        for (const filePath of cssFiles) {
            await processFile(filePath);
        }
    }

    // Обрабатывает импорты в CSS файлах
    async processCSSImports(content, baseDir) {
        const importRegex = /@import\s+(?:url\()?['"]([^'"]+\.css)['"]\)?/g;
        let processedContent = content;
        let match;

        while ((match = importRegex.exec(content)) !== null) {
            const importPath = match[0];
            const importFile = match[1];
            let resolvedPath;

            if (importFile.startsWith('./') || importFile.startsWith('../')) {
                resolvedPath = join(baseDir, importFile);
            } else {
                resolvedPath = join(this.basePath, importFile);
            }

            try {
                const resolvedPathNormalized = resolve(resolvedPath);
                if (existsSync(resolvedPathNormalized)) {
                    let importContent = readFileSync(resolvedPathNormalized, 'utf-8');

                    importContent = await this.processCSSImports(importContent, dirname(resolvedPathNormalized));

                    processedContent = processedContent.replace(importPath, importContent);
                    console.log(`    ↳ Inlined import: ${importFile}`);
                } else {
                    console.warn(`    ↳ Import not found: ${importFile} (from ${baseDir})`);
                }
            } catch (error) {
                console.warn(`    ↳ Error processing import ${importFile}:`, error.message);
            }
        }

        return processedContent;
    }

    // Извлекаем имя компонента из пути к CSS
    extractComponentName(cssPath) {
        const patterns = [
            /components\/([^\/]+)\/css\//,
            /src\/components\/([^\/]+)\/css\//,
            /components\/([^\/]+)\//,
            /([^\/]+)\/css\//
        ];

        for (const pattern of patterns) {
            const match = cssPath.match(pattern);
            if (match) {
                return match[1];
            }
        }

        const dirName = dirname(cssPath);
        const baseName = basename(dirName);

        if (baseName === 'css' || baseName === 'styles') {
            const parentDir = dirname(dirName);
            return basename(parentDir);
        }

        return baseName;
    }

    // Генерируем единый CSS бандл
    generateCSSBundle() {
        let bundle = '/* CSS Bundle - Generated by Bundle Script */\n';
        bundle += '/* This bundle includes all CSS files and their imports */\n\n';

        for (const [filePath, content] of this.cssContent) {
            bundle += `/* === ${filePath} === */\n`;
            bundle += content;
            bundle += '\n\n';
        }

        return bundle;
    }

    // Создаем виртуальный модуль для CSS с улучшенным API
    createVirtualCSSModule() {
        const cssBundle = this.generateCSSBundle();
        const cssPaths = Array.from(this.cssContent.keys());
        const componentMap = Object.fromEntries(this.componentCSSMap);

        return `
// Virtual CSS Module - Auto-generated
// Includes ${cssPaths.length} CSS files for ${Object.keys(componentMap).length} components

const cssContent = ${JSON.stringify(cssBundle)};
const cssPaths = ${JSON.stringify(cssPaths)};
const componentCSSMap = ${JSON.stringify(componentMap)};

/**
 * Get CSS content by exact file path
 */
export function getCSSByPath(filePath) {
    const normalizedPath = filePath.replace(/\\\\/g, '/');
    
    const exactMatch = cssPaths.find(path => path.replace(/\\\\/g, '/') === normalizedPath);
    if (exactMatch) {
        return extractCSSForFile(exactMatch);
    }
    
    const partialMatch = cssPaths.find(path => path.replace(/\\\\/g, '/').includes(normalizedPath));
    if (partialMatch) {
        return extractCSSForFile(partialMatch);
    }
    
    return null;
}

/**
 * Get CSS for specific component
 */
export function getCSSForComponent(componentName) {
    const componentPaths = componentCSSMap[componentName];
    if (!componentPaths) return null;
    
    return componentPaths.map(path => getCSSByPath(path)).filter(Boolean).join('\\n');
}

/**
 * Get all CSS content
 */
export function getAllCSS() {
    return cssContent;
}

/**
 * Get CSS paths for a component
 */
export function getCSSPathsForComponent(componentName) {
    return componentCSSMap[componentName] || [];
}

/**
 * Check if CSS path exists
 */
export function hasCSSPath(filePath) {
    const normalizedPath = filePath.replace(/\\\\/g, '/');
    return cssPaths.some(path => path.replace(/\\\\/g, '/').includes(normalizedPath));
}

/**
 * Get multiple CSS files
 */
export function getMultipleCSS(paths) {
    return paths.map(path => getCSSByPath(path)).filter(Boolean).join('\\n');
}

/**
 * Get all component names
 */
export function getComponentNames() {
    return Object.keys(componentCSSMap);
}

/**
 * Inject all CSS into document
 */
export function injectCSS() {
    if (typeof document !== 'undefined') {
        const style = document.createElement('style');
        style.textContent = cssContent;
        style.id = 'virtual-css-bundle';
        document.head.appendChild(style);
    }
}

/**
 * Extract CSS for specific file
 */
function extractCSSForFile(filePath) {
    const startMarker = '/* === ' + filePath + ' === */';
    const startIndex = cssContent.indexOf(startMarker);
    
    if (startIndex === -1) {
        const oldMarker = '/* ' + filePath + ' */';
        const oldStartIndex = cssContent.indexOf(oldMarker);
        if (oldStartIndex === -1) return null;
        
        return extractBetweenMarkers(oldStartIndex, oldMarker);
    }
    
    return extractBetweenMarkers(startIndex, startMarker);
}

/**
 * Helper to extract CSS between markers
 */
function extractBetweenMarkers(startIndex, marker) {
    const markerLength = marker.length;
    const contentStart = startIndex + markerLength;
    let endIndex = cssContent.length;
    
    const nextFileMarkerIndex = cssContent.indexOf('/* === ', contentStart);
    if (nextFileMarkerIndex !== -1) {
        endIndex = nextFileMarkerIndex;
    }
    
    const content = cssContent.substring(contentStart, endIndex).trim();
    return content || null;
}

export default {
    getCSSByPath,
    getCSSForComponent,
    getAllCSS,
    getCSSPathsForComponent,
    hasCSSPath,
    getMultipleCSS,
    getComponentNames,
    injectCSS,
    cssPaths,
    componentCSSMap
};
`;
    }
}

class UniversalBundler {
    constructor(options = {}) {
        this.srcDir = options.srcDir || resolve(__dirname, '../src');
        this.distDir = options.distDir || resolve(__dirname, '../bundle');
        this.projectRoot = process.cwd();
        this.cssBundler = new CSSBundler(this.srcDir);
    }

    async createUniversalBundle(outputFileName = 'bundle', options = {}) {
        console.log('⚡ Creating single bundle with all dependencies...');
        console.log(`📁 Source directory: ${this.srcDir}`);
        console.log(`📁 Output directory: ${this.distDir}`);

        this.ensureDirectory(this.distDir);

        const entryPoint = join(this.srcDir, 'index.ts');

        if (!existsSync(entryPoint)) {
            console.error('❌ Entry point not found:', entryPoint);
            process.exit(1);
        }

        console.log(`📁 Entry point: ${entryPoint}`);

        let cssPlugin = null;
        if (options.virtualCss) {
            try {
                const cssFiles = await this.cssBundler.findCSSFiles(this.srcDir);
                console.log(`🎨 Found ${cssFiles.length} CSS files in ${this.srcDir}`);

                if (cssFiles.length > 0) {
                    await this.cssBundler.processCSSFiles(cssFiles);

                    const self = this;
                    cssPlugin = {
                        name: 'virtual-css',
                        setup(build) {
                            build.onResolve({ filter: /^virtual:css$/ }, args => {
                                return { path: 'virtual:css', namespace: 'virtual-css' };
                            });

                            build.onLoad({ filter: /^virtual:css$/, namespace: 'virtual-css' }, () => {
                                return {
                                    contents: self.cssBundler.createVirtualCSSModule(),
                                    loader: 'js'
                                };
                            });
                        }
                    };
                }
            } catch (error) {
                console.warn('⚠️ CSS processing skipped:', error.message);
            }
        } else {
            console.log('🎨 Virtual CSS disabled (use --virtual-css to enable)');
        }

        const packageJsonPath = join(this.projectRoot, 'package.json');
        if (!existsSync(packageJsonPath)) {
            console.error('❌ package.json not found');
            process.exit(1);
        }

        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        const dependencies = Object.keys(packageJson.dependencies || {});

        console.log(`📦 Found ${dependencies.length} dependencies`);

        try {
            const buildConfig = {
                entryPoints: [entryPoint],
                bundle: true,
                outfile: join(this.distDir, `${outputFileName}.mjs`),
                platform: 'browser',
                format: 'esm',
                minify: true,
                target: ['es2022', 'chrome114', 'firefox115', 'safari14'],
                treeShaking: true,
                sourcemap: true,
                define: {
                    'process.env.NODE_ENV': '"production"'
                },
                loader: {
                    '.css': 'text',
                    '.html': 'text',
                    '.json': 'json'
                },
                supported: {
                    'top-level-await': true
                },
                resolveExtensions: ['.ts', '.js', '.mjs', '.cjs', '.json', '.css']
            };

            if (cssPlugin) {
                buildConfig.plugins = [cssPlugin];

                buildConfig.plugins.push({
                    name: 'css-import-resolver',
                    setup(build) {
                        build.onLoad({ filter: /\.css$/ }, async (args) => {
                            try {
                                const contents = readFileSync(args.path, 'utf-8');

                                const importRegex = /@import\s+(?:url\()?['"]([^'"]+\.css)['"]\)?/g;
                                let processedContents = contents;
                                let match;

                                while ((match = importRegex.exec(contents)) !== null) {
                                    const importPath = match[0];
                                    const importFile = match[1];
                                    processedContents = processedContents.replace(importPath, `/* Import resolved: ${importFile} */`);
                                }

                                return {
                                    contents: `export default ${JSON.stringify(processedContents)};`,
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
                });
            }

            await build(buildConfig);
            console.log(`   ✅ ${outputFileName}.mjs (Single bundle with all dependencies)`);

            console.log('\n✅ Bundle created successfully:');
            console.log(`   📦 ${outputFileName}.mjs (Single file with all dependencies)`);
            console.log(`   📊 Includes: ${dependencies.length} dependencies`);
            console.log(`   🎨 CSS: ${options.virtualCss ? 'Virtual CSS module included' : 'No CSS'}`);

            this.generateBuildInfo(outputFileName, dependencies, options);

            this.showFileSizes(outputFileName, options);

        } catch (error) {
            console.error('❌ Bundle creation failed:', error);
            process.exit(1);
        }
    }

    generateBuildInfo(outputFileName, dependencies, options) {
        const buildInfo = {
            name: outputFileName,
            timestamp: new Date().toISOString(),
            paths: {
                source: this.srcDir,
                output: this.distDir
            },
            output: {
                file: `${outputFileName}.mjs`,
                format: 'esm',
                platform: 'browser'
            },
            build: {
                tool: 'esbuild',
                target: ['es2022', 'chrome114', 'firefox115', 'safari14'],
                minify: true,
                treeShaking: true,
                bundle: true,
                virtualCss: options.virtualCss || false,
                supportsTopLevelAwait: true
            },
            includes: {
                dependencies: dependencies,
                totalDependencies: dependencies.length,
                cssFiles: this.cssBundler.cssContent.size,
                virtualCss: options.virtualCss
            }
        };

        writeFileSync(
            join(this.distDir, `${outputFileName}.info.json`),
            JSON.stringify(buildInfo, null, 2)
        );

        console.log(`   📄 ${outputFileName}.info.json (Build info)`);
    }

    showFileSizes(outputFileName, options) {
        const files = [
            `${outputFileName}.mjs`,
            `${outputFileName}.info.json`
        ];

        console.log('\n📊 File sizes:');
        let hasFiles = false;

        files.forEach(file => {
            const filePath = join(this.distDir, file);
            if (existsSync(filePath)) {
                const stats = statSync(filePath);
                const size = (stats.size / 1024).toFixed(2);
                console.log(`   ${file}: ${size} KB`);
                hasFiles = true;
            } else {
                console.log(`   ${file}: ❌ NOT FOUND`);
            }
        });

        if (!hasFiles) {
            console.log('   ⚠️ No bundle files were created');
        }
    }

    ensureDirectory(path) {
        if (!existsSync(path)) {
            mkdirSync(path, { recursive: true });
        }
    }
}

function basename(path) {
    return path.split('/').pop().split('\\').pop();
}

/**
 * Проверяет CSS файлы на наличие импортов
 */
function checkCSSImports() {
    const srcDir = resolve(__dirname, '../src');
    const cssFiles = [];

    const scanDir = (dir) => {
        const items = readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
            const fullPath = join(dir, item.name);
            if (item.isDirectory() && !item.name.includes('node_modules')) {
                scanDir(fullPath);
            } else if (item.isFile() && extname(item.name) === '.css') {
                cssFiles.push(fullPath);
            }
        }
    };

    scanDir(srcDir);

    console.log('\n🔍 Checking CSS imports:');
    for (const cssFile of cssFiles) {
        try {
            const content = readFileSync(cssFile, 'utf-8');
            const importRegex = /@import\s+(?:url\()?['"]([^'"]+\.css)['"]\)?/g;
            const imports = content.match(importRegex);

            if (imports) {
                console.log(`  ${relative(srcDir, cssFile)} has imports:`);
                imports.forEach(imp => console.log(`    → ${imp}`));
            }
        } catch (error) {
            console.warn(`  ⚠️ Error reading ${cssFile}:`, error.message);
        }
    }
}

// CLI обработчик
async function main() {
    const args = process.argv.slice(2);
    let outputFileName = 'bundle';

    let srcDir = resolve(__dirname, '../src');
    let distDir = resolve(__dirname, '../bundle');

    const options = {
        onlyMjs: false,
        virtualCss: false,
        outputToExample: false,
        platform: 'browser'
    };

    // Парсим аргументы командной строки
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        switch (arg) {
            case '--help':
            case '-h':
                showHelp();
                return;

            case '--output':
            case '-o':
                outputFileName = args[++i] || 'bundle';
                outputFileName = outputFileName.replace(/\.[^/.]+$/, '');
                break;

            case '--name':
            case '-n':
                outputFileName = args[++i] || 'bundle';
                break;

            case '--src':
                srcDir = resolve(args[++i] || '../src');
                break;

            case '--dist':
                distDir = resolve(args[++i] || '../bundle');
                break;

            case '--only-mjs':
            case '--esm-only':
                options.onlyMjs = true;
                break;

            case '--virtual-css':
                options.virtualCss = true;
                break;

            case '--browser-only':
                options.platform = 'browser';
                break;

            case '--example':
                options.outputToExample = true;
                break;

            case '--check-css':
                checkCSSImports();
                process.exit(0);

            default:
                if (!arg.startsWith('-')) {
                    outputFileName = arg.replace(/\.[^/.]+$/, '');
                }
                break;
        }
    }

    console.log(`🎯 Generating ${options.platform} bundle (Single file)`);
    console.log(`📁 Source: ${srcDir}`);
    console.log(`📁 Destination: ${distDir}`);

    if (options.virtualCss) {
        console.log('🎨 Virtual CSS enabled');
    }

    if (options.outputToExample) {
        console.log('📁 Example HTML will be generated');
    }

    const bundler = new UniversalBundler({
        srcDir,
        distDir
    });

    await bundler.createUniversalBundle(outputFileName, options);
}

function showHelp() {
    console.log(`
🚀 Single File Bundle with All Dependencies

Создает единый файл сборки со всеми зависимостями и virtual:css

ИСПОЛЬЗОВАНИЕ:
  node scripts/bundle.js [options] [output-name]

ОПЦИИ:
  -h, --help           Показать эту справку
  --src <path>         Путь к исходным файлам (по умолчанию: ../src)
  --dist <path>        Путь для выходных файлов (по умолчанию: ../bundle)
  -o, --output <name>  Имя выходного файла (без расширения)
  -n, --name <name>    Альтернативное указание имени
  --only-mjs           Создать только ESM бандл (.mjs)
  --esm-only           Alias для --only-mjs
  --virtual-css        Включить поддержку virtual:css модуля
  --browser-only       Собрать только для браузера (по умолчанию)
  --example            Создать HTML файл примера
  --check-css          Проверить CSS импорты перед сборкой

ПРИМЕРЫ:
  # Сборка с путями по умолчанию
  node scripts/bundle.js
  
  # Сборка с указанием путей
  node scripts/bundle.js --src ../src --dist ../bundle
  
  # Сборка с virtual:css и проверкой импортов
  node scripts/bundle.js --virtual-css --src ./src --dist ./dist --check-css
  
  # Сборка с указанием имени файла
  node scripts/bundle.js --output my-app --src ../my-src --dist ../my-dist
  
  # Создание примера HTML
  node scripts/bundle.js --example -o example-app

СОЗДАВАЕМЫЕ ФАЙЛЫ:
  • <dist>/<name>.mjs          - Единый файл сборки со всеми зависимостями
  • <dist>/<name>.info.json    - Информация о сборке
  • example/index.html         - Пример HTML файл (с флагом --example)

ОСОБЕННОСТИ:
  • Все зависимости включены в один файл
  • Tree shaking и минификация
  • Source maps для отладки
  • Виртуальный модуль CSS (virtual:css) по флагу --virtual-css
  • Поддержка top-level await для современного JavaScript
  • Полифилы для Node.js модулей в браузере
  • Поддержка только ESM формата для браузера
  • Гибкие пути для исходников и выходных файлов
  • Автоматическая обработка CSS импортов (@import)

ВКЛЮЧАЕТ:
  • Все зависимости из package.json
  • Все компоненты проекта
  • CSS через virtual:css модуль (если включен)
  • CSS импорты автоматически разрешаются
  • Полифилы для Node.js API
    `.trim());
}

// Запуск
main().catch(console.error);

export { UniversalBundler };