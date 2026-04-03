const fs = require('fs-extra');
const path = require('path');

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
        const files = await fs.readdir(localesDir);
        const jsonFiles = files.filter(f => f.endsWith('.json'));

        const translations = {};
        for (const file of jsonFiles) {
            const lang = path.basename(file, '.json');
            const content = await fs.readJson(path.join(localesDir, file));
            translations[lang] = content;
        }

        return translations;
    }

    /**
     * Writes a single translation file (or all of them).
     */
    async write(lang, content) {
        const localesDir = await this.getLocalesDir();
        const filePath = path.join(localesDir, `${lang}.json`);
        await fs.writeJson(filePath, content, { spaces: 2 });
    }

    /**
     * Writes all translations.
     */
    async writeAll(translations) {
        const languages = Object.keys(translations);
        for (const lang of languages) {
            await this.write(lang, translations[lang]);
        }
    }
}

module.exports = Storage;
