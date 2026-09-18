/**
 * Parse `:::tabs` / `:::` fenced regions within a markdown string into an
 * interleaved array of markdown segments and structured tab groups. The tab
 * group syntax is:
 *
 * ```
 * :::tabs
 * ### filename.ext
 *
 * ```lang
 * content
 * ```
 *
 * ### another.ext
 *
 * ```
 * content
 * ```
 * :::
 * ```
 *
 * The heading level inside `:::tabs` is flexible — any ATX heading (`#` through
 * `######`) is accepted. Each heading names a tab, and the fenced code block
 * beneath it is the tab's content. The language tag on the fence is optional.
 */

export interface MarkdownSegment {
  kind: 'markdown';
  content: string;
}

export interface Tab {
  name: string;
  language: string;
  content: string;
}

export interface TabGroupSegment {
  kind: 'tabGroup';
  tabs: Tab[];
}

export type InstructionSegment = MarkdownSegment | TabGroupSegment;

/**
 * Split a raw instructions string into an ordered array of markdown and
 * tab-group segments. When no `:::tabs` blocks are present the result is a
 * single markdown segment wrapping the original string.
 */
export function parseInstructionSegments(source: string, path: string): InstructionSegment[] {
  const segments: InstructionSegment[] = [];
  const lines = source.split('\n');
  let cursor = 0;
  let markdownStart = 0;

  while (cursor < lines.length) {
    if (lines[cursor].trim() === ':::tabs') {
      // Flush any preceding markdown.
      const preceding = lines.slice(markdownStart, cursor).join('\n').trim();
      if (preceding.length > 0) {
        segments.push({ kind: 'markdown', content: preceding });
      }

      cursor += 1;
      const tabGroupStart = cursor;
      let depth = 0;

      // Find the matching `:::` closer. Nested `:::` fences (not currently
      // used) are tracked so an inner `:::` doesn't close the outer block.
      while (cursor < lines.length) {
        const trimmed = lines[cursor].trim();
        if (trimmed === ':::tabs') {
          depth += 1;
        } else if (trimmed === ':::') {
          if (depth === 0) {
            break;
          }
          depth -= 1;
        }
        cursor += 1;
      }

      if (cursor >= lines.length) {
        throw new Error(`Unterminated :::tabs block in ${path}`);
      }

      const inner = lines.slice(tabGroupStart, cursor).join('\n');
      const tabs = parseTabEntries(inner, path);

      if (tabs.length === 0) {
        throw new Error(`Empty :::tabs block in ${path} — define at least one tab`);
      }

      segments.push({ kind: 'tabGroup', tabs });
      cursor += 1; // skip the closing `:::`
      markdownStart = cursor;
      continue;
    }

    cursor += 1;
  }

  // Flush trailing markdown.
  const trailing = lines.slice(markdownStart).join('\n').trim();
  if (trailing.length > 0) {
    segments.push({ kind: 'markdown', content: trailing });
  }

  return segments;
}

/**
 * Parse the inner content of a `:::tabs` block into individual tab entries.
 * Each tab is a heading (any level) followed by a fenced code block.
 */
function parseTabEntries(inner: string, path: string): Tab[] {
  const lines = inner.split('\n');
  const tabs: Tab[] = [];
  let index = 0;

  while (index < lines.length) {
    // Skip blank lines.
    while (index < lines.length && lines[index].trim().length === 0) {
      index += 1;
    }

    if (index >= lines.length) {
      break;
    }

    // Expect a heading of any level.
    const headingMatch = /^(#{1,6})\s+(.+?)\s*$/.exec(lines[index]);
    if (headingMatch === null) {
      throw new Error(`Expected a heading inside :::tabs in ${path}, got: ${lines[index]}`);
    }

    const name = headingMatch[2];
    index += 1;

    // Skip blank lines between heading and fence.
    while (index < lines.length && lines[index].trim().length === 0) {
      index += 1;
    }

    // Expect an opening fence.
    const openingFence = /^(\s*)(`{3,})(.*)$/.exec(lines[index] ?? '');
    if (openingFence === null) {
      throw new Error(`Expected a fenced code block after "${name}" inside :::tabs in ${path}`);
    }

    const language = openingFence[3].trim();
    const fenceLength = openingFence[2].length;
    const closingPattern = new RegExp(`^\\s*\`{${fenceLength},}\\s*$`);
    index += 1;

    const bodyLines: string[] = [];
    while (index < lines.length && !closingPattern.test(lines[index])) {
      bodyLines.push(lines[index]);
      index += 1;
    }

    if (index >= lines.length) {
      throw new Error(`Unterminated fenced block for "${name}" inside :::tabs in ${path}`);
    }

    tabs.push({ name, language, content: bodyLines.join('\n') });
    index += 1;
  }

  return tabs;
}

/** Whether a raw instructions string contains any `:::tabs` blocks. */
export function hasTabBlocks(source: string): boolean {
  return /^:::tabs\s*$/m.test(source);
}
