import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cardHTML,
  fetchPosts,
  filterPosts,
  getAllTags,
  getActiveTag,
  init,
  renderGrid,
  renderTags,
  setActiveTag,
} from '../assets/js/main.js';

const posts = [
  {
    slug: 'older',
    title: 'Older Post',
    date: '2024-01-02',
    thumbnail: '/older.jpg',
    tags: ['linux', 'cli'],
    readTime: '2 min read',
    description: 'Older description',
    popular: true,
    favorite: false,
  },
  {
    slug: 'newer',
    title: 'Newer Post',
    date: '2025-05-10',
    thumbnail: '/newer.jpg',
    tags: ['web'],
    readTime: '4 min read',
    description: 'Newer description',
    popular: false,
    favorite: true,
  },
];

beforeEach(() => {
  document.body.innerHTML = `
    <div id="tag-list"></div>
    <div id="recent-grid"></div>
    <div id="popular-grid"></div>
    <div id="favorites-grid"></div>
  `;
  setActiveTag('all');
  vi.restoreAllMocks();
});

describe('main blog helpers', () => {
  it('deduplicates and sorts tags with all first', () => {
    expect(getAllTags([...posts, { ...posts[0], tags: ['web', 'alpha'] }])).toEqual([
      'all', 'alpha', 'cli', 'linux', 'web',
    ]);
  });

  it('filters all posts, matching tags, and unmatched tags', () => {
    expect(filterPosts(posts, 'all')).toEqual(posts);
    expect(filterPosts(posts, 'linux')).toEqual([posts[0]]);
    expect(filterPosts(posts, 'missing')).toEqual([]);
  });

  it('renders a post card with metadata and animation delay', () => {
    const html = cardHTML(posts[0], 120);
    expect(html).toContain('href="post.html?slug=older"');
    expect(html).toContain('src="/older.jpg"');
    expect(html).toContain('linux');
    expect(html).toContain('2 min read');
    expect(html).toContain('Jan 2, 2024');
    expect(html).toContain('animation-delay:120ms');
  });

  it('renders cards or an empty state in a grid', () => {
    renderGrid('recent-grid', posts, 'Nothing here.', 'all');
    expect(document.querySelectorAll('#recent-grid .card')).toHaveLength(2);
    renderGrid('recent-grid', posts, 'Nothing here.', 'missing');
    expect(document.querySelector('#recent-grid').textContent).toContain('Nothing here.');
  });

  it('renders tags and re-renders filtered cards after a tag click', () => {
    init(posts);
    expect(document.querySelector('.tag.active').dataset.tag).toBe('all');
    document.querySelector('.tag[data-tag="linux"]').click();
    expect(getActiveTag()).toBe('linux');
    expect(document.querySelector('.tag[data-tag="linux"]').classList).toContain('active');
    expect(document.querySelectorAll('#recent-grid .card')).toHaveLength(1);
  });

  it('writes the fetch failure empty state for non-ok and rejected responses', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch = vi.fn().mockResolvedValue({ ok: false });
    await fetchPosts();
    expect(document.querySelector('#recent-grid').textContent).toContain('⚠ Could not load posts.');

    global.fetch = vi.fn().mockRejectedValue(new Error('offline'));
    await fetchPosts();
    expect(document.querySelector('#recent-grid').textContent).toContain('⚠ Could not load posts.');
    expect(error).toHaveBeenCalledTimes(2);
  });

  it('loads posts and initializes the sections on success', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => posts });
    await fetchPosts();
    expect(document.querySelectorAll('#recent-grid .card')).toHaveLength(2);
    expect(document.querySelectorAll('#tag-list .tag')).toHaveLength(4);
  });
});
