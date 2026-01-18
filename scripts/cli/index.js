#!/usr/bin/env node
import { VendorBundler } from '../core/index.js';
import { FileUtils } from '../utils/index.js';
class VendorCLI {
    constructor(projectRoot = process.cwd()) {
        this.projectRoot = projectRoot;
        this.vendorBundler = new VendorBundler(projectRoot, 'browser');
    }
    async run() {
        const args = process.argv.slice(2);
        const command = args[0] || ''; // Добавляем fallback для command
        // Parse options
        const platform = this.parsePlatform(args);
        const outputDir = this.parseOutputDir(args, command, platform);
        // Set platform
        this.vendorBundler.setPlatform(platform);
        try {
            switch (command) {
                case 'build':
                    const outputPath = this.parseOption(args, '--output') || this.getDefaultOutputPath(platform);
                    const htmlPath = this.parseOption(args, '--html') || './dist/index.html';
                    await this.build(outputPath, htmlPath);
                    break;
                case 'importmap':
                    await this.generateImportMap(outputDir);
                    break;
                case 'analyze':
                    await this.analyze();
                    break;
                case 'clean':
                    await this.clean();
                    break;
                case 'version':
                    this.showVersion();
                    break;
                case 'help':
                case '--help':
                case '-h':
                default:
                    this.showHelp();
                    break;
            }
        }
        catch (error) {
            console.error('❌ CLI Error:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    }
    parsePlatform(args) {
        if (args.includes('--platform') || args.includes('-p')) {
            const platformIndex = args.findIndex(arg => arg === '--platform' || arg === '-p');
            const platform = args[platformIndex + 1];
            return platform === 'node' ? 'node' : 'browser';
        }
        return 'browser';
    }
    parseOutputDir(args, command, platform) {
        // Для importmap второй аргумент - это директория, а не файл
        if (command === 'importmap') {
            const outputIndex = args.findIndex(arg => arg === '--output' || arg === '-o');
            if (outputIndex !== -1 && args[outputIndex + 1]) {
                return args[outputIndex + 1]; // Добавляем non-null assertion
            }
            // Если аргумент передан напрямую (не как --option)
            const directArg = args[1];
            if (directArg && !directArg.startsWith('-')) {
                return directArg;
            }
            // Значение по умолчанию для importmap
            return this.getDefaultImportMapDir(platform);
        }
        // Для других команд используем стандартный парсинг
        return this.parseOption(args, '--output') || this.getDefaultOutputPath(platform);
    }
    parseOption(args, option) {
        const index = args.findIndex(arg => arg === option);
        return index !== -1 && args[index + 1] ? args[index + 1] : null; // Добавляем non-null assertion
    }
    getDefaultOutputPath(platform) {
        return platform === 'node'
            ? './dist/node/vendor.mjs'
            : './dist/browser/vendor.bundle.mjs';
    }
    getDefaultImportMapDir(platform) {
        return platform === 'node'
            ? './dist/node'
            : './dist/browser';
    }
    async build(outputPath, htmlPath) {
        // console.log('🚀 Starting vendor bundle generation...');
        // console.log(`📁 Project root: ${this.projectRoot}`);
        // console.log(`📦 Output: ${outputPath}`);
        // console.log(`🎯 Platform: ${this.vendorBundler.getPlatform()}`);
        const startTime = Date.now();
        const result = await this.vendorBundler.generateVendorBundle(outputPath);
        if (!result.success) {
            console.error('❌ Build failed:', result.error);
            process.exit(1);
        }
        // Update HTML import map if HTML file exists
        if (FileUtils.exists(htmlPath)) {
            console.log(`📄 Updating HTML: ${htmlPath}`);
            const outputDir = FileUtils.dirname(outputPath);
            const importMap = await this.vendorBundler.generateImportMapOnly(outputDir);
            await this.vendorBundler.updateHtmlImportMap(htmlPath, importMap);
        }
        else {
            console.log(`⚠️ HTML file not found, skipping importmap update: ${htmlPath}`);
        }
        const duration = Date.now() - startTime;
        console.log(`✅ Vendor bundle generation completed in ${duration}ms`);
        if (result.stats) {
            console.log(`📊 Bundle size: ${(result.stats.size / 1024 / 1024).toFixed(2)} MB`);
            console.log(`📦 Dependencies: ${result.stats.dependencies}`);
        }
    }
    async generateImportMap(outputDir) {
        console.log(`🗺️ Generating ${this.vendorBundler.getPlatform()} import map...`);
        console.log(`📁 Output directory: ${outputDir}`);
        // Убедимся, что это директория, а не файл
        if (outputDir.endsWith('.mjs') || outputDir.endsWith('.js')) {
            // Если передан файл, используем его директорию
            const dir = FileUtils.dirname(outputDir);
            console.log(`⚠️  Output path is a file, using directory instead: ${dir}`);
            outputDir = dir;
        }
        FileUtils.ensureDir(outputDir);
        const importMap = await this.vendorBundler.generateImportMapOnly(outputDir);
        console.log(`✅ Import map generated with ${Object.keys(importMap.imports).length} entries`);
        console.log(`📄 Location: ${outputDir}/importmap.json`);
        // Show import map entries
        const entries = Object.entries(importMap.imports)
            .filter(([key]) => !key.includes('/*'))
            .map(([key, value]) => `   - ${key} → ${value}`);
        if (entries.length > 0) {
            console.log('📋 Import map entries:');
            entries.forEach(entry => console.log(entry));
        }
    }
    async analyze() {
        console.log('🔍 Analyzing project dependencies...');
        console.log(`📁 Project root: ${this.projectRoot}`);
        console.log(`🎯 Platform: ${this.vendorBundler.getPlatform()}`);
        const dependencyAnalyzer = this.vendorBundler['dependencyAnalyzer'];
        const analysis = await dependencyAnalyzer.analyzeDependencies(this.vendorBundler.getPlatform());
        console.log(`📊 Found ${analysis.dependencies.size} external dependencies:`);
        if (analysis.dependencies.size > 0) {
            analysis.dependencies.forEach((dep, pkgName) => {
                console.log(`   📦 ${pkgName} (${dep.version})`);
            });
        }
        else {
            console.log('   ℹ️ No external dependencies found');
        }
        console.log(`🗺️ Import map will contain ${Object.keys(analysis.importMap.imports).length} entries`);
    }
    async clean() {
        console.log('🧹 Cleaning vendor artifacts...');
        const vendorDir = `${this.projectRoot}/vendor`;
        const distVendorPath = `${this.projectRoot}/dist/vendor.bundle.mjs`;
        const importMapPath = `${this.projectRoot}/dist/importmap.json`;
        const pathsToClean = [vendorDir, distVendorPath, importMapPath];
        let cleanedCount = 0;
        for (const path of pathsToClean) {
            if (FileUtils.exists(path)) {
                if (FileUtils.isDirectory(path)) {
                    // Note: In real implementation, use fs.rmSync with recursive
                    console.log(`   📁 Would remove directory: ${path}`);
                }
                else {
                    console.log(`   📄 Would remove file: ${path}`);
                }
                cleanedCount++;
            }
        }
        console.log(`✅ Would clean ${cleanedCount} vendor artifacts`);
        console.log('⚠️ Actual file removal not implemented in this version');
    }
    showVersion() {
        const packageJsonPath = `${this.projectRoot}/package.json`;
        try {
            const packageJson = FileUtils.readJson(packageJsonPath);
            console.log(`📦 ${packageJson?.name || '@newkind/vendor-scripts'} v${packageJson?.version || '1.0.0'}`);
            console.log(`🟢 Node.js: ${process.version}`);
            console.log(`💻 Platform: ${process.platform} ${process.arch}`);
        }
        catch {
            console.log('📦 @newkind/vendor-scripts v1.0.0');
        }
    }
    showHelp() {
        console.log(`\n🚀 Vendor Bundle Generator - CLI Tool\n\nUsage:\n  vendor-gen <command> [options]\n\nCommands:\n  build [options]          - Generate vendor bundle\n  importmap [dir]         - Generate only import map (default: ./dist/browser)\n  analyze                 - Analyze dependencies without building\n  clean                   - Remove generated vendor artifacts\n  version                 - Show version information\n  help                    - Show this help message\n\nOptions:\n  -p, --platform <platform>  Target platform: browser (default) or node\n  -o, --output <path>        Output path for bundle or directory for importmap\n  --html <path>              HTML file to update with import map (build only)\n\nExamples:\n  vendor-gen build                                # Browser bundle\n  vendor-gen build --platform node               # Node.js bundle\n  vendor-gen build -o ./public/vendor.js         # Custom output\n  vendor-gen importmap                           # Browser import map\n  vendor-gen importmap --platform node           # Node.js import map\n  vendor-gen importmap -o ./public               # Custom directory\n  vendor-gen analyze                             # Analyze dependencies\n\nOutput Structure:\n  Browser:\n    📁 dist/browser/\n      ├── vendor/\n      │   └── index.js\n      ├── vendor.bundle.mjs\n      └── importmap.json\n  \n  Node.js:\n    📁 dist/node/\n      ├── vendor/\n      │   └── index.js\n      ├── vendor.mjs\n      └── importmap.json\n    `.trim());
    }
}
// CLI entry point with error handling
async function main() {
    const cli = new VendorCLI();
    // Handle process signals for graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n👋 Process interrupted by user');
        process.exit(0);
    });
    process.on('SIGTERM', () => {
        console.log('\n🛑 Process terminated');
        process.exit(0);
    });
    try {
        await cli.run();
    }
    catch (error) {
        console.error('💥 Fatal error:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
}
// ES module equivalent of require.main === module
// const isMainModule = import.meta.url === `file://${process.argv[1]}`;
// Only run if this file is executed directly
// if (isMainModule) {
main().catch(console.error);
// }
export { VendorCLI };
//# sourceMappingURL=index.js.map