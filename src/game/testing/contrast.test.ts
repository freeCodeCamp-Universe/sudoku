import { describe, expect, it } from 'vitest';
import { compositeOver, contrastRatio, parseHex, relativeLuminance, TEXT_AA } from './contrast';

describe('parseHex', () => {
  it('should parse a 6-digit hex color', () => {
    expect(parseHex('#1b1b32')).toEqual({ r: 27, g: 27, b: 50, a: 1 });
  });

  it('should expand a 3-digit hex color', () => {
    expect(parseHex('#fa0')).toEqual({ r: 255, g: 170, b: 0, a: 1 });
  });

  it('should read the alpha channel of an 8-digit hex color', () => {
    expect(parseHex('#ffffff80').a).toBeCloseTo(128 / 255, 5);
  });
});

describe('relativeLuminance', () => {
  it('should be 1 for white', () => {
    expect(relativeLuminance('#ffffff')).toBe(1);
  });

  it('should be 0 for black', () => {
    expect(relativeLuminance('#000000')).toBe(0);
  });
});

describe('contrastRatio', () => {
  it('should be 21 for black on white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBe(21);
  });

  it('should be symmetric in its arguments', () => {
    expect(contrastRatio('#99c9ff', '#12123a')).toBe(contrastRatio('#12123a', '#99c9ff'));
  });

  it('should be 1 for identical colors', () => {
    expect(contrastRatio('#3b3b4f', '#3b3b4f')).toBe(1);
  });

  it('should not round a ratio up to a passing threshold', () => {
    // #777777 on white is ~4.478:1 — it rounds to 4.5 but must still fail AA.
    const ratio = contrastRatio('#777777', '#ffffff');
    expect(ratio).toBeGreaterThan(4.47);
    expect(ratio).toBeLessThan(TEXT_AA);
  });

  it('should pass AA for the canonical #767676 on white', () => {
    expect(contrastRatio('#767676', '#ffffff')).toBeGreaterThanOrEqual(TEXT_AA);
  });
});

describe('compositeOver', () => {
  it('should return the top color at alpha 1', () => {
    expect(compositeOver('#99c9ff', 1, '#12123a')).toBe('#99c9ff');
  });

  it('should return the bottom color at alpha 0', () => {
    expect(compositeOver('#99c9ff', 0, '#12123a')).toBe('#12123a');
  });

  it('should mix channels linearly at alpha 0.5', () => {
    expect(compositeOver('#ffffff', 0.5, '#000000')).toBe('#808080');
  });
});
