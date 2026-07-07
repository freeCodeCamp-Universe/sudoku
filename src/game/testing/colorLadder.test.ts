import { describe, expect, it } from 'vitest';
import { atLuminance, luminanceLadder } from './colorLadder';
import { contrastRatio, parseHex, relativeLuminance } from './contrast';

describe('luminanceLadder', () => {
  it('should start and end at the given bounds', () => {
    const rungs = luminanceLadder(0.18, 0.824, 9);
    expect(rungs).toHaveLength(9);
    expect(rungs[0]).toBeCloseTo(0.18, 6);
    expect(rungs[8]).toBeCloseTo(0.824, 6);
  });

  it('should space every adjacent rung pair at the same contrast ratio', () => {
    const rungs = luminanceLadder(0.18, 0.824, 9);
    const ratios = rungs.slice(1).map((L, i) => (L + 0.05) / (rungs[i] + 0.05));
    for (const ratio of ratios) {
      expect(ratio).toBeCloseTo(ratios[0], 6);
    }
  });

  it('should produce strictly increasing rungs', () => {
    const rungs = luminanceLadder(0.01, 0.178, 9);
    for (let i = 1; i < rungs.length; i++) {
      expect(rungs[i]).toBeGreaterThan(rungs[i - 1]);
    }
  });
});

describe('atLuminance', () => {
  it('should hit the target luminance when darkening', () => {
    const hex = atLuminance('#ff2e2e', 0.15);
    expect(relativeLuminance(hex)).toBeCloseTo(0.15, 2);
  });

  it('should hit the target luminance when lightening', () => {
    const hex = atLuminance('#3377e6', 0.6);
    expect(relativeLuminance(hex)).toBeCloseTo(0.6, 2);
  });

  it('should preserve channel proportions (saturation) when darkening', () => {
    const anchor = parseHex('#ff8c1a');
    const solved = parseHex(atLuminance('#ff8c1a', 0.2));
    // Scaling toward black keeps r:g:b ratios, up to rounding.
    expect(solved.g / solved.r).toBeCloseTo(anchor.g / anchor.r, 1);
    expect(solved.b / solved.r).toBeCloseTo(anchor.b / anchor.r, 1);
  });

  it('should return the anchor itself when the target is its own luminance', () => {
    const anchorL = relativeLuminance('#11acac');
    expect(contrastRatio(atLuminance('#11acac', anchorL), '#11acac')).toBeCloseTo(1, 2);
  });

  it('should reproduce a committed high-contrast chip from its anchor and rung', () => {
    // Yellow tops the dark high-contrast ladder at its own full saturation.
    expect(atLuminance('#ffee00', relativeLuminance('#ffee00'))).toBe('#ffee00');
  });
});
