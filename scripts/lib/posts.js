// ── Shared helpers for the CLI scripts ──────────────────────────
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');

export const BASE_URL = 'https://taephlon.github.io';
export const POSTS_FILE = path.join(ROOT, 'posts/posts.json');
export const CONTENT_DIR = path.join(ROOT, 'posts/content');
export const SITEMAP_FILE = path.join(ROOT, 'sitemap.xml');

export function readPosts() {
  return JSON.parse(fs.readFileSync(POSTS_FILE, 'utf8'));
}

export function writePosts(posts) {
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
}

export function toISODate(date = new Date()) {
  return new Date(date).toISOString().split('T')[0];
}

export function slugify(str) {
  return str.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
}
