// ── Shared browser utilities ────────────────────────────────────
export const POSTS_URL = './posts/posts.json';

export async function fetchPosts() {
  const res = await fetch(POSTS_URL);
  if (!res.ok) throw new Error('Failed to load posts');
  return res.json();
}

export function sortByDateDesc(posts) {
  return [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function formatDate(date, month = 'short') {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month, day: 'numeric'
  });
}

export function tagsHTML(tags, className = 'card-tag') {
  return tags.map(t => `<span class="${className}">${t}</span>`).join('');
}

export function emptyStateHTML(message) {
  return `<div class="empty"><p>${message}</p></div>`;
}

const ARROW_SVG = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>`;

export function cardHTML(post, delay = 0) {
  return `
    <a class="card" href="post.html?slug=${post.slug}" style="animation-delay:${delay}ms">
      <div class="card-thumb-wrapper">
        <img class="card-thumb" src="${post.thumbnail}" alt="${post.title}" loading="lazy">
      </div>
      <div class="card-body">
        <div class="card-tags">${tagsHTML(post.tags)}</div>
        <h3 class="card-title">${post.title}</h3>
        <div class="card-meta">
          <span>${formatDate(post.date)}</span>
          <span class="card-meta-dot"></span>
          <span>${post.readTime}</span>
        </div>
        <p class="card-desc">${post.description}</p>
      </div>
      <div class="card-arrow">${ARROW_SVG}</div>
    </a>
  `;
}

export function renderCards(containerId, posts, emptyMsg = 'No posts found.', delayStep = 60) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = posts.length
    ? posts.map((p, i) => cardHTML(p, i * delayStep)).join('')
    : emptyStateHTML(emptyMsg);
}

export function setHTML(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

// ── Head element upsert (SEO tags) ──────────────────
export function upsertHeadElement(selector, tagName, init) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement(tagName);
    init(el);
    document.head.appendChild(el);
  }
  return el;
}

// ── Run a callback once per element when it scrolls into view ─
export function observeOnce(elements, onVisible, threshold = 0.2) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach((entry, i) => {
      if (!entry.isIntersecting) return;
      onVisible(entry.target, i);
      observer.unobserve(entry.target);
    });
  }, { threshold });

  elements.forEach(el => observer.observe(el));
  return observer;
}

// ── Layout chrome shared by every page ──────────────────────────
export function initMobileMenu() {
  const hamburger = document.getElementById('nav-hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  if (!hamburger || !mobileMenu) return;

  hamburger.addEventListener('click', () => mobileMenu.classList.toggle('open'));
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => mobileMenu.classList.remove('open'));
  });
}

export function initFooterYear() {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
}

export function initLayout() {
  initMobileMenu();
  initFooterYear();
}
