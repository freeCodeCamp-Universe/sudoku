import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildColorDocs } from './colorDocs';

describe('color documentation', () => {
  it('should match the committed docs/colors.md', () => {
    const committed = readFileSync(resolve(process.cwd(), 'docs/colors.md'), 'utf8');

    expect(committed).toBe(buildColorDocs());
  });
});
