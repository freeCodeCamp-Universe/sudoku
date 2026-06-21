import { contrastRatio, compositeOver, TEXT_AA, UI_AA } from './contrast';
import type { TokenValue } from './themeTokens';

export type Theme = 'dark' | 'light';

export interface ContrastPair {
  label: string;
  /** Token name (starts with `--`) or a literal hex string. */
  fg: string;
  bg: string;
  threshold: number;
  themes: Theme[];
  gate: boolean;
  /** When set, fg is composited over bg at this alpha before measuring. */
  alpha?: number;
}

const BOTH: Theme[] = ['dark', 'light'];

type ThemeRef = { dark: string; light: string };

// Text colors as actually rendered (see notes in the plan for theme splits).
const TEXT: Record<string, ThemeRef> = {
  value: { dark: '--accent-blue', light: '--cell-text-light' },
  given: { dark: '--text-subtle', light: '#0a0a23' },
  correct: { dark: '--accent-green', light: '--accent-green' },
  hint: { dark: '--cell-hint-text', light: '--cell-hint-text' },
  candidate: { dark: '--candidate-text', light: '--candidate-text' },
  errorText: { dark: '--cell-error-text', light: '--cell-error-text' },
};

const BASE: ThemeRef = { dark: '--bg-secondary', light: '--cell-bg-light' };

// Backgrounds a value-bearing cell can resolve to.
const FILLED_BG: Record<string, ThemeRef> = {
  base: BASE,
  tint: { dark: '--cell-diagonal-bg', light: '--cell-diagonal-bg' },
  odd: { dark: '--cell-odd-bg', light: '--cell-odd-bg' },
  peer: { dark: '--cell-peer-bg', light: '--cell-peer-bg' },
  'peer-structural': { dark: '--cell-peer-structural-bg', light: '--cell-peer-structural-bg' },
  'peer-even': { dark: '--cell-peer-even-bg', light: '--cell-peer-even-bg' },
  'peer-odd': { dark: '--cell-peer-odd-bg', light: '--cell-peer-odd-bg' },
  'same-value': { dark: '--cell-same-value-bg', light: '--cell-same-value-bg' },
};

// Empty cells (candidates) cannot be same-value (no value to match).
const EMPTY_BG: Record<string, ThemeRef> = Object.fromEntries(
  Object.entries(FILLED_BG).filter(([name]) => name !== 'same-value')
);

function textPairs(
  textKey: string,
  bgs: Record<string, ThemeRef>,
  threshold: number
): ContrastPair[] {
  const pairs: ContrastPair[] = [];
  for (const [bgName, bgRef] of Object.entries(bgs)) {
    for (const theme of BOTH) {
      pairs.push({
        label: `${textKey} text on ${bgName}`,
        fg: TEXT[textKey][theme],
        bg: bgRef[theme],
        threshold,
        themes: [theme],
        gate: true,
      });
    }
  }
  return pairs;
}

