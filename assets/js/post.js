// ── Post Reader Engine ──────────────────────────────────────────
const POSTS_URL = './posts/posts.json';

async function loadPost() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');

  if (!slug) {
    window.location.href = './index.html';
    return;
  }

  try {
    const res = await fetch(POSTS_URL);
    const posts = await res.json();
    const post = posts.find(p => p.slug === slug);

    if (!post) {
      document.body.innerHTML = `<div style="padding:80px;text-align:center;color:#8888a0;font-family:sans-serif">
        <h2 style="font-size:2rem;color:#e8e8ed;margin-bottom:16px">Post not found</h2>
        <a href="./index.html" style="color:#7c6af7">← Back to home</a>
      </div>`;
      return;
    }

    renderPost(post, posts);
    updateSEO(post);
    initScrollProgress();

  } catch (e) {
    console.error(e);
  }
}

function renderPost(post, allPosts) {
  const dateStr = new Date(post.date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  // Hero
  document.getElementById('post-hero-img').src = post.thumbnail;
  document.getElementById('post-hero-img').alt = post.title;
  document.getElementById('post-title').textContent = post.title;
  document.getElementById('post-date').textContent = dateStr;
  document.getElementById('post-readtime').textContent = post.readTime;

  // Tags
  document.getElementById('post-tags').innerHTML =
    post.tags.map(t => `<span class="post-tag">${t}</span>`).join('');

  // Body
  document.getElementById('post-body').innerHTML = post.content;

  // Related posts
  const related = allPosts
    .filter(p => p.slug !== post.slug && p.tags.some(t => post.tags.includes(t)))
    .slice(0, 3);

  const relatedEl = document.getElementById('related-grid');
  if (related.length) {
    relatedEl.innerHTML = related.map(p => `
      <a class="card" href="post.html?slug=${p.slug}">
        <div class="card-thumb-wrapper">
          <img class="card-thumb" src="${p.thumbnail}" alt="${p.title}" loading="lazy">
        </div>
        <div class="card-body">
          <div class="card-tags">
            ${p.tags.map(t => `<span class="card-tag">${t}</span>`).join('')}
          </div>
          <h3 class="card-title">${p.title}</h3>
          <div class="card-meta">
            <span>${new Date(p.date).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'})}</span>
            <span class="card-meta-dot"></span>
            <span>${p.readTime}</span>
          </div>
          <p class="card-desc">${p.description}</p>
        </div>
        <div class="card-arrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </div>
      </a>
    `).join('');
  } else {
    relatedEl.innerHTML = '<p style="color:var(--muted);font-size:0.9rem">No related posts found.</p>';
  }
}

// ── SEO ─────────────────────────────────────────────────────────
function updateSEO(post) {
  document.title = `${post.title} — My Blog`;

  const setMeta = (name, content, prop = false) => {
    const attr = prop ? 'property' : 'name';
    let el = document.querySelector(`meta[${attr}="${name}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  setMeta('description', post.description);
  setMeta('keywords', post.tags.join(', '));
  setMeta('og:title', post.title, true);
  setMeta('og:description', post.description, true);
  setMeta('og:image', post.thumbnail, true);
  setMeta('og:type', 'article', true);
  setMeta('twitter:card', 'summary_large_image');
  setMeta('twitter:title', post.title);
  setMeta('twitter:description', post.description);
  setMeta('twitter:image', post.thumbnail);

  // Canonical URL
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = window.location.href.split('?')[0] + `?slug=${post.slug}`;

  // JSON-LD structured data
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    image: post.thumbnail,
    datePublished: post.date,
    author: { '@type': 'Person', name: 'Your Name' },
    keywords: post.tags.join(', ')
  };
  let ldScript = document.getElementById('ld-json');
  if (!ldScript) {
    ldScript = document.createElement('script');
    ldScript.id = 'ld-json';
    ldScript.type = 'application/ld+json';
    document.head.appendChild(ldScript);
  }
  ldScript.textContent = JSON.stringify(ld);
}

// ── Reading progress bar ─────────────────────────────────────────
function initScrollProgress() {
  const bar = document.getElementById('post-progress');
  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = pct + '%';
  }, { passive: true });
}

loadPost();
