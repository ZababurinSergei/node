/**
 * Abstract base class for bundle builders
 * Provides common functionality and interface for all bundle builders
 */
export class BundleBuilder {
    /**
     * Common validation for bundle configuration
     */
    validateConfig(config) {
        if (!config.entryPoint) {
            throw new Error('Bundle config must have an entryPoint');
        }
        if (!config.outfile) {
            throw new Error('Bundle config must have an outfile');
        }
        if (!config.platform) {
            throw new Error('Bundle config must specify platform (browser or node)');
        }
        if (!config.format) {
            throw new Error('Bundle config must specify format (esm or cjs)');
        }
        // Validate platform and format compatibility
        if (config.platform === 'node' && config.format === 'esm') {
            console.warn('⚠️ Using ESM format for Node.js platform - ensure Node.js version supports ESM');
        }
        if (config.platform === 'browser' && config.format === 'cjs') {
            console.warn('⚠️ Using CJS format for browser platform - consider using ESM for better compatibility');
        }
    }
    /**
     * Calculate file size in human readable format
     */
    formatFileSize(bytes) {
        if (bytes === 0)
            return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    /**
     * Generate build statistics
     */
    generateBuildStats(success, outputPath, size = 0, duration = 0, dependencies = 0) {
        if (!success) {
            return undefined;
        }
        return {
            size,
            duration,
            dependencies,
            formattedSize: this.formatFileSize(size),
            formattedDuration: `${duration}ms (${(duration / 1000).toFixed(2)}s)`,
            outputFiles: outputPath ? [outputPath] : [],
            inputFiles: []
        };
    }
    /**
     * Common error handler for build processes
     */
    handleBuildError(error, config) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown build error';
        console.error(`❌ Build failed for ${config.entryPoint}:`, errorMessage);
        if (error instanceof Error && error.stack) {
            console.error('Stack trace:', error.stack);
        }
        return {
            success: false,
            error: errorMessage
        };
    }
    /**
     * Log build success information
     */
    logBuildSuccess(config, stats) {
        console.log(`✅ Build completed: ${config.outfile}`);
        if (stats) {
            console.log(`📊 Size: ${stats.formattedSize || this.formatFileSize(stats.size)}`);
            console.log(`⏱️ Duration: ${stats.formattedDuration || `${stats.duration}ms`}`);
            console.log(`📦 Dependencies: ${stats.dependencies}`);
        }
        console.log(`🎯 Platform: ${config.platform}`);
        console.log(`📝 Format: ${config.format}`);
        console.log(`🔧 Minify: ${config.minify ? 'Yes' : 'No'}`);
        console.log(`🗺️ Sourcemap: ${config.sourcemap ? 'Yes' : 'No'}`);
        if (config.external && config.external.length > 0) {
            console.log(`🚫 External: ${config.external.join(', ')}`);
        }
    }
    /**
     * Log build start information
     */
    logBuildStart(config) {
        console.log(`🚀 Starting build...`);
        console.log(`📁 Entry: ${config.entryPoint}`);
        console.log(`📁 Output: ${config.outfile}`);
        console.log(`🎯 Platform: ${config.platform}`);
        console.log(`📝 Format: ${config.format}`);
        console.log(`🔧 Minify: ${config.minify}`);
        console.log(`🗺️ Sourcemap: ${config.sourcemap}`);
        if (config.external && config.external.length > 0) {
            console.log(`🚫 External dependencies: ${config.external.length}`);
        }
    }
    /**
     * Check if file exists at path (for pre-build validation)
     */
    async checkEntryPointExists(entryPoint) {
        try {
            // Use dynamic import for fs to avoid CommonJS/ESM conflicts
            const fs = await import('fs');
            return fs.existsSync(entryPoint);
        }
        catch {
            return false;
        }
    }
    /**
     * Ensure output directory exists
     */
    async ensureOutputDir(outfile) {
        try {
            const path = await import('path');
            const fs = await import('fs');
            const outputDir = path.dirname(outfile);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
                console.log(`📁 Created output directory: ${outputDir}`);
            }
        }
        catch (error) {
            console.warn(`⚠️ Could not ensure output directory: ${error}`);
        }
    }
    /**
     * Get file extension based on format and platform
     */
    getFileExtension(config) {
        if (config.outfile.includes('.')) {
            return ''; // User specified extension
        }
        const extensions = {
            browser: {
                esm: '.mjs',
                cjs: '.js'
            },
            node: {
                esm: '.mjs',
                cjs: '.js'
            }
        };
        return extensions[config.platform]?.[config.format] || '.js';
    }
    /**
     * Normalize output file path with proper extension
     */
    normalizeOutputPath(config) {
        const extension = this.getFileExtension(config);
        if (!config.outfile.endsWith(extension)) {
            return config.outfile.replace(/\.[^/.]+$/, '') + extension;
        }
        return config.outfile;
    }
    /**
     * Create fallback bundle when build fails
     */
    async createFallbackBundle(config, error) {
        console.warn(`🔄 Creating fallback bundle for: ${config.entryPoint}`);
        try {
            const fs = await import('fs');
            const fallbackContent = this.generateFallbackContent(config, error);
            const fallbackPath = config.outfile.replace(/\.(js|mjs)$/, '.fallback.$1');
            await this.ensureOutputDir(fallbackPath);
            fs.writeFileSync(fallbackPath, fallbackContent, 'utf8');
            console.log(`✅ Fallback bundle created: ${fallbackPath}`);
            return {
                success: false,
                outputPath: fallbackPath,
                error: `Original build failed, fallback created: ${error}`
            };
        }
        catch (fallbackError) {
            console.error('❌ Failed to create fallback bundle:', fallbackError);
            return {
                success: false,
                error: `Build failed and fallback creation also failed: ${error}`
            };
        }
    }
    /**
     * Generate content for fallback bundle
     */
    generateFallbackContent(config, error) {
        const timestamp = new Date().toISOString();
        return `// Fallback Bundle - Auto-generated
// Original build failed: ${error}
// Generated: ${timestamp}
// Entry: ${config.entryPoint}
// Platform: ${config.platform}
// Format: ${config.format}

console.error('⚠️ Using fallback bundle - original build failed:', ${JSON.stringify(error)});

// Export empty objects for common patterns
export const fallbackExports = {
  generatedAt: '${timestamp}',
  isFallback: true,
  originalError: ${JSON.stringify(error)}
};

// Default export
export default fallbackExports;

// CommonJS fallback
if (typeof module !== 'undefined' && module.exports) {
  module.exports = fallbackExports;
}

console.log('✅ Fallback bundle loaded');
`;
    }
    /**
     * Get build environment information
     */
    getBuildEnvironment() {
        return {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            cwd: process.cwd(),
            timestamp: new Date().toISOString(),
            // Add any other relevant environment info
        };
    }
    /**
     * Performance monitoring wrapper
     */
    async withPerformanceMonitoring(operation, operationName) {
        const startTime = Date.now();
        try {
            const result = await operation();
            const duration = Date.now() - startTime;
            console.log(`⏱️ ${operationName} completed in ${duration}ms`);
            return { result, duration };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            console.error(`⏱️ ${operationName} failed after ${duration}ms:`, error);
            throw error;
        }
    }
}
//# sourceMappingURL=bundle-builder.js.map