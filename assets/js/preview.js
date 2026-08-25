// ── Blog preview on homepage — shows 3 latest posts only ──────
import { fetchPosts, sortByDateDesc, renderCards, setHTML, emptyStateHTML } from './shared.js';

async function loadPreview() {
  try {
    const posts = await fetchPosts();
    renderCards('blog-preview-grid', sortByDateDesc(posts).slice(0, 3), 'No posts yet.', 80);
  } catch (e) {
    console.error(e);
    setHTML('blog-preview-grid', emptyStateHTML('Could not load posts.'));
  }
}

loadPreview();
