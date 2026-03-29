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
        let config = {};

        // Load config from file
        const configPath = options.config || 'translation.config.json';
        const absoluteConfigPath = path.resolve(targetDir, configPath);

        if (await fs.pathExists(absoluteConfigPath)) {
            config = await fs.readJson(absoluteConfigPath);
        } else {
            // Check for JS config
            const jsConfigPath = path.resolve(targetDir, 'translation.config.js');
            if (await fs.pathExists(jsConfigPath)) {
                config = require(jsConfigPath);
            }
        }

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

program.parse(process.argv);
