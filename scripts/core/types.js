/**
 * Core types for Vendor Bundle Generator
 * Maximum TypeScript strictness enabled
 */
export {};
// Export all types as a namespace for easy importing
/*
export namespace VendorTypes {
    export type Dependency = VendorDependency;
    export type BundleConfig = BundleConfig;
    export type ImportMap = ImportMap;
    export type AnalysisResult = VendorAnalysisResult;
    export type BuildResult = BuildResult;
    export type FileAnalysis = FileAnalysisResult;
    export type VendorConfig = VendorConfig;
    export type PackageJson = PackageJson;
    export type VendorIndexInfo = VendorIndexInfo;
    export type DependencyUsage = DependencyUsage;
    export type BundleAnalysis = BundleAnalysis;
    export type ImportPattern = ImportPattern;
    export type ResolvedImport = ResolvedImport;
    export type GenerationOptions = VendorGenerationOptions;
    export type CLIOptions = VendorCLIOptions;

    // Явные определения для избежания циклических ссылок
    export type Platform = 'browser' | 'node';
    export type ModuleFormat = 'esm' | 'cjs';
    export type ImportType = 'static' | 'dynamic' | 'export' | 'require';
    export type PathType = 'package' | 'relative' | 'absolute' | 'internal';

    export type Result<T, E = Error> =
        | { readonly success: true; readonly data: T }
        | { readonly success: false; readonly error: E };

    export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;
    export type ProgressCallback = (event: VendorGenerationEvent) => void;
    export type ConfigValidation = ConfigValidationResult;
    export type Metrics = PerformanceMetrics;
}
*/ 
//# sourceMappingURL=types.js.map