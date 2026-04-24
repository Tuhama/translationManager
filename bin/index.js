#!/usr/bin/env node

const { program } = require('commander');
const path = require('path');
const fs = require('fs-extra');
const { startServer } = require('../src/server');
const open = (...args) => import('open').then(m => m.default(...args));

program
    .version('0.1.0')
    .description('Translation Manager CLI - Manage your React translations with a modern UI')
    .option('-p, --port <number>', 'Port to run the UI on', 3000)
    .option('-c, --config <path>', 'Path to config file')
    .action(async (options) => {
        const targetDir = process.cwd();
        let config = await loadConfig(targetDir, options.config);

        console.log('\x1b[36mℹ\x1b[0m Starting Translation Manager...');
        
        try {
            startServer(targetDir, options.port, config);
            
            // Open the browser
            await open(`http://localhost:${options.port}`);
        } catch (err) {
            console.error('\x1b[31m✖\x1b[0m Error:', err.message);
            process.exit(1);
        }
    });

program
    .command('status')
    .description('Get translation status in JSON format')
    .option('-c, --config <path>', 'Path to config file')
    .action(async (options) => {
        const targetDir = process.cwd();
        const config = await loadConfig(targetDir, options.config);
        const TranslatorManager = require('../src/core/TranslatorManager');
        const manager = new TranslatorManager(targetDir, config);

        try {
            const data = await manager.scan();
            const status = {
                languages: data.languages,
                totalKeys: data.allKeys.length,
                missingKeysFromCode: data.missingFromFiles.length,
                unusedKeys: data.unused.length,
                maybeUsedKeys: data.maybeUsed.length,
                coverage: {}
            };

            data.languages.forEach(lang => {
                const untranslated = data.allKeys.filter(key => {
                    const val = require('lodash').get(data.translations[lang], key);
                    return val === undefined || val === '';
                }).length;
                
                status.coverage[lang] = {
                    translated: data.allKeys.length - untranslated,
                    total: data.allKeys.length,
                    percentage: Math.round(((data.allKeys.length - untranslated) / data.allKeys.length) * 100)
                };
            });

            console.log(JSON.stringify(status, null, 2));
        } catch (err) {
            console.error(JSON.stringify({ error: err.message }, null, 2));
            process.exit(1);
        }
    });

async function loadConfig(targetDir, configPath) {
    let config = {};
    const absoluteConfigPath = path.resolve(targetDir, configPath || 'translation.config.json');

    if (await fs.pathExists(absoluteConfigPath)) {
        config = await fs.readJson(absoluteConfigPath);
    } else {
        const jsConfigPath = path.resolve(targetDir, 'translation.config.js');
        if (await fs.pathExists(jsConfigPath)) {
            config = require(jsConfigPath);
        }
    }
    return config;
}

program.parse(process.argv);
