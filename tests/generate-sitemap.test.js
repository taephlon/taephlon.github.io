import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { buildSitemapXML } from '../scripts/generate-sitemap.js';

describe('buildSitemapXML', () => {
  it('emits static and post URLs with deterministic lastmod dates', () => {
    const posts = [
      { slug: 'first-post', date: '2025-04-03' },
      { slug: 'second-post', date: '2024-12-31T12:00:00Z' },
    ];
    const xml = buildSitemapXML(posts, '2026-01-15');
    expect(xml.match(/<url>/g)).toHaveLength(4);
    expect(xml).toContain('https://taephlon.github.io/post.html?slug=first-post');
    expect(xml).toContain('<lastmod>2025-04-03</lastmod>');
    expect(xml).toContain('<lastmod>2024-12-31</lastmod>');
    const parsed = new JSDOM().window.DOMParser
      ? new (new JSDOM().window.DOMParser)().parseFromString(xml, 'application/xml')
      : null;
    expect(parsed).not.toBeNull();
    expect(parsed.querySelector('parsererror')).toBeNull();
    expect(parsed.getElementsByTagName('url')).toHaveLength(4);
  });
});
