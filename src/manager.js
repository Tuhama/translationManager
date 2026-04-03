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

    // Analyze unused keys
    const analysis = await findUnusedKeys(targetDir, localesDir, Array.from(allKeys), config);

    return {
        localesDir,
        languages,
        translations,
        allKeys: Array.from(allKeys).sort(),
        results,
        unused: analysis.unused,
        maybeUsed: analysis.maybeUsed
    };
}

/**
 * Scans the source code for key usages to identify unused translations.
 */
async function findUnusedKeys(targetDir, localesDir, allKeys, config = {}) {
    const extensions = config.extensions || ['.js', '.jsx', '.ts', '.tsx', '.html', '.vue'];
    const exclude = config.exclude || ['node_modules', '.git', 'dist', 'build', localesDir];
    
    const files = [];
    async function getFiles(dir) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const res = path.resolve(dir, entry.name);
            
            // Check if directory should be excluded
            if (entry.isDirectory()) {
                if (exclude.includes(entry.name) || exclude.some(ex => res === path.resolve(targetDir, ex) || res.startsWith(path.resolve(targetDir, ex) + path.sep))) {
                    continue;
                }
                await getFiles(res);
            } else if (extensions.includes(path.extname(res))) {
                files.push(res);
            }
        }
    }

    await getFiles(targetDir);
    // console.log('Scanning files:', files.length);

    // Read all file contents at once for performance
    const contents = await Promise.all(files.map(f => fs.readFile(f, 'utf-8')));
    const combinedContent = contents.join('\n---\n'); // Use a separator just in case

    const used = new Set();
    const maybeUsed = new Set();
    const unused = [];

    allKeys.forEach(key => {
        // 1. Check for exact literal usage (in quotes or backticks)
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const literalRegex = new RegExp(`['"\`]${escapedKey}['"\`]`, 'g');
        
        if (literalRegex.test(combinedContent)) {
            used.add(key);
            return;
        }

        // 2. Check for dynamic usage (maybeUsed)
        // If the key is 'auth.login.submit', we check if 'auth.' or 'auth.login.' is used dynamically
        const parts = key.split('.');
        let isMaybeUsed = false;
        
        for (let i = 1; i < parts.length; i++) {
            const prefix = parts.slice(0, i).join('.') + '.';
            const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            
            // Check for prefix + variable or prefix inside template literal
            // e.g. 'prefix.' + var  OR  `prefix.${var}`
            const dynamicRegex = new RegExp(`(['"\`]${escapedPrefix}['"\`].*?[+])|(['"\`]${escapedPrefix}.*?\$\{)`, 'g');
            
            if (dynamicRegex.test(combinedContent)) {
                isMaybeUsed = true;
                break;
            }
        }

        if (isMaybeUsed) {
            maybeUsed.add(key);
        } else {
            unused.push(key);
        }
    });

    return {
        unused: unused.sort(),
        maybeUsed: Array.from(maybeUsed).sort()
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

/**
 * Deletes multiple translation keys across all language files.
 */
async function deleteMultipleTranslations(localesDir, keys) {
    const files = await fs.readdir(localesDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    for (const file of jsonFiles) {
        const filePath = path.join(localesDir, file);
        const content = await fs.readJson(filePath);
        
        keys.forEach(key => {
            lodash.unset(content, key);
        });
        
        await fs.writeJson(filePath, content, { spaces: 2 });
    }
}

module.exports = {
    scanTranslations,
    findUnusedKeys,
    saveTranslation,
    deleteTranslation,
    deleteMultipleTranslations,
    normalizeTranslations
};
