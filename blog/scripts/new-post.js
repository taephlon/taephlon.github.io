#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────
// new-post.js — Blog Post Automation Script
// Usage: node scripts/new-post.js
// ─────────────────────────────────────────────────────────────────

const fs   = require('fs');
const path = require('path');
const rl   = require('readline').createInterface({ input: process.stdin, output: process.stdout });

const POSTS_FILE = path.join(__dirname, '../posts/posts.json');

// ── Helpers ────────────────────────────────────────────────────
const ask = (q) => new Promise(res => rl.question(q, res));

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function estimateReadTime(content) {
  const words = content.split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

// ── Main ────────────────────────────────────────────────────────
async function main() {
  console.log('\n✦ New Blog Post\n' + '─'.repeat(40));

  const title       = await ask('Title: ');
  const description = await ask('Short description: ');
  const tagsRaw     = await ask('Tags (comma-separated, e.g. linux,cli): ');
  const thumbnail   = await ask('Thumbnail URL (leave blank for placeholder): ');
  const popular     = (await ask('Mark as popular? (y/n): ')).toLowerCase() === 'y';
  const favorite    = (await ask('Mark as favorite? (y/n): ')).toLowerCase() === 'y';

  console.log('\nPaste your post content (HTML or plain text).');
  console.log('Type END on a new line when done:\n');

  let contentLines = [];
  for await (const line of readLines()) {
    if (line.trim() === 'END') break;
    contentLines.push(line);
  }
  const content = contentLines.join('\n');

  // ── Build post object ────────────────────────────────────────
  const posts = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf8'));
  const maxId  = posts.reduce((m, p) => Math.max(m, p.id), 0);

  const newPost = {
    id:          maxId + 1,
    slug:        slugify(title),
    title:       title.trim(),
    date:        today(),
    description: description.trim(),
    thumbnail:   thumbnail.trim() || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&q=80',
    tags:        tagsRaw.split(',').map(t => t.trim().toLowerCase()).filter(Boolean),
    popular,
    favorite,
    readTime:    estimateReadTime(content),
    content:     content.trim()
  };

  posts.unshift(newPost); // newest first
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));

  console.log('\n✅ Post created!');
  console.log(`   Slug: ${newPost.slug}`);
  console.log(`   URL:  post.html?slug=${newPost.slug}`);
  console.log(`   File: posts/posts.json updated\n`);

  rl.close();
}

// ── Async line reader helper ───────────────────────────────────
async function* readLines() {
  for await (const line of rl) {
    yield line;
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
