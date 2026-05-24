// ── Blog Engine ────────────────────────────────────────────────
const POSTS_URL = './posts/posts.json';
let allPosts = [];
let activeTag = 'all';

// ── Fetch posts ────────────────────────────────────────────────
async function fetchPosts() {
  try {
    const res = await fetch(POSTS_URL);
    if (!res.ok) throw new Error('Failed to load posts');
    allPosts = await res.json();
    init();
  } catch (e) {
    console.error(e);
    document.getElementById('recent-grid').innerHTML =
      `<div class="empty"><p>⚠ Could not load posts. Make sure you're running on a server.</p></div>`;
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
  const tags = getAllTags();
  container.innerHTML = tags.map(tag => `
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

// ── Card HTML ──────────────────────────────────────────────────
function cardHTML(post, delay = 0) {
  const dateStr = new Date(post.date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });

  return `
    <a class="card" href="post.html?slug=${post.slug}" style="animation-delay:${delay}ms">
      <div class="card-thumb-wrapper">
        <img class="card-thumb" src="${post.thumbnail}" alt="${post.title}" loading="lazy">
      </div>
      <div class="card-body">
        <div class="card-tags">
          ${post.tags.map(t => `<span class="card-tag">${t}</span>`).join('')}
        </div>
        <h3 class="card-title">${post.title}</h3>
        <div class="card-meta">
          <span>${dateStr}</span>
          <span class="card-meta-dot"></span>
          <span>${post.readTime}</span>
        </div>
        <p class="card-desc">${post.description}</p>
      </div>
      <div class="card-arrow">
        <svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
      </div>
    </a>
  `;
}

// ── Render grid ────────────────────────────────────────────────
function renderGrid(containerId, posts, emptyMsg = 'No posts found.') {
  const el = document.getElementById(containerId);
  const filtered = filterPosts(posts);
  if (!filtered.length) {
    el.innerHTML = `<div class="empty"><p>${emptyMsg}</p></div>`;
    return;
  }
  el.innerHTML = filtered.map((p, i) => cardHTML(p, i * 60)).join('');
}

// ── Render all sections ────────────────────────────────────────
function renderSections() {
  const sorted = [...allPosts].sort((a, b) => new Date(b.date) - new Date(a.date));
  const popular = allPosts.filter(p => p.popular);
  const favorites = allPosts.filter(p => p.favorite);

  renderGrid('recent-grid', sorted, 'No recent posts match this tag.');
  renderGrid('popular-grid', popular, 'No popular posts match this tag.');
  renderGrid('favorites-grid', favorites, 'No favorites match this tag.');
}

// ── Init ───────────────────────────────────────────────────────
function init() {
  renderTags();
  renderSections();
}

fetchPosts();
