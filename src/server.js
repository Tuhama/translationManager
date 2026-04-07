const express = require('express');
const cors = require('cors');
const path = require('path');
const history = require('express-history-api-fallback');
const TranslatorManager = require('./core/TranslatorManager');

/**
 * Starts the translation manager server.
 */
function startServer(targetDir, port = 3000, config = {}) {
    const app = express();
    const manager = new TranslatorManager(targetDir, config);

    app.use(cors());
    app.use(express.json());

    // API endpoints
    app.get('/api/translations', async (req, res) => {
        try {
            const data = await manager.scan();
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.post('/api/translations', async (req, res) => {
        try {
            const { key, values, format = true } = req.body;
            const options = { sort: format };
            await manager.saveTranslation(key, values, options);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.delete('/api/translations', async (req, res) => {
        try {
            const { key } = req.body;
            await manager.deleteTranslations(key);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.post('/api/delete-keys', async (req, res) => {
        try {
            const { keys } = req.body;
            await manager.deleteTranslations(keys);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.post('/api/normalize', async (req, res) => {
        try {
            await manager.normalize();
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.post('/api/translate', async (req, res) => {
        try {
            const { text, targetLang, sourceLang } = req.body;

            // Check if Google Translate is configured
            if (!manager.config.googleTranslate || !manager.config.googleTranslate.projectId) {
                return res.status(400).json({ 
                    error: 'Google Translate is not configured. Please add your Google Cloud Project ID and key file in Settings.',
                    configurationRequired: true
                });
            }

            const translatedText = await manager.translateSingle(text, targetLang, sourceLang);
            res.json({ translatedText });
        } catch (err) {
            // Check if it's a configuration error
            if (err.message.includes('Google Cloud Project ID is required') || 
                err.message.includes('Google Translate configuration is missing')) {
                return res.status(400).json({ 
                    error: err.message,
                    configurationRequired: true
                });
            }
            res.status(500).json({ error: err.message });
        }
    });

    app.get('/api/bulk-translate/scan', async (req, res) => {
        try {
            const { sourceLang } = req.query;
            const report = await manager.getBulkTranslateReport(sourceLang || 'en');
            res.json(report);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.post('/api/bulk-translate/execute', async (req, res) => {
        try {
            const { sourceLang } = req.body;

            // Check if Google Translate is configured
            if (!manager.config.googleTranslate || !manager.config.googleTranslate.projectId) {
                return res.status(400).json({ 
                    error: 'Google Translate is not configured. Please add your Google Cloud Project ID and key file in Settings.',
                    configurationRequired: true
                });
            }

            const preview = await manager.bulkTranslate(sourceLang || 'en');
            res.json(preview);
        } catch (err) {
            // Check if it's a configuration error
            if (err.message.includes('Google Cloud Project ID is required') || 
                err.message.includes('Google Translate configuration is missing')) {
                return res.status(400).json({ 
                    error: err.message,
                    configurationRequired: true
                });
            }
            res.status(500).json({ error: err.message });
        }
    });

    app.post('/api/bulk-save', async (req, res) => {
        try {
            const { data, format = true } = req.body;
            const options = { sort: format };
            await manager.saveBulkTranslations(data, options);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.get('/api/export-missing', async (req, res) => {
        try {
            const { sourceLang = 'en' } = req.query;
            const exportResult = await manager.exportMissingKeys(sourceLang);

            // Set headers for file download
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="missing-translations-${new Date().toISOString().split('T')[0]}.json"`);

            res.json(exportResult.exportData);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.post('/api/import-translations', async (req, res) => {
        try {
            const { data, options = {} } = req.body;

            if (!data || typeof data !== 'object') {
                return res.status(400).json({ error: 'Invalid import data format' });
            }

            const importStats = await manager.importTranslations(data, options);
            res.json({ success: true, stats: importStats });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.get('/api/export-missing/preview', async (req, res) => {
        try {
            const { sourceLang = 'en' } = req.query;
            const exportResult = await manager.exportMissingKeys(sourceLang);
            res.json(exportResult);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.get('/api/config', (req, res) => {
        res.json(manager.config);
    });

    app.post('/api/settings', async (req, res) => {
        try {
            const { settings } = req.body;
            await manager.saveConfig(settings);
            res.json({ success: true, config: manager.config });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Serve static files from the build folder
    const buildPath = path.resolve(__dirname, '../web/dist');
    app.use(express.static(buildPath));
    app.use(history('index.html', { root: buildPath }));

    app.listen(port, () => {
        console.log(`\x1b[32m✔\x1b[0m Translation Manager UI is running at http://localhost:${port}`);
    });
}

module.exports = { startServer };
