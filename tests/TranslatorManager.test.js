import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
const TranslatorManager = require('../src/core/TranslatorManager');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

describe('TranslatorManager', () => {
    let testDir;
    let localesDir;

    beforeEach(async () => {
        testDir = path.join(os.tmpdir(), `tm-tm-test-${Math.random().toString(36).slice(2)}`);
        localesDir = path.join(testDir, 'locales');
        await fs.ensureDir(testDir);
        await fs.ensureDir(localesDir);
    });

    afterEach(async () => {
        await fs.remove(testDir);
    });

    it('should scan and build a correct picture of translations', async () => {
        await fs.writeJson(path.join(localesDir, 'en.json'), { hello: 'Hello', save: 'Save' });
        await fs.writeJson(path.join(localesDir, 'es.json'), { hello: 'Hola' });
        
        await fs.writeFile(path.join(testDir, 'App.js'), "t('missing.key')");

        const manager = new TranslatorManager(testDir);
        const data = await manager.scan();

        expect(data.languages).toContain('en');
        expect(data.languages).toContain('es');
        expect(data.allKeys).toContain('hello');
        expect(data.allKeys).toContain('save');
        expect(data.results['save'].missing).toContain('es');
        expect(data.missingFromFiles).toContain('missing.key');
    });

    it('should save translations across all languages', async () => {
        await fs.writeJson(path.join(localesDir, 'en.json'), { hello: 'Hello' });
        await fs.writeJson(path.join(localesDir, 'es.json'), { hello: 'Hola' });

        const manager = new TranslatorManager(testDir);
        await manager.saveTranslation('new.key', { en: 'New', es: 'Nuevo' });

        const en = await fs.readJson(path.join(localesDir, 'en.json'));
        const es = await fs.readJson(path.join(localesDir, 'es.json'));

        expect(en.new.key).toBe('New');
        expect(es.new.key).toBe('Nuevo');
    });

    it('should export missing translations with context', async () => {
        await fs.writeJson(path.join(localesDir, 'en.json'), { hello: 'Hello' });
        await fs.writeFile(path.join(testDir, 'App.js'), `
            // Context line
            t('missing.key')
            // After line
        `);

        const manager = new TranslatorManager(testDir);
        const exportResult = await manager.exportMissingFromFiles();

        expect(exportResult.exportData['missing.key']).toBeDefined();
        expect(exportResult.context['missing.key']).toBeDefined();
        expect(exportResult.context['missing.key'][0].snippet).toContain('Context line');
        expect(exportResult.metadata.aiFriendly).toBe(true);
    });

    it('should import translations correctly', async () => {
        await fs.writeJson(path.join(localesDir, 'en.json'), { hello: 'Hello' });
        await fs.writeJson(path.join(localesDir, 'es.json'), { hello: 'Hola' });

        const manager = new TranslatorManager(testDir);
        const importData = {
            'new.key': { en: 'New', es: 'Nuevo' },
            'hello': { es: 'Hola Updated' } // Should be skipped if overwriteExisting is false
        };

        const stats = await manager.importTranslations(importData, { overwriteExisting: false });

        const es = await fs.readJson(path.join(localesDir, 'es.json'));
        expect(es.new.key).toBe('Nuevo');
        expect(es.hello).toBe('Hola'); // Not updated
        expect(stats.imported).toBe(2); // en:new.key and es:new.key
    });
});

describe('AITranslator', () => {
    const AITranslator = require('../src/core/services/AITranslator');

    it('should prepare a prompt with context', async () => {
        const translator = new AITranslator({ apiKey: 'test-key', provider: 'openai' });
        
        // Mock _callAI to see the prompt
        const callSpy = vi.spyOn(translator, '_callAI').mockResolvedValue(JSON.stringify({ "Hello": "Hola" }));

        const context = {
            "Hello": [{ file: "App.js", line: 10, snippet: "<div>Hello</div>" }]
        };

        await translator.translate("Hello", "es", "en", context);

        const prompt = callSpy.mock.calls[0][0];
        expect(prompt).toContain('Translate the following en strings to es');
        expect(prompt).toContain('Context for some strings');
        expect(prompt).toContain('Key "Hello"');
        expect(prompt).toContain('<div>Hello</div>');
    });
});
