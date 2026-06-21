import { describe, expect, it } from 'vitest';
import { readThemeTokens } from './themeTokens';
import { contrastPairs, evaluatePair } from './contrastSpecs';

describe('board color contrast (WCAG AA)', () => {
  const tokens = readThemeTokens();
  const gated = contrastPairs.filter((pair) => pair.gate);

  for (const pair of gated) {
    for (const theme of pair.themes) {
      it(`should meet ${pair.threshold}:1 — ${pair.label} (${theme})`, () => {
        const { ratio, pass } = evaluatePair(pair, theme, tokens);
        expect(
          pass,
          `${pair.label} (${theme}) = ${ratio.toFixed(2)}:1, needs ${pair.threshold}:1`
        ).toBe(true);
      });
    }
  }

  it('should include at least one gated pair', () => {
    expect(gated.length).toBeGreaterThan(0);
  });
});
