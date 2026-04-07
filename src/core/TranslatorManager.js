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

        // Scan source for unused and missing keys
        const scanner = new Scanner(this.targetDir, localesDir, this.config);
        const [analysis, missingFromFiles] = await Promise.all([
            scanner.findUnusedKeys(allKeys),
            scanner.findMissingKeys(allKeys)
        ]);

        return {
            localesDir,
            languages,
            translations,
            allKeys,
            results,
            unused: analysis.unused,
            maybeUsed: analysis.maybeUsed,
            missingFromFiles: missingFromFiles
        };
    }

    /**
     * Saves a translation key across all language files.
     */
    async saveTranslation(key, values, options = {}) {
        const translations = await this.storage.readAll();
        const languages = Object.keys(translations);

        for (const lang of languages) {
            if (values[lang] !== undefined) {
                lodash.set(translations[lang], key, values[lang]);
                await this.storage.write(lang, translations[lang], options);
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
        // Support both old and new config formats for backward compatibility
        let translatorConfig;
        if (this.config.googleTranslateApiKey) {
            // Legacy v2 config - provide migration guidance
            throw new Error('Google Translate API v2 is deprecated. Please update your configuration to use v3 with projectId and keyFilename in the googleTranslate object.');
        } else if (this.config.googleTranslate) {
            translatorConfig = this.config.googleTranslate;
        } else {
            throw new Error('Google Translate configuration is missing. Please add googleTranslate.projectId and googleTranslate.keyFilename in Settings.');
        }

        const translator = new GoogleTranslator(translatorConfig);
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

        // Support both old and new config formats for backward compatibility
        let translatorConfig;
        if (this.config.googleTranslateApiKey) {
            // Legacy v2 config - provide migration guidance
            throw new Error('Google Translate API v2 is deprecated. Please update your configuration to use v3 with projectId and keyFilename in the googleTranslate object.');
        } else if (this.config.googleTranslate) {
            translatorConfig = this.config.googleTranslate;
        } else {
            throw new Error('Google Translate configuration is missing. Please add googleTranslate.projectId and googleTranslate.keyFilename in Settings.');
        }

        const translator = new GoogleTranslator(translatorConfig);

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
    async saveBulkTranslations(data, options = {}) {
        const translations = await this.storage.readAll();
        const languages = Object.keys(translations);

        for (const lang in data) {
            if (languages.includes(lang)) {
                for (const key in data[lang]) {
                    lodash.set(translations[lang], key, data[lang][key]);
                }
                await this.storage.write(lang, translations[lang], options);
            }
        }
    }

    /**
     * Exports missing translation keys in the format: {"key": {"lang1": "", "lang2": ""}}
     * @param {string} sourceLang - The source language to exclude from missing keys
     * @returns {Object} - Export data with missing keys and empty values for each target language
     */
    async exportMissingKeys(sourceLang = 'en') {
        const { languages, translations, allKeys } = await this.scan();
        const exportData = {};

        // Get all missing keys across all languages
        const allMissingKeys = new Set();

        languages.forEach(lang => {
            if (lang === sourceLang) return;

            allKeys.forEach(key => {
                const val = lodash.get(translations[lang], key);
                if (val === undefined || val === '') {
                    allMissingKeys.add(key);
                }
            });
        });

        // Build export structure: {"key": {"lang1": "", "lang2": ""}}
        Array.from(allMissingKeys).forEach(key => {
            exportData[key] = {};
            languages.forEach(lang => {
                if (lang !== sourceLang) {
                    const val = lodash.get(translations[lang], key);
                    exportData[key][lang] = (val === undefined || val === '') ? '' : val;
                }
            });
        });

        return {
            exportData,
            metadata: {
                sourceLang,
                targetLanguages: languages.filter(lang => lang !== sourceLang),
                totalKeys: allMissingKeys.size,
                exportedAt: new Date().toISOString()
            }
        };
    }

    /**
     * Imports translated keys from the export format back into translation files
     * @param {Object} importData - Data in format {"key": {"lang1": "translation", "lang2": "translation"}}
     * @param {Object} options - Import options (merge strategy, formatting, etc.)
     */
    async importTranslations(importData, options = {}) {
        const { 
            overwriteExisting = false, 
            skipEmpty = true,
            format = true 
        } = options;

        const translations = await this.storage.readAll();
        const languages = Object.keys(translations);
        const importStats = {
            imported: 0,
            skipped: 0,
            errors: []
        };

        for (const key in importData) {
            const keyTranslations = importData[key];

            for (const lang in keyTranslations) {
                const translation = keyTranslations[lang];

                // Skip if language doesn't exist in project
                if (!languages.includes(lang)) {
                    importStats.errors.push(`Language '${lang}' not found in project`);
                    continue;
                }

                // Skip empty translations if configured
                if (skipEmpty && (!translation || translation.trim() === '')) {
                    importStats.skipped++;
                    continue;
                }

                // Check if key already has a value
                const existingValue = lodash.get(translations[lang], key);
                if (existingValue && existingValue !== '' && !overwriteExisting) {
                    importStats.skipped++;
                    continue;
                }

                // Import the translation
                lodash.set(translations[lang], key, translation);
                importStats.imported++;
            }
        }

        // Save all updated translations
        const saveOptions = { sort: format };
        await this.storage.writeAll(translations, saveOptions);

        return importStats;
    }

    /**
     * Saves the current configuration to the config file.
     */
    async saveConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        // Sync storage config if path changed
        this.storage.config = this.config;
        const configPath = path.resolve(this.targetDir, 'translation.config.json');
        await fs.writeJson(configPath, this.config, { spaces: 2 });
    }
}

module.exports = TranslatorManager;
