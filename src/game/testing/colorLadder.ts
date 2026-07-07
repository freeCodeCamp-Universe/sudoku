import { parseHex, relativeLuminance } from './contrast';

const toHex = (n: number) =>
  Math.round(Math.max(0, Math.min(255, n)))
    .toString(16)
    .padStart(2, '0');

const rgbHex = (r: number, g: number, b: number) => `#${toHex(r)}${toHex(g)}${toHex(b)}`;

/**
 * Equal-ratio luminance rungs from lMin to lMax: adjacent rungs share one
 * constant contrast ratio, the optimal spacing for a set of colors that must
 * all stay distinguishable pairwise (see docs/color-contrast.md).
 */
export function luminanceLadder(lMin: number, lMax: number, steps: number): number[] {
  const ratio = ((lMax + 0.05) / (lMin + 0.05)) ** (1 / (steps - 1));
  return Array.from({ length: steps }, (_, i) => (lMin + 0.05) * ratio ** i - 0.05);
}

/**
 * Solve for a color in the anchor's hue family with the target relative
 * luminance: scale toward black when the target is darker than the anchor
 * (preserves channel proportions, i.e. saturation), blend toward white only
 * when the target is lighter than the anchor can reach.
 */
export function atLuminance(anchor: string, target: number): string {
  const { r, g, b } = parseHex(anchor);
  const darken = target <= relativeLuminance(anchor);
  const at = (t: number) =>
    darken
      ? rgbHex(r * t, g * t, b * t)
      : rgbHex(r + (255 - r) * t, g + (255 - g) * t, b + (255 - b) * t);

  // Luminance rises monotonically with t in both parametrizations.
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 60; i++) {
    const t = (lo + hi) / 2;
    if (relativeLuminance(at(t)) < target) {
      lo = t;
    } else {
      hi = t;
    }
  }
  return at((lo + hi) / 2);
}
