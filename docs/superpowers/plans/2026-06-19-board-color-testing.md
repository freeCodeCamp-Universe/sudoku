# Board Color Documentation and Testing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every board color a single `theme.css`-sourced token, document them, and add per-variant tests that catch color regressions without a browser.

**Architecture:** `theme.css` is the one source of truth. DOM consumers (board, keypad) read tokens via `var(--…)`; canvas consumers (gallery previews) read the same tokens at runtime via `getComputedStyle`. A deterministic fixture (`makeFixture`) gives value-derived variants a stable board so their colored cells can be asserted. Tests parse `theme.css` for expected values, assert markers through a render harness, and pin specific values. Dead overlap board styling is removed; its tokens stay for the previews.

**Tech Stack:** TypeScript, React, Vite, Vitest + @testing-library/react + jest-dom (jsdom), CSS Modules, pnpm.

## Global Constraints

- Package manager is **pnpm**. Single-run tests only: `pnpm exec vitest run <path>` (never watch mode).
- Verify before claiming done: `pnpm build && pnpm test && pnpm lint` (build runs `tsc --noEmit` over `*.test.ts(x)` too).
- File naming: name files after their export; `index.ts(x)` is barrels only; test files mirror the unit (never `index.test.tsx`).
- Exports: named exports only, no default exports.
- Styling: CSS Modules only; no inline styles, no new `!important` (a pre-existing `!important` may stay when a line only swaps a hex for a `var()`); logical properties; colors from theme custom properties; mobile-first `min-width` queries (`768/1024/1440/2560`).
- Imports: use the `@/` alias for `src`.
- Tests: `should`-style names; query by role/label, never `container.querySelector`; drive interactions with `userEvent`. Filtering an array returned by `getAllByRole` and reading an attribute off those returned nodes is allowed.
- Commits: conventional `<type>: <description>`; no `Co-Authored-By: Claude` trailer.
- Branch: work on the `test/board-color` branch.

---

### Task 1: Deterministic fixture and render harness

The foundation. `makeFixture` gives value-derived variants a stable board; `renderVariantBoard` renders any variant for assertion. The positional-marker tests here are the safety net the later CSS refactor must not disturb.

**Files:**

- Create: `src/game/testing/makeFixture.ts`
- Create: `src/game/testing/makeFixture.test.ts`
- Create: `src/game/testing/renderVariantBoard.tsx`
- Create: `src/game/testing/renderVariantBoard.test.tsx`

**Interfaces:**

- Produces: `makeFixture(variant: Variant, seed?: number): Fixture` where
  `Fixture = { model: VariantModel; rects: Map<CellId, Rect>; size: Size; solution: Solution; givens: Values; structure: unknown; parityMap?: Map<CellId, 0 | 1> }`.
- Produces: `seeded(seed: number): () => number` (the LCG used across the engine tests).
- Produces: `renderVariantBoard(variant, options?): { model: VariantModel; getCell(id: CellId): HTMLElement }` where
  `options = { fixture?: Fixture; cellState?: (id: CellId) => Partial<CellRenderState>; renderSymbol?: (v: SymbolValue) => string; parityMap?: Map<CellId, 0 | 1>; structure?: unknown; colorblindMode?: boolean }`.

- [ ] **Step 1: Confirm layout resolver and difficulty type**

Run: `grep -rn "export" src/game/layouts/registry.ts src/game/layouts/grid.ts; grep -rn "Difficulty" src/engine/types.ts`
Expected (already verified): `resolveLayout(kind)` in `src/game/layouts/registry.ts` resolves `grid`/`multigrid`/`triangular` to strategies exposing `cellRects(variant)`/`canvasSize(variant)`; `Difficulty = 'beginner' | 'intermediate' | 'advanced'` (use `'intermediate'`). `makeFixture` uses `resolveLayout(variant.layout.kind)`, so triangular variants (sujiken) resolve without a special case.

- [ ] **Step 2: Write the failing fixture test**

```ts
// src/game/testing/makeFixture.test.ts
import { describe, expect, it } from 'vitest';
import { sudokuX } from '@/variants/sudoku-x';
import { evenOdd } from '@/variants/evenOdd';
import { makeFixture } from './makeFixture';

describe('makeFixture', () => {
  it('should return a complete, valid solution for the variant', () => {
    const { solution, model } = makeFixture(sudokuX);
    expect(solution.size).toBe(model.cells.length);
  });

  it('should be deterministic for the same seed', () => {
    const a = makeFixture(sudokuX, 7);
    const b = makeFixture(sudokuX, 7);
    expect([...a.solution.entries()]).toEqual([...b.solution.entries()]);
  });

  it('should expose a parityMap for value-derived variants', () => {
    const { parityMap } = makeFixture(evenOdd, 11);
    expect(parityMap?.size).toBeGreaterThan(0);
  });
});
```

Confirm the exported variant names with `grep -n "export const" src/variants/sudoku-x.ts src/variants/evenOdd.ts` before finalizing the imports.

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm exec vitest run src/game/testing/makeFixture.test.ts`
Expected: FAIL ("Failed to resolve import './makeFixture'").

- [ ] **Step 4: Implement `makeFixture`**

```ts
// src/game/testing/makeFixture.ts
import type { CellId, Solution, Values, Variant, VariantModel } from '@/engine/types';
import type { Rect, Size } from '@/game/gameTypes';
import { buildModel } from '@/engine/buildModel';
import { generate } from '@/engine/generate';
import { resolveLayout } from '@/game/layouts/registry';

