// ── Shared output-encoding helpers ─────────────────────────────
// Loaded before the page scripts; exposes globals used by
// main.js, preview.js and post.js.

const SAFE_URL_SCHEMES = ['http:', 'https:', 'mailto:'];

// Escape text for interpolation into HTML text nodes and quoted attributes.
function escapeHTML(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Escape only quotes — for strings whose &, < and > are already encoded.
function escapeQuotes(value) {
  return String(value == null ? '' : value)
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Allow relative URLs and an explicit scheme allowlist; anything else
// (javascript:, data:, vbscript: …) collapses to the fallback.
function safeURL(value, fallback = '') {
  // Control characters let attackers write things like "java\tscript:".
  const raw = String(value == null ? '' : value).replace(/[\u0000-\u001f\u007f]/g, '').trim();
  if (!raw) return fallback;
  const schemeMatch = /^([a-z][a-z0-9+.-]*):/i.exec(raw);
  if (schemeMatch && !SAFE_URL_SCHEMES.includes(schemeMatch[1].toLowerCase() + ':')) return fallback;
  if (!schemeMatch && /^\/\//.test(raw)) return fallback;
  return raw;
}

// Safe value for a query-string parameter.
function safeParam(value) {
  return encodeURIComponent(String(value == null ? '' : value));
}
