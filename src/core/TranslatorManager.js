const lodash = require('lodash');
const Storage = require('./Storage');
const Scanner = require('./Scanner');
const Utilities = require('./Utilities');

/**
 * Main manager class for translation management.
 * Acts as an orchestrator.
 */
class TranslatorManager {
    constructor(targetDir, config = {}) {
        this.targetDir = targetDir;
        this.config = config;
        this.storage = new Storage(targetDir, config);
    }

    /**
     * Re-scans translations and sources to build a complete picture.
     */
    async scan() {
        const localesDir = await this.storage.getLocalesDir();
        const translations = await this.storage.readAll();
        const languages = Object.keys(translations);

        // Flatten all keys across all languages
        const allKeysSet = new Set();
        languages.forEach(lang => Utilities.flattenKeys(translations[lang], '', allKeysSet));
        const allKeys = Array.from(allKeysSet).sort();

        // Calculate results
        const results = {};
        allKeys.forEach(key => {
            const missing = [];
            languages.forEach(lang => {
                const val = lodash.get(translations[lang], key);
                if (val === undefined || val === '') {
                    missing.push(lang);
                }
            });
            results[key] = { missing };
        });

        // Scan source for unused keys
        const scanner = new Scanner(this.targetDir, localesDir, this.config);
        const analysis = await scanner.findUnusedKeys(allKeys);

        return {
            localesDir,
            languages,
            translations,
            allKeys,
            results,
            unused: analysis.unused,
            maybeUsed: analysis.maybeUsed
        };
    }

    /**
     * Saves a translation key across all language files.
     */
    async saveTranslation(key, values) {
        const translations = await this.storage.readAll();
        const languages = Object.keys(translations);

        for (const lang of languages) {
            if (values[lang] !== undefined) {
                lodash.set(translations[lang], key, values[lang]);
                await this.storage.write(lang, translations[lang]);
            }
        }
    }

    /**
     * Deletes one or more translation keys across all language files.
     */
    async deleteTranslations(keys) {
        const keysToDelete = Array.isArray(keys) ? keys : [keys];
        const translations = await this.storage.readAll();
        const languages = Object.keys(translations);

        for (const lang of languages) {
            keysToDelete.forEach(key => lodash.unset(translations[lang], key));
            await this.storage.write(lang, translations[lang]);
        }
    }

    /**
     * Normalizes and sorts everything.
     */
    async normalize() {
        let translations = await this.storage.readAll();
        const languages = Object.keys(translations);

        const allKeysSet = new Set();
        languages.forEach(lang => Utilities.flattenKeys(translations[lang], '', allKeysSet));
        const allKeys = Array.from(allKeysSet);

        // Sync and sort
        translations = Utilities.syncKeys(translations, allKeys);

        // Save back
        await this.storage.writeAll(translations);
    }
}

module.exports = TranslatorManager;
