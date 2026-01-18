import { unlinkSync, readFileSync, writeFileSync, existsSync, mkdirSync, statSync, readdirSync } from 'fs';
import { dirname, join, relative, resolve } from 'path';
export class FileUtils {
    static exists(path) {
        return existsSync(path);
    }
    static ensureDir(path) {
        if (!this.exists(path)) {
            mkdirSync(path, { recursive: true });
        }
    }
    static readFile(path) {
        return readFileSync(path, 'utf8');
    }
    static writeFile(path, content) {
        this.ensureDir(dirname(path));
        writeFileSync(path, content, 'utf8');
    }
    static readJson(path) {
        try {
            const content = this.readFile(path);
            return JSON.parse(content);
        }
        catch (error) {
            console.warn(`❌ Failed to read JSON file ${path}:`, error instanceof Error ? error.message : 'Unknown error');
            return null;
        }
    }
    static writeJson(path, data) {
        this.writeFile(path, JSON.stringify(data, null, 2));
    }
    static getAllFiles(dir, extensions = []) {
        const files = [];
        const scanDirectory = (currentDir) => {
            if (!this.exists(currentDir)) {
                console.warn(`⚠️ Directory does not exist: ${currentDir}`);
                return;
            }
            try {
                const items = readdirSync(currentDir, { withFileTypes: true });
                for (const item of items) {
                    const fullPath = join(currentDir, item.name);
                    if (item.isDirectory()) {
                        // Skip node_modules, hidden directories, and common build directories
                        if (!item.name.startsWith('.') &&
                            item.name !== 'node_modules' &&
                            item.name !== 'dist' &&
                            item.name !== 'build' &&
                            item.name !== 'coverage') {
                            scanDirectory(fullPath);
                        }
                    }
                    else if (item.isFile()) {
                        if (extensions.length === 0 || extensions.some(ext => item.name.endsWith(ext))) {
                            files.push(fullPath);
                        }
                    }
                }
            }
            catch (error) {
                console.warn(`❌ Cannot read directory: ${currentDir}`, error instanceof Error ? error.message : 'Unknown error');
            }
        };
        scanDirectory(dir);
        return files;
    }
    static isDirectory(path) {
        try {
            return statSync(path).isDirectory();
        }
        catch (error) {
            console.warn(`❌ Cannot check if path is directory: ${path}`, error instanceof Error ? error.message : 'Unknown error');
            return false;
        }
    }
    static getFileSize(path) {
        try {
            return statSync(path).size;
        }
        catch (error) {
            console.warn(`❌ Cannot get file size: ${path}`, error instanceof Error ? error.message : 'Unknown error');
            return -1;
        }
    }
    static copyFile(source, destination) {
        try {
            if (!this.exists(source)) {
                console.warn(`❌ Source file does not exist: ${source}`);
                return false;
            }
            this.ensureDir(dirname(destination));
            const content = readFileSync(source);
            writeFileSync(destination, content);
            console.log(`✅ Copied: ${source} → ${destination}`);
            return true;
        }
        catch (error) {
            console.error(`❌ Failed to copy file ${source} to ${destination}:`, error instanceof Error ? error.message : 'Unknown error');
            return false;
        }
    }
    static deleteFile(path) {
        try {
            if (!this.exists(path)) {
                return true;
            }
            unlinkSync(path);
            console.log(`🗑️ Deleted: ${path}`);
            return true;
        }
        catch (error) {
            console.error(`❌ Failed to delete file ${path}:`, error instanceof Error ? error.message : 'Unknown error');
            return false;
        }
    }
    static getRelativePath(from, to) {
        return relative(from, to);
    }
    static resolvePath(...paths) {
        return resolve(...paths);
    }
    static joinPaths(...paths) {
        return join(...paths);
    }
    static getFileExtension(path) {
        const ext = path.slice(path.lastIndexOf('.'));
        return ext || '';
    }
    static getFileNameWithoutExtension(path) {
        const baseName = path.split('/').pop() || path.split('\\\\').pop() || path;
        return baseName.replace(/\.[^/.]+$/, '');
    }
    static getDirectoryContents(dir) {
        const files = [];
        const directories = [];
        if (!this.exists(dir)) {
            return { files, directories };
        }
        try {
            const items = readdirSync(dir, { withFileTypes: true });
            for (const item of items) {
                const fullPath = join(dir, item.name);
                if (item.isDirectory()) {
                    directories.push(fullPath);
                }
                else if (item.isFile()) {
                    files.push(fullPath);
                }
            }
            return { files, directories };
        }
        catch (error) {
            console.error(`❌ Failed to read directory contents: ${dir}`, error instanceof Error ? error.message : 'Unknown error');
            return { files, directories };
        }
    }
    static createFileIfNotExists(path, defaultContent = '') {
        if (this.exists(path)) {
            return false;
        }
        try {
            this.writeFile(path, defaultContent);
            console.log(`📄 Created: ${path}`);
            return true;
        }
        catch (error) {
            console.error(`❌ Failed to create file ${path}:`, error instanceof Error ? error.message : 'Unknown error');
            return false;
        }
    }
    static isTypeScriptFile(path) {
        const ext = this.getFileExtension(path).toLowerCase();
        return ext === '.ts' || ext === '.tsx';
    }
    static isJavaScriptFile(path) {
        const ext = this.getFileExtension(path).toLowerCase();
        return ext === '.js' || ext === '.jsx' || ext === '.mjs' || ext === '.cjs';
    }
    static isSourceFile(path) {
        this.getFileExtension(path).toLowerCase(); // Исправлено: удалена неиспользуемая переменная 'ext'
        return this.isTypeScriptFile(path) || this.isJavaScriptFile(path);
    }
    static formatFileSize(bytes) {
        if (bytes === 0)
            return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    static getFileStats(path) {
        try {
            const stats = statSync(path);
            return {
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime
            };
        }
        catch (error) {
            console.warn(`❌ Cannot get file stats: ${path}`, error instanceof Error ? error.message : 'Unknown error');
            return null;
        }
    }
    static findFilesByPattern(dir, pattern) {
        const allFiles = this.getAllFiles(dir);
        return allFiles.filter(file => pattern.test(file));
    }
    static ensureFileStructure(files) {
        for (const file of files) {
            this.createFileIfNotExists(file.path, file.content);
        }
    }
    static backupFile(path, backupSuffix = '.backup') {
        if (!this.exists(path)) {
            return false;
        }
        try {
            const backupPath = path + backupSuffix;
            return this.copyFile(path, backupPath);
        }
        catch (error) {
            console.error(`❌ Failed to backup file ${path}:`, error instanceof Error ? error.message : 'Unknown error');
            return false;
        }
    }
    static restoreBackup(path, backupSuffix = '.backup') {
        const backupPath = path + backupSuffix;
        if (!this.exists(backupPath)) {
            console.warn(`⚠️ Backup file does not exist: ${backupPath}`);
            return false;
        }
        try {
            return this.copyFile(backupPath, path);
        }
        catch (error) {
            console.error(`❌ Failed to restore backup for ${path}:`, error instanceof Error ? error.message : 'Unknown error');
            return false;
        }
    }
    // ДОБАВЛЕННЫЕ МЕТОДЫ ДЛЯ ИСПРАВЛЕНИЯ ОШИБОК
    static statSync(path) {
        return statSync(path);
    }
    static readDir(path) {
        return readdirSync(path, { withFileTypes: true });
    }
    static dirname(path) {
        return dirname(path);
    }
}
//# sourceMappingURL=file-utils.js.map