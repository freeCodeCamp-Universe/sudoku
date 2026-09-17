import { describe, expect, it } from 'vitest';
import { classic } from '@/variants/classic';
import { seoConfig } from './seo.config';

describe('seoConfig', () => {
  it('should define the Sudoku site metadata', () => {
    expect(seoConfig.siteUrl).toBe('https://sudoku.freecode.camp');
    expect(seoConfig.siteTitle).toBe('Sudoku | freeCodeCamp.org');
    expect(seoConfig.siteDescription.length).toBeGreaterThan(0);
  });

  it('should keep variant descriptions separate from site defaults', () => {
    expect(classic.description).not.toBe(seoConfig.siteDescription);
  });
});
