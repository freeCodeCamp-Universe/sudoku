import { describe, expect, it } from 'vitest';
import { contrastRatio, relativeLuminance } from './contrast';
import {
  CHIP_LADDER_MIN,
  CHIP_TOKENS,
  contrastPairs,
  evaluatePair,
  resolveColor,
} from './contrastSpecs';
import { readThemeTokens } from './themeTokens';

const tokens = readThemeTokens();

describe('contrastSpecs', () => {
  it('should declare at least one gated pair per theme', () => {
    for (const theme of ['dark', 'light'] as const) {
      expect(contrastPairs.some((pair) => pair.theme === theme && pair.gate)).toBe(true);
    }
  });

  describe('gated pairs', () => {
    for (const pair of contrastPairs.filter((p) => p.gate)) {
      it(`should keep ${pair.label} (${pair.theme}) at ${pair.threshold}:1 or better`, () => {
        const { ratio, pass } = evaluatePair(pair, tokens);
        expect(pass, `${ratio.toFixed(3)}:1 is below ${pair.threshold}:1`).toBe(true);
      });
    }
  });

  describe('high-contrast chip ladder', () => {
    // Any two chips can sit on adjacent cells, and hue collapses under
    // color-vision deficiency, so the chips are spaced on a luminance ladder.
    for (const theme of ['dark-hc', 'light-hc'] as const) {
      it(`should keep every luminance-adjacent chip pair at ${CHIP_LADDER_MIN[theme]}:1 or better (${theme})`, () => {
        const sorted = CHIP_TOKENS.map((token) => resolveColor(token, theme, tokens)).sort(
          (a, b) => relativeLuminance(a) - relativeLuminance(b)
        );

        for (let i = 1; i < sorted.length; i++) {
          const ratio = contrastRatio(sorted[i - 1], sorted[i]);
          expect(
            ratio,
            `${sorted[i - 1]} vs ${sorted[i]} is ${ratio.toFixed(3)}:1`
          ).toBeGreaterThanOrEqual(CHIP_LADDER_MIN[theme]);
        }
      });
    }
  });

  describe('advisory pairs', () => {
    // Accepted failures stay listed so `pnpm contrast:report` keeps surfacing
    // them; once one starts passing, its ACCEPTED_FAILURES entry should be
    // removed so the gate locks the improvement in.
    for (const pair of contrastPairs.filter((p) => !p.gate)) {
      it(`should still fail ${pair.label} (${pair.theme}) — otherwise promote it to gated`, () => {
        expect(evaluatePair(pair, tokens).pass).toBe(false);
      });
    }
  });
});
