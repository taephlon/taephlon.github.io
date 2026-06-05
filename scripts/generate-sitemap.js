#!/usr/bin/env node
const fs   = require('fs');
const path = require('path');

const BASE_URL   = 'https://taephlon.github.io';
const POSTS_FILE = path.join(__dirname, '../posts/posts.json');
const OUT_FILE   = path.join(__dirname, '../sitemap.xml');

function generate() {
  const posts = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf8'));
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
    ...posts.map(post => `  <url>
    <loc>${BASE_URL}/post.html?slug=${post.slug}</loc>
    <lastmod>${new Date(post.date).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`)
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  fs.writeFileSync(OUT_FILE, xml);
  console.log(`✅ sitemap.xml generated with ${posts.length + 2} URLs`);
}

generate();
