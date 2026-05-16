import { describe, it, expect, beforeEach, afterEach } from 'vitest';
const Storage = require('../src/core/Storage');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

describe('Storage External Namespaces', () => {
    let testDir;
    let localesDir;

    beforeEach(async () => {
        testDir = path.join(os.tmpdir(), `tm-ext-ns-test-${Math.random().toString(36).slice(2)}`);
        localesDir = path.join(testDir, 'locales');
        await fs.ensureDir(testDir);
        await fs.ensureDir(localesDir);
    });

    afterEach(async () => {
        await fs.remove(testDir);
    });

    describe('readAll with directory-based namespaces', () => {
        it('should read from subdirectories as namespaces', async () => {
            const enDir = path.join(localesDir, 'en');
            await fs.ensureDir(enDir);
            await fs.writeJson(path.join(enDir, 'common.json'), { save: 'Save' });
            await fs.writeJson(path.join(enDir, 'auth.json'), { login: 'Login' });

            const frDir = path.join(localesDir, 'fr');
            await fs.ensureDir(frDir);
            await fs.writeJson(path.join(frDir, 'common.json'), { save: 'Enregistrer' });

            const storage = new Storage(testDir);
            const data = await storage.readAll();

            expect(data.en.common.save).toBe('Save');
            expect(data.en.auth.login).toBe('Login');
            expect(data.fr.common.save).toBe('Enregistrer');
        });

        it('should handle mixed flat and namespaced structures (though not recommended)', async () => {
            // en is namespaced
            const enDir = path.join(localesDir, 'en');
            await fs.ensureDir(enDir);
            await fs.writeJson(path.join(enDir, 'common.json'), { save: 'Save' });

            // fr is flat
            await fs.writeJson(path.join(localesDir, 'fr.json'), { save: 'Enregistrer' });

            const storage = new Storage(testDir);
            const data = await storage.readAll();

            expect(data.en.common.save).toBe('Save');
            expect(data.fr.save).toBe('Enregistrer');
        });
    });

    describe('write with directory-based namespaces', () => {
        it('should write back to subdirectories if they exist', async () => {
            const enDir = path.join(localesDir, 'en');
            await fs.ensureDir(enDir);
            
            const storage = new Storage(testDir);
            const content = {
                common: { save: 'Save' },
                auth: { login: 'Login' }
            };

            await storage.write('en', content);

            const commonContent = await fs.readJson(path.join(enDir, 'common.json'));
            const authContent = await fs.readJson(path.join(enDir, 'auth.json'));

            expect(commonContent.save).toBe('Save');
            expect(authContent.login).toBe('Login');
        });

        it('should default to flat file if no subdirectory exists', async () => {
            const storage = new Storage(testDir);
            const content = { save: 'Save' };

            await storage.write('en', content);

            const fileExists = await fs.pathExists(path.join(localesDir, 'en.json'));
            expect(fileExists).toBe(true);
            
            const fileContent = await fs.readJson(path.join(localesDir, 'en.json'));
            expect(fileContent.save).toBe('Save');
        });
    });

    describe('Edge cases', () => {
        it('should handle empty namespace directories', async () => {
            const enDir = path.join(localesDir, 'en');
            await fs.ensureDir(enDir);

            const storage = new Storage(testDir);
            const data = await storage.readAll();

            expect(data.en).toEqual({});
        });

        it('should ignore non-JSON files in namespace directories', async () => {
            const enDir = path.join(localesDir, 'en');
            await fs.ensureDir(enDir);
            await fs.writeJson(path.join(enDir, 'common.json'), { save: 'Save' });
            await fs.writeFile(path.join(enDir, 'notes.txt'), 'This is a note');

            const storage = new Storage(testDir);
            const data = await storage.readAll();

            expect(data.en.common.save).toBe('Save');
            expect(data.en.notes).toBeUndefined();
        });

        it('should merge flat file and namespaced directory for the same language', async () => {
            // Flat file: en.json
            await fs.writeJson(path.join(localesDir, 'en.json'), { flat: 'Flat' });
            
            // Namespaced directory: en/
            const enDir = path.join(localesDir, 'en');
            await fs.ensureDir(enDir);
            await fs.writeJson(path.join(enDir, 'common.json'), { save: 'Save' });

            const storage = new Storage(testDir);
            const data = await storage.readAll();

            expect(data.en.flat).toBe('Flat');
            expect(data.en.common.save).toBe('Save');
        });

        it('should handle nested directories (deep namespaces)', async () => {
            const enDir = path.join(localesDir, 'en');
            const nestedDir = path.join(enDir, 'nested');
            await fs.ensureDir(nestedDir);
            await fs.writeJson(path.join(nestedDir, 'extra.json'), { more: 'More' });

            const storage = new Storage(testDir);
            const data = await storage.readAll();

            expect(data.en.nested.extra.more).toBe('More');
        });

        it('should provide clear error if a JSON file is malformed', async () => {
            const enDir = path.join(localesDir, 'en');
            await fs.ensureDir(enDir);
            await fs.writeFile(path.join(enDir, 'bad.json'), '{ "unclosed": "brace" '); // Missing closing brace

            const storage = new Storage(testDir);
            
            try {
                await storage.readAll();
            } catch (err) {
                expect(err.message).toMatch(/bad\.json/);
                // console.log('Captured error:', err.message);
            }
        });
    });
});
