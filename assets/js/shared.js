// ── Shared error handling / DOM helpers ────────────────────────
// Loaded as a classic script before the page scripts, so every helper
// here is a plain global.

// Surface anything that escapes the page scripts instead of losing it.
window.addEventListener('unhandledrejection', (event) => {
  console.error('[unhandled rejection]', event.reason);
});

function describeError(err) {
  if (err instanceof Error) return err.message || err.name;
  return String(err);
}

function reportError(context, err) {
  console.error(`[${context}]`, err);
}

// Throws instead of returning null so a missing element cannot turn into a
// confusing "cannot set innerHTML of null" further down the call stack.
function requireEl(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Required element #${id} is missing from the page`);
  return el;
}

// Renders a user-facing failure message, falling back to the console when the
// intended container is itself missing.
function showFailure(containerId, message) {
  const el = document.getElementById(containerId);
  if (!el) {
    console.error(`Cannot display error in #${containerId} (element missing): ${message}`);
    return;
  }
  const wrapper = document.createElement('div');
  wrapper.className = 'empty';
  const p = document.createElement('p');
  p.textContent = `⚠ ${message}`;
  wrapper.appendChild(p);
  el.replaceChildren(wrapper);
}

async function fetchWithContext(url) {
  let res;
  try {
    res = await fetch(url);
  } catch (err) {
    throw new Error(`Network error requesting ${url}: ${describeError(err)}`, { cause: err });
  }
  if (!res.ok) {
    throw new Error(`Request for ${url} failed: HTTP ${res.status} ${res.statusText}`);
  }
  return res;
}

async function fetchJSON(url) {
  const res = await fetchWithContext(url);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`${url} did not contain valid JSON: ${describeError(err)}`, { cause: err });
  }
}

async function fetchText(url) {
  const res = await fetchWithContext(url);
  try {
    return await res.text();
  } catch (err) {
    throw new Error(`Could not read the response body of ${url}: ${describeError(err)}`, { cause: err });
  }
}

async function loadPosts(url) {
  const data = await fetchJSON(url);
  if (!Array.isArray(data)) {
    throw new Error(`${url} must contain an array of posts but contained ${typeof data}`);
  }
  return data;
}

// Runs one independent piece of page setup. Keeping each piece isolated stops a
// single failure (usually a missing element) from aborting the whole script.
function safeInit(name, fn) {
  try {
    fn();
  } catch (err) {
    reportError(`init: ${name}`, err);
  }
}

// A malformed entry should not take down the whole page, so log it loudly and
// fall back to an empty tag list.
function postTags(post) {
  if (Array.isArray(post.tags)) return post.tags;
  if (post.tags !== undefined) {
    console.warn(`Post "${post.slug ?? '(no slug)'}" has a non-array "tags" field; ignoring it`);
  }
  return [];
}
