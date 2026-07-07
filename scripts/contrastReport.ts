import { contrastPairs, evaluatePair } from '../src/game/testing/contrastSpecs';
import { readThemeTokens } from '../src/game/testing/themeTokens';

const tokens = readThemeTokens();

let failures = 0;

for (const theme of ['dark', 'light', 'dark-hc', 'light-hc'] as const) {
  console.log(`\n=== ${theme} theme ===`);
  for (const pair of contrastPairs.filter((p) => p.theme === theme)) {
    const { ratio, pass } = evaluatePair(pair, tokens);
    if (!pass) {
      failures += 1;
    }
    const status = pass ? 'PASS' : pair.gate ? 'FAIL (gated)' : 'FAIL (advisory)';
    console.log(
      `${status.padEnd(16)} ${ratio.toFixed(3).padStart(7)} >= ${pair.threshold}  ${pair.label}`
    );
  }
}

console.log(`\n${failures} failing pair(s) (raw ratios; never rounded up).`);
