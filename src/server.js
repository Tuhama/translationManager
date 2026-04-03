const express = require('express');
const cors = require('cors');
const path = require('path');
const history = require('express-history-api-fallback');
const { scanTranslations, saveTranslation, deleteTranslation, deleteMultipleTranslations, normalizeTranslations } = require('./manager');

function startServer(targetDir, port = 3000, config = {}) {
    const app = express();
    app.use(cors());
    app.use(express.json());

    // API endpoints
    app.get('/api/translations', async (req, res) => {
        try {
            const data = await scanTranslations(targetDir, config);
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.post('/api/translations', async (req, res) => {
        try {
            const { key, values } = req.body;
            const data = await scanTranslations(targetDir, config);
            await saveTranslation(data.localesDir, key, values);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.delete('/api/translations', async (req, res) => {
        try {
            const { key } = req.body;
            const data = await scanTranslations(targetDir, config);
            await deleteTranslation(data.localesDir, key);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.post('/api/delete-keys', async (req, res) => {
        try {
            const { keys } = req.body;
            const data = await scanTranslations(targetDir, config);
            await deleteMultipleTranslations(data.localesDir, keys);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.post('/api/normalize', async (req, res) => {
        try {
            const data = await scanTranslations(targetDir, config);
            await normalizeTranslations(data.localesDir);
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
