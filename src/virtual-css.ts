import { createLogger } from '@/logger'

// Объявляем интерфейс для виртуального CSS модуля
export interface VirtualCSSModule {
    getCSSForComponent: (componentName: string) => string | null;
    getCSSByPath?: (filePath: string) => string | null;
    getAllCSS?: () => string;
    injectCSS?: () => void;
}

let cssModule: VirtualCSSModule | false = false;

// Функция для асинхронной загрузки CSS модуля
export async function loadCSSModule(): Promise<void> {
    try {
        // Используем dynamic import с явным типом
        // @ts-ignore - виртуальный модуль не имеет типов TypeScript
        const importedModule = await import('virtual:css') as any;

        // Проверяем структуру импортированного модуля
        // Модуль может экспортироваться как default или как именованный экспорт
        if (importedModule && importedModule.default && importedModule.default.getCSSForComponent) {
            cssModule = importedModule.default as VirtualCSSModule;
        } else if (importedModule && importedModule.getCSSForComponent) {
            cssModule = importedModule as VirtualCSSModule;
        } else if (importedModule && typeof importedModule === 'object') {
            // Пытаемся найти метод getCSSForComponent в любом месте объекта
            const methods = Object.keys(importedModule);
            for (const key of methods) {
                if (key.includes('getCSS') && typeof importedModule[key] === 'function') {
                    // Создаем обертку для совместимости
                    cssModule = {
                        getCSSForComponent: (componentName: string) => {
                            const result = importedModule[key](componentName);
                            return typeof result === 'string' ? result : null;
                        },
                        getCSSByPath: importedModule.getCSSByPath,
                        getAllCSS: importedModule.getAllCSS,
                        injectCSS: importedModule.injectCSS
                    } as VirtualCSSModule;
                    break;
                }
            }

            if (!cssModule) {
                console.warn('virtual:css модуль не содержит ожидаемых методов:', importedModule);
                cssModule = false;
            }
        } else {
            console.warn('virtual:css модуль имеет неожиданную структуру:', importedModule);
            cssModule = false;
        }
    } catch (e) {
        console.warn('virtual:css не загружен:', e);
        cssModule = false;
    }
}

// Инициализация CSS модуля при первом использовании
let cssModuleInitialized = false;
export async function ensureCSSModule(): Promise<void> {
    if (!cssModuleInitialized) {
        await loadCSSModule();
        cssModuleInitialized = true;
    }
}

const prefix = 'wc';
const log = createLogger(`${prefix}:virtual-css`);

// Основная функция импорта CSS
export async function importCss(): Promise<void> {
    try {
        log('Загрузка виртуальных стилей...');

        // Загружаем CSS модуль
        await ensureCSSModule();

        if (cssModule) {
            log('Виртуальные стили загружены успешно');

            // Если модуль поддерживает глобальную инъекцию
            if (cssModule.injectCSS) {
                cssModule.injectCSS();
                log('Глобальные стили инжектированы');
            }
        } else {
            log.warn('CSS модуль не доступен, стили не будут загружены');
        }
    } catch (error) {
        log.error('Ошибка загрузки CSS:', error);
        throw error;
    }
}

// Функция для получения CSS для конкретного компонента
export async function getComponentCSS(componentName: string): Promise<string | null> {
    try {
        await ensureCSSModule();

        if (cssModule && cssModule.getCSSForComponent) {
            return cssModule.getCSSForComponent(componentName);
        }

        return null;
    } catch (error) {
        log.error(`Ошибка получения CSS для компонента ${componentName}:`, error);
        return null;
    }
}

// Функция для получения CSS по пути
export async function getCSSByPath(filePath: string): Promise<string | null> {
    try {
        await ensureCSSModule();

        if (cssModule && cssModule.getCSSByPath) {
            return cssModule.getCSSByPath(filePath);
        }

        return null;
    } catch (error) {
        log.error(`Ошибка получения CSS по пути ${filePath}:`, error);
        return null;
    }
}

// Функция для получения всех CSS
export async function getAllCSS(): Promise<string | null> {
    try {
        await ensureCSSModule();

        if (cssModule && cssModule.getAllCSS) {
            return cssModule.getAllCSS();
        }

        return null;
    } catch (error) {
        log.error('Ошибка получения всех CSS:', error);
        return null;
    }
}

// Функция для инъекции CSS в DOM
export async function injectGlobalCSS(): Promise<boolean> {
    try {
        await ensureCSSModule();

        if (cssModule && cssModule.injectCSS) {
            cssModule.injectCSS();
            log('Глобальные CSS инжектированы');
            return true;
        }

        log.warn('Метод injectCSS не доступен');
        return false;
    } catch (error) {
        log.error('Ошибка инъекции глобальных CSS:', error);
        return false;
    }
}

// Утилита для проверки доступности CSS модуля
export function isCSSModuleAvailable(): boolean {
    return cssModule !== false;
}

// Утилита для получения статуса CSS модуля
export function getCSSModuleStatus(): {
    initialized: boolean;
    available: boolean;
    hasModule: boolean;
} {
    return {
        initialized: cssModuleInitialized,
        available: cssModule !== false,
        hasModule: !!cssModule
    };
}

// Экспорт по умолчанию
export default {
    importCss,
    getComponentCSS,
    getCSSByPath,
    getAllCSS,
    injectGlobalCSS,
    isCSSModuleAvailable,
    getCSSModuleStatus,
    loadCSSModule,
    ensureCSSModule
};