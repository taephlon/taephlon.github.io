#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────
// generate-sitemap.js — Auto-generates sitemap.xml for SEO
// Usage: node scripts/generate-sitemap.js
// Run this before deploying to GitHub Pages!
// ─────────────────────────────────────────────────────────────────

const fs   = require('fs');
const path = require('path');

const BASE_URL   = 'https://yourusername.github.io'; // ← CHANGE THIS
const POSTS_FILE = path.join(__dirname, '../posts/posts.json');
const OUT_FILE   = path.join(__dirname, '../sitemap.xml');

function formatDate(dateStr) {
  return new Date(dateStr).toISOString().split('T')[0];
}

function generate() {
  const posts = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf8'));
  const today = new Date().toISOString().split('T')[0];

  const urls = [
    // Homepage
    `  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>`,
    // Post pages
    ...posts.map(post => `  <url>
    <loc>${BASE_URL}/post.html?slug=${post.slug}</loc>
    <lastmod>${formatDate(post.date)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`)
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  fs.writeFileSync(OUT_FILE, xml);
  console.log(`✅ sitemap.xml generated with ${posts.length + 1} URLs`);
  console.log(`   Submit to Google: https://search.google.com/search-console`);
}

generate();
