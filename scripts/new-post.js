#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────
// new-post.js — Blog Post Automation Script
// Usage: node scripts/new-post.js
// ─────────────────────────────────────────────────────────────────

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { CONTENT_DIR, readPosts, writePosts, slugify, toISODate } from './lib/posts.js';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const ask = (q) => new Promise(res => rl.question(q, res));

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

  const lines = [];
  for await (const line of rl) {
    if (line.trim() === 'END') break;
    lines.push(line);
  }
  const markdown = lines.join('\n');
  const slug = slugify(title);

  // Write .md file
  if (!fs.existsSync(CONTENT_DIR)) fs.mkdirSync(CONTENT_DIR, { recursive: true });
  fs.writeFileSync(path.join(CONTENT_DIR, `${slug}.md`), markdown);

  // Update posts.json
  const posts = readPosts();
  posts.unshift({
    slug,
    title:       title.trim(),
    date:        toISODate(),
    description: description.trim(),
    thumbnail:   thumbnail.trim() || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&q=80',
    tags:        tagsRaw.split(',').map(t => t.trim().toLowerCase()).filter(Boolean),
    popular,
    favorite,
    readTime:    estimateReadTime(markdown),
    file:        `posts/content/${slug}.md`
  });
  writePosts(posts);

  console.log(`\n✅ Post created!`);
  console.log(`   Markdown: posts/content/${slug}.md`);
  console.log(`   URL:      post.html?slug=${slug}\n`);
  rl.close();
}

main().catch(e => { console.error(e.message); process.exit(1); });
