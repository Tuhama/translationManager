const lodash = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const Storage = require('./Storage');
const Scanner = require('./Scanner');
const Utilities = require('./Utilities');
const GoogleTranslator = require('./services/GoogleTranslator');

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

    /**
     * Translates a specific text into target language.
     */
    async translateSingle(text, targetLang, sourceLang = 'en') {
        const translator = new GoogleTranslator(this.config.googleTranslateApiKey);
        return await translator.translate(text, targetLang, sourceLang);
    }

    /**
     * Gets a report of missing translations.
     */
    async getBulkTranslateReport(sourceLang) {
        const { languages, translations, allKeys } = await this.scan();
        const report = {};
        
        languages.forEach(lang => {
            if (lang === sourceLang) return;
            const missing = allKeys.filter(key => {
                const val = lodash.get(translations[lang], key);
                return val === undefined || val === '';
            });
            if (missing.length > 0) {
                report[lang] = {
                    count: missing.length,
                    keys: missing
                };
            }
        });

        return report;
    }

    /**
     * Performs bulk translation for all missing keys.
     * Returns an object mapping language to key-value pairs for review.
     */
    async bulkTranslate(sourceLang) {
        const report = await this.getBulkTranslateReport(sourceLang);
        const translations = await this.storage.readAll();
        const translator = new GoogleTranslator(this.config.googleTranslateApiKey);
        
        const preview = {};

        for (const lang in report) {
            const keys = report[lang].keys;
            const sourceTexts = keys.map(key => lodash.get(translations[sourceLang], key));
            
            // Filter out keys that don't have source text
            const validIndices = sourceTexts.map((text, idx) => text ? idx : null).filter(idx => idx !== null);
            const textsToTranslate = validIndices.map(idx => sourceTexts[idx]);
            const validKeys = validIndices.map(idx => keys[idx]);

            if (textsToTranslate.length > 0) {
                const translatedTexts = await translator.translate(textsToTranslate, lang, sourceLang);
                preview[lang] = {};
                validKeys.forEach((key, idx) => {
                    preview[lang][key] = translatedTexts[idx];
                });
            }
        }

        return preview;
    }

    /**
     * Saves multiple translation keys across languages.
     * @param {Object} data - { lang: { key: value } }
     */
    async saveBulkTranslations(data) {
        const translations = await this.storage.readAll();
        const languages = Object.keys(translations);

        for (const lang in data) {
            if (languages.includes(lang)) {
                for (const key in data[lang]) {
                    lodash.set(translations[lang], key, data[lang][key]);
                }
                await this.storage.write(lang, translations[lang]);
            }
        }
    }

    /**
     * Saves the current configuration to the config file.
     */
    async saveConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        const configPath = path.resolve(this.targetDir, 'translation.config.json');
        await fs.writeJson(configPath, this.config, { spaces: 2 });
    }
}

module.exports = TranslatorManager;
