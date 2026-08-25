// ── Blog Engine ────────────────────────────────────────────────
import { fetchPosts, sortByDateDesc, renderCards, setHTML, initLayout } from './shared.js';

let allPosts = [];
let activeTag = 'all';

// ── Fetch posts ────────────────────────────────────────────────
async function loadPosts() {
  try {
    allPosts = await fetchPosts();
    init();
  } catch (e) {
    console.error(e);
    setHTML('recent-grid',
      `<div class="empty"><p>⚠ Could not load posts. Make sure you're running on a server.</p></div>`);
  }
}

// ── Collect all tags ───────────────────────────────────────────
function getAllTags() {
  const set = new Set();
  allPosts.forEach(p => p.tags.forEach(t => set.add(t)));
  return ['all', ...Array.from(set).sort()];
}

// ── Render tag filter ──────────────────────────────────────────
function renderTags() {
  const container = document.getElementById('tag-list');
  container.innerHTML = getAllTags().map(tag => `
    <button class="tag ${tag === activeTag ? 'active' : ''}" data-tag="${tag}">
      ${tag === 'all' ? '✦ All' : tag}
    </button>
  `).join('');

  container.querySelectorAll('.tag').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTag = btn.dataset.tag;
      renderTags();
      renderSections();
    });
  });
}

// ── Filter posts ───────────────────────────────────────────────
function filterPosts(posts) {
  if (activeTag === 'all') return posts;
  return posts.filter(p => p.tags.includes(activeTag));
}

// ── Render all sections ────────────────────────────────────────
function renderSections() {
  renderCards('recent-grid', filterPosts(sortByDateDesc(allPosts)), 'No recent posts match this tag.');
  renderCards('popular-grid', filterPosts(allPosts.filter(p => p.popular)), 'No popular posts match this tag.');
  renderCards('favorites-grid', filterPosts(allPosts.filter(p => p.favorite)), 'No favorites match this tag.');
}

// ── Init ───────────────────────────────────────────────────────
function init() {
  renderTags();
  renderSections();
}

initLayout();
loadPosts();
