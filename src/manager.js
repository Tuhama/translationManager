const path = require('path');
const TranslatorManager = require('./core/TranslatorManager');

/**
 * Facade for the new SOLID core architecture.
 * Maintains backward compatibility while delegating to the TranslatorManager.
 */

async function scanTranslations(targetDir, config = {}) {
    const manager = new TranslatorManager(targetDir, config);
    return await manager.scan();
}

async function findUnusedKeys(targetDir, localesDir, allKeys, config = {}) {
    const Scanner = require('./core/Scanner');
    const scanner = new Scanner(targetDir, localesDir, config);
    return await scanner.findUnusedKeys(allKeys);
}

async function normalizeTranslations(localesDir) {
    const manager = new TranslatorManager(path.dirname(localesDir), { path: path.basename(localesDir) });
    await manager.normalize();
}

async function saveTranslation(localesDir, key, values) {
    const manager = new TranslatorManager(path.dirname(localesDir), { path: path.basename(localesDir) });
    await manager.saveTranslation(key, values);
}

async function deleteTranslation(localesDir, key) {
    const manager = new TranslatorManager(path.dirname(localesDir), { path: path.basename(localesDir) });
    await manager.deleteTranslations([key]);
}

async function deleteMultipleTranslations(localesDir, keys) {
    const manager = new TranslatorManager(path.dirname(localesDir), { path: path.basename(localesDir) });
    await manager.deleteTranslations(keys);
}

module.exports = {
    scanTranslations,
    findUnusedKeys,
    saveTranslation,
    deleteTranslation,
    deleteMultipleTranslations,
    normalizeTranslations
};
