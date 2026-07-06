/**
 * Solve candidate high-contrast chip ladders against the current theme bounds
 * and print them next to the committed tokens. Use when re-tuning the color
 * sudoku chips; see docs/color-contrast.md for the design rules.
 */
import { atLuminance, luminanceLadder } from '../src/game/testing/colorLadder';
import { contrastRatio, relativeLuminance, TEXT_AA, UI_AA } from '../src/game/testing/contrast';
import { readThemeTokens } from '../src/game/testing/themeTokens';

// Saturated hue anchors, keyed by the colorNames hue each chip index carries.
const ANCHORS: Record<string, string> = {
  red: '#ff2e2e',
  orange: '#ff8c1a',
  yellow: '#ffee00',
  green: '#3fd93f',
  teal: '#14cccc',
  blue: '#3377e6',
  purple: '#8833ff',
  pink: '#ff70b8',
  silver: '#bfbfbf',
};

// Ladder rung orders (darkest first): luminance-neighbors are hue-distant,
// and each hue sits near its natural lightness for the theme.
const DARK_RUNGS = ['purple', 'blue', 'red', 'teal', 'orange', 'pink', 'green', 'silver', 'yellow'];
const LIGHT_RUNGS = [
  'purple',
  'blue',
  'teal',
  'red',
  'pink',
  'green',
  'orange',
  'yellow',
  'silver',
];
const NAME_ORDER = ['red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink', 'silver'];

const tokens = readThemeTokens();

interface Bounds {
  themeKey: 'darkHc' | 'lightHc';
  base: string;
  label: string;
  lMin: number;
  lMax: number;
}

function labelBound(label: string, isDarkTheme: boolean): number {
  const labelL = relativeLuminance(label);
  // Chip luminance at which the label sits exactly at TEXT_AA.
  return isDarkTheme ? TEXT_AA * (labelL + 0.05) - 0.05 : (labelL + 0.05) / TEXT_AA - 0.05;
}

function baseBound(base: string, isDarkTheme: boolean): number {
  const baseL = relativeLuminance(base);
  return isDarkTheme ? UI_AA * (baseL + 0.05) - 0.05 : (baseL + 0.05) / UI_AA - 0.05;
}

const bounds: Bounds[] = (['darkHc', 'lightHc'] as const).map((themeKey) => {
  const isDark = themeKey === 'darkHc';
  const base = tokens[isDark ? '--bg-secondary' : '--cell-bg-light'][themeKey];
  const label = tokens['--numpad-chip-label'][themeKey];
  return isDark
    ? {
        themeKey,
        base,
        label,
        lMin: Math.max(baseBound(base, true), labelBound(label, true)) + 0.005,
        lMax: relativeLuminance(ANCHORS.yellow),
      }
    : {
        themeKey,
        base,
        label,
        lMin: 0.01,
        lMax: Math.min(baseBound(base, false), labelBound(label, false)) - 0.005,
      };
});

for (const { themeKey, base, label, lMin, lMax } of bounds) {
  const rungs = luminanceLadder(lMin, lMax, 9);
  const order = themeKey === 'darkHc' ? DARK_RUNGS : LIGHT_RUNGS;
  const solved: Record<string, string> = {};
  order.forEach((hue, i) => {
    solved[hue] = atLuminance(ANCHORS[hue], rungs[i]);
  });

  console.log(`\n=== ${themeKey} (rungs L ${lMin.toFixed(3)} .. ${lMax.toFixed(3)}) ===`);
  NAME_ORDER.forEach((hue, i) => {
    const token = `--color-${i + 1}`;
    const committed = tokens[token][themeKey];
    const hex = solved[hue];
    console.log(
      `${token} ${hue.padEnd(7)} solved ${hex}  committed ${committed}  ` +
        `vsBase ${contrastRatio(hex, base).toFixed(2)}  label ${contrastRatio(hex, label).toFixed(2)}`
    );
  });

  let worst = Infinity;
  for (let i = 1; i < order.length; i++) {
    worst = Math.min(worst, contrastRatio(solved[order[i]], solved[order[i - 1]]));
  }
  console.log(`worst adjacent chip-vs-chip ratio: ${worst.toFixed(3)}`);
}
