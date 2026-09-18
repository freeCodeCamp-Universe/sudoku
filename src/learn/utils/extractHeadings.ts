export interface Heading {
  level: 2 | 3;
  text: string;
  id: string;
}

/**
 * Converts a heading's raw text to a URL-safe slug. Must match the heading
 * renderer in Markdown.tsx exactly so ToC links resolve to the rendered anchors.
 *
 * Rule: lowercase → strip non-alphanumeric except hyphens and spaces → replace
 * spaces with hyphens.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
}

/**
 * Parses a markdown string and returns H2 and H3 headings in source order.
 * H1 is the lesson title (rendered separately) and H4+ are excluded.
 */
export function extractHeadings(markdown: string): Heading[] {
  const headings: Heading[] = [];
  for (const line of markdown.split('\n')) {
    const h2 = line.match(/^## (.+)$/);
    if (h2) {
      const text = h2[1].trim();
      headings.push({ level: 2, text, id: slugify(text) });
      continue;
    }
    const h3 = line.match(/^### (.+)$/);
    if (h3) {
      const text = h3[1].trim();
      headings.push({ level: 3, text, id: slugify(text) });
    }
  }
  return headings;
}
