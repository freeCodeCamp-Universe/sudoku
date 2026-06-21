# Board Color Accessibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring every board cell-state color to WCAG 2.1 AA across both themes and all variants, replace the conflict/incorrect warning icon with a colorblind-safe red error fill backed by the existing screen-reader announcements, and add a contrast-checking test that fails CI on regressions.

**Architecture:** A pure `contrast.ts` module (WCAG math + alpha compositing) and a declarative `contrastSpecs.ts` (reachable foreground/background pairs + thresholds) feed a test that resolves tokens per theme from `theme.css` via the existing `readThemeTokens()` parser. The palette is then fixed to pass the gate, and the warning SVG is replaced by a single `data-error` background driven from the same `conflict || correct === false` condition.

**Tech Stack:** TypeScript, React, CSS Modules, Vitest + @testing-library/react, tsx (for scripts), pnpm.

## Global Constraints

- Package manager is **pnpm**. Run one test file with `pnpm exec vitest run path/to/file.test.ts`.
- Final gate before done: `pnpm build && pnpm test && pnpm lint` must all pass. `pnpm build` typechecks test files too.
- Named exports only; no default exports.
- File naming mirrors the unit under test; never `index.test.*`.
- CSS Modules only; logical properties; colors from theme tokens.
- `!important` exception: the project rule forbids `!important`, but `src/game/Cell/Cell.module.css` already uses it pervasively for state-background layering (peer, same-value). The error background must override those `!important` rules, which is only possible with `!important`. This plan follows the file's established pattern. Flag to the reviewer; do not refactor the whole file's cascade in this work.
- Tests use `should`-style names and accessible queries; assert attributes with `toHaveAttribute`, never `container.querySelector`.
- After any `theme.css` token change, run `pnpm docs:colors` and commit the regenerated `docs/colors.md` (the drift test `colorDocs.test.ts` fails otherwise).

## Locked palette values (computed, WCAG-verified)

New tokens (added in Task 2):

| Token               | Dark      | Light     | Purpose                                 |
| ------------------- | --------- | --------- | --------------------------------------- |
| `--cell-error-bg`   | `#cc3333` | `#c62828` | Error cell fill (conflict or incorrect) |
| `--cell-error-text` | `#ffffff` | `#ffffff` | Error cell value text                   |
| `--cell-hint-text`  | `#f1be32` | `#6b5300` | Revealed + wordoku value text           |

New light override (added in Task 2): `--overlay-arrow-stroke: #767698` (dark stays `#9898b8`).

Verified ratios (all meet AA): error bg vs base = 3.27 (dark) / 5.62 (light); white error text on error bg = 5.14 / 5.62; light hint text `#6b5300` worst-case (on `--cell-same-value-bg`) = 5.78; light arrow stroke `#767698` on white = 4.36; selection border vs base = 5.03 / 3.34.

---

### Task 1: Contrast math module

**Files:**

- Create: `src/game/testing/contrast.ts`
- Test: `src/game/testing/contrast.test.ts`

**Interfaces:**

- Produces: `relativeLuminance(hex: string): number`, `contrastRatio(fg: string, bg: string): number`, `compositeOver(top: string, alpha: number, bottom: string): string`, `parseHex(input: string): { r: number; g: number; b: number; a: number }`, and constants `TEXT_AA = 4.5`, `UI_AA = 3`.

- [ ] **Step 1: Write the failing test**

```ts
// src/game/testing/contrast.test.ts
import { describe, expect, it } from 'vitest';
import {
  contrastRatio,
  relativeLuminance,
  compositeOver,
  parseHex,
  TEXT_AA,
  UI_AA,
} from './contrast';

describe('contrastRatio', () => {
  it('should return 21 for black on white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
  });

  it('should return 1 for identical colors', () => {
    expect(contrastRatio('#1b1b32', '#1b1b32')).toBeCloseTo(1, 5);
  });

  it('should be order-independent', () => {
    expect(contrastRatio('#99c9ff', '#1b1b32')).toBeCloseTo(contrastRatio('#1b1b32', '#99c9ff'), 5);
  });
});

describe('relativeLuminance', () => {
  it('should return 0 for black and ~1 for white', () => {
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 5);
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5);
  });
});

describe('parseHex', () => {
  it('should expand 3-digit shorthand', () => {
    expect(parseHex('#fff')).toEqual({ r: 255, g: 255, b: 255, a: 1 });
  });

  it('should read an 8-digit alpha channel', () => {
    expect(parseHex('#00000080').a).toBeCloseTo(0.5, 1);
  });
});

describe('compositeOver', () => {
  it('should blend 50% black over white to mid grey', () => {
    expect(compositeOver('#000000', 0.5, '#ffffff')).toBe('#808080');
  });

  it('should return the top color at full alpha', () => {
    expect(compositeOver('#9898b8', 1, '#1b1b32')).toBe('#9898b8');
  });
});

describe('threshold constants', () => {
  it('should expose AA text and UI thresholds', () => {
    expect(TEXT_AA).toBe(4.5);
    expect(UI_AA).toBe(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/game/testing/contrast.test.ts`
