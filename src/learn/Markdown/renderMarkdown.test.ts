import { describe, expect, it } from 'vitest';
import { renderMarkdown } from '@/learn/Markdown/renderMarkdown';

describe('renderMarkdown', () => {
  it('should pass a raw <img> through unchanged', () => {
    expect(renderMarkdown('<img src="/a.svg" alt="A grid" width="320" height="320">')).toContain(
      '<img src="/a.svg" alt="A grid" width="320" height="320">'
    );
  });

  it('should render markdown image syntax as an <img> with alt', () => {
    expect(renderMarkdown('![A grid](/a.svg)')).toContain('<img src="/a.svg" alt="A grid">');
  });
});
