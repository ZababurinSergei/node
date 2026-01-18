import { FileUtils } from '../utils/index.js';
import { isPackageExcluded } from './excluded-packages.js';
// Локальная константа вместо импорта (временное решение)
const browserPolyfills = {
    // Пустые заглушки для Node.js модулей
    buffer: () => ({}),
    stream: () => ({}),
    process: () => ({}),
    util: () => ({}),
    events: () => ({}),
    crypto: () => ({}),
    path: () => ({}),
    fs: () => ({}),
    net: () => ({}),
    tls: () => ({}),
    child_process: () => ({}),
    dgram: () => ({}),
    dns: () => ({}),
    http: () => ({}),
    https: () => ({}),
    os: () => ({}),
    zlib: () => ({}),
    vm: () => ({}),
    module: () => ({}),
    perf_hooks: () => ({}),
    worker_threads: () => ({}),
    readline: () => ({}),
    repl: () => ({}),
    timers: () => ({}),
    querystring: () => ({}),
    cluster: () => ({}),
    v8: () => ({})
};

export class VendorIndexGenerator {
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
    }

    async generateVendorIndex(dependencies, platform = 'browser') {
        if (dependencies.size === 0) {
            return this.generateFallbackIndex(platform);
        }

        // Filter out invalid dependencies
        const validDependencies = new Map();
        for (const [pkgName, dep] of dependencies) {
            if (this.isValidForBundle(pkgName, platform)) {
                validDependencies.set(pkgName, dep);
            } else {
                console.log(`🚫 Excluding ${pkgName} from ${platform} vendor bundle`);
            }
        }

        if (validDependencies.size === 0) {
            return this.generateFallbackIndex(platform);
        }

        const exports = [];
        const infoExports = [];

        console.log(`📦 Processing ${validDependencies.size} dependencies`);

        // Сортировка зависимостей для стабильного порядка
        const sortedDeps = Array.from(validDependencies.keys()).sort();

        // ВАЖНО: Реэкспортируем ВСЕ именованные экспорты из каждого пакета
        for (const pkgName of sortedDeps) {
            console.log(`📦 Exporting: ${pkgName}`);
            exports.push(`export * from '${pkgName}';`);
        }

        // Vendor metadata
        infoExports.push(`export const VENDOR_INFO = {
  generatedAt: '${new Date().toISOString()}',
  dependencies: ${JSON.stringify(sortedDeps)},
  totalDependencies: ${sortedDeps.length},
  buildType: 'vendor-bundle',
  platform: '${platform}'
};`);

        // Utility functions
        infoExports.push(`\n// Utility to check if a dependency is available
export function hasDependency(name) {
  return VENDOR_INFO.dependencies.includes(name);
}

// Vendor initialization status
export const VENDOR_STATUS = {
  initialized: true,
  timestamp: Date.now(),
  dependenciesLoaded: ${sortedDeps.length}
};`);

        const content = `// Vendor Index - Auto-generated
// External dependencies for the project
// Generated: ${new Date().toISOString()}
// Project: ${this.projectRoot}
// Platform: ${platform}

${exports.join('\n')}

${infoExports.join('\n')}

// Vendor initialization
console.log('✅ Vendor index loaded with ${sortedDeps.length} dependencies:', VENDOR_INFO.dependencies);

// Export VENDOR_INFO as default for compatibility
export default {
  VENDOR_INFO,
  VENDOR_STATUS,
  hasDependency
};
`;

        return content;
    }

    isValidForBundle(packageName, platform) {
        return !isPackageExcluded(packageName, platform);
    }

    toValidIdentifier(str) {
        // Заменяем все недопустимые символы на подчеркивания
        let identifier = str.replace(/[^a-zA-Z0-9_]/g, '_');
        // Убираем двойные подчеркивания
        identifier = identifier.replace(/_+/g, '_');
        // Убираем подчеркивание в начале и конце
        identifier = identifier.replace(/^_+|_+$/g, '');
        // Если начинается с цифры, добавляем _
        if (/^[0-9]/.test(identifier)) {
            identifier = '_' + identifier;
        }
        // Если пустой, создаем случайное имя
        if (identifier === '') {
            identifier = 'vendor_' + Math.random().toString(36).substr(2, 9);
        }
        return identifier;
    }

    isReservedWord(word) {
        const reservedWords = [
            'package', 'function', 'class', 'return', 'if', 'else', 'for', 'while',
            'do', 'switch', 'case', 'default', 'break', 'continue', 'var', 'let',
            'const', 'import', 'export', 'from', 'as', 'in', 'of', 'typeof', 'void',
            'delete', 'new', 'this', 'super', 'extends', 'instanceof', 'try', 'catch',
            'finally', 'throw', 'debugger', 'with', 'yield', 'await', 'async', 'static',
            'public', 'private', 'protected', 'interface', 'implements', 'enum'
        ];
        return reservedWords.includes(word);
    }

    generateFallbackIndex(platform) {
        return `// Fallback Vendor Index
// Auto-generated: ${new Date().toISOString()}
// No external dependencies found in project: ${this.projectRoot}
// Platform: ${platform}

// Mock implementations for common dependencies
export const libp2pLogger = {
  info: (...args) => console.log('[libp2p]', ...args),
  warn: (...args) => console.warn('[libp2p]', ...args),
  error: (...args) => console.error('[libp2p]', ...args),
  debug: (...args) => console.debug('[libp2p]', ...args),
  trace: (...args) => console.trace('[libp2p]', ...args)
};

export const react = {
  createElement: (...args) => {
    console.warn('⚠️ Using React mock - install react package for full functionality');
    return { type: 'mock-element', props: args[1], children: args[2] };
  },
  useState: (initial) => [initial, () => {}],
  useEffect: (fn, deps) => fn(),
  useRef: (initial) => ({ current: initial })
};

export const VENDOR_INFO = {
  generatedAt: '${new Date().toISOString()}',
  dependencies: [],
  totalDependencies: 0,
  buildType: 'fallback-vendor',
  platform: '${platform}',
  usingMocks: true
};

export const VENDOR_STATUS = {
  initialized: true,
  timestamp: Date.now(),
  dependenciesLoaded: 0,
  usingFallback: true
};

// Utility functions
export function hasDependency(name) {
  return false;
}

export function getDependencyInfo(name) {
  return { available: false };
}

// Fallback initialization
console.warn('⚠️ Using fallback vendor index - no external dependencies found in package.json or source files');

export default {
  VENDOR_INFO,
  VENDOR_STATUS,
  hasDependency,
  getDependencyInfo,
  libp2pLogger,
  react
};
`;
    }

    async saveVendorIndex(content, platform = 'browser') {
        // Используем ту же директорию, что и для vendor bundle
        const outputDir = platform === 'node' ? './dist/node' : './dist/browser';
        const vendorDir = `${outputDir}/vendor`;
        const indexPath = `${vendorDir}/index.js`;
        FileUtils.ensureDir(vendorDir);
        FileUtils.writeFile(indexPath, content);
        console.log(`📁 Vendor directory: ${vendorDir}`);
        console.log(`📄 Vendor index saved: ${indexPath}`);
        console.log(`🎯 Platform: ${platform}`);
        console.log(`📏 File size: ${(content.length / 1024).toFixed(2)} KB`);
        return indexPath;
    }

    async saveVendorIndexToDir(content, outputDir, platform = 'browser') {
        const vendorDir = `${outputDir}/vendor`;
        const indexPath = `${vendorDir}/index.js`;
        FileUtils.ensureDir(vendorDir);
        FileUtils.writeFile(indexPath, content);
        console.log(`📁 Vendor directory: ${vendorDir}`);
        console.log(`📄 Vendor index saved: ${indexPath}`);
        console.log(`🎯 Platform: ${platform}`);
        console.log(`📏 File size: ${(content.length / 1024).toFixed(2)} KB`);
        return indexPath;
    }

    async generateAndSave(dependencies, platform = 'browser') {
        const content = await this.generateVendorIndex(dependencies, platform);
        const indexPath = await this.saveVendorIndex(content, platform);
        return {
            indexPath,
            content,
            dependenciesCount: dependencies.size
        };
    }
}