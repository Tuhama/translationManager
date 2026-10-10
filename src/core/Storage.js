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
     * True when at least as many locales are directories as flat JSON files.
     */
    async usesNamespaceLayout() {
        const localesDir = await this.getLocalesDir();
        const entries = await fs.readdir(localesDir, { withFileTypes: true });
        const dirs = entries.filter(entry => entry.isDirectory()).length;
        const files = entries.filter(entry => entry.isFile() && entry.name.endsWith('.json')).length;
        return dirs > 0 && dirs >= files;
    }

    /**
     * Relative directory paths inside a locale folder, or null if that locale is a flat file.
     */
    async readLanguageStructure(lang) {
        const localesDir = await this.getLocalesDir();
        const langDir = path.join(localesDir, lang);
        if (!(await fs.pathExists(langDir))) return null;
        const stat = await fs.stat(langDir);
        if (!stat.isDirectory()) return null;

        const dirs = new Set();
        const walk = async (dir, rel) => {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                if (!entry.isDirectory()) continue;
                const childRel = rel ? `${rel}/${entry.name}` : entry.name;
                dirs.add(childRel);
                await walk(path.join(dir, entry.name), childRel);
            }
        };
        await walk(langDir, '');
        return dirs;
    }

    /**
     * Writes a single translation file (or all of them).
     * New languages follow an existing locale when `mirrorLang` is set,
     * otherwise they follow the project-wide namespace vs flat layout.
     */
    async write(lang, content, options = {}) {
        const localesDir = await this.getLocalesDir();
        const langDir = path.join(localesDir, lang);
        const flatPath = path.join(localesDir, `${lang}.json`);

        const shouldSort = options.sort !== false;
        const finalContent = shouldSort ? Utilities.sortObject(content) : content;

        const langDirExists = await fs.pathExists(langDir) && (await fs.stat(langDir)).isDirectory();
        const flatExists = await fs.pathExists(flatPath);

        let namespaceDirs = options.namespaceDirs;
        if (Array.isArray(namespaceDirs)) {
            namespaceDirs = new Set(namespaceDirs);
        }
        if (!namespaceDirs && options.mirrorLang) {
            namespaceDirs = await this.readLanguageStructure(options.mirrorLang);
        }

        let useNamespace = langDirExists;
        if (!useNamespace && !flatExists) {
            if (namespaceDirs) {
                useNamespace = true;
            } else {
                useNamespace = await this.usesNamespaceLayout();
            }
        }

        const writeRecursive = async (dir, data, rel = '') => {
            await fs.ensureDir(dir);
            for (const key of Object.keys(data)) {
                const value = data[key];
                const childRel = rel ? `${rel}/${key}` : key;
                const potentialDir = path.join(dir, key);
                const existsAsDir = await fs.pathExists(potentialDir) && (await fs.stat(potentialDir)).isDirectory();
                const mirroredDir = namespaceDirs instanceof Set && namespaceDirs.has(childRel);
                if (typeof value === 'object' && value !== null && !Array.isArray(value) && (existsAsDir || mirroredDir)) {
                    await writeRecursive(potentialDir, value, childRel);
                } else {
                    await fs.writeJson(path.join(dir, `${key}.json`), value, { spaces: 2 });
                }
            }
        };

        if (useNamespace) {
            await writeRecursive(langDir, finalContent);
        } else {
            await fs.writeJson(flatPath, finalContent, { spaces: 2 });
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
