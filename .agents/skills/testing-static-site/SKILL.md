---
name: testing-static-site
description: How to run and test this static portfolio/blog site locally (ES modules, blog pages, post pages, Node CLI scripts).
---

# Testing taephlon.github.io locally

No build step and no dependencies to install. Serve the repo root over HTTP —
`file://` breaks because `assets/js/*.js` are loaded as `<script type="module">`
(ES module imports from `assets/js/shared.js`).

```bash
cd <repo root> && python3 -m http.server 8099   # may already be running
```

Pages: `http://localhost:8099/index.html` (portfolio + 3-post blog preview),
`/blog.html` (Recent / Popular / Favorites grids + tag filter),
`/post.html?slug=<slug>` (slug must exist in `posts/posts.json`).

## Gotchas

- `posts/content/` may contain orphan `.md` files that are NOT in `posts.json`
  (e.g. `my-minimalist-desk-setup-2025.md`). Only slugs listed in `posts.json`
  are reachable; card counts should be derived from `posts.json`, not the dir.
- The bundled markdown parser in `assets/js/post.js` only handles `- ` and
  `1. ` list markers. `*   ` bullets render as literal asterisks — pre-existing
  behavior, do not report as a regression unless the parser changed.
- When typing URLs via xdotool/computer-use, `?` and `:` characters are
  sometimes dropped. Prefer navigating by clicking cards/links, or re-check the
  address bar before concluding a 404 is a real failure.
- `formatDate` defaults to short month; `post.html` uses `'long'`. To prove long
  format actually applies, pick a post whose month differs (e.g. Jul vs July),
  not a May/June post where both formats are identical.
- Injected SEO tags (title, og/twitter meta, canonical, `#ld-json`) are not
  visible in pixels — read them once via the browser console.
- Mobile menu / footer year come from `initLayout()` in `assets/js/shared.js`
  (no inline scripts). Test the hamburger by resizing the window narrow, e.g.
  `wmctrl -r :ACTIVE: -b remove,maximized_vert,maximized_horz && wmctrl -r :ACTIVE: -e 0,50,50,480,760`.

## Node CLI scripts

```bash
node scripts/generate-sitemap.js   # writes sitemap.xml; then: git checkout sitemap.xml
node scripts/new-post.js           # interactive; type END to finish markdown body
```

`new-post.js` cannot be driven by a plain pipe (`printf ... | node`) — readline
consumes the buffered stdin and it exits early. Use a PTY-backed interactive
shell and send one answer per write. Afterwards revert:
`git checkout posts/posts.json && rm posts/content/<new-slug>.md`.

## Devin Secrets Needed

None — the site is fully static and has no auth or external API keys.