export interface Fixture {
  model: VariantModel;
  rects: Map<CellId, Rect>;
  size: Size;
  solution: Solution;
  givens: Values;
  structure: unknown;
  parityMap?: Map<CellId, 0 | 1>;
}

export function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

export function makeFixture(variant: Variant, seed = 1): Fixture {
  const model = buildModel(variant);
  const layout = resolveLayout(variant.layout.kind);
  const { solution, givens } = generate(model, 'intermediate', seeded(seed));
  const structure = variant.deriveStructure?.(solution, model);
  const parityMap =
    structure && typeof structure === 'object' && 'parityMap' in structure
      ? (structure as { parityMap: Map<CellId, 0 | 1> }).parityMap
      : undefined;

  return {
    model,
    rects: layout.cellRects(variant),
    size: layout.canvasSize(variant),
    solution,
    givens,
    structure,
    parityMap,
  };
}
```

Note: this uses the verified `resolveLayout(kind)` registry helper, which already maps `grid`/`multigrid`/`triangular`, so triangular variants (sujiken) need no special case when they appear in the spec table (Task 8).

- [ ] **Step 5: Run the fixture test to verify it passes**

Run: `pnpm exec vitest run src/game/testing/makeFixture.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Write the failing harness test (positional safety net)**

```tsx
// src/game/testing/renderVariantBoard.test.tsx
import { describe, expect, it } from 'vitest';
import { sudokuX } from '@/variants/sudoku-x';
import { windoku } from '@/variants/windoku';
import { renderVariantBoard } from './renderVariantBoard';

describe('renderVariantBoard', () => {
  it('should mark the diagonal cells on sudoku-x', () => {
    const { getCell } = renderVariantBoard(sudokuX);
    expect(getCell('r0c0')).toHaveAttribute('data-diagonal', 'true');
    expect(getCell('r0c1')).not.toHaveAttribute('data-diagonal');
  });

  it('should mark a window cell on windoku', () => {
    const { getCell } = renderVariantBoard(windoku);
    expect(getCell('r1c1')).toHaveAttribute('data-window', 'true');
  });
});
```

Confirm the canonical window cell from `WINDOKU_WINDOWS` (`src/variants/windoku.ts`) before fixing `r1c1`.

- [ ] **Step 7: Run to verify it fails**

Run: `pnpm exec vitest run src/game/testing/renderVariantBoard.test.tsx`
Expected: FAIL ("Failed to resolve import './renderVariantBoard'").

- [ ] **Step 8: Implement `renderVariantBoard`**

```tsx
// src/game/testing/renderVariantBoard.tsx
import { render, screen } from '@testing-library/react';
import type { CellId, SymbolValue, Variant, VariantModel } from '@/engine/types';
import { Board } from '@/game/Board';
import { makeFixture, type Fixture } from './makeFixture';

interface CellRenderState {
  value?: SymbolValue;
  candidates: SymbolValue[];
  given: boolean;
  selected: boolean;
  conflict: boolean;
  correct?: boolean;
  sameValue?: boolean;
  peer?: boolean;
  revealed?: boolean;
}

export interface RenderVariantBoardOptions {
  fixture?: Fixture;
  cellState?: (id: CellId) => Partial<CellRenderState>;
  renderSymbol?: (value: SymbolValue) => string;
  parityMap?: Map<CellId, 0 | 1>;
  structure?: unknown;
  colorblindMode?: boolean;
}

export function renderVariantBoard(variant: Variant, options: RenderVariantBoardOptions = {}) {
  const fixture = options.fixture ?? makeFixture(variant);
  const { model, rects, size } = fixture;

  render(
    <Board
      variant={variant}
      cells={model.cells}
      rects={rects}
      size={size}
      grid={{
        cellState: (id: CellId) => ({
          candidates: [],
          given: false,
          selected: false,
          conflict: false,
          ...options.cellState?.(id),
        }),
        cellProps: (id: CellId) => ({ 'data-cell': id, onClick: () => {} }),
        announcerRef: { current: null },
        announce: () => {},
      }}
      renderSymbol={options.renderSymbol ?? ((value) => String(value))}
      parityMap={options.parityMap ?? fixture.parityMap}
      colorblindMode={options.colorblindMode ?? false}
    />
  );

  const getCell = (id: CellId): HTMLElement => {
    const cell = screen
      .getAllByRole('gridcell')
      .find((node) => node.getAttribute('data-cell') === id);
    if (!cell) {
      throw new Error(`No gridcell with data-cell="${id}"`);
    }
    return cell;
  };

  return { model: model as VariantModel, getCell };
}
```

Confirm `Board`'s accepted props against `BoardProps` in `src/game/gameTypes.ts`; drop any option the type rejects (the `Board.tsx` read shows `grid`, `renderSymbol`, `parityMap`, `wordCells`, `colorblindMode`, `markerGaps`, `overlays`, `gutters`).

- [ ] **Step 9: Run to verify it passes**

Run: `pnpm exec vitest run src/game/testing/renderVariantBoard.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 10: Commit**

```bash
git add src/game/testing/makeFixture.ts src/game/testing/makeFixture.test.ts src/game/testing/renderVariantBoard.tsx src/game/testing/renderVariantBoard.test.tsx
git commit -m "test: add deterministic fixture and board render harness"
```

---

### Task 2: theme.css token reader and canvas bridge

**Files:**

- Create: `src/game/testing/themeTokens.ts`
- Create: `src/game/testing/themeTokens.test.ts`
- Create: `src/app/readThemeColor.ts`
- Create: `src/app/readThemeColor.test.ts`

**Interfaces:**

- Produces: `readThemeTokens(): Record<string, { dark: string; light: string }>` (light = `.light` override else `:root`).
- Produces: `readThemeColor(name: string): string` (runtime `getComputedStyle` read for canvas).

- [ ] **Step 1: Write the failing reader test (against existing vars)**

```ts
// src/game/testing/themeTokens.test.ts
import { describe, expect, it } from 'vitest';
import { readThemeTokens } from './themeTokens';

