import { FileUtils } from './file-utils.js';
import { isPackageExcluded } from '../core/excluded-packages.js';
import { join } from 'path';
export class DependencyAnalyzer {
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
    }
    async analyzeDependencies(platform = 'browser') {
        const dependencies = new Map();
        const entryPoints = [];
        let analyzedFiles = 0;
        // Find package.json and analyze dependencies
        const packageJsonPath = join(this.projectRoot, 'package.json');
        if (FileUtils.exists(packageJsonPath)) {
            const packageJson = FileUtils.readJson(packageJsonPath);
            if (packageJson) {
                // Combine all dependency types
                const allDeps = {
                    ...packageJson.dependencies,
                    ...packageJson.devDependencies,
                    ...packageJson.peerDependencies
                };
                for (const [pkgName, version] of Object.entries(allDeps)) {
                    if (!isPackageExcluded(pkgName, platform)) {
                        dependencies.set(pkgName, {
                            packageName: pkgName,
                            version: version || 'unknown',
                            importPath: pkgName,
                            isExternal: true,
                            usedIn: []
                        });
                    }
                }
            }
        }
        // Generate import map
        const importMap = this.generateImportMap(dependencies, platform);
        return {
            dependencies,
            entryPoints,
            importMap,
            projectRoot: this.projectRoot,
            analyzedFiles
        };
    }
    generateImportMap(dependencies, platform) {
        const imports = {};
        for (const [pkgName] of dependencies) {
            if (platform === 'browser') {
                imports[pkgName] = './vendor.bundle.mjs';
                imports[`${pkgName}/*`] = './vendor.bundle.mjs';
            }
            else {
                imports[pkgName] = './vendor.mjs';
                imports[`${pkgName}/*`] = './vendor.mjs';
            }
        }
        return {
            imports,
            scopes: {
                "./": { ...imports }
            }
        };
    }
}
//# sourceMappingURL=dependency-analyzer.js.map