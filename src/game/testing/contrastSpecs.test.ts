import { describe, expect, it } from 'vitest';
import { readThemeTokens } from './themeTokens';
import { contrastRatio, UI_AA } from './contrast';
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

// The selection ring is a two-tone indicator: a blue ring plus a thin dark
// inner edge. A single mid-blue can't clear 3:1 on the grey shaded tint, so the
// requirement is that on every cell background AT LEAST ONE of the two layers
// clears 3:1 — the blue carries dark backgrounds, the dark edge carries the
// light and mid-luminance ones.
describe('selection ring two-tone visibility (WCAG 3:1)', () => {
  const tokens = readThemeTokens();
  const themes = ['dark', 'light'] as const;

  for (const theme of themes) {
    const ring = tokens['--cell-selected-border'][theme];
    const edge = tokens['--cell-selected-edge'][theme];
    const backgrounds: Record<string, string> = {
      base: theme === 'dark' ? tokens['--bg-secondary'].dark : tokens['--cell-bg-light'].light,
      shaded: tokens['--cell-shaded-bg'][theme],
      window: tokens['--cell-window-bg'][theme],
      special: tokens['--cell-special-bg'][theme],
      overlap: tokens['--cell-overlap-5-bg'][theme],
      error: tokens['--cell-error-bg'][theme],
    };

    for (const [name, bg] of Object.entries(backgrounds)) {
      it(`ring or edge should clear ${UI_AA}:1 on the ${name} cell (${theme})`, () => {
        const best = Math.max(contrastRatio(ring, bg), contrastRatio(edge, bg));
        expect(best, `best ${best.toFixed(2)}:1 on ${name}/${theme}`).toBeGreaterThanOrEqual(UI_AA);
      });
    }
  }
});
