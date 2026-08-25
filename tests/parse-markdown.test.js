import { describe, expect, it } from 'vitest';
import { parseMarkdown } from '../assets/js/post.js';

describe('parseMarkdown', () => {
  it('renders headings at all supported levels', () => {
    expect(parseMarkdown('# One\n## Two\n### Three')).toBe(
      '<h1>One</h1>\n<h2>Two</h2>\n<h3>Three</h3>'
    );
  });

  it('renders bold, italic, and bold-italic text', () => {
    expect(parseMarkdown('**bold** *italic* ***both***')).toBe(
      '<p><strong>bold</strong> <em>italic</em> <strong><em>both</em></strong></p>'
    );
  });

  it('renders images and links with safe link attributes', () => {
    const html = parseMarkdown('![A cat](cat.jpg)\n[Read more](https://example.com)');
    expect(html).toContain('<img src="cat.jpg" alt="A cat"');
    expect(html).toContain('<a href="https://example.com" target="_blank" rel="noopener">Read more</a>');
  });

  it('renders blockquotes, unordered lists, ordered lists, and rules', () => {
    const html = parseMarkdown('> quoted\n\n- first\n- second\n\n1. one\n2. two\n\n---');
    expect(html).toContain('<blockquote>quoted</blockquote>');
    expect(html).toContain('<ul><li>first</li><li>second</li></ul>');
    expect(html).toContain('<ol><li>one</li><li>two</li></ol>');
    expect(html).toContain('<hr>');
  });

  it('wraps ordinary lines in paragraphs and removes empty paragraphs', () => {
    expect(parseMarkdown('first line\n\n\nsecond line')).toBe(
      '<p>first line</p>\n\n<p>second line</p>'
    );
    expect(parseMarkdown('')).toBe('');
  });

  it('escapes HTML inside fenced blocks and preserves meaningful formatting', () => {
    const html = parseMarkdown('```js\n  <div>\n    & value\n  </div>\n```\n\n```\nline two\nline three\n```');
    expect(html).toContain('<pre><code class="language-js">  &lt;div&gt;\n    &amp; value\n  &lt;/div&gt;</code></pre>');
    expect(html).toContain('<pre><code class="language-">line two\nline three</code></pre>');
    expect(html).not.toContain('<div>');
  });

  it('supports inline code without transforming markdown inside it', () => {
    expect(parseMarkdown('Use `**not bold** and [not a link](x)` here')).toBe(
      '<p>Use <code>**not bold** and [not a link](x)</code> here</p>'
    );
  });

  it('restores multiple inline and fenced code placeholders independently', () => {
    const html = parseMarkdown('`one` and `two`\n\n```js\nconst x = `literal`;\n```\n\n`three`');
    expect(html).toContain('<code>one</code> and <code>two</code>');
    expect(html).toContain('<pre><code class="language-js">const x = `literal`;</code></pre>');
    expect(html).toContain('<code>three</code>');
  });

  it('escapes blockquote markers before matching them', () => {
    expect(parseMarkdown('> safe & <tag>')).toBe('<blockquote>safe &amp; &lt;tag&gt;</blockquote>');
  });
});
