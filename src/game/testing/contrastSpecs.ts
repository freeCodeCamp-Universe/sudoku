import { contrastRatio, TEXT_AA, UI_AA } from './contrast';
import { readThemeTokens, type TokenValue } from './themeTokens';

export type Theme = 'dark' | 'light' | 'dark-hc' | 'light-hc';

export interface ContrastPair {
  label: string;
  /** Token name (starts with `--`) or a literal hex string. */
  fg: string;
  bg: string;
  threshold: number;
  theme: Theme;
  /**
   * Gated pairs fail the CI test below threshold. Advisory pairs are reported
   * by `pnpm contrast:report` but do not gate.
   */
  gate: boolean;
}

const THEMES: Theme[] = ['dark', 'light', 'dark-hc', 'light-hc'];

const TOKEN_KEY: Record<Theme, keyof TokenValue> = {
  dark: 'dark',
  light: 'light',
  'dark-hc': 'darkHc',
  'light-hc': 'lightHc',
};

type ThemeRef = { dark: string; light: string };

const refFor = (ref: ThemeRef, theme: Theme): string =>
  theme.startsWith('light') ? ref.light : ref.dark;

// Text colors as actually rendered by Cell.module.css.
const TEXT: Record<string, ThemeRef> = {
  value: { dark: '--accent-blue', light: '--cell-text-light' },
  given: { dark: '--text-subtle', light: '#0a0a23' },
  correct: { dark: '--accent-green', light: '--accent-green' },
  incorrect: { dark: '--accent-red', light: '--accent-red' },
  hint: { dark: '--accent-yellow', light: '--accent-yellow' },
  candidate: { dark: '--candidate-text', light: '--candidate-text' },
};

// The plain cell background each theme renders when no state applies.
const BASE: ThemeRef = { dark: '--bg-secondary', light: '--cell-bg-light' };

// Backgrounds a digit can sit on. Incorrect text only renders on the error
// background, so it is paired separately below.
const CELL_BGS = [
  'base',
  '--cell-even-bg',
  '--cell-odd-bg',
  '--cell-peer-bg',
  '--cell-peer-structural-bg',
  '--cell-peer-even-bg',
  '--cell-peer-odd-bg',
  '--cell-same-value-bg',
  '--cell-special-bg',
] as const;

export const CHIP_TOKENS = Array.from({ length: 9 }, (_, i) => `--color-${i + 1}`);

/**
 * Chips 3 and 9 sit on the two brightest ladder rungs in both high-contrast
 * palettes and render `--numpad-chip-label-bright` (NumberPad.module.css);
 * in light HC that label is dark, which is what lets the ladder rise past
 * the white-label bound.
 */
export const chipLabelToken = (chip: string): string =>
  chip === '--color-3' || chip === '--color-9'
    ? '--numpad-chip-label-bright'
    : '--numpad-chip-label';

/**
 * Minimum contrast between luminance-adjacent chips in the high-contrast
 * palettes. Not a WCAG threshold — nine chips boxed in by the vs-base and
 * numpad-label gates cannot reach 3:1 against each other, so the ladder is
 * spaced at the best equal ratio the bounds allow, and this floor keeps it
 * from silently collapsing (the pre-ladder palette had two chips at 1.00:1).
 * The light ladder has more headroom (per-chip label polarity leaves the
 * 3:1-vs-white base as its only cap), so its floor is higher.
 */
export const CHIP_LADDER_MIN: Record<'dark-hc' | 'light-hc', number> = {
  'dark-hc': 1.15,
  'light-hc': 1.2,
};

/**
 * Known failures the owner has accepted for the standard palette (see the
 * PR #66 discussion): fixing them in place would require reworking the whole
 * palette (the even/odd exploration showed no compliant background pair
 * exists under the current text colors), so the opt-in high-contrast palette
 * carries the compliant colors instead. Keyed `theme|label`; only standard
 * themes may appear here — every high-contrast pair is gated. Remove an entry
 * once its pair is fixed.
 */