Expected: FAIL — cannot resolve `./contrast`.

- [ ] **Step 3: Write the implementation**

```ts
// src/game/testing/contrast.ts
export const TEXT_AA = 4.5;
export const LARGE_AA = 3;
export const UI_AA = 3;

export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

export function parseHex(input: string): Rgba {
  const hex = input.trim().replace('#', '');
  if (hex.length === 3) {
    return {
      r: parseInt(hex[0] + hex[0], 16),
      g: parseInt(hex[1] + hex[1], 16),
      b: parseInt(hex[2] + hex[2], 16),
      a: 1,
    };
  }
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
    a: hex.length >= 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1,
  };
}

function srgbToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const { r, g, b } = parseHex(hex);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

export function contrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function compositeOver(top: string, alpha: number, bottom: string): string {
  const t = parseHex(top);
  const b = parseHex(bottom);
  const mix = (x: number, y: number) => Math.round(x * alpha + y * (1 - alpha));
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(mix(t.r, b.r))}${toHex(mix(t.g, b.g))}${toHex(mix(t.b, b.b))}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/game/testing/contrast.test.ts`
Expected: PASS (all specs).

- [ ] **Step 5: Commit**

```bash
git add src/game/testing/contrast.ts src/game/testing/contrast.test.ts
git commit -m "test: add WCAG contrast math module"
```

---

### Task 2: Palette tokens + hint-text rewiring

**Files:**

- Modify: `src/app/theme.css` (`:root` block lines 1-55, `.light` block lines 57-91)
- Modify: `src/game/Cell/Cell.module.css:211-213` and `:229-231` (revealed/word value text token)
- Modify: `docs/colors.md` (regenerated, do not hand-edit)

**Interfaces:**

- Produces: tokens `--cell-error-bg`, `--cell-error-text`, `--cell-hint-text` and a light override for `--overlay-arrow-stroke`, consumed by Tasks 3 and 4.

- [ ] **Step 1: Add the new tokens to `:root`**

In `src/app/theme.css`, after the `--accent-red: #ffadad;` line (line 22), add:

```css
--accent-red: #ffadad;
--cell-error-bg: #cc3333;
--cell-error-text: #ffffff;
--cell-hint-text: #f1be32;
```

- [ ] **Step 2: Add the light overrides to `.light`**

In `src/app/theme.css`, inside the `.light` block, after `--accent-red: #850000;` (line 68), add:

```css
--accent-red: #850000;
--cell-error-bg: #c62828;
--cell-hint-text: #6b5300;
--overlay-arrow-stroke: #767698;
```

(`--cell-error-text` needs no light override; it falls back to the `:root` `#ffffff`.)

- [ ] **Step 3: Rewire revealed and word value text to the readable hint token**

In `src/game/Cell/Cell.module.css`, change the revealed value rule:

```css
.cell[data-revealed] .value {
  color: var(--cell-hint-text);
}
```

and the word value rule:

```css
.cell[data-word] .value {
  color: var(--cell-hint-text);
}
```

(Both previously used `var(--accent-yellow)`, which is unreadable on light backgrounds.)

- [ ] **Step 4: Regenerate the color docs**

Run: `pnpm docs:colors`
Then verify the drift test passes:
Run: `pnpm exec vitest run src/game/testing/colorDocs.test.ts`
Expected: PASS (committed `docs/colors.md` now includes the three new token rows).

- [ ] **Step 5: Confirm token parsing**

Run: `pnpm exec vitest run src/game/testing/themeTokens.test.ts`
Expected: PASS (no regressions to the parser).

- [ ] **Step 6: Commit**

```bash
git add src/app/theme.css src/game/Cell/Cell.module.css docs/colors.md
git commit -m "feat: add error + hint color tokens and fix light hint contrast"
```

---

### Task 3: Contrast spec gate + report script

**Files:**

- Create: `src/game/testing/contrastSpecs.ts`
- Test: `src/game/testing/contrastSpecs.test.ts`
- Create: `scripts/contrastReport.ts`
- Modify: `package.json` (`scripts` block — add `contrast:report`)

**Interfaces:**

- Consumes: `contrastRatio`, `compositeOver`, `TEXT_AA`, `UI_AA` from `contrast.ts`; `readThemeTokens`, `TokenValue` from `themeTokens.ts`.
- Produces: `contrastPairs: ContrastPair[]`, `resolveColor(ref, theme, tokens): string`, `evaluatePair(pair, theme, tokens): { ratio: number; pass: boolean }`.

