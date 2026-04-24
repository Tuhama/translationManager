const fs = require('fs-extra');
const path = require('path');

/**
 * Scanner class to find translation key usages in source code.
 */
class Scanner {
    constructor(targetDir, localesDir, config = {}) {
        this.targetDir = targetDir;
        this.localesDir = localesDir;
        this.config = config;
        this.extensions = config.extensions || ['.js', '.jsx', '.ts', '.tsx', '.html', '.vue'];
        this.exclude = config.exclude || ['node_modules', '.git', 'dist', 'build', localesDir];
    }

    /**
     * Recursively gets files from the target directory.
     */
    async getFiles() {
        const files = [];

        const walk = async (dir) => {
            const entries = await fs.readdir(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.resolve(dir, entry.name);

                if (entry.isDirectory()) {
                    if (this.exclude.includes(entry.name) || this.exclude.some(ex => fullPath === path.resolve(this.targetDir, ex) || fullPath.startsWith(path.resolve(this.targetDir, ex) + path.sep))) {
                        continue;
                    }
                    await walk(fullPath);
                } else if (this.extensions.includes(path.extname(fullPath))) {
                    files.push(fullPath);
                }
            }
        };

        await walk(this.targetDir);
        return files;
    }

    /**
     * Scans source code for key usages.
     */
    async findUnusedKeys(allKeys) {
        const files = await this.getFiles();
        const contents = await Promise.all(files.map(f => fs.readFile(f, 'utf-8')));
        const combinedContent = contents.join('\n---\n');

        const used = new Set();
        const maybeUsed = new Set();
        const unused = [];

        allKeys.forEach(key => {
            // 1. Literal usage
            const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const literalRegex = new RegExp(`['"\`]${escapedKey}['"\`]`, 'g');

            if (literalRegex.test(combinedContent)) {
                used.add(key);
                return;
            }

            // 2. Dynamic usage
            const parts = key.split('.');
            let isMaybeUsed = false;

            for (let i = 1; i < parts.length; i++) {
                const prefix = parts.slice(0, i).join('.') + '.';
                const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const dynamicRegex = new RegExp("(['\"`]" + escapedPrefix + "['\"`].*?[+])|(['\"`]" + escapedPrefix + ".*?\\${)", 'g');

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
     * Finds keys that are used in source code but missing from translation files.
     */
    async findMissingKeys(existingKeys) {
        const files = await this.getFiles();
        const contents = await Promise.all(files.map(f => fs.readFile(f, 'utf-8')));
        const combinedContent = contents.join('\n---\n');

        const missingKeys = new Set();
        const existingKeysSet = new Set(existingKeys);

        // Regex patterns to find potential keys: 
        // 1. t('key')
        // 2. i18n.t('key')
        // 3. i18nKey="key"
        // 4. <Trans i18nKey="key">
        const patterns = [
            /(?:\bt\(|i18n\.t\(|i18nKey=)\s*['"\`]([^'"\`\s]+)['"\`]/g
        ];

        patterns.forEach(regex => {
            let match;
            while ((match = regex.exec(combinedContent)) !== null) {
                const key = match[1];
                // basic validation to avoid random strings and ensure it's not a translation file path
                if (key && !existingKeysSet.has(key) && !key.includes('/') && !key.includes('\\')) {
                    missingKeys.add(key);
                }
            }
        });

        return Array.from(missingKeys).sort();
    }
}

module.exports = Scanner;
