/**
 * Excluded Packages Configuration
 * Centralized configuration for packages that should be excluded from vendor bundles
 */
export const EXCLUDED_PACKAGES = {
    // Always excluded (both browser and node)
    always: [
        '@types/*',
        'node:*',
        'fs', 'path', 'url', 'child_process', 'os', 'crypto', 'http', 'https',
        'net', 'dns', 'util', 'stream', 'buffer', 'events', 'module', 'assert',
        'querystring', 'zlib', 'tls', 'cluster', 'vm', 'perf_hooks', 'readline',
        'repl', 'timers', 'string_decoder', 'worker_threads',
        // Добавить эти Node.js built-in модули:
        'dgram', 'v8'
    ],
    // Browser-only exclusions (Node.js specific packages)
    browser: [
        'esbuild', 'typescript', 'webpack', 'rollup', 'vite',
        'jest', 'mocha', 'chai', 'ava', 'tape',
        'nodemon', 'pm2', 'forever',
        'sass', 'less', 'stylus', 'postcss',
        'fs-extra', 'chokidar',
        // Добавить проблемные пакеты:
        'multicast-dns', // Использует dgram - Node.js только
        'prom-client', // Использует v8 - Node.js только
        'express', // Node.js только
        'express-enqueue', // Node.js только
        'compression', // Node.js только
        'cors', // Node.js только
        'http-proxy', // Node.js только
        'dotenv', // Node.js только
        '@libp2p/tcp', // TCP только для Node.js
        '@libp2p/upnp-nat', // UPnP только для Node.js
        'stream-to-socket', // Node.js только
        // Добавить другие проблемные пакеты:
        'dns-packet', // Использует buffer
        'dns-over-http-resolver', // Node.js только
        'ws', // Node.js WebSocket сервер
        'ws-stream', // Зависит от ws
        'native-fetch', // Браузер имеет нативный fetch
        'native-websocket', // Браузер имеет нативный WebSocket
        'peer-id', // Есть браузерная версия
        'uint8arrays' // Есть браузерная версия
    ],
    // Node.js-only exclusions (build tools and dev dependencies)
    node: [
        'esbuild', 'typescript', 'webpack', 'rollup', 'vite',
        'jest', 'mocha', 'chai', 'ava', 'tape',
        'nodemon', 'pm2', 'forever',
        'sass', 'less', 'stylus', 'postcss',
        'fs-extra', 'chokidar'
    ]
};
/**
 * Convert wildcard pattern to regular expression
 */
function patternToRegex(pattern) {
    // Escape special regex characters
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Replace * with .*
    const regexStr = '^' + escaped.replace(/\\\*/g, '.*') + '$';
    return new RegExp(regexStr);
}
/**
 * Check if a package should be excluded from vendor bundle
 */
export function isPackageExcluded(packageName, platform) {
    // Check always excluded patterns
    for (const pattern of EXCLUDED_PACKAGES.always) {
        if (pattern.includes('*')) {
            const regex = patternToRegex(pattern);
            if (regex.test(packageName))
                return true;
        }
        else if (packageName === pattern) {
            return true;
        }
    }
    // Check platform-specific exclusions
    const platformExclusions = EXCLUDED_PACKAGES[platform];
    for (const pattern of platformExclusions) {
        if (pattern.includes('*')) {
            const regex = patternToRegex(pattern);
            if (regex.test(packageName))
                return true;
        }
        else if (packageName === pattern) {
            return true;
        }
    }
    return false;
}
/**
 * Get list of excluded packages for a specific platform
 */
export function getExcludedPackages(platform) {
    return [
        ...EXCLUDED_PACKAGES.always,
        ...EXCLUDED_PACKAGES[platform]
    ];
}
/**
 * Filter dependencies map to remove excluded packages
 */
export function filterExcludedDependencies(dependencies, platform) {
    const filtered = new Map();
    for (const [pkgName, dep] of dependencies) {
        if (!isPackageExcluded(pkgName, platform)) {
            filtered.set(pkgName, dep);
        }
    }
    return filtered;
}
/**
 * Log excluded packages for debugging
 */
export function logExcludedPackages(dependencies, platform) {
    const excluded = [];
    for (const [pkgName] of dependencies) {
        if (isPackageExcluded(pkgName, platform)) {
            excluded.push(pkgName);
        }
    }
    if (excluded.length > 0) {
        console.log(`🚫 Excluded ${excluded.length} packages from ${platform} vendor bundle:`);
        excluded.forEach(pkg => console.log(`   - ${pkg}`));
    }
}
//# sourceMappingURL=excluded-packages.js.map