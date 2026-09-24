import { describe, expect, it } from 'vitest';
import { classic } from '@/variants/classic';
import { cellSizeForWidth } from './cellSizeForWidth';

describe('cellSizeForWidth', () => {
  it('should fit a standard board at the 320px baseline', () => {
    expect(cellSizeForWidth(320, classic, false)).toBe(34);
  });

  it('should choose the largest step that fits an in-between width', () => {
    expect(cellSizeForWidth(400, classic, false)).toBe(38);
  });

  it('should cap the result at the layout base size when the container is wider', () => {
    expect(cellSizeForWidth(1000, classic, false)).toBe(52);
  });
});
