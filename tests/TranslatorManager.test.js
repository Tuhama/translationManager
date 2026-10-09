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

    it('passes code context and the translation key into AI translation', async () => {
        await fs.writeJson(path.join(localesDir, 'en.json'), { hello: 'Hello' });
        await fs.writeFile(path.join(testDir, 'App.js'), "const label = t('hello');");

        const AITranslator = require('../src/core/services/AITranslator');
        const manager = new TranslatorManager(testDir, {
            aiTranslate: { provider: 'ollama' }
        });
        const spy = vi.spyOn(AITranslator.prototype, 'translate').mockResolvedValue('Hola');

        try {
            const result = await manager.translateSingle('Hello', 'es', 'en', 'hello');
            expect(result).toBe('Hola');
            expect(spy.mock.calls[0][4]).toEqual(['hello']);
            expect(spy.mock.calls[0][3].hello.occurrences[0].context).toContain("t('hello')");
        } finally {
            spy.mockRestore();
        }
    });

    it('keeps a saved API key when settings omit it and can clear it', async () => {
        const manager = new TranslatorManager(testDir, {
            aiTranslate: { provider: 'openai', apiKey: 'sk-secret', model: 'gpt-4o' }
        });

        await manager.saveConfig({
            aiTranslate: { provider: 'openai', apiKey: '', model: 'gpt-4o' }
        });

        expect(manager.config.aiTranslate.apiKey).toBe('sk-secret');
        const saved = await fs.readJson(path.join(testDir, 'translation.config.json'));
        expect(saved.aiTranslate.apiKey).toBe('sk-secret');
        expect(manager.toPublicConfig().aiTranslate.apiKey).toBeUndefined();
        expect(manager.toPublicConfig().aiTranslate.hasApiKey).toBe(true);

        await manager.saveConfig({
            aiTranslate: { provider: 'openai', clearApiKey: true }
        });
        expect(manager.config.aiTranslate.apiKey).toBe('');
        expect(manager.config.aiTranslate.clearApiKey).toBeUndefined();
        expect(manager.toPublicConfig().aiTranslate.hasApiKey).toBe(false);
    });
});

describe('AITranslator', () => {
    const AITranslator = require('../src/core/services/AITranslator');

    it('should prepare a prompt with context and read indexed translations', async () => {
        const translator = new AITranslator({ apiKey: 'test-key', provider: 'openai' });
        
        const callSpy = vi.spyOn(translator, '_callAI').mockResolvedValue(JSON.stringify({
            translations: [{ id: 0, text: 'Hola' }]
        }));

        const context = {
            "Hello": [{ file: "App.js", line: 10, snippet: "<div>Hello</div>" }]
        };

        const result = await translator.translate("Hello", "es", "en", context);

        const prompt = callSpy.mock.calls[0][0];
        expect(result).toBe('Hola');
        expect(prompt).toContain('from en to es');
        expect(prompt).toContain('<div>Hello</div>');
        expect(prompt).toContain('"translations"');
    });

    it('should accept scanner context objects and keep duplicate source strings distinct', async () => {
        const translator = new AITranslator({ apiKey: 'test-key', provider: 'openai' });
        const callSpy = vi.spyOn(translator, '_callAI').mockResolvedValue(JSON.stringify({
            translations: [
                { id: 0, text: 'Guardar' },
                { id: 1, text: 'Ahorrar' }
            ]
        }));

        const context = {
            'button.save': {
                key: 'button.save',
                occurrences: [{ file: 'App.js', line: 4, context: '<button>Save</button>' }]
            },
            'money.save': {
                occurrences: [{ file: 'Bank.js', line: 8, context: 'save money' }]
            }
        };

        const result = await translator.translate(
            ['Save', 'Save'],
            'es',
            'en',
            context,
            ['button.save', 'money.save']
        );

        expect(result).toEqual(['Guardar', 'Ahorrar']);
        const prompt = callSpy.mock.calls[0][0];
        expect(prompt).toContain('<button>Save</button>');
        expect(prompt).toContain('save money');
        expect(prompt).toContain('button.save');
    });

    it('should parse fenced JSON and reject a response that drops an item', async () => {
        const translator = new AITranslator({ apiKey: 'test-key', provider: 'openai' });
        const callSpy = vi.spyOn(translator, '_callAI').mockResolvedValue('```json\n{"translations":[{"id":0,"text":"Hola"}]}\n```');

        await expect(translator.translate('Hello', 'es', 'en')).resolves.toBe('Hola');

        callSpy.mockResolvedValue(JSON.stringify({ translations: [] }));
        await expect(translator.translate('Hello', 'es', 'en')).rejects.toThrow(/missing translation for item 0/);
    });

    it('should allow local providers without an API key and reject a custom server with no URL', () => {
        const ollama = new AITranslator({ provider: 'ollama' });
        expect(ollama.model).toBe('llama3.2');
        expect(ollama.baseUrl).toBe('http://127.0.0.1:11434/v1');
        expect(AITranslator.isConfigured({ provider: 'ollama' })).toBe(true);
        expect(AITranslator.isConfigured({ provider: 'openai' })).toBe(false);

        const gemini = new AITranslator({ provider: 'gemini', apiKey: 'test-key' });
        expect(gemini.model).toBe('gemini-3.8-flash');

        expect(() => new AITranslator({ provider: 'custom', model: 'local' })).toThrow(/base URL/);
        expect(() => new AITranslator({ provider: 'lmstudio' })).toThrow(/model name/);
    });
});
