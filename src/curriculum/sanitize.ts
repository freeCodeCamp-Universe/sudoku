import sanitizeHtml from 'sanitize-html';

/**
 * Strip fenced code blocks and inline code spans from markdown so that
 * angle brackets inside code (e.g. `<filename>` in `:e <filename>`) are
 * not mistaken for HTML tags.
 */
function stripMarkdownCode(markdown: string): string {
  // Fenced code blocks: opening fence (3+ backticks) through closing fence.
  let text = markdown.replace(/^(`{3,})[^\n]*\n[\s\S]*?\n\1\s*$/gm, '');
  // Inline code spans.
  text = text.replace(/`[^`\n]+`/g, '');
  return text;
}

/** The `sanitize-html` defaults plus `<img>` with its default attributes. */
const LESSON_HTML_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [...sanitizeHtml.defaults.allowedTags, 'img'],
};

/**
 * Assert that every `<img>` has an `alt` attribute. An empty `alt` is allowed
 * and marks the image as decorative. Markdown image syntax (`![alt](src)`)
 * always produces `alt`, so only raw HTML can fail this check.
 */
export function assertImageAltText(content: string, path: string): void {
  const problems: string[] = [];

  sanitizeHtml(stripMarkdownCode(content), {
    allowedTags: false,
    allowedAttributes: false,
    allowVulnerableTags: true,
    transformTags: {
      img: (tagName, attribs) => {
        if (!('alt' in attribs)) {
          problems.push(`<img src="${attribs.src ?? ''}"> is missing an alt attribute`);
        }
        return { tagName, attribs };
      },
    },
  });

  if (problems.length > 0) {
    throw new Error(
      `${path} has images without alt text:\n- ${problems.join('\n- ')}\n` +
        `Use alt="" for a decorative image.`
    );
  }
}

/**
 * Assert that the markdown's non-code prose contains no HTML that
 * the lesson allowlist would strip. Two passes run the
 * same parser/serializer pipeline — one permitting everything, one with
 * the lesson allowlist — so normalization differences cancel out
 * and the only delta is the security filtering. A mismatch means
 * something was stripped, and the build fails.
 */
export function assertSanitizedHtml(content: string, path: string): void {
  const prose = stripMarkdownCode(content);

  // The permissive pass must preserve everything the default pass might strip,
  // so the only delta in the comparison is the security filtering. `allowedTags:
  // false` and `allowedAttributes: false` mean "allow all" in sanitize-html, but
  // `allowedSchemes` uses the opposite convention: `false` means "allow none".
  // An explicit broad list covers the dangerous schemes the default pass rejects.
  const permissive = sanitizeHtml(prose, {
    allowedTags: false,
    allowedAttributes: false,
    allowVulnerableTags: true,
    allowedSchemes: [
      'http',
      'https',
      'ftp',
      'mailto',
      'tel',
      'javascript',
      'data',
      'vbscript',
      'blob',
      'file',
    ],
    allowedSchemesByTag: {},
  });

  const sanitized = sanitizeHtml(prose, LESSON_HTML_OPTIONS);

  if (sanitized !== permissive) {
    throw new Error(
      `${path} contains HTML that is not permitted in lesson content. ` +
        `Only the sanitize-html default allowlist plus <img> are accepted.`
    );
  }
}
