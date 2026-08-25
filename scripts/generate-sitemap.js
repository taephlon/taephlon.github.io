#!/usr/bin/env node
import fs from 'node:fs';
import { BASE_URL, SITEMAP_FILE, readPosts, toISODate } from './lib/posts.js';

function urlEntry(loc, lastmod, changefreq, priority) {
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

function generate() {
  const posts = readPosts();
  const today = toISODate();

  const urls = [
    urlEntry(`${BASE_URL}/`, today, 'weekly', '1.0'),
    urlEntry(`${BASE_URL}/blog.html`, today, 'weekly', '0.9'),
    ...posts.map(post => urlEntry(
      `${BASE_URL}/post.html?slug=${post.slug}`, toISODate(post.date), 'monthly', '0.8'
    ))
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  fs.writeFileSync(SITEMAP_FILE, xml);
  console.log(`✅ sitemap.xml generated with ${urls.length} URLs`);
}

generate();
