import { describe, it, expect, beforeEach, afterEach } from 'vitest';
const Storage = require('../src/core/Storage');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

describe('Storage', () => {
    let testDir;
    let localesDir;

    beforeEach(async () => {
        testDir = path.join(os.tmpdir(), `tm-storage-test-${Math.random().toString(36).slice(2)}`);
        localesDir = path.join(testDir, 'src', 'locales');
        await fs.ensureDir(localesDir);
    });

    afterEach(async () => {
        await fs.remove(testDir);
    });

    describe('getLocalesDir', () => {
        it('should auto-detect standard locales directory', async () => {
            const storage = new Storage(testDir);
            const detected = await storage.getLocalesDir();
            expect(detected).toBe(path.resolve(localesDir));
        });

        it('should use explicit path from config', async () => {
            const customDir = path.join(testDir, 'custom-i18n');
            await fs.ensureDir(customDir);
            
            const storage = new Storage(testDir, { path: 'custom-i18n' });
            const detected = await storage.getLocalesDir();
            expect(detected).toBe(path.resolve(customDir));
        });

        it('should throw error if directory not found', async () => {
            const emptyDir = path.join(os.tmpdir(), `tm-empty-${Math.random().toString(36).slice(2)}`);
            await fs.ensureDir(emptyDir);
            const storage = new Storage(emptyDir);
            
            await expect(storage.getLocalesDir()).rejects.toThrow('Could not find translation directory');
            await fs.remove(emptyDir);
        });
    });

    describe('readAll', () => {
        it('should read all JSON files in locales directory', async () => {
            await fs.writeJson(path.join(localesDir, 'en.json'), { hello: 'Hello' });
            await fs.writeJson(path.join(localesDir, 'fr.json'), { hello: 'Bonjour' });
            await fs.writeFile(path.join(localesDir, 'ignore.txt'), 'ignore me');

            const storage = new Storage(testDir);
            const data = await storage.readAll();

            expect(data).toHaveProperty('en');
            expect(data).toHaveProperty('fr');
            expect(data.en.hello).toBe('Hello');
            expect(data.fr.hello).toBe('Bonjour');
            expect(Object.keys(data)).toHaveLength(2);
        });
    });

    describe('write', () => {
        it('should write and sort JSON content', async () => {
            const storage = new Storage(testDir);
            const content = { z: 1, a: 2 };
            
            await storage.write('en', content);
            
            const fileContent = await fs.readJson(path.join(localesDir, 'en.json'));
            expect(fileContent).toEqual({ a: 2, z: 1 });
            
            // Verify physical order in file
            const raw = await fs.readFile(path.join(localesDir, 'en.json'), 'utf-8');
            const keys = Object.keys(JSON.parse(raw));
            expect(keys).toEqual(['a', 'z']);
        });
    });
});