export const contrastPairs: ContrastPair[] = [
  // --- Gated text contrast (4.5:1) ---
  ...textPairs('value', FILLED_BG, TEXT_AA),
  ...textPairs('given', FILLED_BG, TEXT_AA),
  ...textPairs('correct', FILLED_BG, TEXT_AA),
  ...textPairs('hint', FILLED_BG, TEXT_AA),
  ...textPairs('candidate', EMPTY_BG, TEXT_AA),
  {
    label: 'error text on error background',
    fg: '--cell-error-text',
    bg: '--cell-error-bg',
    threshold: TEXT_AA,
    themes: BOTH,
    gate: true,
  },

  // --- Gated essential-state distinctness (3:1 vs base) ---
  {
    label: 'selection border vs base',
    fg: '--cell-selected-border',
    bg: BASE.dark,
    threshold: UI_AA,
    themes: ['dark'],
    gate: true,
  },
  {
    label: 'selection border vs base',
    fg: '--cell-selected-border',
    bg: BASE.light,
    threshold: UI_AA,
    themes: ['light'],
    gate: true,
  },
  {
    label: 'error background vs base',
    fg: '--cell-error-bg',
    bg: BASE.dark,
    threshold: UI_AA,
    themes: ['dark'],
    gate: true,
  },
  {
    label: 'error background vs base',
    fg: '--cell-error-bg',
    bg: BASE.light,
    threshold: UI_AA,
    themes: ['light'],
    gate: true,
  },

  // --- Gated overlay strokes (3:1 vs base) ---
  {
    label: 'cage stroke vs base',
    fg: '--overlay-cage-stroke',
    bg: BASE.dark,
    threshold: UI_AA,
    themes: ['dark'],
    gate: true,
  },
  {
    label: 'cage stroke vs base',
    fg: '--overlay-cage-stroke',
    bg: BASE.light,
    threshold: UI_AA,
    themes: ['light'],
    gate: true,
  },
  {
    label: 'jigsaw stroke vs base',
    fg: '--overlay-jigsaw-stroke',
    bg: BASE.dark,
    threshold: UI_AA,
    themes: ['dark'],
    gate: true,
  },
  {
    label: 'jigsaw stroke vs base',
    fg: '--overlay-jigsaw-stroke',
    bg: BASE.light,
    threshold: UI_AA,
    themes: ['light'],
    gate: true,
  },
  {
    label: 'arrow stroke vs base',
    fg: '--overlay-arrow-stroke',
    bg: BASE.dark,
    threshold: UI_AA,
    themes: ['dark'],
    gate: true,
  },
  {
    label: 'arrow stroke vs base',
    fg: '--overlay-arrow-stroke',
    bg: BASE.light,
    threshold: UI_AA,
    themes: ['light'],
    gate: true,
  },

  // --- Advisory: convenience highlights & decorative overlays (reported, not gated) ---
  {
    label: 'peer highlight vs base',
    fg: '--cell-peer-bg',
    bg: BASE.dark,
    threshold: UI_AA,
    themes: ['dark'],
    gate: false,
  },
  {
    label: 'peer highlight vs base',
    fg: '--cell-peer-bg',
    bg: BASE.light,
    threshold: UI_AA,
    themes: ['light'],
    gate: false,
  },
  {
    label: 'same-value highlight vs base',
    fg: '--cell-same-value-bg',
    bg: BASE.dark,
    threshold: UI_AA,
    themes: ['dark'],
    gate: false,
  },
  {
    label: 'same-value highlight vs base',
    fg: '--cell-same-value-bg',
    bg: BASE.light,
    threshold: UI_AA,
    themes: ['light'],
    gate: false,
  },
  {
    label: 'kropki dark dot vs base',
    fg: '--overlay-kropki-dark',
    bg: BASE.dark,
    threshold: UI_AA,
    themes: ['dark'],
    gate: false,
  },
  {
    label: 'kropki light dot vs base',
    fg: '--overlay-kropki-light',
    bg: BASE.light,
    threshold: UI_AA,
    themes: ['light'],
    gate: false,
  },
  {
    label: 'consecutive fill vs base',
    fg: '--overlay-consecutive-fill',
    bg: BASE.dark,
    threshold: UI_AA,
    themes: ['dark'],
    gate: false,
  },
  {
    label: 'argyle stroke (60%) vs base',
    fg: '--overlay-argyle-stroke',
    bg: BASE.dark,
    threshold: UI_AA,
    themes: ['dark'],
    gate: false,
    alpha: 0.6,
  },
  {
    label: 'argyle stroke (60%) vs base',
    fg: '--overlay-argyle-stroke',
    bg: BASE.light,
    threshold: UI_AA,
    themes: ['light'],
    gate: false,
    alpha: 0.6,
  },
];

export function resolveColor(
  ref: string,
  theme: Theme,
  tokens: Record<string, TokenValue>
): string {
  if (!ref.startsWith('--')) {
    return ref;
  }
  const token = tokens[ref];
  if (!token) {
    throw new Error(`Unknown theme token: ${ref}`);
  }
  return theme === 'dark' ? token.dark : token.light;
}

export function evaluatePair(
  pair: ContrastPair,
  theme: Theme,
  tokens: Record<string, TokenValue>
): { ratio: number; pass: boolean } {
  const bg = resolveColor(pair.bg, theme, tokens);
  let fg = resolveColor(pair.fg, theme, tokens);
  if (pair.alpha !== undefined) {
    fg = compositeOver(fg, pair.alpha, bg);
  }
  const ratio = contrastRatio(fg, bg);
  return { ratio, pass: ratio >= pair.threshold };
}
