const fs = require('fs-extra');
const path = require('path');
const Utilities = require('./Utilities');

/**
 * Interface-like class for managing translation file storage.
 * Defaults to JSON files on local filesystem.
 */
class Storage {
    constructor(targetDir, config = {}) {
        this.targetDir = targetDir;
        this.config = config;
        this.defaultPaths = [
            'public/locales',
            'src/locales',
            'src/i18n',
            'locales'
        ];
    }

    /**
     * Finds and returns the path to the locales directory.
     */
    async getLocalesDir() {
        let localesDir = this.config.path;

        if (!localesDir) {
            for (const p of this.defaultPaths) {
                const fullPath = path.resolve(this.targetDir, p);
                if (await fs.pathExists(fullPath) && (await fs.stat(fullPath)).isDirectory()) {
                    return fullPath;
                }
            }
        } else {
            localesDir = path.resolve(this.targetDir, localesDir);
        }

        if (!localesDir || !(await fs.pathExists(localesDir))) {
            throw new Error('Could not find translation directory. Please specify it in the config or ensure it exists.');
        }

        return localesDir;
    }

    /**
     * Reads all translation files from the locales directory.
     */
    async readAll() {
        const localesDir = await this.getLocalesDir();
        const entries = await fs.readdir(localesDir, { withFileTypes: true });

        const translations = {};

        const readDirectory = async (dir, lang, prefix = []) => {
            const files = await fs.readdir(dir, { withFileTypes: true });
            const data = {};

            for (const file of files) {
                const fullPath = path.join(dir, file.name);
                if (file.isDirectory()) {
                    const nestedData = await readDirectory(fullPath, lang, [...prefix, file.name]);
                    if (Object.keys(nestedData).length > 0) {
                        data[file.name] = nestedData;
                    }
                } else if (file.isFile() && file.name.endsWith('.json')) {
                    const ns = path.basename(file.name, '.json');
                    try {
                        data[ns] = await fs.readJson(fullPath);
                    } catch (err) {
                        throw new Error(`Failed to read translation file "${fullPath}": ${err.message}`);
                    }
                }
            }
            return data;
        };

        for (const entry of entries) {
            const fullPath = path.join(localesDir, entry.name);

            if (entry.isFile() && entry.name.endsWith('.json')) {
                const lang = path.basename(entry.name, '.json');
                try {
                    const content = await fs.readJson(fullPath);
                    translations[lang] = { ...translations[lang], ...content };
                } catch (err) {
                    throw new Error(`Failed to read translation file "${fullPath}": ${err.message}`);
                }
            } else if (entry.isDirectory()) {
                const lang = entry.name;
                const langData = await readDirectory(fullPath, lang);
                translations[lang] = { ...translations[lang], ...langData };
            }
        }

        return translations;
    }

    /**
     * Writes a single translation file (or all of them).
     */
    async write(lang, content, options = {}) {
        const localesDir = await this.getLocalesDir();
        const langDir = path.join(localesDir, lang);

        // Sort the content before writing if sorting is enabled (default: true)
        const shouldSort = options.sort !== false;
        const finalContent = shouldSort ? Utilities.sortObject(content) : content;

        const writeRecursive = async (dir, data) => {
            await fs.ensureDir(dir);
            for (const key in data) {
                const value = data[key];
                const fullPath = path.join(dir, `${key}.json`);
                
                // If the value is an object and NOT an empty object, and we want to support nested dirs
                // we need to decide if we write it as a file or a directory.
                // In i18next, usually one file = one namespace. Nested keys inside the file are NOT separate files.
                // HOWEVER, our readAll now supports nested directories.
                // To be consistent, if we read a nested directory, we should probably write it back as one.
                
                // Let's check if the directory already exists or if it's a new nested structure.
                const potentialDir = path.join(dir, key);
                if (typeof value === 'object' && value !== null && !Array.isArray(value) && await fs.pathExists(potentialDir) && (await fs.stat(potentialDir)).isDirectory()) {
                    await writeRecursive(potentialDir, value);
                } else {
                    await fs.writeJson(fullPath, value, { spaces: 2 });
                }
            }
        };

        if (await fs.pathExists(langDir) && (await fs.stat(langDir)).isDirectory()) {
            // Namespace mode
            await writeRecursive(langDir, finalContent);
        } else {
            // Flat mode
            const filePath = path.join(localesDir, `${lang}.json`);
            await fs.writeJson(filePath, finalContent, { spaces: 2 });
        }
    }

    /**
     * Writes all translations.
     */
    async writeAll(translations, options = {}) {
        const languages = Object.keys(translations);
        for (const lang of languages) {
            await this.write(lang, translations[lang], options);
        }
    }
}

module.exports = Storage;
