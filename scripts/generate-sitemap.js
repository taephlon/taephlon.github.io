#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));

const BASE_URL   = 'https://taephlon.github.io';
const POSTS_FILE = path.join(__dirname, '../posts/posts.json');
const OUT_FILE   = path.join(__dirname, '../sitemap.xml');

function readPosts() {
  let raw;
  try {
    raw = fs.readFileSync(POSTS_FILE, 'utf8');
  } catch (err) {
    throw new Error(`Could not read ${POSTS_FILE}: ${err.message}`, { cause: err });
  }

  let posts;
  try {
    posts = JSON.parse(raw);
  } catch (err) {
    throw new Error(`${POSTS_FILE} is not valid JSON: ${err.message}`, { cause: err });
  }

  if (!Array.isArray(posts)) {
    throw new Error(`${POSTS_FILE} must contain an array of posts but contained ${typeof posts}`);
  }
  return posts;
}

function postLastMod(post) {
  const date = new Date(post.date);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Post "${post.slug ?? '(no slug)'}" has an invalid date: ${JSON.stringify(post.date)}`);
  }
  return date.toISOString().split('T')[0];
}

function generate() {
  const posts = readPosts();
  const today = new Date().toISOString().split('T')[0];

  const urls = [
    `  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>`,
    `  <url>
    <loc>${BASE_URL}/blog.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`,
    ...posts.map(post => {
      if (!post.slug) {
        throw new Error(`Every post needs a "slug"; found an entry without one: ${JSON.stringify(post)}`);
      }
      return `  <url>
    <loc>${BASE_URL}/post.html?slug=${post.slug}</loc>
    <lastmod>${postLastMod(post)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
    })
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  try {
    fs.writeFileSync(OUT_FILE, xml);
  } catch (err) {
    throw new Error(`Could not write ${OUT_FILE}: ${err.message}`, { cause: err });
  }

  console.log(`✅ sitemap.xml generated with ${posts.length + 2} URLs`);
}

try {
  generate();
} catch (err) {
  console.error(`✗ Failed to generate sitemap.xml: ${err.message}`);
  if (err.cause) console.error(err.cause);
  process.exit(1);
}
