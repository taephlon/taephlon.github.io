#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────
// new-post.js — Blog Post Automation Script
// Usage: node scripts/new-post.js
// ─────────────────────────────────────────────────────────────────

const fs   = require('fs');
const path = require('path');
const rl   = require('readline').createInterface({ input: process.stdin, output: process.stdout });

const POSTS_FILE    = path.join(__dirname, '../posts/posts.json');
const CONTENT_DIR   = path.join(__dirname, '../posts/content');

const ask = (q) => new Promise(res => rl.question(q, res));

function slugify(str) {
  return str.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
}

function today() { return new Date().toISOString().split('T')[0]; }

function estimateReadTime(content) {
  const minutes = Math.max(1, Math.round(content.split(/\s+/).length / 200));
  return `${minutes} min read`;
}

async function main() {
  console.log('\n✦ New Blog Post\n' + '─'.repeat(40));

  const title       = await ask('Title: ');
  const description = await ask('Short description: ');
  const tagsRaw     = await ask('Tags (comma-separated, e.g. linux,cli): ');
  const thumbnail   = await ask('Thumbnail URL (leave blank for placeholder): ');
  const popular     = (await ask('Mark as popular? (y/n): ')).toLowerCase() === 'y';
  const favorite    = (await ask('Mark as favorite? (y/n): ')).toLowerCase() === 'y';

  console.log('\nPaste your Markdown content.');
  console.log('Type END on a new line when done:\n');

  let lines = [];
  for await (const line of rl) {
    if (line.trim() === 'END') break;
    lines.push(line);
  }
  const markdown = lines.join('\n');
  const slug = slugify(title);

  // Write .md file
  if (!fs.existsSync(CONTENT_DIR)) fs.mkdirSync(CONTENT_DIR, { recursive: true });
  const mdPath = path.join(CONTENT_DIR, `${slug}.md`);
  fs.writeFileSync(mdPath, markdown);

  // Update posts.json
  const posts = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf8'));
  posts.unshift({
    slug,
    title:       title.trim(),
    date:        today(),
    description: description.trim(),
    thumbnail:   thumbnail.trim() || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&q=80',
    tags:        tagsRaw.split(',').map(t => t.trim().toLowerCase()).filter(Boolean),
    popular,
    favorite,
    readTime:    estimateReadTime(markdown),
    file:        `posts/content/${slug}.md`
  });
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));

  console.log(`\n✅ Post created!`);
  console.log(`   Markdown: posts/content/${slug}.md`);
  console.log(`   URL:      post.html?slug=${slug}\n`);
  rl.close();
}

async function* [Symbol.asyncIterator]() { for await (const line of rl) yield line; }
main().catch(e => { console.error(e.message); process.exit(1); });
