import { describe, expect, it } from 'vitest';
import { createSeededRng, hashSeed } from './rng';

describe('createSeededRng', () => {
  it('should produce an identical sequence for the same seed', () => {
    const first = createSeededRng(12345);
    const second = createSeededRng(12345);
    const firstValues = Array.from({ length: 10 }, () => first());
    const secondValues = Array.from({ length: 10 }, () => second());

    expect(secondValues).toEqual(firstValues);
  });

  it('should produce different sequences for different seeds', () => {
    const a = createSeededRng(1);
    const b = createSeededRng(2);
    const aValues = Array.from({ length: 10 }, () => a());
    const bValues = Array.from({ length: 10 }, () => b());

    expect(aValues).not.toEqual(bValues);
  });

  it('should only yield values in the [0, 1) range', () => {
    const rng = createSeededRng(0);

    for (let i = 0; i < 1000; i += 1) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('hashSeed', () => {
  it('should return the same number for the same inputs', () => {
    expect(hashSeed('classic', 7, 3)).toEqual(hashSeed('classic', 7, 3));
  });

  it('should return a non-negative integer', () => {
    const seed = hashSeed('jigsaw', 42, 1);

    expect(Number.isInteger(seed)).toBe(true);
    expect(seed).toBeGreaterThanOrEqual(0);
  });

  it('should differ when any input changes', () => {
    expect(hashSeed('classic', 7, 3)).not.toEqual(hashSeed('classic', 7, 4));
    expect(hashSeed('classic', 7, 3)).not.toEqual(hashSeed('color', 7, 3));
  });
});
