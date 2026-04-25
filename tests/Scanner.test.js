import { describe, it, expect, beforeEach, afterEach } from 'vitest';
const Scanner = require('../src/core/Scanner');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

describe('Scanner', () => {
    let testDir;
    let localesDir;

    beforeEach(async () => {
        // Create a unique temporary directory for each test
        testDir = path.join(os.tmpdir(), `tm-test-${Math.random().toString(36).slice(2)}`);
        localesDir = path.join(testDir, 'locales');
        await fs.ensureDir(testDir);
        await fs.ensureDir(localesDir);
    });

    afterEach(async () => {
        // Clean up
        await fs.remove(testDir);
    });
    
    describe('findMissingKeys', () => {
        it('should find keys in various patterns: t(), i18n.t(), i18nKey=', async () => {
            const scanner = new Scanner(testDir, localesDir);
            
            // Create mock files
            await fs.writeFile(path.join(testDir, 'App.js'), `
                t('app.title')
                i18n.t('auth.login')
                <Trans i18nKey="common.save" />
            `);
            
            await fs.writeFile(path.join(testDir, 'Component.tsx'), `
                const k = t("component.label");
                const m = t(\`dynamic.\${val}\`);
            `);

            const existingKeys = ['app.title'];
            const missingKeys = await scanner.findMissingKeys(existingKeys);

            expect(missingKeys).toContain('auth.login');
            expect(missingKeys).toContain('common.save');
            expect(missingKeys).toContain('component.label');
            expect(missingKeys).not.toContain('app.title');
        });

        it('should find simple keys without dots', async () => {
            const scanner = new Scanner(testDir, localesDir);
            await fs.writeFile(path.join(testDir, 'App.js'), "t('simpleKey')");

            const missingKeys = await scanner.findMissingKeys([]);
            expect(missingKeys).toContain('simpleKey');
        });

        it('should find keys with context if requested', async () => {
            const scanner = new Scanner(testDir, localesDir);
            await fs.writeFile(path.join(testDir, 'App.js'), `
                // Line before
                t('context.key')
                // Line after
            `);

            const result = await scanner.findMissingKeys([], true);
            expect(result['context.key']).toBeDefined();
            expect(result['context.key'].occurrences[0].context).toContain('// Line before');
            expect(result['context.key'].occurrences[0].context).toContain("t('context.key')");
        });

        it('should ignore dynamic template literals', async () => {
            const scanner = new Scanner(testDir, localesDir);
            await fs.writeFile(path.join(testDir, 'App.js'), "t(`${dynamic}.key`); t('literal.key')");

            const missingKeys = await scanner.findMissingKeys([]);
            expect(missingKeys).toContain('literal.key');
            expect(missingKeys).not.toContain('${dynamic}.key');
        });
    });

    describe('findUnusedKeys', () => {
        it('should identify unused vs maybe-used keys', async () => {
            const scanner = new Scanner(testDir, localesDir);
            
            await fs.writeFile(path.join(testDir, 'App.js'), `
                t('auth.login')
                t('status.' + type)
                t(\`user.\${id}\`)
            `);

            const allKeys = [
                'auth.login',     // used literally
                'auth.logout',    // unused
                'status.active',  // maybe used (dynamic prefix match)
                'user.profile'    // maybe used (dynamic prefix match)
            ];

            const result = await scanner.findUnusedKeys(allKeys);

            expect(result.unused).toContain('auth.logout');
            expect(result.unused).not.toContain('auth.login');
            
            expect(result.maybeUsed).toContain('status.active');
            expect(result.maybeUsed).toContain('user.profile');
        });
    });
});
