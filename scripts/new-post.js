#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────
// new-post.js — Blog Post Automation Script
// Usage: node scripts/new-post.js
// ─────────────────────────────────────────────────────────────────

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const POSTS_FILE  = path.join(__dirname, '../posts/posts.json');
const CONTENT_DIR = path.join(__dirname, '../posts/content');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

// Everything is read through this one iterator. Mixing `rl.question` with
// `for await (const line of rl)` drops the first line of the iteration.
const input = rl[Symbol.asyncIterator]();

async function nextLine() {
  const { value, done } = await input.next();
  if (done) return null;
  return value;
}

async function ask(question) {
  process.stdout.write(question);
  const answer = await nextLine();
  if (answer === null) throw new Error(`Input ended while waiting for an answer to "${question.trim()}"`);
  return answer;
}

function slugify(str) {
  return str.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
}

function today() { return new Date().toISOString().split('T')[0]; }

function estimateReadTime(content) {
  const minutes = Math.max(1, Math.round(content.split(/\s+/).length / 200));
  return `${minutes} min read`;
}

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
    throw new Error(`${POSTS_FILE} is not valid JSON, fix it before adding a post: ${err.message}`, { cause: err });
  }

  if (!Array.isArray(posts)) {
    throw new Error(`${POSTS_FILE} must contain an array of posts but contained ${typeof posts}`);
  }
  return posts;
}

function writeFileChecked(file, contents, description) {
  try {
    fs.writeFileSync(file, contents);
  } catch (err) {
    throw new Error(`Could not write ${description} (${file}): ${err.message}`, { cause: err });
  }
}

async function readMarkdownFromStdin() {
  const lines = [];
  for (let line = await nextLine(); line !== null; line = await nextLine()) {
    if (line.trim() === 'END') break;
    lines.push(line);
  }
  return lines.join('\n');
}

async function main() {
  console.log('\n✦ New Blog Post\n' + '─'.repeat(40));

  const title       = await ask('Title: ');
  const description = await ask('Short description: ');
  const tagsRaw     = await ask('Tags (comma-separated, e.g. linux,cli): ');
  const thumbnail   = await ask('Thumbnail URL (leave blank for placeholder): ');
  const popular     = (await ask('Mark as popular? (y/n): ')).toLowerCase() === 'y';
  const favorite    = (await ask('Mark as favorite? (y/n): ')).toLowerCase() === 'y';

  const slug = slugify(title);
  if (!slug) {
    throw new Error('A title containing at least one letter or digit is required');
  }

  // Validate posts.json up front so a failure here cannot leave an orphaned
  // markdown file behind.
  const posts = readPosts();
  if (posts.some(p => p.slug === slug)) {
    throw new Error(`A post with the slug "${slug}" already exists in ${POSTS_FILE}`);
  }

  const mdPath = path.join(CONTENT_DIR, `${slug}.md`);
  if (fs.existsSync(mdPath)) {
    throw new Error(`${mdPath} already exists; refusing to overwrite it`);
  }

  console.log('\nPaste your Markdown content.');
  console.log('Type END on a new line when done:\n');
  const markdown = await readMarkdownFromStdin();

  if (!fs.existsSync(CONTENT_DIR)) {
    try {
      fs.mkdirSync(CONTENT_DIR, { recursive: true });
    } catch (err) {
      throw new Error(`Could not create ${CONTENT_DIR}: ${err.message}`, { cause: err });
    }
  }
  writeFileChecked(mdPath, markdown, 'the post markdown');

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

  try {
    writeFileChecked(POSTS_FILE, JSON.stringify(posts, null, 2), 'the posts index');
  } catch (err) {
    // The markdown file is already on disk; say so instead of leaving the user
    // with a half-applied change they do not know about.
    console.error(`⚠ ${mdPath} was written but could not be registered in ${POSTS_FILE}.`);
    throw err;
  }

  console.log(`\n✅ Post created!`);
  console.log(`   Markdown: posts/content/${slug}.md`);
  console.log(`   URL:      post.html?slug=${slug}\n`);
}

try {
  await main();
} catch (err) {
  console.error(`✗ ${err.message}`);
  if (err.cause) console.error(err.cause);
  process.exitCode = 1;
} finally {
  rl.close();
}
