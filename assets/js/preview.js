// ── Blog preview on homepage — shows 3 latest posts only ──────
const POSTS_URL = './posts/posts.json';

function previewCardHTML(post, index) {
  const dateStr = new Date(post.date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
  return `
    <a class="card" href="post.html?slug=${post.slug}" style="animation-delay:${index * 80}ms">
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
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
        </svg>
      </div>
    </a>`;
}

async function loadPreview() {
  let posts;
  try {
    posts = await loadPosts(POSTS_URL);
  } catch (err) {
    reportError('blog preview: loading posts', err);
    showFailure('blog-preview-grid', `Could not load posts: ${describeError(err)}`);
    return;
  }

  try {
    const recent = [...posts]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3);

    requireEl('blog-preview-grid').innerHTML =
      recent.map((post, i) => previewCardHTML(post, i)).join('');
  } catch (err) {
    reportError('blog preview: rendering posts', err);
    showFailure('blog-preview-grid', `Could not display posts: ${describeError(err)}`);
  }
}

loadPreview().catch(err => reportError('blog preview: unexpected failure', err));
