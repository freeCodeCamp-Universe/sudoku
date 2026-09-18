/**
 * Renders a markdown string to HTML using the course's custom marked renderer.
 *
 * This is a pure function with no DOM or React dependency, so it runs at build
 * time in the prebuild script. Extracting it from the React `Markdown`
 * component lets lesson instructions be pre-rendered, removing `marked` from
 * the client bundle.
 */
import { marked } from 'marked';

/**
 * Converts a heading's raw text to a URL-safe slug. Must match the heading
 * renderer in render-markdown exactly so ToC links resolve to the rendered anchors.
 *
 * Rule: lowercase → strip non-alphanumeric except hyphens and spaces → replace
 * spaces with hyphens.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character] ?? character
  );
}

marked.use({
  renderer: {
    heading(token) {
      const text = this.parser.parseInline(token.tokens);
      if (token.depth === 2 || token.depth === 3) {
        const id = slugify(token.text);
        return `<h${token.depth} id="${id}">${text}</h${token.depth}>\n`;
      }
      return `<h${token.depth}>${text}</h${token.depth}>\n`;
    },
    code({ text, lang }) {
      const raw = lang ?? '';
      const infoTokens = raw.split(/\s+/).filter(Boolean);
      const hasCopy = infoTokens.includes('copy');
      const language = infoTokens.find((token) => token !== 'copy' && token !== 'no-copy') ?? '';
      const langClass = language ? ` class="language-${escapeHtml(language)}"` : '';
      const copyAttr = hasCopy ? ' data-copy' : '';
      return `<pre${copyAttr}><code${langClass}>${escapeHtml(text)}</code></pre>`;
    },
    link(token) {
      const href = escapeHtml(token.href);
      const title = token.title ? ` title="${escapeHtml(token.title)}"` : '';
      const text = this.parser.parseInline(token.tokens);
      return `<a href="${href}"${title} target="_blank" rel="nofollow noopener noreferrer">${text}</a>`;
    },
    tablecell(token) {
      const tag = token.header ? 'th' : 'td';
      const align = token.align ? ` data-align="${token.align}"` : '';
      const inner = this.parser.parseInline(token.tokens);
      return `<${tag}${align}>${inner}</${tag}>\n`;
    },
  },
});

export function renderMarkdown(source: string): string {
  return (
    marked.parse(source, {
      async: false,
      breaks: false,
      gfm: true,
    }) as string
  )
    .replace(/<table>/g, '<div data-table-wrapper><table>')
    .replace(/<\/table>/g, '</table></div>');
}
