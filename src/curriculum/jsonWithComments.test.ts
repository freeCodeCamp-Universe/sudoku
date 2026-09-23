import { describe, expect, it } from 'vitest';
import { parseJsonWithComments } from '@/curriculum/jsonWithComments';

describe('parseJsonWithComments', () => {
  it('should parse plain JSON', () => {
    expect(parseJsonWithComments('{ "a": 1 }')).toEqual({ a: 1 });
  });

  it('should ignore line comments', () => {
    const source = ['{', '  // which cell to focus', '  "row": 5 // 1-based', '}'].join('\n');

    expect(parseJsonWithComments(source)).toEqual({ row: 5 });
  });

  it('should ignore block comments, including multi-line ones', () => {
    const source = ['{', '  /* first line', '     second line */', '  "row": 5', '}'].join('\n');

    expect(parseJsonWithComments(source)).toEqual({ row: 5 });
  });

  it('should keep comment markers that appear inside strings', () => {
    expect(
      parseJsonWithComments('{ "url": "https://example.com/*x*/", "note": "a // b" }')
    ).toEqual({
      url: 'https://example.com/*x*/',
      note: 'a // b',
    });
  });

  it('should keep escaped quotes inside strings', () => {
    expect(parseJsonWithComments('{ "label": "say \\"hi\\" // not a comment" }')).toEqual({
      label: 'say "hi" // not a comment',
    });
  });

  it('should throw on an unterminated block comment', () => {
    expect(() => parseJsonWithComments('{ /* oops "a": 1 }')).toThrow('Unterminated block comment');
  });

  it('should reject trailing commas, which are not JSON', () => {
    expect(() => parseJsonWithComments('{ "a": [1, 2,] }')).toThrow(SyntaxError);
  });

  it('should still throw on invalid JSON once comments are removed', () => {
    expect(() => parseJsonWithComments('{ "a": 1 "b": 2 }')).toThrow(SyntaxError);
  });
});
