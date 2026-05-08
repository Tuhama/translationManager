import { describe, it, expect, beforeEach, afterEach } from 'vitest';
const Scanner = require('../src/core/Scanner');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

describe('Scanner Internal Namespaces', () => {
    let testDir;
    let localesDir;

    beforeEach(async () => {
        testDir = path.join(os.tmpdir(), `tm-ns-test-${Math.random().toString(36).slice(2)}`);
        localesDir = path.join(testDir, 'locales');
        await fs.ensureDir(testDir);
        await fs.ensureDir(localesDir);
    });

    afterEach(async () => {
        await fs.remove(testDir);
    });

    describe('useTranslation detection', () => {
        it('should correctly identify keys with useTranslation namespace', async () => {
            const scanner = new Scanner(testDir, localesDir);
            
            await fs.writeFile(path.join(testDir, 'Component.jsx'), `
                import { useTranslation } from 'react-i18next';
                
                function Component() {
                    const { t } = useTranslation('auth');
                    return (
                        <div>
                            <h1>{t('login_title')}</h1>
                            <button>{t('submit')}</button>
                        </div>
                    );
                }
            `);

            const existingKeys = [];
            const missingKeys = await scanner.findMissingKeys(existingKeys);

            // Should be prefixed with 'auth.'
            expect(missingKeys).toContain('auth.login_title');
            expect(missingKeys).toContain('auth.submit');
        });

        it('should handle array of namespaces and use the first one', async () => {
            const scanner = new Scanner(testDir, localesDir);
            
            await fs.writeFile(path.join(testDir, 'Component.jsx'), `
                const { t } = useTranslation(['common', 'home']);
                t('save');
            `);

            const missingKeys = await scanner.findMissingKeys([]);
            expect(missingKeys).toContain('common.save');
        });

        it('should still support absolute keys (with colon) even with useTranslation', async () => {
            const scanner = new Scanner(testDir, localesDir);
            
            await fs.writeFile(path.join(testDir, 'Component.jsx'), `
                const { t } = useTranslation('auth');
                t('login');
                t('common:cancel');
            `);

            const missingKeys = await scanner.findMissingKeys([]);
            expect(missingKeys).toContain('auth.login');
            expect(missingKeys).toContain('common.cancel');
        });
    });

    describe('findUnusedKeys with namespaces', () => {
        it('should correctly identify used keys when namespace is used', async () => {
            const scanner = new Scanner(testDir, localesDir);
            
            await fs.writeFile(path.join(testDir, 'App.js'), `
                const { t } = useTranslation('settings');
                t('profile.title');
            `);

            const allKeys = [
                'settings.profile.title',
                'settings.profile.description'
            ];

            const result = await scanner.findUnusedKeys(allKeys);

            expect(result.unused).toContain('settings.profile.description');
            expect(result.unused).not.toContain('settings.profile.title');
        });
    });
});
