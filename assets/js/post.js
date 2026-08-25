// ── Markdown → HTML parser ──────────────────────────────────────
function parseMarkdown(md) {
  // Escape HTML entities first
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Extract code blocks (``` ... ```)
  const codeBlocks = [];
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const placeholder = `__CODE_BLOCK_PLACEHOLDER_${codeBlocks.length}__`;
    codeBlocks.push(`<pre><code class="language-${lang}">${code.trimEnd()}</code></pre>`);
    return placeholder;
  });

  // Extract inline code ( `...` )
  const inlineCodes = [];
  html = html.replace(/`([^`\n]+)`/g, (_, code) => {
    const placeholder = `__INLINE_CODE_PLACEHOLDER_${inlineCodes.length}__`;
    inlineCodes.push(`<code>${code}</code>`);
    return placeholder;
  });

  // Headings
  html = html
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')

    // Images
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:10px;margin:24px 0;display:block;">')

    // Bold & italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')

    // Blockquotes
    .replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')

    // Unordered lists
    .replace(/(^- .+(\n- .+)*)/gm, block => {
      const items = block.split('\n').map(l => `<li>${l.replace(/^- /, '')}</li>`).join('');
      return `<ul>${items}</ul>`;
    })

    // Ordered lists
    .replace(/(^\d+\. .+(\n\d+\. .+)*)/gm, block => {
      const items = block.split('\n').map(l => `<li>${l.replace(/^\d+\. /, '')}</li>`).join('');
      return `<ol>${items}</ol>`;
    })

    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')

    // Horizontal rule
    .replace(/^---$/gm, '<hr>')

    // Paragraphs — wrap lines that aren't already block elements (ignoring code block placeholders)
    .replace(/^(?!<[hup]|<ol|<bl|<hr|<pre|__CODE_BLOCK_PLACEHOLDER_\d+__)(.+)$/gm, '<p>$1</p>')

    // Clean up empty paragraphs
    .replace(/<p>\s*<\/p>/g, '')

    // Collapse multiple blank lines
    .replace(/\n{3,}/g, '\n\n');

  // Restore inline codes
  inlineCodes.forEach((codeHTML, idx) => {
    html = html.replace(`__INLINE_CODE_PLACEHOLDER_${idx}__`, codeHTML);
  });

  // Restore code blocks
  codeBlocks.forEach((codeHTML, idx) => {
    html = html.replace(`__CODE_BLOCK_PLACEHOLDER_${idx}__`, codeHTML);
  });

  return html;
}

// ── Post Reader Engine ──────────────────────────────────────────
const POSTS_URL = './posts/posts.json';

async function loadPost() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');

  if (!slug) { window.location.href = './index.html'; return; }

  let posts;
  let post;
  let contentHTML;

  try {
    posts = await loadPosts(POSTS_URL);
    post = posts.find(p => p.slug === slug);

    if (!post) {
      showPostNotFound(slug);
      return;
    }

    if (typeof post.file !== 'string' || !post.file) {
      throw new Error(`Post "${slug}" has no "file" field pointing at its markdown source`);
    }

    const markdown = await fetchText('./' + post.file);
    contentHTML = parseMarkdown(markdown);
  } catch (err) {
    reportError('post: loading content', err);
    // The header is still showing its "Loading…" placeholder, so fill in
    // whatever metadata did load instead of leaving the page looking stuck.
    safeInit('post: header after failure', () => renderPostHeader(post));
    showFailure('post-body', `Failed to load post content: ${describeError(err)}`);
    return;
  }

  // Rendering, SEO and the progress bar are independent: a failure in one must
  // not silently skip the others.
  try {
    renderPost(post, contentHTML, posts);
  } catch (err) {
    reportError('post: rendering post', err);
    showFailure('post-body', `Failed to display this post: ${describeError(err)}`);
  }

  try {
    updateSEO(post);
  } catch (err) {
    reportError('post: updating SEO metadata', err);
  }

  try {
    initScrollProgress();
  } catch (err) {
    reportError('post: initialising reading progress bar', err);
  }
}

function showPostNotFound(slug) {
  document.body.innerHTML = `<div style="padding:80px;text-align:center;color:#8888a0;font-family:sans-serif">
    <h2 style="font-size:2rem;color:#e8e8ed;margin-bottom:16px">Post not found</h2>
    <a href="./index.html" style="color:#7c6af7">← Back to home</a>
  </div>`;
  console.warn(`No post in ${POSTS_URL} matches slug "${slug}"`);
}

// `post` is undefined when posts.json itself could not be loaded.
function renderPostHeader(post) {
  if (!post) {
    requireEl('post-title').textContent = 'Post unavailable';
    return;
  }

  const dateStr = new Date(post.date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const heroImg = requireEl('post-hero-img');
  heroImg.src = post.thumbnail;
  heroImg.alt = post.title;
  requireEl('post-title').textContent = post.title;
  requireEl('post-date').textContent = dateStr;
  requireEl('post-readtime').textContent = post.readTime;
  requireEl('post-tags').innerHTML =
    postTags(post).map(t => `<span class="post-tag">${t}</span>`).join('');
}

function renderPost(post, contentHTML, allPosts) {
  renderPostHeader(post);
  requireEl('post-body').innerHTML = contentHTML;

  // Related posts
  const tags = postTags(post);
  const related = allPosts
    .filter(p => p.slug !== post.slug && postTags(p).some(t => tags.includes(t)))
    .slice(0, 3);

  const relatedEl = requireEl('related-grid');
  if (related.length) {
    relatedEl.innerHTML = related.map(p => `
      <a class="card" href="post.html?slug=${p.slug}">
        <div class="card-thumb-wrapper">
          <img class="card-thumb" src="${p.thumbnail}" alt="${p.title}" loading="lazy">
        </div>
        <div class="card-body">
          <div class="card-tags">${postTags(p).map(t => `<span class="card-tag">${t}</span>`).join('')}</div>
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
      </a>`).join('');
  } else {
    relatedEl.innerHTML = '<p style="color:var(--muted);font-size:0.9rem">No related posts found.</p>';
  }
}

// ── SEO ──────────────────────────────────────────────────────────
function updateSEO(post) {
  document.title = `${post.title} — My Blog`;
  const setMeta = (name, content, prop = false) => {
    const attr = prop ? 'property' : 'name';
    let el = document.querySelector(`meta[${attr}="${name}"]`);
    if (!el) { el = document.createElement('meta'); el.setAttribute(attr, name); document.head.appendChild(el); }
    el.setAttribute('content', content);
  };
  setMeta('description', post.description);
  setMeta('keywords', postTags(post).join(', '));
  setMeta('og:title', post.title, true);
  setMeta('og:description', post.description, true);
  setMeta('og:image', post.thumbnail, true);
  setMeta('og:type', 'article', true);
  setMeta('twitter:card', 'summary_large_image');
  setMeta('twitter:title', post.title);
  setMeta('twitter:description', post.description);
  setMeta('twitter:image', post.thumbnail);

  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
  canonical.href = window.location.href.split('?')[0] + `?slug=${post.slug}`;

  const ld = {
    '@context': 'https://schema.org', '@type': 'BlogPosting',
    headline: post.title, description: post.description,
    image: post.thumbnail, datePublished: post.date,
    author: { '@type': 'Person', name: 'Your Name' },
    keywords: postTags(post).join(', ')
  };
  let ldScript = document.getElementById('ld-json');
  if (!ldScript) { ldScript = document.createElement('script'); ldScript.id = 'ld-json'; ldScript.type = 'application/ld+json'; document.head.appendChild(ldScript); }
  ldScript.textContent = JSON.stringify(ld);
}

// ── Reading progress bar ─────────────────────────────────────────
function initScrollProgress() {
  const bar = requireEl('post-progress');
  window.addEventListener('scroll', () => {
    const pct = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
    bar.style.width = Math.min(pct, 100) + '%';
  }, { passive: true });
}

loadPost().catch(err => reportError('post: unexpected failure', err));
