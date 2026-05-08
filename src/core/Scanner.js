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
        const used = new Set();
        const maybeUsed = new Set();

        for (const file of files) {
            const content = await fs.readFile(file, 'utf-8');
            const namespace = this.extractNamespace(content);

            allKeys.forEach(key => {
                // If key is already marked as used, skip
                if (used.has(key)) return;

                // 1. Literal usage
                const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                
                // Check for full key match
                const literalRegex = new RegExp(`['"\`]${escapedKey}['"\`]`, 'g');
                if (literalRegex.test(content)) {
                    used.add(key);
                    return;
                }

                // Check for namespaced match if namespace exists
                if (namespace && key.startsWith(namespace + '.')) {
                    const relativeKey = key.substring(namespace.length + 1);
                    const escapedRelativeKey = relativeKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const relativeRegex = new RegExp(`['"\`]${escapedRelativeKey}['"\`]`, 'g');
                    if (relativeRegex.test(content)) {
                        used.add(key);
                        return;
                    }
                }

                // 2. Dynamic usage
                const parts = key.split('.');
                let isMaybeUsed = false;

                for (let i = 1; i < parts.length; i++) {
                    const prefix = parts.slice(0, i).join('.') + '.';
                    const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const dynamicRegex = new RegExp("(['\"`]" + escapedPrefix + "['\"`].*?[+])|(['\"`]" + escapedPrefix + ".*?\\${)", 'g');

                    if (dynamicRegex.test(content)) {
                        isMaybeUsed = true;
                        break;
                    }
                }

                if (isMaybeUsed) {
                    maybeUsed.add(key);
                }
            });
        }

        const unused = allKeys.filter(key => !used.has(key) && !maybeUsed.has(key));

        return {
            unused: unused.sort(),
            maybeUsed: Array.from(maybeUsed).sort()
        };
    }

    /**
     * Extracts the default namespace from useTranslation('ns') call.
     */
    extractNamespace(content) {
        // Matches useTranslation('ns') or useTranslation(['ns', ...]) or useTranslations('ns')
        const match = /\buseTranslations?\(\s*\[?\s*['"\`]([^'"`]+)['"\`]/.exec(content);
        return match ? match[1] : null;
    }

    /**
     * Finds keys that are used in source code but missing from translation files.
     * Returns an array of keys by default, or an object with context if includeContext is true.
     */
    async findMissingKeys(existingKeys, includeContext = false) {
        const files = await this.getFiles();
        const missingKeysData = {};
        const existingKeysSet = new Set(existingKeys);

        // Regex patterns to find potential keys: 
        // 1. t('key')
        // 2. i18n.t('key')
        // 3. i18nKey="key"
        // 4. <Trans i18nKey="key">
        const patterns = [
            /(?:\bt\(|i18n\.t\(|i18nKey=)\s*['"\`]([a-zA-Z0-9._:-]+)['"\`]/g
        ];

        for (const file of files) {
            const content = await fs.readFile(file, 'utf-8');
            const lines = content.split('\n');
            const namespace = this.extractNamespace(content);

            patterns.forEach(regex => {
                let match;
                regex.lastIndex = 0;
                while ((match = regex.exec(content)) !== null) {
                    let key = match[1];
                    
                    // Normalize colon to dot for internal representation if it's a namespace separator
                    // and not just part of a key.
                    if (key.includes(':')) {
                        key = key.replace(':', '.');
                    } else if (namespace) {
                        // Apply default namespace if no colon was present
                        key = `${namespace}.${key}`;
                    }
                    
                    if (key.includes('${') || key.includes('`') || key.startsWith('$')) {
                        continue;
                    }

                    if (key && !existingKeysSet.has(key) && !key.includes('/') && !key.includes('\\')) {
                        if (includeContext) {
                            if (!missingKeysData[key]) {
                                missingKeysData[key] = {
                                    key,
                                    occurrences: []
                                };
                            }
                            
                            const index = match.index;
                            const lineNo = content.substring(0, index).split('\n').length;
                            const contextRange = 2;
                            const startLine = Math.max(0, lineNo - contextRange - 1);
                            const endLine = Math.min(lines.length, lineNo + contextRange);
                            const contextLines = lines.slice(startLine, endLine);
                            
                            missingKeysData[key].occurrences.push({
                                file: path.relative(this.targetDir, file),
                                line: lineNo,
                                context: contextLines.join('\n').trim()
                            });
                        } else {
                            missingKeysData[key] = true;
                        }
                    }
                }
            });
        }

        if (includeContext) {
            return missingKeysData;
        }
        return Object.keys(missingKeysData).sort();
    }

    /**
     * Finds context for a list of existing keys.
     */
    async findContextForKeys(keys) {
        const files = await this.getFiles();
        const contextData = {};

        for (const file of files) {
            const content = await fs.readFile(file, 'utf-8');
            const lines = content.split('\n');
            const namespace = this.extractNamespace(content);

            keys.forEach(key => {
                const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regexes = [new RegExp(`['"\`]${escapedKey}['"\`]`, 'g')];
                
                // Also check for relative key if it matches the current namespace
                if (namespace && key.startsWith(namespace + '.')) {
                    const relativeKey = key.substring(namespace.length + 1);
                    const escapedRelativeKey = relativeKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    regexes.push(new RegExp(`['"\`]${escapedRelativeKey}['"\`]`, 'g'));
                }

                regexes.forEach(regex => {
                    let match;
                    while ((match = regex.exec(content)) !== null) {
                        if (!contextData[key]) {
                            contextData[key] = {
                                key,
                                occurrences: []
                            };
                        }

                        const index = match.index;
                        const lineNo = content.substring(0, index).split('\n').length;
                        const contextRange = 2;
                        const startLine = Math.max(0, lineNo - contextRange - 1);
                        const endLine = Math.min(lines.length, lineNo + contextRange);
                        const contextLines = lines.slice(startLine, endLine);

                        contextData[key].occurrences.push({
                            file: path.relative(this.targetDir, file),
                            line: lineNo,
                            context: contextLines.join('\n').trim()
                        });
                    }
                });
            });
        }

        return contextData;
    }
}

module.exports = Scanner;