Notes baked into the spec list:

- A cell's rendered text color is theme-split: dark value text is `--accent-blue`, light value text is `--cell-text-light` (set by `:global(.light) .cell`). Light given text is hardcoded `#0a0a23` in `Cell.module.css`. The spec encodes per-theme refs to match what actually renders.
- `--cell-diagonal-bg`, `--cell-window-bg`, `--cell-special-bg`, `--cell-even-bg` share one value; `--cell-diagonal-bg` stands in for all four ("tint").
- Gated text pairs use only **reachable** combinations: filled cells (value present) never show candidates; empty cells (candidates) are never same-value or error; error cells always have a value, so candidates/error never co-occur.
- Gated state pairs: selection border and error background must be ≥3:1 vs the base cell (they convey essential state). Peer / same-value highlights are convenience cues; they are listed `gate: false` (reported, not enforced) so the highlight palette stays subtle.
- Overlay strokes that convey constraints (cage, jigsaw, arrow) are gated at 3:1 vs base. Kropki/consecutive dots and the translucent argyle stroke are listed `gate: false` (paired light/dark dot system with rings; meaning is also announced by annotators).

- [ ] **Step 1: Write the failing test**

```ts
// src/game/testing/contrastSpecs.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/game/testing/contrastSpecs.test.ts`
Expected: FAIL — cannot resolve `./contrastSpecs`.

- [ ] **Step 3: Write the spec module**

```ts
// src/game/testing/contrastSpecs.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/game/testing/contrastSpecs.test.ts`
Expected: PASS. (If any gated pair fails, the message names the pair, theme, and ratio — fix the offending token value in `theme.css`, rerun `pnpm docs:colors`, and retest.)

- [ ] **Step 5: Add the report script**

```ts
// scripts/contrastReport.ts
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
```

- [ ] **Step 6: Wire the pnpm script**

In `package.json`, add to the `scripts` block (after `"docs:colors"`):

```json
    "contrast:report": "tsx scripts/contrastReport.ts",
```

- [ ] **Step 7: Run the report to confirm it prints**

Run: `pnpm contrast:report`
Expected: a dark and light table; every `PASS`/`FAIL` row shows `PASS`.

- [ ] **Step 8: Commit**

```bash
git add src/game/testing/contrastSpecs.ts src/game/testing/contrastSpecs.test.ts scripts/contrastReport.ts package.json
git commit -m "test: gate board colors on WCAG AA contrast"
```

---

### Task 4: Replace the warning icon with the error fill

**Files:**

- Modify: `src/game/Cell/Cell.tsx:106-108` (add `data-error`) and `:193-204` (remove the SVG)
- Modify: `src/game/Cell/Cell.module.css:219-227` (remove `.incorrectIcon`; add `data-error` rules at end of file)
- Modify: `src/game/Cell/Cell.test.tsx:195-223` (replace icon assertions)

**Interfaces:**

- Consumes: `--cell-error-bg`, `--cell-error-text` from Task 2.
- Produces: a `data-error` attribute on the gridcell when `conflict || correct === false`.

- [ ] **Step 1: Replace the icon assertions in `Cell.test.tsx`**

Replace the five tests at `src/game/Cell/Cell.test.tsx:195-223` with:

```tsx
it('should mark the cell as an error when conflict is true', () => {
  render(<Cell {...baseProps} value={5} conflict />);

  expect(screen.getByRole('gridcell')).toHaveAttribute('data-error');
});

it('should mark the cell as an error when correct is false', () => {
  render(<Cell {...baseProps} value={5} correct={false} />);

  expect(screen.getByRole('gridcell')).toHaveAttribute('data-error');
});

it('should not mark an error when there is no conflict and correct is undefined', () => {
  render(<Cell {...baseProps} value={5} />);

  expect(screen.getByRole('gridcell')).not.toHaveAttribute('data-error');
});

it('should not mark an error when correct is true', () => {
  render(<Cell {...baseProps} value={5} correct />);

  expect(screen.getByRole('gridcell')).not.toHaveAttribute('data-error');
});

it('should no longer render the legacy warning icon', () => {
  render(<Cell {...baseProps} value={5} conflict correct={false} />);

  expect(screen.queryByTestId('cell-warning-icon')).toBeNull();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run src/game/Cell/Cell.test.tsx`
Expected: FAIL — `data-error` not present (still rendering the SVG).

- [ ] **Step 3: Add `data-error` to the cell in `Cell.tsx`**

In `src/game/Cell/Cell.tsx`, after the `data-incorrect` line (line 108), add:

```tsx
      data-incorrect={correct === false || undefined}
      data-error={conflict || correct === false || undefined}
```