const ACCEPTED_FAILURES = new Set<string>([
  'dark|candidate text on --cell-same-value-bg',
  'dark|even bg vs odd bg',
  'dark|peer-even bg vs peer-odd bg',
  'dark|error bg vs base',
  ...CELL_BGS.map((bg) => `light|hint text on ${bg}`),
  'light|even bg vs odd bg',
  'light|peer-even bg vs peer-odd bg',
  'light|error bg vs base',
  // These four chips predate the contrast gate and sit below 3:1 on the white
  // light-theme cells; the high-contrast palette carries the compliant set.
  'light|chip --color-2 vs base',
  'light|chip --color-3 vs base',
  'light|chip --color-5 vs base',
  'light|chip --color-9 vs base',
  // The standard light primary button keeps its brand yellow, which sits too
  // close to the light page background; its 10:1+ label is what identifies
  // the control. The high-contrast palettes carry a compliant surface.
  'light|primary button bg vs page bg',
]);

type PairInput = Omit<ContrastPair, 'gate'>;

function withGate(pair: PairInput): ContrastPair {
  return { ...pair, gate: !ACCEPTED_FAILURES.has(`${pair.theme}|${pair.label}`) };
}

function textPairs(): PairInput[] {
  const pairs: PairInput[] = [];
  for (const role of Object.keys(TEXT)) {
    if (role === 'incorrect') {
      continue;
    }
    for (const bg of CELL_BGS) {
      for (const theme of THEMES) {
        pairs.push({
          label: `${role} text on ${bg}`,
          fg: refFor(TEXT[role], theme),
          bg: bg === 'base' ? refFor(BASE, theme) : bg,
          threshold: TEXT_AA,
          theme,
        });
      }
    }
  }
  return pairs;
}

