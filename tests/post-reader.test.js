import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initScrollProgress, loadPost, renderPost, updateSEO } from '../assets/js/post.js';

const post = {
  slug: 'current',
  title: 'Current Post',
  date: '2025-05-10',
  thumbnail: '/current.jpg',
  tags: ['linux', 'debugging'],
  readTime: '8 min read',
  description: 'Current description',
};

const related = [
  { ...post, slug: 'related-one', title: 'Related One', tags: ['linux'], date: '2025-01-01' },
  { ...post, slug: 'related-two', title: 'Related Two', tags: ['debugging'], date: '2025-01-02' },
  { ...post, slug: 'related-three', title: 'Related Three', tags: ['linux'], date: '2025-01-03' },
  { ...post, slug: 'related-four', title: 'Related Four', tags: ['linux'], date: '2025-01-04' },
  { ...post, slug: 'unrelated', title: 'Unrelated', tags: ['web'], date: '2025-01-05' },
];

function postDOM() {
  document.body.innerHTML = `
    <img id="post-hero-img"><h1 id="post-title"></h1>
    <span id="post-date"></span><span id="post-readtime"></span>
    <div id="post-tags"></div><article id="post-body"></article>
    <div id="related-grid"></div><div id="post-progress"></div>
  `;
}

beforeEach(() => {
  postDOM();
  document.head.innerHTML = '';
  history.replaceState({}, '', '/post.html?slug=current');
  vi.restoreAllMocks();
});

describe('post reader', () => {
  it('renders post metadata, body, and up to three related posts', () => {
    renderPost(post, '<p>Rendered content</p>', [post, ...related]);
    expect(document.querySelector('#post-hero-img').src).toContain('/current.jpg');
    expect(document.querySelector('#post-title').textContent).toBe('Current Post');
    expect(document.querySelector('#post-date').textContent).toBe('May 10, 2025');
    expect(document.querySelector('#post-readtime').textContent).toBe('8 min read');
    expect(document.querySelector('#post-tags').textContent).toContain('linux');
    expect(document.querySelector('#post-body').innerHTML).toBe('<p>Rendered content</p>');
    expect(document.querySelectorAll('#related-grid .card')).toHaveLength(3);
    expect(document.querySelector('#related-grid').textContent).not.toContain('Unrelated');
  });

  it('renders the related-post fallback when no tags match', () => {
    renderPost(post, '<p>Body</p>', [post, { ...related[4] }]);
    expect(document.querySelector('#related-grid').textContent).toContain('No related posts found.');
  });

  it('creates and updates SEO metadata idempotently', () => {
    updateSEO(post);
    updateSEO({ ...post, title: 'Updated Post', description: 'Updated description' });
    expect(document.title).toBe('Updated Post — My Blog');
    expect(document.querySelectorAll('meta[name="description"]')).toHaveLength(1);
    expect(document.querySelector('meta[name="description"]').content).toBe('Updated description');
    expect(document.querySelector('meta[property="og:title"]').content).toBe('Updated Post');
    expect(document.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    expect(document.querySelector('link[rel="canonical"]').href).toContain('post.html?slug=current');
    expect(() => JSON.parse(document.querySelector('#ld-json').textContent)).not.toThrow();
    expect(document.querySelectorAll('#ld-json')).toHaveLength(1);
  });

  it('updates and clamps reading progress', () => {
    initScrollProgress();
    Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: 1000 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 500 });
    window.scrollY = 250;
    window.dispatchEvent(new Event('scroll'));
    expect(document.querySelector('#post-progress').style.width).toBe('50%');
    window.scrollY = 900;
    window.dispatchEvent(new Event('scroll'));
    expect(document.querySelector('#post-progress').style.width).toBe('100%');
  });

  it('redirects when the URL has no slug', async () => {
    history.replaceState({}, '', '/post.html');
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    await loadPost();
    expect(window.location.href).toContain('/post.html');
    error.mockRestore();
  });

  it('renders not-found and markdown-fetch failure states', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    await loadPost();
    expect(document.body.textContent).toContain('Post not found');

    postDOM();
    history.replaceState({}, '', '/post.html?slug=current');
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [post] })
      .mockResolvedValueOnce({ ok: false });
    await loadPost();
    expect(document.querySelector('#post-body').textContent).toContain('⚠ Failed to load post content');
    error.mockRestore();
  });
});