- [ ] **Step 4: Remove the warning SVG from `Cell.tsx`**

Delete the entire block at `src/game/Cell/Cell.tsx:193-204`:

```tsx
{
  conflict || correct === false ? (
    <svg
      aria-hidden="true"
      data-testid="cell-warning-icon"
      className={styles.incorrectIcon}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
    >
      {/* !Font Awesome Free v7.2.0 ... */}
      <path d="M256 0c14.7 ..." />
    </svg>
  ) : null;
}
```

(The preceding `markerEdges?.map(...)` block stays; this removes only the trailing icon ternary and its now-unused position in the JSX.)

- [ ] **Step 5: Swap the CSS — remove the icon rule, add the error fill**

In `src/game/Cell/Cell.module.css`, delete the `.incorrectIcon` rule (lines 219-227). Then append at the **end of the file** (so it wins source-order against the `!important` peer/same-value rules):

```css
/* Error fill for cells that are incorrect or in conflict. A saturated red
   background (not hue-only text) so the state reads by luminance for colorblind
   users; the screen-reader announcement still distinguishes incorrect vs
   in-conflict. Placed last and marked !important to override the peer /
   same-value background rules, which are themselves !important. */
.cell[data-error],
:global(.light) .cell[data-error] {
  background: var(--cell-error-bg) !important;
}

.cell[data-error] .value {
  color: var(--cell-error-text);
}
```

- [ ] **Step 6: Run the Cell tests to verify they pass**

Run: `pnpm exec vitest run src/game/Cell/Cell.test.tsx`
Expected: PASS.

- [ ] **Step 7: Verify the announcement still distinguishes the two states**

The announcement plumbing is unchanged (`getCellLabel()` pushes `incorrect` vs `in conflict`; the value-entry path in `useSudokuGrid.ts` appends `, incorrect` / `, in conflict`). Confirm the existing coverage still passes:

Run: `pnpm exec vitest run src/game/GamePage.test.tsx src/game/useSudokuGrid.test.ts`
Expected: PASS (GamePage asserts the accessible name `/in conflict/i`, which is independent of the removed icon).

- [ ] **Step 8: Commit**

```bash
git add src/game/Cell/Cell.tsx src/game/Cell/Cell.module.css src/game/Cell/Cell.test.tsx
git commit -m "feat: replace conflict/incorrect icon with colorblind-safe error fill"
```

---

### Task 5: Full verification

**Files:** none (verification only).

- [ ] **Step 1: Build (typechecks tests too)**

Run: `pnpm build`
Expected: no TypeScript errors; Vite build completes.

- [ ] **Step 2: Full test run**

Run: `pnpm test`
Expected: all suites pass, including `contrast.test.ts`, `contrastSpecs.test.ts`, `colorDocs.test.ts`, `Cell.test.tsx`.

- [ ] **Step 3: Lint + format check**

Run: `pnpm lint`
Expected: clean.

- [ ] **Step 4: Confirm no orphaned references to the removed icon**

Run: `grep -rn "cell-warning-icon\|incorrectIcon" src`
Expected: no matches.

- [ ] **Step 5: Final commit (only if Steps 1-4 surfaced fixes)**

```bash
git add -A
git commit -m "chore: verify board color a11y pass"
```

---

## Self-Review

**Spec coverage:**

- Contrast script (comprehensive: text, state distinctness, overlays) → Tasks 1, 3. ✓
- WCAG AA thresholds → `TEXT_AA`/`UI_AA` in Task 1, applied in Task 3. ✓
- One shared error look → single `data-error` fill, Task 4. ✓
- Colorblind-safe error via luminance-distinct background → `--cell-error-bg` (3.27/5.62 vs base), Task 2/4. ✓
- State colors shared across variants → error/selection/peer/same-value remain single tokens; error fill overrides all variant tints uniformly. ✓
- A11y announcement retained + distinct → Task 4 Step 7. ✓
- Removed icon → Task 4 Steps 4-5; verified absent in Task 5 Step 4. ✓
- Drift docs kept in sync → Task 2 Step 4. ✓
- High-contrast theme → explicitly deferred (spec out-of-scope). ✓

**Placeholder scan:** No TBD/TODO; all token values, code, and commands are concrete. ✓

**Type consistency:** `ContrastPair`, `resolveColor`, `evaluatePair`, `Theme`, `TokenValue` are defined in Task 1/3 and used consistently in the test and report script. `compositeOver(top, alpha, bottom)` signature matches both call sites. ✓

## Open question (carried from spec)

`pnpm contrast:report` prints to stdout only; no committed `docs/contrast.md` drift gate. Change Task 3 to also write/commit a markdown report if a committed artifact is preferred.