describe('readThemeTokens', () => {
  it('should read a dark value from :root', () => {
    expect(readThemeTokens()['--accent-blue'].dark).toBe('#99c9ff');
  });

  it('should read a light override when present', () => {
    expect(readThemeTokens()['--accent-red'].light).toBe('#850000');
  });

  it('should fall back to the :root value when there is no light override', () => {
    expect(readThemeTokens()['--accent-blue'].light).toBe('#99c9ff');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm exec vitest run src/game/testing/themeTokens.test.ts`
Expected: FAIL ("Failed to resolve import './themeTokens'").

- [ ] **Step 3: Implement the reader**

```ts
// src/game/testing/themeTokens.ts
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export interface TokenValue {
  dark: string;
  light: string;
}

const THEME_CSS_PATH = fileURLToPath(new URL('../../app/theme.css', import.meta.url));

function parseDeclarations(css: string, selector: string): Record<string, string> {
  const block = new RegExp(`${selector}\\s*\\{([^}]*)\\}`).exec(css);
  const result: Record<string, string> = {};
  if (!block) {
    return result;
  }
  for (const line of block[1].split(';')) {
    const match = /\s*(--[\w-]+)\s*:\s*([^;]+)/.exec(line);
    if (match) {
      result[match[1]] = match[2].trim();
    }
  }
  return result;
}

export function readThemeTokens(): Record<string, TokenValue> {
  const css = readFileSync(THEME_CSS_PATH, 'utf8');
  const root = parseDeclarations(css, ':root');
  const light = parseDeclarations(css, '\\.light');
  const tokens: Record<string, TokenValue> = {};
  for (const [name, dark] of Object.entries(root)) {
    tokens[name] = { dark, light: light[name] ?? dark };
  }
  return tokens;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm exec vitest run src/game/testing/themeTokens.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Write the failing bridge test**

```ts
// src/app/readThemeColor.test.ts
import { describe, expect, it } from 'vitest';
import { readThemeColor } from './readThemeColor';

describe('readThemeColor', () => {
  it('should return the inline custom property value when set', () => {
    document.documentElement.style.setProperty('--probe-color', '#123456');
    expect(readThemeColor('--probe-color')).toBe('#123456');
  });

  it('should return an empty string for an undefined property', () => {
    expect(readThemeColor('--not-defined')).toBe('');
  });
});
```

Note: jsdom resolves inline custom properties set directly on the element (as above), even though it cannot resolve values that come only from a stylesheet. That is enough to test the helper's logic.

- [ ] **Step 6: Run to verify it fails, then implement**

Run: `pnpm exec vitest run src/app/readThemeColor.test.ts`
Expected: FAIL. Then:

```ts
// src/app/readThemeColor.ts
export function readThemeColor(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
```

- [ ] **Step 7: Run to verify it passes**

Run: `pnpm exec vitest run src/app/readThemeColor.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 8: Commit**

```bash
git add src/game/testing/themeTokens.ts src/game/testing/themeTokens.test.ts src/app/readThemeColor.ts src/app/readThemeColor.test.ts
git commit -m "test: add theme token reader and canvas color bridge"
```

---

### Task 3: Remove the dead overlap board code

`Board` never sets `data-overlap`; two tests enforce its absence. Delete the dead prop, the dead CSS, and the now-meaningless tests. The overlap _tokens_ are added to `theme.css` in Task 4 for the previews, not here.

**Files:**

- Modify: `src/game/Cell/Cell.tsx` (remove `overlap` prop, `overlapClass`, `data-overlap`)
- Modify: `src/game/Cell/Cell.module.css` (remove `[data-overlap]` rules)
- Modify: `src/variants/butterfly.render.test.tsx` (delete the overlap-absence test)
- Modify: `src/game/Board/Board.test.tsx` (delete the overlap-absence assertion/test)

- [ ] **Step 1: Confirm nothing else passes `overlap` to Cell**

Run: `grep -rn "overlap=" src/game; grep -rn "data-overlap" src`
Expected: only the `Cell.tsx` definition and the `Cell.module.css` rules and the two tests; no producer sets `overlap`.

- [ ] **Step 2: Remove the dead code**

In `Cell.tsx`: delete the `overlap?: number;` prop (line 24), the `overlap = 0` default (line 75), the `overlapClass` block (lines 98-107), and `data-overlap={overlapClass}` (line 127).

In `Cell.module.css`: delete the standalone `[data-overlap='two'..'five']` rules (lines 92-106), the `.light` overlap rules (lines 390-404), and remove the `[data-peer][data-overlap='…']` selectors from the compound peer rules (lines 169-172, 180-183) and the `[data-same-value][data-overlap='…']` selectors (lines 225-228, 236-239), keeping the non-overlap selectors in those rule lists intact.

- [ ] **Step 3: Delete the absence tests**

In `butterfly.render.test.tsx`, delete the `should not apply overlap shading to any multigrid cells` test (around line 94). In `Board.test.tsx`, delete the `not.toHaveAttribute('data-overlap')` assertion (line 199) and its test if that is the only assertion.

- [ ] **Step 4: Verify nothing broke**

Run: `pnpm exec vitest run src/game/testing/renderVariantBoard.test.tsx src/variants/butterfly.render.test.tsx src/game/Board/Board.test.tsx && pnpm build && pnpm lint`
Expected: PASS. The positional safety net is unaffected.

- [ ] **Step 5: Commit**

```bash
git add src/game/Cell/Cell.tsx src/game/Cell/Cell.module.css src/variants/butterfly.render.test.tsx src/game/Board/Board.test.tsx
git commit -m "refactor: remove dead overlap cell styling"
```

---

### Task 4: Migrate cell colors into theme.css tokens

Move every hardcoded hex in `Cell.module.css` into named `theme.css` tokens (including the overlap tokens, which the previews will consume), have the selectors reference them, then lock values and wiring. Behavior must not change; the Task 1 safety net plus a manual visual check confirm that.

**Files:**

- Modify: `src/app/theme.css`
- Modify: `src/game/Cell/Cell.module.css`
- Create: `src/game/Cell/cellColors.test.ts`

**Add to `:root`:**

```css
--cell-border: #4a4a5e;
--cell-bg-light: #ffffff;
--cell-text-light: #2c5f8a;
--box-boundary: #4a4a5e;
--cell-diagonal-bg: #3b3b4f;
--cell-window-bg: #3b3b4f;
--cell-special-bg: #3b3b4f;
--cell-even-bg: #3b3b4f;
--cell-odd-bg: #12123a;
--cell-peer-even-bg: #2c2c4c;
--cell-peer-odd-bg: #1a1a40;
--cell-overlap-2-bg: #222248;
--cell-overlap-3-bg: #272751;
--cell-overlap-4-bg: #2c2c5a;
--cell-overlap-5-bg: #313163;
--cell-selected-border: #4a90d9;
--cell-peer-bg: #272948;
--cell-peer-structural-bg: #2e2e44;
--cell-same-value-bg: #1a4f4f;
--candidate-text: #aaaacc;
```

**Add to `.light`:**

```css
--cell-border: #d8d8e8;
--box-boundary: #b8b8cc;
--cell-diagonal-bg: #e8e8fa;
--cell-window-bg: #e8e8fa;
--cell-special-bg: #e8e8fa;
--cell-even-bg: #e8e8fa;
--cell-odd-bg: #ffffff;
--cell-peer-even-bg: #d8d8f0;
--cell-peer-odd-bg: #ededf6;
--cell-overlap-2-bg: #eeeef8;
--cell-overlap-3-bg: #e9e9f6;
--cell-overlap-4-bg: #e4e4f4;
--cell-overlap-5-bg: #dfdff2;
--cell-peer-bg: #ededf6;
--cell-peer-structural-bg: #d8d8f0;
--cell-same-value-bg: #cdeaea;
--candidate-text: #555570;
```

(`--cell-bg-light` and `--cell-text-light` have no `.light` entry; they are the light values consumed by the `:global(.light) .cell` rule. `--cell-selected-border` is the same in both themes.)

**Cell.module.css replacements (post-Task-3 line numbers shift; match by selector, not line):**

| Selector / rule                                                                                                               | Current hex                   | Replace with                                                             |
| ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------ |
| `.cell` border                                                                                                                | `#4a4a5e`                     | `var(--cell-border)`                                                     |
| `[data-diagonal]`                                                                                                             | `#3b3b4f` / light `#e8e8fa`   | `var(--cell-diagonal-bg)`                                                |
| `[data-even]`                                                                                                                 | `#3b3b4f` / `#e8e8fa`         | `var(--cell-even-bg)`                                                    |
| `[data-odd]`                                                                                                                  | `#12123a` / `#ffffff`         | `var(--cell-odd-bg)`                                                     |
| `[data-window]`                                                                                                               | `#3b3b4f` / `#e8e8fa`         | `var(--cell-window-bg)`                                                  |
| `[data-asterisk],[data-center-dot],[data-girandola]`                                                                          | `#3b3b4f` / `#e8e8fa`         | `var(--cell-special-bg)`                                                 |
| `[data-peer][data-even]`                                                                                                      | `#2c2c4c` / `#d8d8f0`         | `var(--cell-peer-even-bg)`                                               |
| `[data-peer][data-odd]`                                                                                                       | `#1a1a40` / `#ededf6`         | `var(--cell-peer-odd-bg)`                                                |
| box border `::after`/`::before`                                                                                               | `#4a4a5e` / `#b8b8cc`         | `var(--box-boundary)`                                                    |
| `[data-selected]::after` border                                                                                               | `#4a90d9`                     | `var(--cell-selected-border)`                                            |
| `[data-peer]`                                                                                                                 | `#272948` / `#ededf6`         | `var(--cell-peer-bg)`                                                    |
| `[data-peer][data-overlay-borders]…`, `[data-peer][data-window]`, `[data-peer][data-asterisk]…`, `[data-peer][data-diagonal]` | `#2e2e44` / `#d8d8f0`         | `var(--cell-peer-structural-bg)`                                         |
| `[data-same-value]…`                                                                                                          | `#1a4f4f` / `#cdeaea`         | `var(--cell-same-value-bg)`                                              |
| `.candidate`                                                                                                                  | `#aaaacc` / `#555570`         | `var(--candidate-text)`                                                  |
| `:global(.light) .cell`                                                                                                       | `#ffffff`/`#2c5f8a`/`#d8d8e8` | `var(--cell-bg-light)` / `var(--cell-text-light)` / `var(--cell-border)` |

Leave the decorative `rgba(...)` dots (`givenDot`, `revealedDot`, `colorLabel`) unchanged. Do not touch existing `var(--accent-*)`, `var(--bg-*)`, `var(--text-*)` references.

- [ ] **Step 1: Write the failing value-pin and integrity test**

```ts
// src/game/Cell/cellColors.test.ts
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { readThemeTokens } from '@/game/testing/themeTokens';

const CELL_CSS = readFileSync(fileURLToPath(new URL('./Cell.module.css', import.meta.url)), 'utf8');

describe('cell color tokens', () => {
  it('should pin the structural shades', () => {
    const tokens = readThemeTokens();
    expect(tokens['--cell-diagonal-bg']).toEqual({ dark: '#3b3b4f', light: '#e8e8fa' });
    expect(tokens['--cell-same-value-bg']).toEqual({ dark: '#1a4f4f', light: '#cdeaea' });
    expect(tokens['--cell-selected-border']).toEqual({ dark: '#4a90d9', light: '#4a90d9' });
  });

  it('should wire each structural marker to its token', () => {
    expect(CELL_CSS).toMatch(/\[data-diagonal\]\s*\{\s*background:\s*var\(--cell-diagonal-bg\)/);
    expect(CELL_CSS).toMatch(/\[data-window\]\s*\{\s*background:\s*var\(--cell-window-bg\)/);
    expect(CELL_CSS).toMatch(/\[data-even\]\s*\{\s*background:\s*var\(--cell-even-bg\)/);
    expect(CELL_CSS).toMatch(/\[data-odd\]\s*\{\s*background:\s*var\(--cell-odd-bg\)/);
  });

  it('should not leave bare hex in the structural marker rules', () => {
    expect(CELL_CSS).not.toMatch(/\[data-diagonal\]\s*\{\s*background:\s*#/);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm exec vitest run src/game/Cell/cellColors.test.ts`
Expected: FAIL (tokens undefined; CSS still has bare hex).

- [ ] **Step 3: Apply the token block and the CSS replacements**

Add the `:root` and `.light` blocks above; apply every replacement-table row.

- [ ] **Step 4: Run the new test and the safety net**

Run: `pnpm exec vitest run src/game/Cell/cellColors.test.ts src/game/testing/renderVariantBoard.test.tsx`
Expected: PASS.

- [ ] **Step 5: Full verification and manual visual check**

Run: `pnpm build && pnpm test && pnpm lint`. Then `pnpm dev` and spot-check sudoku-x, windoku, even-odd in both themes. Colors must look identical to before.

- [ ] **Step 6: Commit**

```bash
git add src/app/theme.css src/game/Cell/Cell.module.css src/game/Cell/cellColors.test.ts
git commit -m "refactor: source cell colors from theme.css tokens"
```

---

### Task 5: Migrate overlay colors into theme.css tokens

**Files:**

- Modify: `src/app/theme.css`
- Modify: `src/game/overlays/CageOverlay/CageOverlay.module.css`
- Modify: `src/game/overlays/ArgyleOverlay.module.css`
- Modify: any other overlay `*.module.css` with a bare hex (Step 1)
- Create: `src/game/overlays/overlayColors.test.ts`

- [ ] **Step 1: Discover every overlay hex**

Run: `grep -rnE "#[0-9a-fA-F]{3,6}" src/game/overlays`
Expected: the overlay color literals. Known: cage stroke `#9898b8`/`#5555aa`, cage sum `#f1be32`; argyle stroke `#9898b8`/`#8080a8`. Add a token per distinct (selector, value); reuse `--accent-yellow` where a literal equals `#f1be32`.

- [ ] **Step 2: Add overlay tokens to `theme.css`**

```css
/* :root */
--overlay-cage-stroke: #9898b8;
--overlay-argyle-stroke: #9898b8;
/* .light */
--overlay-cage-stroke: #5555aa;
--overlay-argyle-stroke: #8080a8;
```

Add tokens for any extra literals Step 1 surfaced.

- [ ] **Step 3: Write the failing test**

```ts
// src/game/overlays/overlayColors.test.ts
import { describe, expect, it } from 'vitest';
import { readThemeTokens } from '@/game/testing/themeTokens';

describe('overlay color tokens', () => {
  it('should pin the cage and argyle stroke values', () => {
    const tokens = readThemeTokens();
    expect(tokens['--overlay-cage-stroke']).toEqual({ dark: '#9898b8', light: '#5555aa' });
    expect(tokens['--overlay-argyle-stroke']).toEqual({ dark: '#9898b8', light: '#8080a8' });
  });
});
```

- [ ] **Step 4: Run to verify it fails, then replace the overlay hex**

Run: `pnpm exec vitest run src/game/overlays/overlayColors.test.ts` (FAIL). Then swap each overlay `stroke:`/`fill:` hex for the matching `var(--overlay-…)` (and `var(--accent-yellow)` for the cage sum), moving light values out of `:global(.light)` overrides that now resolve through the token.

- [ ] **Step 5: Verify**

Run: `pnpm exec vitest run src/game/overlays/overlayColors.test.ts && pnpm build && pnpm lint`. Spot-check killer and argyle boards in both themes via `pnpm dev`.

- [ ] **Step 6: Commit**

```bash
git add src/app/theme.css src/game/overlays src/game/overlays/overlayColors.test.ts
git commit -m "refactor: source overlay colors from theme.css tokens"
```

---

### Task 6: Move the color palette into CSS (full option B)

The nine palette colors become `--color-1..9` in `theme.css`; the cell chip and the keypad swatch apply them via `data-color`, removing the inline `renderSymbol` background and the `COLOR_PALETTE` constant.

**Files:**

- Modify: `src/app/theme.css`
- Modify: `src/game/Cell/Cell.module.css`, `src/game/Cell/Cell.tsx`, `src/game/Cell/Cell.test.tsx`
- Modify: `src/game/NumberPad/NumberPad.module.css`, `src/game/NumberPad/NumberPad.tsx`, `src/game/NumberPad/NumberPad.test.tsx`
- Modify: `src/variants/color.ts`, `src/variants/color.test.ts`

**`theme.css` `:root` (palette is theme-invariant):**

```css
--color-1: #e03535;
--color-2: #f07820;
--color-3: #d4a828;
--color-4: #33a850;
--color-5: #1aabaa;
--color-6: #3a80e0;
--color-7: #8e52e8;
--color-8: #d94080;
--color-9: #9898b0;
```

- [ ] **Step 1: Write the failing tests first**

In `Cell.test.tsx`, set `colorProps.renderSymbol` to `(value) => String(value)`, delete the `should set the chip background…` test, and add:

```tsx
it('should tag the chip with its color index so CSS can paint it', () => {
  render(<Cell {...colorProps} />);
  expect(screen.getByTestId('cell-color-chip')).toHaveAttribute('data-color', '3');
});
```

In `color.test.ts`, remove the `COLOR_PALETTE` import and the `should export COLOR_PALETTE…` / `should map renderSymbol(1)…` tests, and add:

```ts
import { readThemeTokens } from '@/game/testing/themeTokens';

it('should define the nine palette colors in theme.css', () => {
  const tokens = readThemeTokens();
  expect(tokens['--color-1'].dark).toBe('#e03535');
  expect(tokens['--color-9'].dark).toBe('#9898b0');
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `pnpm exec vitest run src/game/Cell/Cell.test.tsx src/variants/color.test.ts`
Expected: FAIL (no `data-color`; `--color-1` undefined; `COLOR_PALETTE` import error).

- [ ] **Step 3: Add palette vars and CSS rules**

Add `--color-1..9` to `theme.css`. In `Cell.module.css`, after `.colorChip { … }`, add nine rules:

```css
.colorChip[data-color='1'] {
  background: var(--color-1);
}
/* … through --color-9 */
```

Add the identical nine `.colorChip[data-color='N']` rules in `NumberPad.module.css`.

- [ ] **Step 4: Update the components**

In `Cell.tsx`, the chip span drops the inline style and gains the attribute:

```tsx
<span
  aria-hidden="true"
  className={styles.colorChip}
  data-color-chip
  data-color={value}
  data-testid="cell-color-chip"
/>
```

In `NumberPad.tsx`, the swatch span:

```tsx
<span aria-hidden="true" className={styles.colorChip} data-color={symbol}>
  <span className={styles.colorLabel}>{symbol}</span>
</span>
```

- [ ] **Step 5: Simplify `color.ts`**

Remove the `COLOR_PALETTE` export and the `renderSymbol` method; keep `colorNames`. Confirm no importer remains:

Run: `grep -rn "COLOR_PALETTE" src`
Expected: no matches.

- [ ] **Step 6: Run everything**

Run: `pnpm exec vitest run src/game/Cell/Cell.test.tsx src/game/NumberPad/NumberPad.test.tsx src/variants/color.test.ts && pnpm build && pnpm lint`
Expected: PASS. The NumberPad `should use descriptive aria-labels…` test still passes because the label comes from `describeSymbol`. Then `pnpm dev`: confirm color board chips and color keypad swatches show the nine colors in both themes.

- [ ] **Step 7: Commit**

```bash
git add src/app/theme.css src/game/Cell src/game/NumberPad src/variants/color.ts src/variants/color.test.ts
git commit -m "refactor: source color palette from theme.css via data-color"
```

---

### Task 7: Unify gallery preview canvas colors

Replace each preview's hardcoded `isLight` overlap hex table with `readThemeColor` reads of the shared tokens, resolving the cross-preview inconsistency.

**Files:**

- Modify: `src/gallery/previews/SamuraiPreview.tsx`, `Gattai3Preview.tsx`, `SoheiPreview.tsx`, `TwodokuPreview.tsx`, `TripledokuPreview.tsx`, `KazagurumaPreview.tsx`, `CrossPreview.tsx`, `ButterflyPreview.tsx`, `FlowerPreview.tsx`
- Create: `src/gallery/previews/previewColors.test.ts`

- [ ] **Step 1: Confirm the preview overlap usages**

Run: `grep -rnE "fillOverlap|#1f1f3a|#252538|#222248" src/gallery/previews`
Expected: the per-preview hex tables. Note the inconsistency: `#1f1f3a` (samurai family) vs `#222248` (flower) for 2-grid overlap. The tokens (`--cell-overlap-2-bg = #222248`, etc.) become the single resolved value for all previews.

- [ ] **Step 2: Replace each preview's overlap color source**

In each preview, replace the local `const fillOverlapN = isLight ? '#…' : '#…'` lines with reads of the shared bridge:

```tsx
import { readThemeColor } from '@/app/readThemeColor';
// …
const fillOverlap2 = readThemeColor('--cell-overlap-2-bg');
const fillOverlap3 = readThemeColor('--cell-overlap-3-bg');
const fillOverlap4 = readThemeColor('--cell-overlap-4-bg');
const fillOverlap5 = readThemeColor('--cell-overlap-5-bg');
```

Read these inside the draw routine (so a theme switch re-reads them), and keep using whichever depths each preview already references. The single-grid base fill stays as it is unless it is also a duplicated literal worth tokenizing; if so, add a `--cell-single-bg` token and read it too.

- [ ] **Step 3: Write the source-pin test**

```ts
// src/gallery/previews/previewColors.test.ts
import { describe, expect, it } from 'vitest';
import { readThemeTokens } from '@/game/testing/themeTokens';

describe('preview overlap tokens', () => {
  it('should define one consistent overlap scale for all previews', () => {
    const tokens = readThemeTokens();
    expect(tokens['--cell-overlap-2-bg']).toEqual({ dark: '#222248', light: '#eeeef8' });
    expect(tokens['--cell-overlap-5-bg']).toEqual({ dark: '#313163', light: '#dfdff2' });
  });
});
```

Note: jsdom cannot paint a canvas, so this verifies the single source and the resolved values; the manual visual check in Step 4 confirms the previews still look right. This is the documented canvas limitation.

- [ ] **Step 4: Verify**

Run: `pnpm exec vitest run src/gallery/previews/previewColors.test.ts && pnpm build && pnpm lint`. Then `pnpm dev`, open the gallery, and confirm every overlapping-grid preview (samurai, butterfly, cross, flower, gattai-3, sohei, twodoku, tripledoku, kazaguruma) renders its overlap shading in both themes, now visually consistent.

- [ ] **Step 5: Commit**

```bash
git add src/gallery/previews
git commit -m "refactor: source gallery preview overlap colors from theme.css"
```

---

### Task 8: Per-variant color spec table and wiring tests

**Files:**

- Create: `src/game/testing/colorSpecs.ts`
- Create: `src/game/testing/colorSpecs.test.tsx`

**Interfaces:**

- Produces: `colorSpecs: ColorSpec[]` where
  `ColorSpec = { variantImport: string; variant: Variant; cell: CellId; marker: string; token: string; kind: 'positional' | 'value-derived' }`.

Positional markers wired in `Board.tsx`: `data-diagonal`, `data-window`, `data-asterisk`, `data-center-dot`, `data-girandola`. Value-derived: `data-even`/`data-odd` (need the fixture's `parityMap`). The color chip uses `data-color` (carries the value, asserted separately).

- [ ] **Step 1: Write the failing parameterized test**

```tsx
// src/game/testing/colorSpecs.test.tsx
import { describe, expect, it } from 'vitest';
import { readThemeTokens } from './themeTokens';
import { renderVariantBoard } from './renderVariantBoard';
import { makeFixture } from './makeFixture';
import { colorSpecs } from './colorSpecs';

describe('per-variant color specs', () => {
  it.each(colorSpecs)('should mark $cell on $variantImport with $marker', (spec) => {
    const fixture = spec.kind === 'value-derived' ? makeFixture(spec.variant) : undefined;
    const { getCell } = renderVariantBoard(spec.variant, fixture ? { fixture } : {});
    expect(getCell(spec.cell)).toHaveAttribute(spec.marker, 'true');
  });

  it.each(colorSpecs)('should define $token for $variantImport', (spec) => {
    expect(readThemeTokens()[spec.token]).toBeDefined();
  });
});
```

Note: a value-derived row's asserted `cell` must be one the fixed seed actually marks. Pick the cell by reading the fixture's `parityMap`/structure for that seed (a quick scratch assertion), then hardcode the confirmed id. If a seed yields an awkward layout, choose a different fixed seed for that variant and record it in the spec row.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm exec vitest run src/game/testing/colorSpecs.test.tsx`
Expected: FAIL ("Failed to resolve import './colorSpecs'").

- [ ] **Step 3: Implement the table (positional first)**

```ts
// src/game/testing/colorSpecs.ts
import type { CellId, Variant } from '@/engine/types';
import { sudokuX } from '@/variants/sudoku-x';
import { windoku } from '@/variants/windoku';
import { asterisk } from '@/variants/asterisk';
import { centerDot } from '@/variants/centerDot';
import { girandola } from '@/variants/girandola';

export interface ColorSpec {
  variantImport: string;
  variant: Variant;
  cell: CellId;
  marker: string;
  token: string;
  kind: 'positional' | 'value-derived';
}

export const colorSpecs: ColorSpec[] = [
  {
    variantImport: 'sudoku-x',
    variant: sudokuX,
    cell: 'r0c0',
    marker: 'data-diagonal',
    token: '--cell-diagonal-bg',
    kind: 'positional',
  },
  {
    variantImport: 'windoku',
    variant: windoku,
    cell: 'r1c1',
    marker: 'data-window',
    token: '--cell-window-bg',
    kind: 'positional',
  },
  {
    variantImport: 'asterisk',
    variant: asterisk,
    cell: 'r4c4',
    marker: 'data-asterisk',
    token: '--cell-special-bg',
    kind: 'positional',
  },
  {
    variantImport: 'center-dot',
    variant: centerDot,
    cell: 'r1c1',
    marker: 'data-center-dot',
    token: '--cell-special-bg',
    kind: 'positional',
  },
  {
    variantImport: 'girandola',
    variant: girandola,
    cell: 'r0c0',
    marker: 'data-girandola',
    token: '--cell-special-bg',
    kind: 'positional',
  },
];
```

Confirm each variant's exported name and a marked cell id before committing (`grep -n "export const" …` and read `ASTERISK_CELLS`, `CENTER_DOT_CELLS`, `GIRANDOLA_CELLS`, `WINDOKU_WINDOWS`, `MAIN_DIAGONAL_CELLS`).

- [ ] **Step 4: Run to verify it passes, then commit**

Run: `pnpm exec vitest run src/game/testing/colorSpecs.test.tsx` (PASS).

```bash
git add src/game/testing/colorSpecs.ts src/game/testing/colorSpecs.test.tsx
git commit -m "test: add per-variant positional color spec wiring tests"
```

- [ ] **Step 5: Add the even-odd value-derived rows**

Read `src/variants/evenOdd.ts` to confirm the `parityMap` value convention (`0` even, `1` odd). With a fixed seed, find one even and one odd cell from `makeFixture(evenOdd, SEED).parityMap` and add two rows:

```ts
{ variantImport: 'even-odd', variant: evenOdd, cell: '<even cell>', marker: 'data-even', token: '--cell-even-bg', kind: 'value-derived' },
{ variantImport: 'even-odd', variant: evenOdd, cell: '<odd cell>', marker: 'data-odd', token: '--cell-odd-bg', kind: 'value-derived' },
```

Run the suite (PASS) and commit:

```bash
git add src/game/testing/colorSpecs.ts
git commit -m "test: cover even-odd parity color markers"
```

- [ ] **Step 6: Record uncovered variants**

Add a comment block at the bottom of `colorSpecs.ts` listing variants whose color is overlay/canvas-only (killer cages, argyle, kropki, greater-than, arrows, chains, the multigrid previews) and where each is instead covered (overlay token tests in Task 5, preview token tests in Task 7). Decide the `chain.color` question (tokenize vs JS-pin) and note it here and in the docs. This keeps coverage explicit rather than silently partial.

---

### Task 9: Generate the color documentation

**Files:**

- Create: `scripts/generateColorDocs.ts`
- Create: `docs/colors.md`
- Create: `docs/colors.test.ts`

**Interfaces:**

- Produces: `buildColorDocs(): string`.

- [ ] **Step 1: Write the failing drift test**

```ts
// docs/colors.test.ts
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildColorDocs } from '../scripts/generateColorDocs';

const DOC_PATH = fileURLToPath(new URL('./colors.md', import.meta.url));

describe('color documentation', () => {
  it('should match the generated output', () => {
    expect(readFileSync(DOC_PATH, 'utf8')).toBe(buildColorDocs());
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm exec vitest run docs/colors.test.ts`
Expected: FAIL ("Failed to resolve import '../scripts/generateColorDocs'").

- [ ] **Step 3: Implement the generator**

```ts
// scripts/generateColorDocs.ts
import { readThemeTokens } from '@/game/testing/themeTokens';
import { colorSpecs } from '@/game/testing/colorSpecs';

export function buildColorDocs(): string {
  const tokens = readThemeTokens();
  const tokenRows = Object.entries(tokens)
    .map(([name, value]) => `| \`${name}\` | ${value.dark} | ${value.light} |`)
    .join('\n');
  const specRows = colorSpecs
    .map(
      (spec) => `| ${spec.variantImport} | \`${spec.marker}\` | \`${spec.token}\` | ${spec.kind} |`
    )
    .join('\n');

  return [
    '# Board Colors',
    '',
    '_Generated from `src/app/theme.css` and `src/game/testing/colorSpecs.ts`. Run `pnpm exec tsx scripts/generateColorDocs.ts` to regenerate._',
    '',
    '## Tokens',
    '',
    '| Token | Dark | Light |',
    '| --- | --- | --- |',
    tokenRows,
    '',
    '## Per-variant color markers',
    '',
    '| Variant | Marker | Token | Kind |',
    '| --- | --- | --- | --- |',
    specRows,
    '',
  ].join('\n');
}
```

Confirm `tsx` is available (`pnpm exec tsx --version`); otherwise run the generator with `vite-node`, or add a `pnpm` script. Confirm the `@/` alias resolves for files under `scripts/`; if not, use relative imports.

- [ ] **Step 4: Generate, commit the doc, verify the drift test**

Run: `pnpm exec tsx scripts/generateColorDocs.ts > docs/colors.md` then `pnpm exec vitest run docs/colors.test.ts` (PASS).

- [ ] **Step 5: Final full verification**

Run: `pnpm build && pnpm test && pnpm lint`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add scripts/generateColorDocs.ts docs/colors.md docs/colors.test.ts
git commit -m "docs: generate board color reference from tokens"
```

---

## Self-Review

**Spec coverage:** single-source `theme.css` (Tasks 4-7), DOM via `var()` (Tasks 4-6), canvas via `readThemeColor` (Tasks 2, 7), fixture for value-derived variants (Task 1), reader (Task 2), positional + value-derived wiring tests (Tasks 1, 8), value-pin + integrity (Tasks 4-6), dead overlap removal (Task 3), gallery preview unification (Task 7), full option B with NumberPad (Task 6), docs generation (Task 9). Sequencing matches the spec.

**Placeholder scan:** the `<even cell>`/`<odd cell>` and the chain-color decision in Task 8 are deliberate "confirm against the fixed seed / make and record a decision" steps, each with the exact procedure to resolve them, not deferred work.

**Type consistency:** `Fixture`, `RenderVariantBoardOptions`, `ColorSpec`, `TokenValue`, and `buildColorDocs` are used consistently across Tasks 1, 2, 8, and 9. `renderVariantBoard` accepts an optional `fixture`, which Task 8 supplies for value-derived rows.
