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
            const { key, values } = req.body;
            await manager.saveTranslation(key, values);
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

    // Serve static files from the build folder
    const buildPath = path.resolve(__dirname, '../web/dist');
    app.use(express.static(buildPath));
    app.use(history('index.html', { root: buildPath }));

    app.listen(port, () => {
        console.log(`\x1b[32m✔\x1b[0m Translation Manager UI is running at http://localhost:${port}`);
    });
}

module.exports = { startServer };
