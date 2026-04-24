const lodash = require('lodash');

/**
 * Utility functions for object manipulation.
 */
class Utilities {
    /**
     * Recursively sorts object keys alphabetically.
     */
    static sortObject(obj) {
        if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
            return obj;
        }

        const sorted = {};
        Object.keys(obj).sort().forEach(key => {
            sorted[key] = Utilities.sortObject(obj[key]);
        });
        return sorted;
    }

    /**
     * Flattens a nested object into a set of dot-notated keys.
     */
    static flattenKeys(obj, prefix = '', keySet = new Set()) {
        if (!obj || typeof obj !== 'object') {
            return keySet;
        }

        Object.keys(obj).forEach(key => {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                Utilities.flattenKeys(obj[key], fullKey, keySet);
            } else {
                keySet.add(fullKey);
            }
        });
        return keySet;
    }

    /**
     * Normalizes translation keys across all languages.
     */
    static syncKeys(translations, allKeys) {
        const languages = Object.keys(translations);
        languages.forEach(lang => {
            const content = translations[lang];
            allKeys.forEach(key => {
                if (lodash.get(content, key) === undefined) {
                    lodash.set(content, key, '');
                }
            });
            translations[lang] = Utilities.sortObject(content);
        });
        return translations;
    }
}

module.exports = Utilities;
