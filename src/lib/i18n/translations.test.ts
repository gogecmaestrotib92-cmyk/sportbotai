/**
 * i18n Translations Tests
 * 
 * Tests for internationalization utilities and translation completeness.
 */

import { describe, it, expect } from 'vitest';
import {
    translations,
    getTranslations,
    defaultLocale,
    locales,
    serbianCountries,
} from '@/lib/i18n';

describe('translations object', () => {
    it('has English translations', () => {
        expect(translations.en).toBeDefined();
        expect(translations.en.header).toBeDefined();
        expect(translations.en.hero).toBeDefined();
    });

    it('has Serbian translations', () => {
        expect(translations.sr).toBeDefined();
        expect(translations.sr.header).toBeDefined();
        expect(translations.sr.hero).toBeDefined();
    });

    it('has matching structure for all locales', () => {
        // Core sections should exist in both
        const enKeys = Object.keys(translations.en);
        const srKeys = Object.keys(translations.sr);

        enKeys.forEach(key => {
            expect(srKeys).toContain(key);
        });
    });
});

describe('getTranslations', () => {
    it('returns English translations for "en" locale', () => {
        const t = getTranslations('en');
        expect(t.header.home).toBe('Home');
    });

    it('returns Serbian translations for "sr" locale', () => {
        const t = getTranslations('sr');
        expect(t.header.home).toBe('Početna');
    });

    it('returns undefined for unknown locale (no fallback)', () => {
        // @ts-expect-error - Testing fallback behavior
        const t = getTranslations('de');
        expect(t).toBeUndefined();
    });
});

describe('locales', () => {
    it('includes "en" and "sr"', () => {
        expect(locales).toContain('en');
        expect(locales).toContain('sr');
    });

    it('has at least 2 locales', () => {
        expect(locales.length).toBeGreaterThanOrEqual(2);
    });
});

describe('defaultLocale', () => {
    it('is "en"', () => {
        expect(defaultLocale).toBe('en');
    });

    it('is included in locales array', () => {
        expect(locales).toContain(defaultLocale);
    });
});

describe('serbianCountries', () => {
    it('is an array', () => {
        expect(Array.isArray(serbianCountries)).toBe(true);
    });

    it('includes Serbia', () => {
        expect(serbianCountries.some(c => c.toLowerCase().includes('serb') || c === 'RS')).toBe(true);
    });
});

describe('translation keys completeness', () => {
    it('header has all required keys in English', () => {
        expect(translations.en.header.home).toBeDefined();
        expect(translations.en.header.analyze).toBeDefined();
        expect(translations.en.header.pricing).toBeDefined();
        expect(translations.en.header.signIn).toBeDefined();
    });

    it('header has all required keys in Serbian', () => {
        expect(translations.sr.header.home).toBeDefined();
        expect(translations.sr.header.analyze).toBeDefined();
        expect(translations.sr.header.pricing).toBeDefined();
        expect(translations.sr.header.signIn).toBeDefined();
    });

    it('pricing section has all required keys', () => {
        expect(translations.en.pricing.free).toBeDefined();
        expect(translations.en.pricing.pro).toBeDefined();
        expect(translations.en.pricing.premium).toBeDefined();

        expect(translations.sr.pricing.free).toBeDefined();
        expect(translations.sr.pricing.pro).toBeDefined();
        expect(translations.sr.pricing.premium).toBeDefined();
    });

    it('auth section has matching keys', () => {
        expect(translations.en.auth.signIn).toBeDefined();
        expect(translations.en.auth.signUp).toBeDefined();
        expect(translations.en.auth.email).toBeDefined();

        expect(translations.sr.auth.signIn).toBeDefined();
        expect(translations.sr.auth.signUp).toBeDefined();
        expect(translations.sr.auth.email).toBeDefined();
    });
});