export const contrastPairs: ContrastPair[] = [
  ...textPairs(),

  // Incorrect digits render only on the error background.
  ...THEMES.map(
    (theme): PairInput => ({
      label: 'incorrect text on error background',
      fg: refFor(TEXT.incorrect, theme),
      bg: '--cell-error-bg',
      threshold: TEXT_AA,
      theme,
    })
  ),

  // Parity shading is the sole cue distinguishing even from odd cells, so the
  // two backgrounds need 3:1 against each other (WCAG 1.4.11).
  ...THEMES.flatMap((theme): PairInput[] => [
    {
      label: 'even bg vs odd bg',
      fg: '--cell-even-bg',
      bg: '--cell-odd-bg',
      threshold: UI_AA,
      theme,
    },
    {
      label: 'peer-even bg vs peer-odd bg',
      fg: '--cell-peer-even-bg',
      bg: '--cell-peer-odd-bg',
      threshold: UI_AA,
      theme,
    },
  ]),

  // Essential state indicators vs the plain base.
  ...THEMES.flatMap((theme): PairInput[] => [
    {
      label: 'error bg vs base',
      fg: '--cell-error-bg',
      bg: refFor(BASE, theme),
      threshold: UI_AA,
      theme,
    },
    {
      label: 'selection ring vs base',
      fg: '--cell-selected-border',
      bg: refFor(BASE, theme),
      threshold: UI_AA,
      theme,
    },
    // The even/odd legend swatches sit on the page background; their border
    // is what keeps them visible there (the odd swatch fill can match it).
    {
      label: 'legend swatch border vs page bg',
      fg: '--text-muted',
      bg: '--bg-primary',
      threshold: UI_AA,
      theme,
    },
  ]),

  // Color-sudoku chips are the rendered symbol, so each chip needs 3:1
  // against the resting cell background.
  ...THEMES.flatMap((theme): PairInput[] =>
    CHIP_TOKENS.map((chip) => ({
      label: `chip ${chip} vs base`,
      fg: chip,
      bg: refFor(BASE, theme),
      threshold: UI_AA,
      theme,
    }))
  ),

  // Number-pad chip labels. The standard dark label is a translucent rgba the
  // math here cannot resolve, and the owner accepted its shortfall — so only
  // the solid-label palettes are declared.
  ...(['light', 'dark-hc', 'light-hc'] as Theme[]).flatMap((theme): PairInput[] =>
    CHIP_TOKENS.map((chip) => ({
      label: `numpad label on chip ${chip}`,
      fg: chipLabelToken(chip),
      bg: chip,
      threshold: TEXT_AA,
      theme,
    }))
  ),

  // The primary action button (New Game and modal confirm).
  ...THEMES.flatMap((theme): PairInput[] => [
    {
      label: 'primary button text on primary button bg',
      fg: '--btn-primary-text',
      bg: '--btn-primary-bg',
      threshold: TEXT_AA,
      theme,
    },
    {
      label: 'primary button bg vs page bg',
      fg: '--btn-primary-bg',
      bg: '--bg-primary',
      threshold: UI_AA,
      theme,
    },
  ]),

  // Board clue text (skyscraper gutter numbers) renders on the page
  // background. It stays a distinct blue in every palette — --accent-blue
  // won't do, because the high-contrast palettes repurpose that token as a
  // near-white/near-black body-text color, which erases the blue identity
  // separating outer clues from cell values.
  ...THEMES.map(
    (theme): PairInput => ({
      label: 'board clue text vs page bg',
      fg: '--board-clue-text',
      bg: '--bg-primary',
      threshold: TEXT_AA,
      theme,
    })
  ),

  // Muted text labels the secondary controls (mode switcher, erase, reveal,
  // clear all) at rest on their shared button background. The high-contrast
  // palettes override --text-muted, since dim text defeats the mode's purpose.
  ...THEMES.map(
    (theme): PairInput => ({
      label: 'muted text on button bg',
      fg: '--text-muted',
      bg: '--bg-secondary',
      threshold: TEXT_AA,
      theme,
    })
  ),

  // Grid lines are graphical objects required to understand the puzzle
  // (WCAG 1.4.11): cell borders and box boundaries need 3:1 against every
  // cell fill they delimit. Only the high-contrast palettes are declared —
  // the standard border values predate the gate and sit below 3:1 (accepted
  // shortfall, as with the standard even/odd shading).
  ...(['dark-hc', 'light-hc'] as Theme[]).flatMap((theme): PairInput[] =>
    (['--cell-border', '--box-boundary'] as const).flatMap((line) =>
      [...CELL_BGS, '--cell-error-bg' as const].map((bg) => ({
        label: `${line === '--cell-border' ? 'cell border' : 'box boundary'} on ${bg}`,
        fg: line,
        bg: bg === 'base' ? refFor(BASE, theme) : bg,
        threshold: UI_AA,
        theme,
      }))
    )
  ),

  // UI component borders (toolbar buttons, cards, dialogs) sit on the page
  // backgrounds. Declared for the high-contrast palettes only, matching the
  // grid-line policy above.
  ...(['dark-hc', 'light-hc'] as Theme[]).flatMap((theme): PairInput[] =>
    (['--bg-primary', '--bg-secondary', '--bg-surface'] as const).map((bg) => ({
      label: `ui border on ${bg}`,
      fg: '--border',
      bg,
      threshold: UI_AA,
      theme,
    }))
  ),

  // The board frame (Board.module.css grid border and samurai edge strips)
  // outlines the whole puzzle against the page background. Passes in every
  // palette, so all four are gated; in high contrast it shares the
  // --cell-border value so the frame and the grid lines read as one system.
  ...THEMES.map(
    (theme): PairInput => ({
      label: 'board frame vs page bg',
      fg: '--board-frame',
      bg: '--bg-primary',
      threshold: UI_AA,
      theme,
    })
  ),

  // Given/revealed cell dots are the sole cue separating clues and revealed
  // cells from player entries. The standard values are translucent rgba the
  // math here cannot resolve (accepted shortfall, as with the dark numpad
  // label), so only the solid high-contrast palettes are declared.
  ...(['dark-hc', 'light-hc'] as Theme[]).flatMap((theme): PairInput[] =>
    (['--given-dot', '--revealed-dot'] as const).flatMap((dot) =>
      [...CELL_BGS, '--cell-error-bg' as const].map((bg) => ({
        label: `${dot === '--given-dot' ? 'given' : 'revealed'} dot on ${bg}`,
        fg: dot,
        bg: bg === 'base' ? refFor(BASE, theme) : bg,
        threshold: UI_AA,
        theme,
      }))
    )
  ),
].map(withGate);

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
  return token[TOKEN_KEY[theme]];
}

export function evaluatePair(
  pair: ContrastPair,
  tokens: Record<string, TokenValue> = readThemeTokens()
): { ratio: number; pass: boolean } {
  const fg = resolveColor(pair.fg, pair.theme, tokens);
  const bg = resolveColor(pair.bg, pair.theme, tokens);
  // The raw ratio decides pass/fail — ratios are never rounded up, so
  // 4.4999:1 fails a 4.5:1 threshold.
  const ratio = contrastRatio(fg, bg);
  return { ratio, pass: ratio >= pair.threshold };
}
