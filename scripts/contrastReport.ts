import { readThemeTokens } from '../src/game/testing/themeTokens';
import { contrastPairs, evaluatePair, type Theme } from '../src/game/testing/contrastSpecs';

const tokens = readThemeTokens();
const themes: Theme[] = ['dark', 'light'];

for (const theme of themes) {
  console.log(`\n=== ${theme.toUpperCase()} ===`);
  for (const pair of contrastPairs) {
    if (!pair.themes.includes(theme)) {
      continue;
    }
    const { ratio, pass } = evaluatePair(pair, theme, tokens);
    const tag = pair.gate ? (pass ? 'PASS' : 'FAIL') : 'info';
    console.log(`${tag.padEnd(5)} ${ratio.toFixed(2).padStart(6)}:1  ${pair.label}`);
  }
}
