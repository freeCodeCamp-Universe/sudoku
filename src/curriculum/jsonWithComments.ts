/**
 * Parses JSON that may contain `//` line comments and `/* *\/` block comments,
 * so lesson authors can annotate the `json` block in `# --config--`. Comment
 * markers inside string literals are preserved. Everything else must be
 * strict JSON.
 */
export function parseJsonWithComments(source: string): unknown {
  return JSON.parse(stripJsonComments(source));
}

function stripJsonComments(source: string): string {
  let output = '';
  let index = 0;

  while (index < source.length) {
    const character = source[index];
    const next = source[index + 1];

    if (character === '"') {
      const end = endOfString(source, index);
      output += source.slice(index, end);
      index = end;
    } else if (character === '/' && next === '/') {
      const newline = source.indexOf('\n', index);
      index = newline === -1 ? source.length : newline;
    } else if (character === '/' && next === '*') {
      const close = source.indexOf('*/', index + 2);
      if (close === -1) {
        throw new SyntaxError('Unterminated block comment in JSON config');
      }
      output += ' ';
      index = close + 2;
    } else {
      output += character;
      index += 1;
    }
  }

  return output;
}

function endOfString(source: string, start: number): number {
  let index = start + 1;
  while (index < source.length) {
    if (source[index] === '\\') {
      index += 2;
    } else if (source[index] === '"') {
      return index + 1;
    } else {
      index += 1;
    }
  }
  return source.length;
}
