import { beforeEach, describe, expect, it, vi } from 'vitest';
import { estimateReadTime, slugify, today } from '../scripts/new-post.js';

describe('new-post helpers', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('slugifies case, punctuation, whitespace, underscores, and unicode input', () => {
    expect(slugify('  Hello, World! A_B  ')).toBe('hello-world-a-b');
    expect(slugify('--- already--slug ---')).toBe('already-slug');
    expect(slugify('café 日本語')).toBe('caf');
    expect(slugify('!!!')).toBe('');
  });

  it('estimates at least one minute and rounds at 200 words per minute', () => {
    expect(estimateReadTime('one two')).toBe('1 min read');
    expect(estimateReadTime(Array(299).fill('word').join(' '))).toBe('1 min read');
    expect(estimateReadTime(Array(300).fill('word').join(' '))).toBe('2 min read');
    expect(estimateReadTime(Array(400).fill('word').join(' '))).toBe('2 min read');
  });

  it('returns the current date in ISO format', () => {
    vi.setSystemTime(new Date('2026-08-25T12:34:56Z'));
    expect(today()).toBe('2026-08-25');
  });
});
