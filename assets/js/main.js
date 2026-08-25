// ── Blog Engine ────────────────────────────────────────────────
const POSTS_URL = './posts/posts.json';
let allPosts = [];
let activeTag = 'all';

// ── Fetch posts ────────────────────────────────────────────────
async function fetchPosts() {
  try {
    allPosts = await loadPosts(POSTS_URL);
  } catch (err) {
    reportError('blog: loading posts', err);
    showFailure('recent-grid', `Could not load posts: ${describeError(err)}`);
    return;
  }

  // Rendering failures are bugs rather than loading failures, so they get
  // their own message instead of being reported as a failed fetch.
  try {
    init();
  } catch (err) {
    reportError('blog: rendering posts', err);
    showFailure('recent-grid', `Could not display posts: ${describeError(err)}`);
  }
}

// ── Collect all tags ───────────────────────────────────────────
function getAllTags() {
  const set = new Set();
  allPosts.forEach(p => postTags(p).forEach(t => set.add(t)));
  return ['all', ...Array.from(set).sort()];
}

// ── Render tag filter ──────────────────────────────────────────
function renderTags() {
  const container = requireEl('tag-list');
  const tags = getAllTags();
  container.innerHTML = tags.map(tag => `
    <button class="tag ${tag === activeTag ? 'active' : ''}" data-tag="${tag}">
      ${tag === 'all' ? '✦ All' : tag}
    </button>
  `).join('');

  container.querySelectorAll('.tag').forEach(btn => {
    btn.addEventListener('click', () => {
      const previousTag = activeTag;
      activeTag = btn.dataset.tag;
      try {
        renderTags();
        renderSections();
      } catch (err) {
        activeTag = previousTag;
        reportError('blog: filtering by tag', err);
        showFailure('recent-grid', `Could not filter posts: ${describeError(err)}`);
      }
    });
  });
}

// ── Filter posts ───────────────────────────────────────────────
function filterPosts(posts) {
  if (activeTag === 'all') return posts;
  return posts.filter(p => postTags(p).includes(activeTag));
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
          ${postTags(post).map(t => `<span class="card-tag">${t}</span>`).join('')}
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
  const el = requireEl(containerId);
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

fetchPosts().catch(err => reportError('blog: unexpected failure', err));
