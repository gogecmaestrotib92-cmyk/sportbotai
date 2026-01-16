/**
 * AI Desk Constants Tests
 * 
 * Tests for chat constants and helper functions.
 */

import { describe, it, expect } from 'vitest';
import {
    FALLBACK_QUESTIONS,
    PLACEHOLDER_EXAMPLES,
    getInitialQuestions,
    stripMarkdown,
} from '@/components/ai-desk/constants';

describe('FALLBACK_QUESTIONS', () => {
    it('is an array with at least 4 questions', () => {
        expect(Array.isArray(FALLBACK_QUESTIONS)).toBe(true);
        expect(FALLBACK_QUESTIONS.length).toBeGreaterThanOrEqual(4);
    });

    it('contains only non-empty strings', () => {
        FALLBACK_QUESTIONS.forEach(q => {
            expect(typeof q).toBe('string');
            expect(q.trim().length).toBeGreaterThan(0);
        });
    });
});

describe('PLACEHOLDER_EXAMPLES', () => {
    it('is an array with examples', () => {
        expect(Array.isArray(PLACEHOLDER_EXAMPLES)).toBe(true);
        expect(PLACEHOLDER_EXAMPLES.length).toBeGreaterThan(0);
    });

    it('all examples start with "Try:"', () => {
        PLACEHOLDER_EXAMPLES.forEach(example => {
            expect(example.startsWith('Try:')).toBe(true);
        });
    });
});

describe('getInitialQuestions', () => {
    it('returns the requested number of questions', () => {
        expect(getInitialQuestions(2).length).toBe(2);
        expect(getInitialQuestions(4).length).toBe(4);
    });

    it('returns empty array for count of 0', () => {
        expect(getInitialQuestions(0)).toEqual([]);
    });

    it('does not exceed available questions', () => {
        const result = getInitialQuestions(100);
        expect(result.length).toBe(FALLBACK_QUESTIONS.length);
    });

    it('returns questions from FALLBACK_QUESTIONS', () => {
        const result = getInitialQuestions(2);
        expect(result[0]).toBe(FALLBACK_QUESTIONS[0]);
        expect(result[1]).toBe(FALLBACK_QUESTIONS[1]);
    });
});

describe('stripMarkdown', () => {
    it('removes bold markers (**text**)', () => {
        expect(stripMarkdown('This is **bold** text')).toBe('This is bold text');
    });

    it('removes bold markers (__text__)', () => {
        expect(stripMarkdown('This is __bold__ text')).toBe('This is bold text');
    });

    it('removes italic markers (*text*)', () => {
        expect(stripMarkdown('This is *italic* text')).toBe('This is italic text');
    });

    it('removes headers (## text)', () => {
        expect(stripMarkdown('## Header\nContent')).toBe('Header\nContent');
    });

    it('removes numbered list markers', () => {
        expect(stripMarkdown('1. First item\n2. Second item')).toBe('First item\nSecond item');
    });

    it('handles multiple markdown elements', () => {
        const input = '## Title\n\n**Bold** and *italic* text\n\n1. Item one';
        const result = stripMarkdown(input);
        expect(result).not.toContain('##');
        expect(result).not.toContain('**');
        expect(result).not.toContain('1.');
    });

    it('trims whitespace', () => {
        expect(stripMarkdown('  text  ')).toBe('text');
    });

    it('handles empty string', () => {
        expect(stripMarkdown('')).toBe('');
    });

    it('preserves normal text', () => {
        expect(stripMarkdown('Normal text without markdown')).toBe('Normal text without markdown');
    });
});
