// scripts/src/index.ts
/**
 * @newkind/vendor-scripts - Vendor Bundle Generator
 * Main entry point for the vendor bundle generation module
 */
// Исправленные импорты
import { VendorBundler } from './core/index.js';
import { DependencyAnalyzer } from './utils/index.js';
import { VendorIndexGenerator } from './core/index.js';
import { ESBuildBuilder } from './builders/index.js';
import { FileUtils } from './utils/index.js';
import { VendorCLI } from './cli/index.js';
// Экспорты классов и утилит
export { VendorBundler, DependencyAnalyzer, VendorIndexGenerator, ESBuildBuilder, FileUtils, VendorCLI };
// Version info
export const VERSION = '1.0.0';
export const DESCRIPTION = 'Vendor Bundle Generator with Platform Support';
/**
 * Main initialization function
 * @param projectRoot - Root path of the project to analyze
 * @returns Configured VendorBundler instance
 */
export function createVendorBundler(projectRoot) {
    return new VendorBundler(projectRoot);
}
/**
 * Create VendorBundler instance for Node.js platform
 * @param projectRoot - Root path of the project to analyze
 * @returns Configured VendorBundler instance for Node.js
 */
export function createNodeVendorBundler(projectRoot) {
    return new VendorBundler(projectRoot, 'node');
}
/**
 * Create VendorBundler instance for browser platform
 * @param projectRoot - Root path of the project to analyze
 * @returns Configured VendorBundler instance for browser
 */
export function createBrowserVendorBundler(projectRoot) {
    return new VendorBundler(projectRoot, 'browser');
}
/**
 * Quick vendor bundle generation
 * @param projectRoot - Project source root
 * @param outputPath - Output path for vendor bundle
 * @param platform - Target platform (node or browser)
 * @returns Build result
 */
export async function generateVendorBundle(projectRoot, outputPath = './dist/vendor.bundle.mjs', platform = 'browser') {
    const bundler = new VendorBundler(projectRoot, platform);
    return await bundler.generateVendorBundle(outputPath);
}
/**
 * Quick vendor bundle generation for Node.js
 * @param projectRoot - Project source root
 * @param outputPath - Output path for vendor bundle
 * @returns Build result
 */
export async function generateNodeVendorBundle(projectRoot, outputPath = './dist/node/vendor.mjs') {
    return generateVendorBundle(projectRoot, outputPath, 'node');
}
/**
 * Quick vendor bundle generation for browser
 * @param projectRoot - Project source root
 * @param outputPath - Output path for vendor bundle
 * @returns Build result
 */
export async function generateBrowserVendorBundle(projectRoot, outputPath = './dist/browser/vendor.bundle.mjs') {
    return generateVendorBundle(projectRoot, outputPath, 'browser');
}
/**
 * Analyze dependencies without building
 * @param projectRoot - Project source root
 * @returns Analysis result with dependencies and import map
 */
export async function analyzeDependencies(projectRoot) {
    const analyzer = new DependencyAnalyzer(projectRoot);
    return await analyzer.analyzeDependencies();
}
/**
 * Generate only import map
 * @param projectRoot - Project source root
 * @param outputDir - Output directory for importmap.json
 * @param platform - Target platform (node or browser)
 * @returns Generated import map
 */
export async function generateImportMap(projectRoot, outputDir = './dist', platform = 'browser') {
    const bundler = new VendorBundler(projectRoot, platform);
    return await bundler.generateImportMapOnly(outputDir);
}
/**
 * Generate import map for Node.js
 * @param projectRoot - Project source root
 * @param outputDir - Output directory for importmap.json
 * @returns Generated import map
 */
export async function generateNodeImportMap(projectRoot, outputDir = './dist/node') {
    return generateImportMap(projectRoot, outputDir, 'node');
}
/**
 * Generate import map for browser
 * @param projectRoot - Project source root
 * @param outputDir - Output directory for importmap.json
 * @returns Generated import map
 */
export async function generateBrowserImportMap(projectRoot, outputDir = './dist/browser') {
    return generateImportMap(projectRoot, outputDir, 'browser');
}
export default {
    VendorBundler,
    DependencyAnalyzer,
    VendorIndexGenerator,
    ESBuildBuilder,
    FileUtils,
    VendorCLI,
    createVendorBundler,
    createNodeVendorBundler,
    createBrowserVendorBundler,
    generateVendorBundle,
    generateNodeVendorBundle,
    generateBrowserVendorBundle,
    analyzeDependencies,
    generateImportMap,
    generateNodeImportMap,
    generateBrowserImportMap,
    VERSION,
    DESCRIPTION
};
//# sourceMappingURL=index.js.map