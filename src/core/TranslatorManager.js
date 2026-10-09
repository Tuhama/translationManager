const lodash = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const Storage = require('./Storage');
const Scanner = require('./Scanner');
const Utilities = require('./Utilities');
const GoogleTranslator = require('./services/GoogleTranslator');
const AITranslator = require('./services/AITranslator');

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
        const [analysis, missingFromFiles, missingKeysContext] = await Promise.all([
            scanner.findUnusedKeys(allKeys),
            scanner.findMissingKeys(allKeys),
            scanner.findMissingKeys(allKeys, true)
        ]);

        return {
            localesDir,
            languages,
            translations,
            allKeys,
            results,
            unused: analysis.unused,
            maybeUsed: analysis.maybeUsed,
            missingFromFiles: missingFromFiles,
            missingKeysContext: missingKeysContext
        };
    }

    /**
     * Saves a translation key across all language files.
     */
    async saveTranslation(key, values, options = {}) {
        if (!key) throw new Error('Key is required');
        if (!values || typeof values !== 'object') throw new Error('Values must be an object');

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
        if (!keys || (Array.isArray(keys) && keys.length === 0)) return;
        
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
    async translateSingle(text, targetLang, sourceLang = 'en', key = null) {
        const { translator, type } = await this.getTranslator();
        
        if (type === 'ai' && key) {
            const scanner = new Scanner(this.targetDir, await this.storage.getLocalesDir(), this.config);
            const context = await scanner.findContextForKeys([key]);
            return await translator.translate(text, targetLang, sourceLang, context, [key]);
        }
        
        return await translator.translate(text, targetLang, sourceLang);
    }

    /**
     * Gets the configured translator instance.
     */
    async getTranslator() {
        if (AITranslator.isConfigured(this.config.aiTranslate)) {
            return {
                translator: new AITranslator(this.config.aiTranslate),
                type: 'ai'
            };
        }

        if (this.config.googleTranslate && this.config.googleTranslate.projectId) {
            return {
                translator: new GoogleTranslator(this.config.googleTranslate),
                type: 'google'
            };
        }

        if (this.config.googleTranslateApiKey) {
            throw new Error('Google Translate API v2 is deprecated. Please update your configuration.');
        }

        throw new Error('No translation service configured. Add an AI provider (OpenAI, Gemini, Ollama, LM Studio, Groq, or a custom server) or Google Cloud Translate.');
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
        const { translator, type } = await this.getTranslator();

        // If AI, get context
        let context = {};
        if (type === 'ai') {
            const scanner = new Scanner(this.targetDir, await this.storage.getLocalesDir(), this.config);
            const allMissingKeys = Object.values(report).flatMap(r => r.keys);
            context = await scanner.findContextForKeys([...new Set(allMissingKeys)]);
        }

        const preview = {};

        for (const lang in report) {
            const keys = report[lang].keys;
            const sourceTexts = keys.map(key => lodash.get(translations[sourceLang], key));

            // Filter out keys that don't have source text
            const validIndices = sourceTexts.map((text, idx) => text ? idx : null).filter(idx => idx !== null);
            const textsToTranslate = validIndices.map(idx => sourceTexts[idx]);
            const validKeys = validIndices.map(idx => keys[idx]);

            if (textsToTranslate.length > 0) {
                const translatedTexts = await translator.translate(textsToTranslate, lang, sourceLang, context, validKeys);
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
     * Exports all missing translation keys.
     * Includes:
     * 1. Keys used in code but missing from all translation files.
     * 2. Keys existing in translation files but missing values in some languages.
     * @param {string} sourceLang - The source language to use as reference (default: 'en')
     * @returns {Object} - Export data with missing keys and empty values for each language
     */
    async exportMissingFromFiles(sourceLang = 'en') {
        const { languages, translations, allKeys, missingFromFiles, missingKeysContext } = await this.scan();
        const exportData = {};
        const context = {};

        // 1. Add keys missing from files (found in code)
        missingFromFiles.forEach(key => {
            exportData[key] = {};
            languages.forEach(lang => {
                exportData[key][lang] = '';
            });
            
            // Add context if available
            if (missingKeysContext[key]) {
                context[key] = missingKeysContext[key].occurrences.map(occ => ({
                    file: occ.file,
                    line: occ.line,
                    snippet: occ.context
                }));
            }
        });

        // 2. Add existing keys that are missing translations in some languages
        allKeys.forEach(key => {
            let isMissingInAny = false;
            const keyLangs = {};

            languages.forEach(lang => {
                const val = lodash.get(translations[lang], key);
                if (val === undefined || val === '') {
                    isMissingInAny = true;
                    keyLangs[lang] = '';
                } else {
                    keyLangs[lang] = val;
                }
            });

            if (isMissingInAny) {
                // If it's already in exportData (from code), we've already handled it.
                // Otherwise, add it now.
                if (!exportData[key]) {
                    exportData[key] = keyLangs;
                }
            }
        });

        return {
            exportData,
            context,
            metadata: {
                languages,
                sourceLang,
                totalKeys: Object.keys(exportData).length,
                exportedAt: new Date().toISOString(),
                aiFriendly: true
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
            // Skip metadata if present
            if (key === 'metadata') continue;

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
     * Config safe to send to the browser. API keys stay on disk.
     */
    toPublicConfig() {
        const clone = JSON.parse(JSON.stringify(this.config || {}));
        if (clone.aiTranslate) {
            clone.aiTranslate.hasApiKey = Boolean(AITranslator.resolveApiKey(this.config.aiTranslate));
            clone.aiTranslate.hasSavedApiKey = Boolean(this.config.aiTranslate?.apiKey);
            delete clone.aiTranslate.apiKey;
            delete clone.aiTranslate.clearApiKey;
        }
        return clone;
    }

    async saveConfig(newConfig) {
        const merged = { ...this.config, ...newConfig };

        if (newConfig.aiTranslate) {
            const incoming = { ...newConfig.aiTranslate };
            const clearApiKey = Boolean(incoming.clearApiKey);
            delete incoming.clearApiKey;

            if (clearApiKey) {
                incoming.apiKey = '';
            } else if (!incoming.apiKey) {
                incoming.apiKey = this.config.aiTranslate?.apiKey || '';
            }

            merged.aiTranslate = incoming;
        }

        this.config = merged;
        // Sync storage config if path changed
        this.storage.config = this.config;
        const configPath = path.resolve(this.targetDir, 'translation.config.json');
        await fs.writeJson(configPath, this.config, { spaces: 2 });
    }
}

module.exports = TranslatorManager;
