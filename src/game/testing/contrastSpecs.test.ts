import { describe, expect, it } from 'vitest';
import { contrastPairs, evaluatePair } from './contrastSpecs';
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
