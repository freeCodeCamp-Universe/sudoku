import { describe, expect, it } from 'vitest';
import { allVariants } from './allVariants';

describe('allVariants', () => {
  it('should include the classic variant', () => {
    expect(allVariants().some((variant) => variant.id === 'classic')).toBe(true);
  });

  it('should expose a unique id per variant', () => {
    const ids = allVariants().map((variant) => variant.id);

    expect(new Set(ids).size).toBe(ids.length);
  });
});
