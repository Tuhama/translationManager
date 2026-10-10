const express = require('express');
const path = require('path');
const history = require('express-history-api-fallback');
const TranslatorManager = require('./core/TranslatorManager');
const AITranslator = require('./core/services/AITranslator');
const pkg = require('../package.json');

/**
 * Starts the translation manager server.
 * Binds to loopback by default so locale files and API keys are not exposed on the network.
 */
function startServer(targetDir, port = 3000, config = {}, host = '127.0.0.1') {
    const app = express();
    const manager = new TranslatorManager(targetDir, config);

    app.use(express.json({ limit: '2mb' }));

    // API endpoints
    app.get('/api/translations', async (req, res, next) => {
        try {
            const data = await manager.scan();
            res.json(data);
        } catch (err) {
            next(err);
        }
    });

    app.post('/api/translations', async (req, res, next) => {
        try {
            const { key, values, format = true } = req.body;
            const options = { sort: format };
            await manager.saveTranslation(key, values, options);
            res.json({ success: true });
        } catch (err) {
            next(err);
        }
    });

    app.delete('/api/translations', async (req, res, next) => {
        try {
            const { key } = req.body;
            await manager.deleteTranslations(key);
            res.json({ success: true });
        } catch (err) {
            next(err);
        }
    });

    app.post('/api/delete-keys', async (req, res, next) => {
        try {
            const { keys } = req.body;
            await manager.deleteTranslations(keys);
            res.json({ success: true });
        } catch (err) {
            next(err);
        }
    });

    app.post('/api/normalize', async (req, res, next) => {
        try {
            await manager.normalize();
            res.json({ success: true });
        } catch (err) {
            next(err);
        }
    });

    const checkConfig = (res) => {
        const hasAI = AITranslator.isConfigured(manager.config.aiTranslate);
        const hasGoogle = manager.config.googleTranslate && manager.config.googleTranslate.projectId;

        if (!hasAI && !hasGoogle) {
            res.status(400).json({ 
                error: 'No translation service configured. Add OpenAI, Gemini, Ollama, LM Studio, Groq, a custom server, or Google Cloud Translate.',
                configurationRequired: true
            });
            return false;
        }
        return true;
    };

    app.post('/api/translate', async (req, res, next) => {
        try {
            if (!checkConfig(res)) return;
            const { text, targetLang, sourceLang, key } = req.body;
            const translatedText = await manager.translateSingle(text, targetLang, sourceLang, key);
            res.json({ translatedText });
        } catch (err) {
            next(err);
        }
    });

    app.get('/api/bulk-translate/scan', async (req, res, next) => {
        try {
            const { sourceLang } = req.query;
            const report = await manager.getBulkTranslateReport(sourceLang || 'en');
            res.json(report);
        } catch (err) {
            next(err);
        }
    });

    app.post('/api/bulk-translate/execute', async (req, res, next) => {
        try {
            if (!checkConfig(res)) return;
            const { sourceLang } = req.body;
            const preview = await manager.bulkTranslate(sourceLang || 'en');
            res.json(preview);
        } catch (err) {
            next(err);
        }
    });

    app.post('/api/languages', async (req, res, next) => {
        try {
            if (!checkConfig(res)) return;
            const { targetLang, sourceLang } = req.body || {};
            const result = await manager.addLanguage(targetLang, sourceLang || 'en');
            res.json({ success: true, ...result });
        } catch (err) {
            if (err.message && /already exists|language code|was not found/i.test(err.message)) {
                return res.status(400).json({ error: err.message });
            }
            next(err);
        }
    });

    app.post('/api/bulk-save', async (req, res, next) => {
        try {
            const { data, format = true } = req.body;
            const options = { sort: format };
            await manager.saveBulkTranslations(data, options);
            res.json({ success: true });
        } catch (err) {
            next(err);
        }
    });

    app.get('/api/export-missing', async (req, res, next) => {
        try {
            const exportResult = await manager.exportMissingFromFiles();

            // Set headers for file download
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="missing-keys-from-code-${new Date().toISOString().split('T')[0]}.json"`);

            res.json(exportResult.exportData);
        } catch (err) {
            next(err);
        }
    });

    app.post('/api/import-translations', async (req, res, next) => {
        try {
            const { data, options = {} } = req.body;

            if (!data || typeof data !== 'object') {
                return res.status(400).json({ error: 'Invalid import data format' });
            }

            const importStats = await manager.importTranslations(data, options);
            res.json({ success: true, stats: importStats });
        } catch (err) {
            next(err);
        }
    });

    app.get('/api/export-missing/preview', async (req, res, next) => {
        try {
            const exportResult = await manager.exportMissingFromFiles();
            res.json(exportResult);
        } catch (err) {
            next(err);
        }
    });

    app.get('/api/config', (req, res) => {
        res.json(manager.toPublicConfig());
    });

    app.post('/api/settings', async (req, res, next) => {
        try {
            const { settings } = req.body;
            await manager.saveConfig(settings);
            res.json({ success: true, config: manager.toPublicConfig() });
        } catch (err) {
            next(err);
        }
    });

    // Serve static files from the build folder
    const buildPath = path.resolve(__dirname, '../web/dist');
    app.use(express.static(buildPath));
    app.use(history('index.html', { root: buildPath }));

    // Global error handler
    app.use((err, req, res, next) => {
        console.error('\x1b[31mError:\x1b[0m', err.message);
        
        // Check for specific error types
        const isConfigError = err.message.includes('not configured') || 
                            err.message.includes('API Key is required') ||
                            err.message.includes('Project ID is required') ||
                            err.message.includes('model name is required') ||
                            err.message.includes('base URL is required');

        res.status(isConfigError ? 400 : 500).json({
            error: err.message,
            configurationRequired: isConfigError
        });
    });

    return new Promise((resolve, reject) => {
        const server = app.listen(port, host, () => {
            const shownHost = host === '0.0.0.0' || host === '::' ? '127.0.0.1' : host;
            console.log(`\x1b[32m✔\x1b[0m Translation Manager v${pkg.version} is running at http://${shownHost}:${port}`);
            resolve(server);
        });
        server.on('error', reject);
    });
}

module.exports = { startServer };
