import { describe, expect, it } from 'vitest';
import {
  contrastRatio,
  relativeLuminance,
  compositeOver,
  parseHex,
  TEXT_AA,
  UI_AA,
} from './contrast';

describe('contrastRatio', () => {
  it('should return 21 for black on white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
  });

  it('should return 1 for identical colors', () => {
    expect(contrastRatio('#1b1b32', '#1b1b32')).toBeCloseTo(1, 5);
  });

  it('should be order-independent', () => {
    expect(contrastRatio('#99c9ff', '#1b1b32')).toBeCloseTo(contrastRatio('#1b1b32', '#99c9ff'), 5);
  });
});

describe('relativeLuminance', () => {
  it('should return 0 for black and ~1 for white', () => {
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 5);
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5);
  });
});

describe('parseHex', () => {
  it('should expand 3-digit shorthand', () => {
    expect(parseHex('#fff')).toEqual({ r: 255, g: 255, b: 255, a: 1 });
  });

  it('should read an 8-digit alpha channel', () => {
    expect(parseHex('#00000080').a).toBeCloseTo(0.5, 1);
  });
});

describe('compositeOver', () => {
  it('should blend 50% black over white to mid grey', () => {
    expect(compositeOver('#000000', 0.5, '#ffffff')).toBe('#808080');
  });

  it('should return the top color at full alpha', () => {
    expect(compositeOver('#9898b8', 1, '#1b1b32')).toBe('#9898b8');
  });
});

describe('threshold constants', () => {
  it('should expose AA text and UI thresholds', () => {
    expect(TEXT_AA).toBe(4.5);
    expect(UI_AA).toBe(3);
  });
});
