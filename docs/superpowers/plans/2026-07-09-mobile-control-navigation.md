# Mobile D-pad + Move/Map Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

Revised 2026-07-14 against `feat/mobile-navigation` @ `bbdd5fd`. The original 2026-07-09 plan's Tasks 2, 4 (structure unification), and 5 (CSS inversion) shipped in PRs #92–#94 — this revision keeps only the outstanding work. See the companion spec (`docs/superpowers/specs/2026-07-09-mobile-control-navigation-design.md`) for what already exists and what is superseded.

**Goal:** Add an on-screen D-pad that moves the selected cell, and split the mobile map column into a Move / Map tab group (D-pad default; minimap + zoom behind Map).

**Architecture:** Cell selection lives in `useSudokuGrid` local state; a new `moveSelection(direction)` exposes the existing arrow-key path (extracted as `stepCellId`) for the D-pad. `GamePage`'s mobile branch already renders `.mapGroup` with minimap + zoom; it becomes a second `Tabs` group with local `navTab` state. Nothing changes in `boardViewport`, `NumberPad`, or the desktop (`isDesktop`, ≥1024px) branch. Viewport auto-follow is free: `onCellNavigate` already calls `ensureCellVisible` when `panZoomActive`.

**Tech Stack:** React + TypeScript, Vite, Vitest + `@testing-library/react` + `userEvent`, CSS Modules.

## Global Constraints

- Package manager: `pnpm`. Verify gate: `pnpm build && pnpm test && pnpm lint` must all pass. `pnpm build` typechecks `*.test.ts(x)` too.
- Named exports only; no default exports. File naming after the export; `index.ts` only for barrels.
- CSS Modules only; no inline styles; no `!important`. Logical properties only. Colors from theme CSS custom properties. Media queries: mobile-first `min-width` only, breakpoints per `docs/breakpoints.md`.
- Imports use the `@/` alias for `src`.
- Tests: `should`-style names; query by role/accessible name; drive interactions with `userEvent`; never `container.querySelector`; assert focus with `toHaveFocus()`.
- Commit style: conventional commits `<type>: <description>`; no `Co-Authored-By: Claude` trailer.

