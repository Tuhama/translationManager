import { describe, it, expect } from 'vitest';
const Utilities = require('../src/core/Utilities');

describe('Utilities', () => {
    describe('sortObject', () => {
        it('should sort complex nested objects alphabetically', () => {
            const input = {
                z: 1,
                a: {
                    c: 2,
                    b: 3
                },
                m: 4
            };
            const expected = {
                a: {
                    b: 3,
                    c: 2
                },
                m: 4,
                z: 1
            };
            const result = Utilities.sortObject(input);
            expect(JSON.stringify(result)).toBe(JSON.stringify(expected));
            expect(Object.keys(result)).toEqual(['a', 'm', 'z']);
            expect(Object.keys(result.a)).toEqual(['b', 'c']);
        });

        it('should return non-object values as is', () => {
            expect(Utilities.sortObject(123)).toBe(123);
            expect(Utilities.sortObject('string')).toBe('string');
            expect(Utilities.sortObject(null)).toBe(null);
            expect(Utilities.sortObject([3, 2, 1])).toEqual([3, 2, 1]);
        });
    });

    describe('flattenKeys', () => {
        it('should flatten nested objects into dot-notation strings', () => {
            const input = {
                common: {
                    save: 'Save',
                    cancel: 'Cancel'
                },
                auth: {
                    login: {
                        title: 'Login',
                        button: 'Sign In'
                    }
                }
            };
            const keySet = Utilities.flattenKeys(input);
            const keys = Array.from(keySet).sort();
            
            expect(keys).toEqual([
                'auth.login.button',
                'auth.login.title',
                'common.cancel',
                'common.save'
            ]);
        });
    });

    describe('syncKeys', () => {
        it('should add missing keys with empty strings and sort everything', () => {
            const translations = {
                en: { a: 'A', b: 'B' },
                fr: { a: 'Ah' }
            };
            const allKeys = ['a', 'b', 'c'];
            
            const result = Utilities.syncKeys(translations, allKeys);
            
            expect(result.en).toEqual({ a: 'A', b: 'B', c: '' });
            expect(result.fr).toEqual({ a: 'Ah', b: '', c: '' });
            
            // Check sorting
            expect(Object.keys(result.en)).toEqual(['a', 'b', 'c']);
        });

        it('should handle nested keys during sync', () => {
            const translations = {
                en: { user: { name: 'Name' } },
                fr: {}
            };
            const allKeys = ['user.name', 'user.email', 'common.save'];
            
            const result = Utilities.syncKeys(translations, allKeys);
            
            expect(result.en).toEqual({
                common: { save: '' },
                user: { email: '', name: 'Name' }
            });
            expect(result.fr).toEqual({
                common: { save: '' },
                user: { email: '', name: '' }
            });
        });
    });
});
