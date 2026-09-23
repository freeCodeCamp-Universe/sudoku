import { describe, expect, it } from 'vitest';

import { assertImageAltText, assertSanitizedHtml } from '@/curriculum/sanitize';

const PATH = './01-test/lesson.md';

describe('assertSanitizedHtml', () => {
  it('should accept plain markdown with no HTML', () => {
    expect(() => assertSanitizedHtml('Hello **world**', PATH)).not.toThrow();
  });

  it('should accept allowed tags like <kbd> and <br>', () => {
    expect(() =>
      assertSanitizedHtml('Press <kbd>Esc</kbd> to exit.<br/>Then continue.', PATH)
    ).not.toThrow();
  });

  it('should throw on tags outside the default allowlist like <details>', () => {
    expect(() =>
      assertSanitizedHtml(
        '<details><summary>More info</summary><p>Details here.</p></details>',
        PATH
      )
    ).toThrow('not permitted');
  });

  it('should accept common formatting tags', () => {
    expect(() =>
      assertSanitizedHtml('<strong>bold</strong> and <em>italic</em> and <code>mono</code>', PATH)
    ).not.toThrow();
  });

  it('should accept links with safe href', () => {
    expect(() => assertSanitizedHtml('<a href="https://example.com">link</a>', PATH)).not.toThrow();
  });

  it('should throw on <script> tags', () => {
    expect(() => assertSanitizedHtml('<script>alert("xss")</script>', PATH)).toThrow(
      'not permitted'
    );
  });

  it('should throw on <iframe> tags', () => {
    expect(() => assertSanitizedHtml('<iframe src="https://evil.com"></iframe>', PATH)).toThrow(
      'not permitted'
    );
  });

  it('should throw on <style> tags', () => {
    expect(() => assertSanitizedHtml('<style>body { display: none }</style>', PATH)).toThrow(
      'not permitted'
    );
  });

  it('should throw on event handler attributes', () => {
    expect(() => assertSanitizedHtml('<p onclick="alert(1)">Click me</p>', PATH)).toThrow(
      'not permitted'
    );
  });

  it('should throw on javascript: URLs', () => {
    expect(() => assertSanitizedHtml('<a href="javascript:alert(1)">Click</a>', PATH)).toThrow(
      'not permitted'
    );
  });

  it('should ignore angle brackets inside inline code spans', () => {
    expect(() => assertSanitizedHtml('Use `:e <filename>` to open a file.', PATH)).not.toThrow();
  });

  it('should ignore angle brackets inside fenced code blocks', () => {
    const content = [
      'Example:',
      '',
      '```html',
      '<script>alert("safe in code")</script>',
      '```',
    ].join('\n');

    expect(() => assertSanitizedHtml(content, PATH)).not.toThrow();
  });

  it('should include the file path in the error message', () => {
    expect(() => assertSanitizedHtml('<script>xss</script>', PATH)).toThrow(PATH);
  });

  it('should accept <img> with its standard attributes', () => {
    expect(() =>
      assertSanitizedHtml('<img src="/images/a.svg" alt="A grid" width="320" height="320">', PATH)
    ).not.toThrow();
  });

  it('should throw on <canvas>, which is not in the allowlist', () => {
    expect(() => assertSanitizedHtml('<canvas aria-label="A grid"></canvas>', PATH)).toThrow(
      'not permitted'
    );
  });

  it('should throw on <img> with a javascript: src', () => {
    expect(() => assertSanitizedHtml('<img src="javascript:alert(1)" alt="">', PATH)).toThrow(
      'not permitted'
    );
  });
});

describe('assertImageAltText', () => {
  it('should accept <img> with alt text', () => {
    expect(() => assertImageAltText('<img src="/a.svg" alt="A grid">', PATH)).not.toThrow();
  });

  it('should accept <img> with an empty alt for decorative images', () => {
    expect(() => assertImageAltText('<img src="/a.svg" alt="">', PATH)).not.toThrow();
  });

  it('should throw on <img> without an alt attribute', () => {
    expect(() => assertImageAltText('<img src="/a.svg">', PATH)).toThrow(
      '<img src="/a.svg"> is missing an alt attribute'
    );
  });

  it('should accept markdown image syntax, which always produces alt', () => {
    expect(() => assertImageAltText('![](/a.svg)', PATH)).not.toThrow();
  });

  it('should report every image missing alt in one error', () => {
    expect(() => assertImageAltText('<img src="/a.svg">\n\n<img src="/b.svg">', PATH)).toThrow(
      /a\.svg[\s\S]*b\.svg/
    );
  });

  it('should ignore images inside code', () => {
    expect(() => assertImageAltText('Write `<img src="/a.svg">` like this.', PATH)).not.toThrow();
  });

  it('should include the file path in the error message', () => {
    expect(() => assertImageAltText('<img src="/a.svg">', PATH)).toThrow(PATH);
  });
});
