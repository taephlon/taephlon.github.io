import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadPreview, pickRecent, previewCardHTML } from '../assets/js/preview.js';

const posts = [
  { slug: 'old', title: 'Old', date: '2024-01-01', thumbnail: '/old.png', tags: ['a'], readTime: '1 min read', description: 'Old' },
  { slug: 'new', title: 'New', date: '2025-01-01', thumbnail: '/new.png', tags: ['b'], readTime: '2 min read', description: 'New' },
  { slug: 'mid', title: 'Mid', date: '2024-06-01', thumbnail: '/mid.png', tags: ['c'], readTime: '3 min read', description: 'Mid' },
  { slug: 'latest', title: 'Latest', date: '2026-01-01', thumbnail: '/latest.png', tags: ['d'], readTime: '4 min read', description: 'Latest' },
];

beforeEach(() => {
  document.body.innerHTML = '<div id="blog-preview-grid"></div>';
  vi.restoreAllMocks();
});

describe('homepage preview', () => {
  it('sorts recent posts descending and caps the result', () => {
    expect(pickRecent(posts).map(post => post.slug)).toEqual(['latest', 'new', 'mid']);
    expect(pickRecent(posts, 2).map(post => post.slug)).toEqual(['latest', 'new']);
  });

  it('renders the essential preview card markup', () => {
    const html = previewCardHTML(posts[1], 2);
    expect(html).toContain('post.html?slug=new');
    expect(html).toContain('src="/new.png"');
    expect(html).toContain('class="card-tag">b');
    expect(html).toContain('New');
    expect(html).toContain('animation-delay:160ms');
  });

  it('renders three cards after a successful load', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => posts });
    await loadPreview();
    expect(document.querySelectorAll('#blog-preview-grid .card')).toHaveLength(3);
    expect(document.querySelector('#blog-preview-grid').textContent).toContain('Latest');
  });

  it('renders the failure empty state', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('offline'));
    await loadPreview();
    expect(document.querySelector('#blog-preview-grid').textContent).toContain('Could not load posts.');
  });
});
