const fs = require('fs-extra');
const path = require('path');
const lodash = require('lodash');

/**
 * Scans the target directory for translation files.
 * Supports standard locales folders and auto-detection.
 */
async function scanTranslations(targetDir, config = {}) {
    const defaultPaths = [
        'public/locales',
        'src/locales',
        'src/i18n',
        'locales'
    ];

    let localesDir = config.path;

    if (!localesDir) {
        // Auto-detect
        for (const p of defaultPaths) {
            const fullPath = path.resolve(targetDir, p);
            if (await fs.pathExists(fullPath) && (await fs.stat(fullPath)).isDirectory()) {
                localesDir = fullPath;
                break;
            }
        }
    } else {
        localesDir = path.resolve(targetDir, localesDir);
    }

    if (!localesDir || !(await fs.pathExists(localesDir))) {
        throw new Error('Could not find translation directory. Please specify it in the config.');
    }

    const files = await fs.readdir(localesDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    const translations = {};
    const languages = [];

    for (const file of jsonFiles) {
        const lang = path.basename(file, '.json');
        languages.push(lang);
        const content = await fs.readJson(path.join(localesDir, file));
        translations[lang] = content;
    }

    // Collect all keys
    const allKeys = new Set();
    const flattenKeys = (obj, prefix = '') => {
        Object.keys(obj).forEach(key => {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                flattenKeys(obj[key], fullKey);
            } else {
                allKeys.add(fullKey);
            }
        });
    };
    languages.forEach(lang => flattenKeys(translations[lang]));

    // Calculate missing translations per key
    const results = {};
    allKeys.forEach(key => {
        const missing = [];
        languages.forEach(lang => {
            const val = lodash.get(translations[lang], key);
            if (val === undefined || val === '') {
                missing.push(lang);
            }
        });
        results[key] = {
            missing
        };
    });

    return {
        localesDir,
        languages,
        translations,
        allKeys: Array.from(allKeys).sort(),
        results
    };
}

/**
 * Normalizes all translation files by synchronizing keys and sorting alphabetically.
 */
async function normalizeTranslations(localesDir) {
    const files = await fs.readdir(localesDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    
    // 1. Collect all unique keys
    const allKeys = new Set();
    const translations = {};
    const languages = [];

    for (const file of jsonFiles) {
        const lang = path.basename(file, '.json');
        languages.push(lang);
        const content = await fs.readJson(path.join(localesDir, file));
        translations[lang] = content;
        
        const flattenKeys = (obj, prefix = '') => {
            Object.keys(obj).forEach(key => {
                const fullKey = prefix ? `${prefix}.${key}` : key;
                if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                    flattenKeys(obj[key], fullKey);
                } else {
                    allKeys.add(fullKey);
                }
            });
        };
        flattenKeys(content);
    }

    // 2. Sync all files with the universal key set and sort
    for (const lang of languages) {
        const content = translations[lang];
        allKeys.forEach(key => {
            if (lodash.get(content, key) === undefined) {
                lodash.set(content, key, '');
            }
        });

        const sortedContent = sortObject(content);
        const filePath = path.join(localesDir, `${lang}.json`);
        await fs.writeJson(filePath, sortedContent, { spaces: 2 });
    }
}

/**
 * Recursively sorts object keys alphabetically.
 */
function sortObject(obj) {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
        return obj;
    }

    const sorted = {};
    Object.keys(obj).sort().forEach(key => {
        sorted[key] = sortObject(obj[key]);
    });
    return sorted;
}

/**
 * Saves a translation key across all language files.
 */
async function saveTranslation(localesDir, key, values) {
    const files = await fs.readdir(localesDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    for (const file of jsonFiles) {
        const lang = path.basename(file, '.json');
        const filePath = path.join(localesDir, file);
        const content = await fs.readJson(filePath);
        
        // Use lodash.set to handle nested keys
        if (values[lang] !== undefined) {
            lodash.set(content, key, values[lang]);
        }
        
        await fs.writeJson(filePath, content, { spaces: 2 });
    }
}

/**
 * Deletes a translation key across all language files.
 */
async function deleteTranslation(localesDir, key) {
    const files = await fs.readdir(localesDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    for (const file of jsonFiles) {
        const filePath = path.join(localesDir, file);
        const content = await fs.readJson(filePath);
        
        // Use lodash.unset to handle nested keys
        lodash.unset(content, key);
        
        await fs.writeJson(filePath, content, { spaces: 2 });
    }
}

module.exports = {
    scanTranslations,
    saveTranslation,
    deleteTranslation,
    normalizeTranslations
};
