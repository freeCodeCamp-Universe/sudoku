import { contrastRatio, compositeOver, TEXT_AA, UI_AA } from './contrast';
import { readThemeTokens, type TokenValue } from './themeTokens';

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

// Text colors as actually rendered.
const TEXT: Record<string, ThemeRef> = {
  value: { dark: '--accent-blue', light: '--cell-text-light' },
  given: { dark: '--text-subtle', light: '#0a0a23' },
  correct: { dark: '--accent-green', light: '--accent-green' },
  hint: { dark: '--cell-hint-text', light: '--cell-hint-text' },
  candidate: { dark: '--candidate-text', light: '--candidate-text' },
};

const BASE: ThemeRef = { dark: '--bg-secondary', light: '--cell-bg-light' };

// Token applied to shaded constraint regions (even / diagonal / girandola).
// Cells carrying it force their text to --cell-shaded-text, so that single
// pair — not the per-state text colors — is what must clear 4.5:1 there.
const SHADED_BG = '--cell-shaded-bg';
const SHADED_TEXT = '--cell-shaded-text';

// Cell-background tints that do NOT need 3:1 vs base, with the reason:
//  - REDUNDANT: a drawn overlay (windoku window fill, asterisk / center-dot
//    SVG) already marks the region, so the tint is decorative, not the sole cue.
// Selection-time highlights (peer dim, same-value) are no longer opaque `-bg`
// tints — they are translucent `-overlay` layers composited over the structural
// color, outside this `-bg` enumeration, and remain advisory by nature.
const REDUNDANT = new Set(['--cell-window-bg', '--cell-special-bg']);
const CONVENIENCE = new Set<string>([]);

// `--cell-overlap-*` tints render only in gallery previews (canvas depth
// shading), never on the playable board, so they are out of scope here.
const PREVIEW_ONLY = /^--cell-overlap-/;

/**
 * Derive the contrast pairs for every cell-background tint by enumerating the
 * theme tokens, rather than hand-listing them. A new `--cell-*-bg` token is
 * therefore covered automatically: its text must stay readable (4.5:1) and,
 * unless it is explicitly REDUNDANT or CONVENIENCE, it must clear 3:1 against
 * the board base. Forgetting to classify a new sole-cue tint fails the gate by
 * default instead of slipping through unnoticed.
 */
function cellTintPairs(tokens: Record<string, TokenValue>): ContrastPair[] {
  const pairs: ContrastPair[] = [];
  const bgTokens = Object.keys(tokens).filter(
    (name) => /^--cell-.*-bg$/.test(name) && name !== '--cell-error-bg' && !PREVIEW_ONLY.test(name)
  );

  for (const token of bgTokens) {
    const advisory = REDUNDANT.has(token) || CONVENIENCE.has(token);

    // Tint vs base — 3:1, gated for sole-cue tints, advisory otherwise.
    for (const theme of BOTH) {
      pairs.push({
        label: `tint ${token} vs base`,
        fg: token,
        bg: BASE[theme],
        threshold: UI_AA,
        themes: [theme],
        gate: !advisory,
      });
    }

    // Text on the tint — 4.5:1, always gated.
    if (token === SHADED_BG) {
      for (const theme of BOTH) {
        pairs.push({
          label: `shaded text on ${token}`,
          fg: SHADED_TEXT,
          bg: token,
          threshold: TEXT_AA,
          themes: [theme],
          gate: true,
        });
      }
      continue;
    }

    for (const role of Object.keys(TEXT)) {
      for (const theme of BOTH) {
        pairs.push({
          label: `${role} text on ${token}`,
          fg: TEXT[role][theme],
          bg: token,
          threshold: TEXT_AA,
          themes: [theme],
          gate: true,
        });
      }
    }
  }

  return pairs;
}

const tokens = readThemeTokens();

export const contrastPairs: ContrastPair[] = [
  // --- Cell-background tints (derived) + their text ---
  ...cellTintPairs(tokens),

  // --- Gated text contrast on the plain base (4.5:1) ---
  ...Object.keys(TEXT).flatMap((role) =>
    BOTH.map(
      (theme): ContrastPair => ({
        label: `${role} text on base`,
        fg: TEXT[role][theme],
        bg: BASE[theme],
        threshold: TEXT_AA,
        themes: [theme],
        gate: true,
      })
    )
  ),
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
  // Selection ring on a shaded cell: the default blue ring loses contrast on
  // the light tint, so shaded+selected uses a dark ring (theme-invariant tint).
  {
    label: 'shaded selection border vs shaded tint',
    fg: '--cell-shaded-selected-border',
    bg: SHADED_BG,
    threshold: UI_AA,
    themes: BOTH,
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

  // --- Advisory: decorative overlays (reported, not gated) ---
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
