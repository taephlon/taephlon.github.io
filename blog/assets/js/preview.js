// ── Blog preview on homepage — shows 3 latest posts only ──────
const POSTS_URL = './posts/posts.json';

async function loadPreview() {
  try {
    const res = await fetch(POSTS_URL);
    const posts = await res.json();

    // Sort by date descending, take 3
    const recent = [...posts]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3);

    const grid = document.getElementById('blog-preview-grid');
    grid.innerHTML = recent.map((post, i) => {
      const dateStr = new Date(post.date).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
      return `
        <a class="card" href="post.html?slug=${post.slug}" style="animation-delay:${i * 80}ms">
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </div>
        </a>`;
    }).join('');

  } catch (e) {
    document.getElementById('blog-preview-grid').innerHTML =
      `<div class="empty"><p>Could not load posts.</p></div>`;
  }
}

loadPreview();
