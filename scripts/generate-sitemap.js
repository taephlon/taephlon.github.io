#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const BASE_URL   = 'https://taephlon.github.io';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POSTS_FILE = path.join(__dirname, '../posts/posts.json');
const OUT_FILE   = path.join(__dirname, '../sitemap.xml');

export function buildSitemapXML(posts, today) {
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
    ...posts.map(post => `  <url>
    <loc>${BASE_URL}/post.html?slug=${post.slug}</loc>
    <lastmod>${new Date(post.date).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`)
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
}

export function generate() {
  const posts = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf8'));
  const today = new Date().toISOString().split('T')[0];
  const xml = buildSitemapXML(posts, today);
  fs.writeFileSync(OUT_FILE, xml);
  console.log(`✅ sitemap.xml generated with ${posts.length + 2} URLs`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) generate();