**jsdom note (replaces the original plan's matchMedia guidance):** `src/test/setup.ts` already polyfills `window.matchMedia` to evaluate `min-width` queries against `window.innerWidth`. jsdom defaults to 1024px, so tests render the **desktop** branch by default; set `window.innerWidth = 500` before rendering to get the mobile branch (existing `GamePage.test.tsx` tests do exactly this, and an `afterEach` resets it). Do not stub `matchMedia`.

---

## File Structure

- `src/game/gameTypes.ts` — **Modify**: add exported `Direction` type; add `moveSelection` to the `GridInteraction` interface.
- `src/game/useSudokuGrid.ts` — **Modify**: add module-level `stepCellId`; refactor the arrow cases in `handleKey` to use it; add and return `moveSelection`.
- `src/game/useSudokuGrid.test.ts` — **Modify** (it EXISTS, ~740 lines; the original plan predates it): append a `moveSelection` describe block.
- `src/game/testing/renderPlay.tsx` — **Modify**: expose `moveSelection` from the internal `usePlay` return.
- `src/game/DPad/DPad.tsx`, `DPad.module.css`, `DPad.test.tsx`, `index.ts` — **Create**.
- `src/game/GamePage.tsx` — **Modify**: `navTab` state; render `.mapGroup` as a Move/Map `Tabs` group in the mobile branch.
- `src/game/GamePage.test.tsx` — **Modify**: new mobile assertions; update the existing minimap-visibility test (minimap moves behind the Map tab).
- `src/game/GamePage.module.css` — **Modify**: map-column width and reserved heights for the new tallest panel.

---

## Task 1: `moveSelection` in the grid hook

**Files:**

- Modify: `src/game/gameTypes.ts` (`GridInteraction` at ~line 58)
- Modify: `src/game/useSudokuGrid.ts` (arrow cases ~236–248; `firstCellId` ~366; return ~396–401)
- Modify: `src/game/testing/renderPlay.tsx` (`usePlay` return, line 41)
- Modify: `src/game/useSudokuGrid.test.ts` (append)

**Interfaces:**

- Produces: `type Direction = 'up' | 'down' | 'left' | 'right'` in `@/game/gameTypes`; `GridInteraction` gains `moveSelection(direction: Direction): void` (the hook's return is typed `GridInteraction`, so the interface change is required, not optional — the original plan missed this).
- Consumes: existing `selectCell`, `cellsById`, `selectedId`, `firstCellId`, `onCellNavigate` (all in scope in the hook).

- [ ] **Step 1: Add the `Direction` type and extend `GridInteraction`**

In `src/game/gameTypes.ts`, near the other type aliases:

```ts
export type Direction = 'up' | 'down' | 'left' | 'right';
```

and in `GridInteraction`:

```ts
moveSelection(direction: Direction): void;
```

- [ ] **Step 2: Write the failing tests**

Append to the existing `src/game/useSudokuGrid.test.ts` (reuse its existing render helpers where practical; the file already has hook-level and rendered-board helpers). If working through `renderPlay` instead, note its `usePlay` does not yet expose `moveSelection` (threaded in Step 5):

```ts
describe('useSudokuGrid moveSelection', () => {
  it('should select the first cell on the first move when nothing is selected', () => {
    // moveSelection('down') with no selection -> r0c0 selected
  });

  it('should move the selection one cell in the given direction', () => {
    // down, down, right -> r1c1 selected
  });

  it('should not move past the edge of the board', () => {
    // up from r0c0 -> stays r0c0
  });
});
```

- [ ] **Step 3: Run to verify failure** — `pnpm exec vitest run src/game/useSudokuGrid.test.ts`; expect `moveSelection is not a function` (only the new tests fail; the ~40 existing tests must still pass).

- [ ] **Step 4: Implement**

In `src/game/useSudokuGrid.ts`, add a module-level helper (type the return as `CellId`, matching how `handleKey` builds ids today):

```ts
function stepCellId(cell: { row: number; col: number }, direction: Direction): CellId {
  switch (direction) {
    case 'up':
      return `r${cell.row - 1}c${cell.col}`;
    case 'down':
      return `r${cell.row + 1}c${cell.col}`;
    case 'left':
      return `r${cell.row}c${cell.col - 1}`;
    case 'right':
      return `r${cell.row}c${cell.col + 1}`;
  }
}
```

Refactor the four `Arrow*` cases in `handleKey` to `nextId = stepCellId(cell, 'up')` etc. (Home/End/Escape unchanged.)

After `const firstCellId = cells[0]?.id ?? null;` add:

```ts
const moveSelection = useCallback(
  (direction: Direction) => {
    if (!selectedId) {
      if (firstCellId) {
        selectCell(firstCellId);
        document
          .querySelector<HTMLElement>(`[data-cell="${firstCellId}"]`)
          ?.focus({ preventScroll: true });
        onCellNavigate?.(firstCellId);
      }
      return;
    }
    const cell = cellsById.get(selectedId);
    if (!cell) {
      return;
    }
    const nextId = stepCellId(cell, direction);
    if (!cellsById.has(nextId)) {
      return;
    }
    selectCell(nextId);
    document.querySelector<HTMLElement>(`[data-cell="${nextId}"]`)?.focus({ preventScroll: true });
    onCellNavigate?.(nextId);
  },
  [selectedId, firstCellId, cellsById, selectCell, onCellNavigate]
);
```

(`handleKey` scopes its focus query to the enclosing `[role="grid"]` via the event target; `moveSelection` runs outside grid events, and there is a single board per page, so `document.querySelector` is the equivalent. Focusing the cell triggers its `onFocus`, which no-ops because the id is already selected.)

Add `moveSelection` to the hook's return object.

- [ ] **Step 5: Thread through `renderPlay`** — in `src/game/testing/renderPlay.tsx` line 41, return `moveSelection: grid.moveSelection` alongside `cellState`.

- [ ] **Step 6: Run to verify pass** — `pnpm exec vitest run src/game/useSudokuGrid.test.ts`.

- [ ] **Step 7: Commit**

```bash
git add src/game/gameTypes.ts src/game/useSudokuGrid.ts src/game/testing/renderPlay.tsx src/game/useSudokuGrid.test.ts
git commit -m "feat: expose moveSelection from the grid hook for on-screen navigation"
```

---

## Task 2: `DPad` component

**Files:**

- Create: `src/game/DPad/DPad.tsx`, `DPad.module.css`, `index.ts`
- Test: `src/game/DPad/DPad.test.tsx`

**Interfaces:**

- Consumes: `Direction` from `@/game/gameTypes`.
- Produces: `DPad` with props `{ onMove: (direction: Direction) => void }`.

- [ ] **Step 1: Write the failing test** — `DPad.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DPad } from './DPad';

describe('DPad', () => {
  it('should expose an accessible button for each direction', () => {
    render(<DPad onMove={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Move up' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move down' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move left' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move right' })).toBeInTheDocument();
  });

  it('should call onMove with the direction when a button is pressed', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(<DPad onMove={onMove} />);

    await user.click(screen.getByRole('button', { name: 'Move up' }));
    await user.click(screen.getByRole('button', { name: 'Move right' }));

    expect(onMove).toHaveBeenNthCalledWith(1, 'up');
    expect(onMove).toHaveBeenNthCalledWith(2, 'right');
  });
});
```

- [ ] **Step 2: Run to verify failure** — cannot resolve `./DPad`.

- [ ] **Step 3: Component** — `DPad.tsx`:

```tsx
import type { Direction } from '@/game/gameTypes';
import styles from './DPad.module.css';

interface DPadProps {
  onMove: (direction: Direction) => void;
}

const BUTTONS: { direction: Direction; label: string; glyph: string; className: string }[] = [
  { direction: 'up', label: 'Move up', glyph: '↑', className: styles.up },
  { direction: 'left', label: 'Move left', glyph: '←', className: styles.left },
  { direction: 'right', label: 'Move right', glyph: '→', className: styles.right },
  { direction: 'down', label: 'Move down', glyph: '↓', className: styles.down },
];

export function DPad({ onMove }: DPadProps) {
  return (
    <div className={styles.dpad} role="group" aria-label="Move selected cell">
      {BUTTONS.map(({ direction, label, glyph, className }) => (
        <button
          key={direction}
          type="button"
          className={`${styles.key} ${className}`}
          aria-label={label}
          onClick={() => onMove(direction)}
        >
          <span aria-hidden="true">{glyph}</span>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Styles** — `DPad.module.css` (3×3 cross; 44px keys, 2px gap = 136px total width — see Task 4's width risk):

```css
.dpad {
  display: grid;
  grid-template-columns: repeat(3, 44px);
  grid-template-rows: repeat(3, 44px);
  gap: 2px;
  justify-content: center;
}

.key {
  display: flex;
  align-items: center;
  justify-content: center;
  min-inline-size: 44px;
  min-block-size: 44px;
  font-size: 1.1rem;
  color: var(--text-bright);
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
}

.key:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

.up {
  grid-column: 2;
  grid-row: 1;
}

.left {
  grid-column: 1;
  grid-row: 2;
}

.right {
  grid-column: 3;
  grid-row: 2;
}

.down {
  grid-column: 2;
  grid-row: 3;
}
```

Tokens re-verified 2026-07-14: `--border` / `--bg-surface` / `--text-bright` match `ZoomControls.module.css` (the D-pad's sibling in the map column) and `--focus-ring` matches `Toolbar.module.css`. ZoomControls buttons have no hover style, so the D-pad has none either. Do not introduce new color values or tokens.

- [ ] **Step 5: Barrel** — `index.ts`: `export { DPad } from './DPad';`

- [ ] **Step 6: Run to verify pass**, then commit:

```bash
git add src/game/DPad
git commit -m "feat: add DPad component for on-screen cell navigation"
```

---

## Task 3: GamePage — Move/Map tab group in the map column

**Files:**

- Modify: `src/game/GamePage.tsx` (state near `controlsOpen` ~line 64; tab consts near `controlTabs` ~466; mobile `.mapGroup` render ~660–663)
- Test: `src/game/GamePage.test.tsx`

**Interfaces:**

- Consumes: `grid.moveSelection` (Task 1), `DPad` (Task 2), existing `Tabs`/`Tab` from `./Tabs`, existing `minimap` and `zoomControls` consts.
- Produces: mobile map column = `Tabs` group (`Move` default / `Map`) with the D-pad in the Move panel and minimap + zoom in the Map panel. Desktop branch, `panZoomActive`, `minimap`/`zoomControls` consts, and the input tab group are untouched.

- [ ] **Step 1: Write the failing tests**

In `src/game/GamePage.test.tsx` (helper `renderGamePage(variantId = 'classic')` at line 30; mobile = set `window.innerWidth = 500` before rendering, per the file's existing pattern):

```tsx
it('should render the Move and Map navigation tabs with the D-pad below tablet width', () => {
  window.innerWidth = 500;
  renderGamePage();

  expect(screen.getByRole('tab', { name: 'Move' })).toBeTruthy();
  expect(screen.getByRole('tab', { name: 'Map' })).toBeTruthy();
  expect(screen.getByRole('group', { name: 'Move selected cell' })).toBeTruthy();
});

it('should reveal the minimap and zoom controls when the Map tab is selected', async () => {
  const user = userEvent.setup();
  window.innerWidth = 500;
  renderGamePage();

  await user.click(screen.getByRole('tab', { name: 'Map' }));

  expect(screen.getByRole('img', { name: /board overview/i })).toBeTruthy();
  expect(screen.getByRole('button', { name: /fit whole board/i })).toBeTruthy();
});

it('should not render the navigation tabs at desktop width', () => {
  renderGamePage();

  expect(screen.queryByRole('tab', { name: 'Move' })).toBeNull();
  expect(screen.queryByRole('tab', { name: 'Map' })).toBeNull();
});
```

**Also update the existing test** "should render the minimap, zoom controls, and Controls tab below tablet width" (~line 83): the minimap and Fit button now sit in the hidden Map panel, so it must `await user.click(screen.getByRole('tab', { name: 'Map' }))` before those two assertions (convert to async; keep the Controls-tab assertion as is — it needs no tab switch). Do not weaken or delete its assertions.

- [ ] **Step 2: Run to verify failure** — `pnpm exec vitest run src/game/GamePage.test.tsx`.

- [ ] **Step 3: Implement**

In `src/game/GamePage.tsx`:

1. Import: `import { DPad } from '@/game/DPad';`
2. State near `controlsOpen`: `const [navTab, setNavTab] = useState<'move' | 'map'>('move');`
3. Tab defs near `controlTabs`:

```ts
const navTabs: Tab[] = [
  { id: 'move', label: 'Move', panelId: 'nav-panel-move' },
  { id: 'map', label: 'Map', panelId: 'nav-panel-map' },
];
```

4. Replace the mobile map column contents (currently `{minimap}{zoomControls}` inside `<div className={styles.mapGroup}>`):

```tsx
<div className={styles.mapGroup}>
  <Tabs
    tabs={navTabs}
    activeId={navTab}
    onSelect={(id) => setNavTab(id as 'move' | 'map')}
    ariaLabel="Board navigation"
  />
  <div
    role="tabpanel"
    id="nav-panel-move"
    aria-labelledby="move-tab"
    className={styles.panel}
    hidden={navTab !== 'move'}
  >
    <DPad onMove={grid.moveSelection} />
  </div>
  <div
    role="tabpanel"
    id="nav-panel-map"
    aria-labelledby="map-tab"
    className={styles.panel}
    hidden={navTab !== 'map'}
  >
    {minimap}
    {zoomControls}
  </div>
</div>
```

(`Tabs` generates tab button ids as `${id}-tab`, so `aria-labelledby="move-tab"` / `"map-tab"` are correct. The `minimap` / `zoomControls` consts and their gating stay exactly as they are.)

- [ ] **Step 4: Run to verify pass** — `pnpm exec vitest run src/game/GamePage.test.tsx`; investigate any other failure rather than papering over it.

- [ ] **Step 5: Typecheck** — `pnpm typecheck`.

- [ ] **Step 6: Commit**

```bash
git add src/game/GamePage.tsx src/game/GamePage.test.tsx
git commit -m "feat: add Move/Map navigation tabs with D-pad to the mobile controls"
```

---

## Task 4: CSS — map-column width and stable heights

**Files:**

- Modify: `src/game/GamePage.module.css` (`.controlsRow` ~148, `.mapGroup` ~171)

**Interfaces:** purely presentational.

**The width problem (verify on device):** `.mapGroup` is `flex: 1 1 0` with `min-inline-size: 88px` / `max-inline-size: 200px`; at 320–375px viewports it resolves to roughly 99–117px, but the D-pad needs 136px (3×44px + 2×2px gaps). Preferred fix: raise `.mapGroup { min-inline-size: 136px; }` and let the numpad grid absorb the loss — its buttons are designed to flex below their 44px cap under width pressure (see the comment in `NumberPad.module.css`). Verify the numpad remains usable at 320px; if it is unacceptably cramped, fall back to the spec's alternatives (tighter D-pad, then smaller keys — WCAG 2.5.8 AA floor is 24px).

- [ ] **Step 1: Widen the map column** — set `min-inline-size` on `.mapGroup` to fit the D-pad (see above). Update the `.controlsRow` comment block to describe the new two-tab-group layout.

- [ ] **Step 2: Reserve stable heights** — the Move panel (tab row ~30px + 10px gap + 136px D-pad ≈ 176px) becomes the row's tallest content, exceeding the current `.controlsRow { min-block-size: 134px }` floor. Raise that floor to the new tallest column and add a `min-block-size` to `.mapGroup` sized to its taller panel, so Move ↔ Map switches (and Normal ↔ Controls) never change the row height or move the board. Both values are hand-tuned constants; update the derivation comments next to them.

- [ ] **Step 3: Manual verification (jsdom cannot assert layout)** — `pnpm dev`, phone viewport (~375px, then 320px):

1. Classic 9×9 and samurai show identical control structure: input tabs (Normal/Candidate/Controls) + nav tabs (Move/Map), same height.
2. Switching Normal ↔ Controls and Move ↔ Map moves nothing (min-heights hold), including Map on a non-overflowing board.
3. D-pad moves the selection; zoomed/oversized boards pan to follow (auto-follow only engages when `panZoomActive` — a fitting board at natural size doesn't need it).
4. Numpad stays usable at 320px with the widened map column.
5. Zoom-in on a 9×9 past fit → the board pans; the Map tab's minimap indicator tracks the visible slice; Fit resets.
6. At ≥1024px the desktop layout is unchanged, with no D-pad or nav tabs.

- [ ] **Step 4: Commit**

```bash
git add src/game/GamePage.module.css
git commit -m "feat: size the mobile map column for the D-pad and reserve stable control heights"
```

---

## Task 5: Full verification

- [ ] **Step 1: Full gate** — `pnpm build && pnpm test && pnpm lint`.

- [ ] **Step 2: Manual mobile pass** — re-run the Task 4 Step 3 checklist on at least: `classic` (fitting 9×9), `samurai` (multigrid oversized), `super` (16×16), and `six-by-six` — those are registry ids (file names `super16.ts` / `sixBySix.ts` differ).

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: address verification findings for mobile D-pad navigation"
```

---

## Dropped from the original plan (already shipped or obsolete)

Verified against `bbdd5fd`:

1. **Task 2 (zoom floor)** — `fitWholeScale` / `clampScale` in `boardViewport.ts` already floor fitting boards at natural size, with tests.
2. **Task 4's structure unification** — the single mobile control structure (Controls tab in every variant, New Game in its panel, desktop-only bottom button, `panZoomActive` viewport gating, `onCellNavigate` wiring) shipped in PR #92. The breakpoint is `isDesktop` (1024px), not the planned 768px `isWide`; the tab is named "Controls", not "Tools".
3. **Task 4 Step 8 (3-column mobile numpad)** — obsolete; PR #94 rebuilt the NumberPad as a flexing grid.
4. **Task 5 (CSS query inversion)** — `GamePage.module.css` is already mobile-first `min-width`-only.
5. **matchMedia stubbing in tests** — `src/test/setup.ts` polyfills `matchMedia` from `window.innerWidth`; tests set `window.innerWidth` instead (existing pattern in `GamePage.test.tsx`).
6. **`ControlTabs`** — the component is now `src/game/Tabs/` (`Tabs`, `Tab`).
7. **Overflow-gated minimap (`overflowing`)** — superseded by the Map tab; see the revised spec.
8. **`useSudokuGrid.test.ts` creation** — the file now exists with ~40 tests; Task 1 appends to it.
