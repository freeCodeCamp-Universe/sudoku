# Large-Board Navigation (Pan / Zoom / Minimap) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make oversized boards (Samurai 21×21, Super 16×16, Gattai3 15×13, Tripledoku 12×9) usable on small screens by rendering cells at an accessible comfortable size and letting the user pan, zoom, and orient via a docked minimap, without breaking tap or keyboard interaction.

**Architecture:** Add a dedicated, ephemeral viewport state layer (`scale`, `translateX`, `translateY`) held in a `useBoardViewport` hook inside `GameInner` — **not** in the game reducer, which snapshots undo history and resets on New Game. Oversized boards render their DOM at a fixed comfortable cell size; a clipping viewport wraps the existing `gridCanvas` and applies a single CSS `transform: translate() scale()`. Because overlays render inside `.grid`, transforming a wrapper scales the whole subtree with no coordinate re-mapping. All navigation math lives in a pure, fully-tested `boardViewport.ts` module; gesture/keyboard handlers are thin wrappers over it. Classic 9×9 and any board that fits its container are unaffected — navigation is inert/hidden.

**Tech Stack:** React (hooks + pure modules), CSS Modules (logical properties, `touch-action`), Vitest + `@testing-library/react` (`renderHook`, `userEvent`), jsdom.

## Global Constraints

- **File naming:** name files after their export (`BoardViewport.tsx`, `Minimap.module.css`, `Minimap.test.tsx`). `index.ts(x)` is barrel-only — never logic, never `index.test.tsx`.
- **Exports:** named exports only; no default exports.
- **Styling:** CSS Modules only (`*.module.css`); no inline styles except dynamic geometry that cannot be a class (transform string, measured px); no `!important`. Logical properties only (`inset-inline-start`, `padding-block`, `text-align: start`, …). Colors from theme CSS custom properties. Mobile-first `min-width` queries; allowed breakpoints `768 / 1024 / 1440 / 2560` (320px is the implicit baseline).
- **Accessibility:** cells at the comfortable zoom clear **WCAG 2.5.8 AA (24px minimum)**; the number pad keeps its 44px+ targets. Zoom controls and the minimap carry accessible names. Keyboard navigation must keep the focused cell in view.
- **Imports:** use the `@/` alias for `src`.
- **Tests:** `should`-style names; query by role/label (never `container.querySelector`); drive interactions with `userEvent`; assert focus with `toHaveFocus()`. Gesture sequences (multi-pointer pinch) are not reliably drivable in jsdom — cover the pure math and state directly and keep gesture handlers thin over tested functions.
- **Scope guard:** every change is gated on a board being **oversized** (rendered board exceeds its viewport container). Classic 9×9 and boards that fit render exactly as today.
- **Verify before finishing each task:** `pnpm build && pnpm test && pnpm lint` must pass (`tsc --noEmit` covers test files).

## Relationship to the 9×9 fit plan

This plan and `2026-06-23-mobile-9x9-fit.md` both touch `src/game/useResponsiveCellSize.ts` but in **disjoint branches**: the 9×9 plan changes the classic `size === 9` path; Task 3 here changes the oversized (16×16 / multigrid) path. Apply this plan's Task 3 on top of whatever that file currently contains; do not revert the classic branch.

---

## File Structure

**Phase 1 — core navigation (independently shippable):**

- **Create:** `src/game/boardViewport.ts` — pure navigation math + constants. No React.
- **Create:** `src/game/boardViewport.test.ts` — unit tests for the math.
- **Create:** `src/game/useBoardViewport.ts` — transform state hook built on the math.
- **Create:** `src/game/useBoardViewport.test.ts`.
- **Create:** `src/game/useElementSize.ts` — measure a container via ref on mount + window resize (no `ResizeObserver`, matching the existing `useResponsiveCellSize` pattern).
- **Create:** `src/game/useElementSize.test.ts`.
- **Modify:** `src/game/useResponsiveCellSize.ts` — oversized boards render at a fixed comfortable cell size (no responsive shrink).
- **Create:** `src/game/useResponsiveCellSize.test.ts` (if not already created by the 9×9 plan; otherwise extend it).
- **Create:** `src/game/Board/BoardViewport.tsx` + `BoardViewport.module.css` + `index.ts` — clipping viewport, transform target, gesture handlers.
- **Create:** `src/game/Board/BoardViewport.test.tsx`.
- **Modify:** `src/game/gameTypes.ts` — add the `BoardViewportState` interface and extend `BoardProps` with an optional `viewport`.
- **Modify:** `src/game/Board/Board.tsx` — when `viewport` is present, wrap `gridCanvas`/`gutterLayout` in `<BoardViewport>`; otherwise render exactly as today.
- **Create:** `src/game/ZoomControls/ZoomControls.tsx` + `.module.css` + `index.ts` + `ZoomControls.test.tsx`.
- **Modify:** `src/game/useSudokuGrid.ts` — `focus({ preventScroll: true })` + optional `onCellNavigate` callback fired on arrow-key moves.
- **Modify:** `src/game/useSudokuGrid.test.ts` — cover the callback.
- **Modify:** `src/game/GamePage.tsx` + `GamePage.module.css` — wire viewport, controls, and the oversized branch.

**Phase 2 — minimap & controls reflow (builds on Phase 1):**

- **Create:** `src/game/Minimap/Minimap.tsx` + `.module.css` + `index.ts` + `Minimap.test.tsx`.
- **Modify:** `src/game/GamePage.tsx` + `GamePage.module.css` — dock the minimap, reflow the number pad to compact 3×3 for oversized 9-symbol boards.

---

## Phase 1 — Core navigation

### Task 1: Pure viewport math module

**Files:**

- Create: `src/game/boardViewport.ts`
- Test: `src/game/boardViewport.test.ts`

**Interfaces:**

- Consumes: `Size`, `Rect` from `@/game/gameTypes`.
- Produces:
  - `interface Transform { scale: number; translateX: number; translateY: number }`
  - `const COMFORTABLE_CELL_SIZE = 40`
  - `const MAX_SCALE = 2`
  - `isOversized(board: Size, viewport: Size): boolean`
  - `fitScale(board: Size, viewport: Size): number`
  - `clampScale(scale: number, board: Size, viewport: Size): number`
  - `clampTranslate(t: Transform, board: Size, viewport: Size): { translateX: number; translateY: number }`
  - `zoomAbout(t: Transform, nextScale: number, focus: { x: number; y: number }, board: Size, viewport: Size): Transform`
  - `minimapPointToTranslate(point: { x: number; y: number }, minimap: Size, board: Size, viewport: Size, scale: number): { translateX: number; translateY: number }`
  - `indicatorRect(t: Transform, board: Size, viewport: Size, minimap: Size): Rect`
  - `ensureVisibleTranslate(cell: Rect, t: Transform, board: Size, viewport: Size): { translateX: number; translateY: number }`

Coordinate model: the transform is `translate(tx, ty) scale(s)` with `transform-origin: 0 0`. A board-space point `b` shows at screen `t + b·s`. The visible board region starts at `(-tx/s, -ty/s)` and spans `(vw/s, vh/s)`.

- [ ] **Step 1: Write the failing test**

Create `src/game/boardViewport.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import {
  clampScale,
  clampTranslate,
  ensureVisibleTranslate,
  fitScale,
  indicatorRect,
  isOversized,
  minimapPointToTranslate,
  zoomAbout,
  COMFORTABLE_CELL_SIZE,
  MAX_SCALE,
} from './boardViewport';

const board = { w: 840, h: 840 }; // 21 × 40
const viewport = { w: 360, h: 360 };

describe('boardViewport', () => {
  describe('isOversized', () => {
    it('should be true when the board is wider than the viewport', () => {
      expect(isOversized(board, viewport)).toBe(true);
    });

    it('should be false when the board fits the viewport', () => {
      expect(isOversized({ w: 300, h: 300 }, viewport)).toBe(false);
    });
  });

  describe('fitScale', () => {
    it('should scale so the whole board fits the smaller axis', () => {
      expect(fitScale(board, viewport)).toBeCloseTo(360 / 840);
    });
  });

  describe('clampScale', () => {
    it('should not allow zooming out past the fit scale', () => {
      expect(clampScale(0.1, board, viewport)).toBeCloseTo(fitScale(board, viewport));
    });

    it('should cap zoom at MAX_SCALE', () => {
      expect(clampScale(99, board, viewport)).toBe(MAX_SCALE);
    });
  });

  describe('clampTranslate', () => {
    it('should keep the board edge from crossing into the viewport when oversized', () => {
      const clamped = clampTranslate({ scale: 1, translateX: 100, translateY: 0 }, board, viewport);
      // tx is clamped to [vw - bw, 0] = [-480, 0]; 100 → 0.
      expect(clamped.translateX).toBe(0);
    });

    it('should center the board on an axis where the scaled board is smaller', () => {
      const clamped = clampTranslate(
        { scale: fitScale(board, viewport), translateX: 999, translateY: 999 },
        board,
        viewport
      );
      // At fit scale the board exactly fills the smaller axis and centers on the other.
      expect(clamped.translateX).toBeCloseTo(0, 0);
    });
  });

  describe('zoomAbout', () => {
    it('should keep the focus point stationary on screen', () => {
      const focus = { x: 180, y: 180 }; // viewport center, screen space
      const before = { scale: 1, translateX: -240, translateY: -240 };
      const boardPointBefore = (focus.x - before.translateX) / before.scale;
      const after = zoomAbout(before, 2, focus, board, viewport);
      const boardPointAfter = (focus.x - after.translateX) / after.scale;
      expect(boardPointAfter).toBeCloseTo(boardPointBefore, 5);
    });
  });

  describe('minimapPointToTranslate', () => {
    it('should center the viewport on the tapped board point', () => {
      const minimap = { w: 150, h: 150 };
      const t = minimapPointToTranslate({ x: 75, y: 75 }, minimap, board, viewport, 1);
      // Tapping minimap center → board center (420,420) under viewport center (180,180).
      expect(t.translateX).toBeCloseTo(180 - 420);
      expect(t.translateY).toBeCloseTo(180 - 420);
    });
  });

  describe('indicatorRect', () => {
    it('should map the visible slice into minimap coordinates', () => {
      const minimap = { w: 150, h: 150 };
      const rect = indicatorRect(
        { scale: 1, translateX: 0, translateY: 0 },
        board,
        viewport,
        minimap
      );
      // Visible board region is 360×360 at origin; minimap scale is 150/840.
      expect(rect.x).toBeCloseTo(0);
      expect(rect.w).toBeCloseTo((360 / 840) * 150);
    });
  });

  describe('ensureVisibleTranslate', () => {
    it('should pan a cell that is off the right edge into view', () => {
      const cell = { x: 800, y: 0, w: 40, h: 40 }; // far-right cell, board space
      const t = { scale: 1, translateX: 0, translateY: 0 }; // showing left edge only
      const next = ensureVisibleTranslate(cell, t, board, viewport);
      const cellRightOnScreen = next.translateX + (cell.x + cell.w) * t.scale;
      expect(cellRightOnScreen).toBeLessThanOrEqual(viewport.w + 0.001);
    });

    it('should leave a cell already in view unchanged', () => {
      const cell = { x: 0, y: 0, w: 40, h: 40 };
      const t = { scale: 1, translateX: 0, translateY: 0 };
      const next = ensureVisibleTranslate(cell, t, board, viewport);
      expect(next.translateX).toBe(0);
      expect(next.translateY).toBe(0);
    });
  });

  it('should expose comfortable-size and max-scale constants', () => {
    expect(COMFORTABLE_CELL_SIZE).toBe(40);
    expect(MAX_SCALE).toBe(2);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run src/game/boardViewport.test.ts`
Expected: FAIL — module `./boardViewport` not found.

- [ ] **Step 3: Implement the module**

Create `src/game/boardViewport.ts`:

```typescript
import type { Rect, Size } from '@/game/gameTypes';

export interface Transform {
  scale: number;
  translateX: number;
  translateY: number;
}

export const COMFORTABLE_CELL_SIZE = 40;
export const MAX_SCALE = 2;

export function isOversized(board: Size, viewport: Size): boolean {
  return board.w > viewport.w || board.h > viewport.h;
}

export function fitScale(board: Size, viewport: Size): number {
  return Math.min(viewport.w / board.w, viewport.h / board.h);
}

export function clampScale(scale: number, board: Size, viewport: Size): number {
  const min = fitScale(board, viewport);
  return Math.min(MAX_SCALE, Math.max(min, scale));
}

// Clamp one axis: center when the scaled board is smaller than the viewport,
// otherwise keep the board from being dragged off-screen.
function clampAxis(translate: number, boardExtent: number, viewportExtent: number, scale: number) {
  const scaled = boardExtent * scale;
  if (scaled <= viewportExtent) {
    return (viewportExtent - scaled) / 2;
  }
  const min = viewportExtent - scaled;
  return Math.min(0, Math.max(min, translate));
}

export function clampTranslate(t: Transform, board: Size, viewport: Size) {
  return {
    translateX: clampAxis(t.translateX, board.w, viewport.w, t.scale),
    translateY: clampAxis(t.translateY, board.h, viewport.h, t.scale),
  };
}

export function zoomAbout(
  t: Transform,
  nextScale: number,
  focus: { x: number; y: number },
  board: Size,
  viewport: Size
): Transform {
  const scale = clampScale(nextScale, board, viewport);
  // Keep the board point under `focus` fixed: focus = translate + boardPoint * scale.
  const boardX = (focus.x - t.translateX) / t.scale;
  const boardY = (focus.y - t.translateY) / t.scale;
  const candidate: Transform = {
    scale,
    translateX: focus.x - boardX * scale,
    translateY: focus.y - boardY * scale,
  };
  return { scale, ...clampTranslate(candidate, board, viewport) };
}

export function minimapPointToTranslate(
  point: { x: number; y: number },
  minimap: Size,
  board: Size,
  viewport: Size,
  scale: number
) {
  const boardX = point.x * (board.w / minimap.w);
  const boardY = point.y * (board.h / minimap.h);
  const candidate: Transform = {
    scale,
    translateX: viewport.w / 2 - boardX * scale,
    translateY: viewport.h / 2 - boardY * scale,
  };
  return clampTranslate(candidate, board, viewport);
}

export function indicatorRect(t: Transform, board: Size, viewport: Size, minimap: Size): Rect {
  const sx = minimap.w / board.w;
  const sy = minimap.h / board.h;
  return {
    x: (-t.translateX / t.scale) * sx,
    y: (-t.translateY / t.scale) * sy,
    w: (viewport.w / t.scale) * sx,
    h: (viewport.h / t.scale) * sy,
  };
}

export function ensureVisibleTranslate(cell: Rect, t: Transform, board: Size, viewport: Size) {
  const left = t.translateX + cell.x * t.scale;
  const right = t.translateX + (cell.x + cell.w) * t.scale;
  const top = t.translateY + cell.y * t.scale;
  const bottom = t.translateY + (cell.y + cell.h) * t.scale;

  let translateX = t.translateX;
  let translateY = t.translateY;

  if (left < 0) translateX -= left;
  else if (right > viewport.w) translateX -= right - viewport.w;
  if (top < 0) translateY -= top;
  else if (bottom > viewport.h) translateY -= bottom - viewport.h;

  return clampTranslate({ ...t, translateX, translateY }, board, viewport);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec vitest run src/game/boardViewport.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add src/game/boardViewport.ts src/game/boardViewport.test.ts
git commit -m "feat: add pure board-viewport navigation math"
```

---

### Task 2: `useBoardViewport` state hook

**Files:**

- Create: `src/game/useBoardViewport.ts`
- Test: `src/game/useBoardViewport.test.ts`

**Interfaces:**

- Consumes: `Transform`, `clampScale`, `clampTranslate`, `zoomAbout`, `minimapPointToTranslate`, `ensureVisibleTranslate`, `fitScale` from `./boardViewport`; `Size`, `Rect` from `@/game/gameTypes`.
- Produces:
  ```typescript
  interface BoardViewport {
    transform: Transform;
    panBy(dx: number, dy: number): void;
    zoomBy(factor: number, focus?: { x: number; y: number }): void;
    fitWhole(): void;
    reset(): void;
    panToMinimapPoint(point: { x: number; y: number }, minimap: Size): void;
    ensureVisible(cell: Rect): void;
  }
  function useBoardViewport(board: Size, viewport: Size): BoardViewport;
  ```
- Initial transform: `{ scale: 1, translateX: 0, translateY: 0 }`, then clamped to current `board`/`viewport` (top-left origin for Samurai per spec).

- [ ] **Step 1: Write the failing test**

Create `src/game/useBoardViewport.test.ts`:

```typescript
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useBoardViewport } from './useBoardViewport';
import { fitScale } from './boardViewport';

const board = { w: 840, h: 840 };
const viewport = { w: 360, h: 360 };

describe('useBoardViewport', () => {
  it('should start at scale 1 pinned to the top-left', () => {
    const { result } = renderHook(() => useBoardViewport(board, viewport));
    expect(result.current.transform.scale).toBe(1);
    expect(result.current.transform.translateX).toBe(0);
    expect(result.current.transform.translateY).toBe(0);
  });

  it('should clamp a pan so the board cannot leave the viewport', () => {
    const { result } = renderHook(() => useBoardViewport(board, viewport));
    act(() => result.current.panBy(500, 0)); // try to drag right past the edge
    expect(result.current.transform.translateX).toBe(0);
  });

  it('should pan within bounds', () => {
    const { result } = renderHook(() => useBoardViewport(board, viewport));
    act(() => result.current.panBy(-100, 0));
    expect(result.current.transform.translateX).toBe(-100);
  });

  it('should zoom out to the fit scale on fitWhole', () => {
    const { result } = renderHook(() => useBoardViewport(board, viewport));
    act(() => result.current.fitWhole());
    expect(result.current.transform.scale).toBeCloseTo(fitScale(board, viewport));
  });

  it('should reset back to scale 1 at the origin', () => {
    const { result } = renderHook(() => useBoardViewport(board, viewport));
    act(() => result.current.fitWhole());
    act(() => result.current.reset());
    expect(result.current.transform.scale).toBe(1);
    expect(result.current.transform.translateX).toBe(0);
  });

  it('should center on a tapped minimap point', () => {
    const { result } = renderHook(() => useBoardViewport(board, viewport));
    act(() => result.current.panToMinimapPoint({ x: 75, y: 75 }, { w: 150, h: 150 }));
    expect(result.current.transform.translateX).toBeCloseTo(180 - 420);
  });

  it('should pan an off-screen cell into view', () => {
    const { result } = renderHook(() => useBoardViewport(board, viewport));
    act(() => result.current.ensureVisible({ x: 800, y: 0, w: 40, h: 40 }));
    const right = result.current.transform.translateX + 840 * result.current.transform.scale;
    expect(right).toBeGreaterThanOrEqual(viewport.w);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run src/game/useBoardViewport.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the hook**

Create `src/game/useBoardViewport.ts`:

```typescript
import { useCallback, useMemo, useState } from 'react';
import type { Rect, Size } from '@/game/gameTypes';
import {
  clampScale,
  clampTranslate,
  ensureVisibleTranslate,
  fitScale,
  minimapPointToTranslate,
  zoomAbout,
  type Transform,
} from './boardViewport';

export interface BoardViewport {
  transform: Transform;
  panBy(dx: number, dy: number): void;
  zoomBy(factor: number, focus?: { x: number; y: number }): void;
  fitWhole(): void;
  reset(): void;
  panToMinimapPoint(point: { x: number; y: number }, minimap: Size): void;
  ensureVisible(cell: Rect): void;
}

const ORIGIN: Transform = { scale: 1, translateX: 0, translateY: 0 };

export function useBoardViewport(board: Size, viewport: Size): BoardViewport {
  const [transform, setTransform] = useState<Transform>(ORIGIN);

  const panBy = useCallback(
    (dx: number, dy: number) => {
      setTransform((t) => {
        const candidate = { ...t, translateX: t.translateX + dx, translateY: t.translateY + dy };
        return { scale: t.scale, ...clampTranslate(candidate, board, viewport) };
      });
    },
    [board, viewport]
  );

  const zoomBy = useCallback(
    (factor: number, focus?: { x: number; y: number }) => {
      const center = focus ?? { x: viewport.w / 2, y: viewport.h / 2 };
      setTransform((t) => zoomAbout(t, t.scale * factor, center, board, viewport));
    },
    [board, viewport]
  );

  const fitWhole = useCallback(() => {
    setTransform((t) => {
      const scale = clampScale(fitScale(board, viewport), board, viewport);
      return { scale, ...clampTranslate({ ...t, scale }, board, viewport) };
    });
  }, [board, viewport]);

  const reset = useCallback(() => {
    setTransform({ scale: 1, ...clampTranslate(ORIGIN, board, viewport) });
  }, [board, viewport]);

  const panToMinimapPoint = useCallback(
    (point: { x: number; y: number }, minimap: Size) => {
      setTransform((t) => ({
        scale: t.scale,
        ...minimapPointToTranslate(point, minimap, board, viewport, t.scale),
      }));
    },
    [board, viewport]
  );

  const ensureVisible = useCallback(
    (cell: Rect) => {
      setTransform((t) => ({ ...t, ...ensureVisibleTranslate(cell, t, board, viewport) }));
    },
    [board, viewport]
  );

  return useMemo(
    () => ({ transform, panBy, zoomBy, fitWhole, reset, panToMinimapPoint, ensureVisible }),
    [transform, panBy, zoomBy, fitWhole, reset, panToMinimapPoint, ensureVisible]
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec vitest run src/game/useBoardViewport.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/useBoardViewport.ts src/game/useBoardViewport.test.ts
git commit -m "feat: add useBoardViewport transform-state hook"
```

---

### Task 3: Comfortable cell size for oversized boards + container measurement

**Files:**

- Modify: `src/game/useResponsiveCellSize.ts`
- Test: `src/game/useResponsiveCellSize.test.ts` (extend if the 9×9 plan already created it; else create)
- Create: `src/game/useElementSize.ts`
- Test: `src/game/useElementSize.test.ts`

**Interfaces:**

- `useResponsiveCellSize(variant: Variant): number` — signature unchanged. New behavior: oversized variants (`size === 16`, or `kind === 'multigrid'`) return a fixed `COMFORTABLE_CELL_SIZE` (40) instead of the responsive-shrink ratio. Classic 9×9 path is untouched (owned by the 9×9 plan).
- `useElementSize(ref: React.RefObject<HTMLElement | null>): Size` — reads `getBoundingClientRect()` on mount and on `window` resize; returns `{ w: 0, h: 0 }` before measurement.

- [ ] **Step 1: Write the failing test for the comfortable size**

Add to `src/game/useResponsiveCellSize.test.ts` (create the file with the standard `setWidth`/`afterEach` harness if it does not exist yet — mirror the 9×9 plan's harness):

```typescript
import { COMFORTABLE_CELL_SIZE } from './boardViewport';
import { super16 } from '@/variants/super16';
import { samurai } from '@/variants/samurai';

describe('oversized boards use a fixed comfortable cell size', () => {
  it('should render a 16×16 board at the comfortable size on mobile', () => {
    expect(cellAt(320, super16)).toBe(COMFORTABLE_CELL_SIZE);
  });

  it('should render a Samurai board at the comfortable size on mobile', () => {
    expect(cellAt(320, samurai)).toBe(COMFORTABLE_CELL_SIZE);
  });

  it('should keep the comfortable size on desktop', () => {
    expect(cellAt(1440, super16)).toBe(COMFORTABLE_CELL_SIZE);
  });
});
```

(`cellAt(width, variant)` and `setWidth` are the helpers defined in the 9×9 plan's test harness. Confirm the exact exported variant name in Step 3.)

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run src/game/useResponsiveCellSize.test.ts`
Expected: FAIL — `super16` currently returns `Math.round(30 × 38/52) = 22` at 320px, not 40.

- [ ] **Step 3: Confirm the oversized variant export names**

Run: `pnpm exec grep -rn "export const" src/variants/super16.ts src/variants/samurai.ts`
Expected: named exports for the 16×16 and 21×21 variants. If the names differ from `super16` / `samurai`, update the imports and the test accordingly.

- [ ] **Step 4: Implement the comfortable-size branch**

Edit `src/game/useResponsiveCellSize.ts`. Import the constant and short-circuit oversized variants before the ratio logic:

```typescript
import { useEffect, useState } from 'react';
import type { Variant } from '@/engine/types';
import { COMFORTABLE_CELL_SIZE } from './boardViewport';

function isOversizedVariant(variant: Variant): boolean {
  const { kind } = variant.layout;
  if (kind === 'multigrid') return true;
  if (kind === 'grid') return (variant.layout as { size: number }).size > 9;
  return false;
}
```

Then in `compute()`, before the existing `window.innerWidth` ratio branches (and after the classic-9×9 branch added by the other plan):

```typescript
function compute(): number {
  const w = window.innerWidth;
  // ... classic-9x9 branch (other plan) ...
  if (isOversizedVariant(variant)) return COMFORTABLE_CELL_SIZE;
  if (w <= 375) return Math.round(base * (38 / 52));
  if (w <= 520) return Math.round(base * (44 / 52));
  return base;
}
```

Add `variant` to the `useEffect` dependency array alongside `base` (the eslint-disable line already suppresses the exhaustive-deps warning for `compute`).

- [ ] **Step 5: Run the responsive-size test to verify it passes**

Run: `pnpm exec vitest run src/game/useResponsiveCellSize.test.ts`
Expected: PASS.

- [ ] **Step 6: Write the failing test for `useElementSize`**

Create `src/game/useElementSize.test.ts`:

```typescript
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useElementSize } from './useElementSize';

describe('useElementSize', () => {
  it('should report the element box size after mount', () => {
    const el = document.createElement('div');
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
      width: 360,
      height: 480,
      top: 0,
      left: 0,
      right: 360,
      bottom: 480,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);
    const ref = { current: el };

    const { result } = renderHook(() => useElementSize(ref));

    expect(result.current).toEqual({ w: 360, h: 480 });
  });

  it('should report zero before an element is attached', () => {
    const ref = { current: null };
    const { result } = renderHook(() => useElementSize(ref));
    expect(result.current).toEqual({ w: 0, h: 0 });
  });
});
```

- [ ] **Step 7: Run it to verify it fails**

Run: `pnpm exec vitest run src/game/useElementSize.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 8: Implement `useElementSize`**

Create `src/game/useElementSize.ts`:

```typescript
import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import type { Size } from '@/game/gameTypes';

export function useElementSize(ref: RefObject<HTMLElement | null>): Size {
  const [size, setSize] = useState<Size>({ w: 0, h: 0 });

  useEffect(() => {
    function measure() {
      const el = ref.current;
      if (!el) {
        return;
      }
      const rect = el.getBoundingClientRect();
      setSize((prev) =>
        prev.w === rect.width && prev.h === rect.height ? prev : { w: rect.width, h: rect.height }
      );
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [ref]);

  return size;
}
```

- [ ] **Step 9: Run both tests to verify they pass**

Run: `pnpm exec vitest run src/game/useElementSize.test.ts src/game/useResponsiveCellSize.test.ts`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add src/game/useResponsiveCellSize.ts src/game/useResponsiveCellSize.test.ts src/game/useElementSize.ts src/game/useElementSize.test.ts
git commit -m "feat: comfortable fixed cell size for oversized boards + element-size hook"
```

---

### Task 4: `BoardViewport` clipping container + Board integration

**Files:**

- Create: `src/game/Board/BoardViewport.tsx`, `src/game/Board/BoardViewport.module.css`, `src/game/Board/index.ts` (extend the existing barrel)
- Test: `src/game/Board/BoardViewport.test.tsx`
- Modify: `src/game/gameTypes.ts`, `src/game/Board/Board.tsx`

**Interfaces:**

- Consumes: `BoardViewport` (the hook's return type) from `@/game/useBoardViewport`; `Size` from gameTypes.
- Produces (in `gameTypes.ts`):
  ```typescript
  export interface BoardViewportState {
    transform: { scale: number; translateX: number; translateY: number };
    viewportRef: React.RefObject<HTMLDivElement | null>;
    onPointerDown(e: React.PointerEvent): void;
    onPointerMove(e: React.PointerEvent): void;
    onPointerUp(e: React.PointerEvent): void;
  }
  ```
  and `BoardProps` gains `viewport?: BoardViewportState`.
- `BoardViewport.tsx` exports `BoardViewport({ viewport, children }: { viewport: BoardViewportState; children: React.ReactNode })` — a clipping `div` (the measured viewport) holding a transformed inner `div`.

- [ ] **Step 1: Extend `gameTypes.ts`**

Add the `BoardViewportState` interface (above `BoardProps`) and `viewport?: BoardViewportState;` to `BoardProps`. No test needed for a type-only change; it is exercised by Steps 2–6.

- [ ] **Step 2: Write the failing test**

Create `src/game/Board/BoardViewport.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { BoardViewport } from './BoardViewport';

function makeViewport() {
  return {
    transform: { scale: 1.5, translateX: -20, translateY: -30 },
    viewportRef: createRef<HTMLDivElement>(),
    onPointerDown: vi.fn(),
    onPointerMove: vi.fn(),
    onPointerUp: vi.fn(),
  };
}

describe('BoardViewport', () => {
  it('should render its children inside a transformed wrapper', () => {
    render(
      <BoardViewport viewport={makeViewport()}>
        <div>board</div>
      </BoardViewport>
    );
    const child = screen.getByText('board');
    const wrapper = child.parentElement as HTMLElement;
    expect(wrapper.style.transform).toBe('translate(-20px, -30px) scale(1.5)');
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `pnpm exec vitest run src/game/Board/BoardViewport.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement `BoardViewport` and its CSS**

Create `src/game/Board/BoardViewport.module.css`:

```css
.viewport {
  position: relative;
  overflow: hidden;
  max-width: 100%;
  touch-action: none;
  overscroll-behavior: contain;
}

.content {
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  transform-origin: 0 0;
  will-change: transform;
}
```

Create `src/game/Board/BoardViewport.tsx`:

```typescript
import type { ReactNode } from 'react';
import type { BoardViewportState } from '@/game/gameTypes';
import styles from './BoardViewport.module.css';

export function BoardViewport({
  viewport,
  children,
}: {
  viewport: BoardViewportState;
  children: ReactNode;
}) {
  const { transform } = viewport;
  return (
    <div
      ref={viewport.viewportRef}
      className={styles.viewport}
      onPointerDown={viewport.onPointerDown}
      onPointerMove={viewport.onPointerMove}
      onPointerUp={viewport.onPointerUp}
      onPointerCancel={viewport.onPointerUp}
    >
      <div
        className={styles.content}
        style={{
          transform: `translate(${transform.translateX}px, ${transform.translateY}px) scale(${transform.scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
```

Add `export { BoardViewport } from './BoardViewport';` to `src/game/Board/index.ts`.

- [ ] **Step 5: Wire `Board` to use it when `viewport` is present**

In `src/game/Board/Board.tsx`, add `viewport` to the destructured props, import `BoardViewport`, and wrap the rendered grid subtree. Replace the two `return` statements so the `gridCanvas` (no-gutter case) and the `gutterLayout` (gutter case) are wrapped only when `viewport` is set:

```typescript
function wrap(node: React.ReactNode) {
  return viewport ? <BoardViewport viewport={viewport}>{node}</BoardViewport> : node;
}

if (!hasGutters || !gutters) {
  return (
    <div className={styles.boardWrap}>
      {wrap(gridCanvas)}
      <LiveRegion ref={grid.announcerRef} />
    </div>
  );
}

return (
  <div className={styles.boardWrap}>
    {wrap(<div className={styles.gutterLayout}>{/* …existing gutter JSX… */}</div>)}
    <LiveRegion ref={grid.announcerRef} />
  </div>
);
```

(Keep the existing gutter JSX unchanged inside the wrapped `gutterLayout` div.)

- [ ] **Step 6: Run the Board + BoardViewport tests**

Run: `pnpm exec vitest run src/game/Board/BoardViewport.test.tsx src/game/Board/Board.test.tsx`
Expected: PASS — existing Board tests still pass (no `viewport` prop → unchanged render).

- [ ] **Step 7: Commit**

```bash
git add src/game/gameTypes.ts src/game/Board/BoardViewport.tsx src/game/Board/BoardViewport.module.css src/game/Board/BoardViewport.test.tsx src/game/Board/index.ts src/game/Board/Board.tsx
git commit -m "feat: add BoardViewport clipping/transform wrapper for oversized boards"
```

---

### Task 5: Drag-pan and pinch-zoom gestures

**Files:**

- Create: `src/game/useBoardGestures.ts`
- Test: `src/game/useBoardGestures.test.ts`

**Interfaces:**

- Consumes: `BoardViewport` from `./useBoardViewport`.
- Produces: `useBoardGestures(viewport: BoardViewport): { onPointerDown; onPointerMove; onPointerUp }` (React pointer-event handlers). Single pointer → `panBy(dx, dy)`. Two pointers → `zoomBy(ratio, midpoint)` based on the change in pinch distance, with the midpoint in viewport-local coordinates. Handlers are thin over the tested hook; only the single-pointer pan path is unit-tested (jsdom cannot synthesize a true two-finger pinch reliably — that risk is called out in the spec and verified manually in Task 10).

- [ ] **Step 1: Write the failing test (single-pointer pan)**

Create `src/game/useBoardGestures.test.ts`:

```typescript
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useBoardGestures } from './useBoardGestures';

function pointerEvent(overrides: Partial<{ pointerId: number; clientX: number; clientY: number }>) {
  return {
    pointerId: 1,
    clientX: 0,
    clientY: 0,
    currentTarget: { setPointerCapture: vi.fn(), releasePointerCapture: vi.fn() },
    ...overrides,
  } as unknown as React.PointerEvent;
}

describe('useBoardGestures', () => {
  it('should pan by the pointer delta while dragging', () => {
    const panBy = vi.fn();
    const viewport = {
      panBy,
      zoomBy: vi.fn(),
      transform: { scale: 1, translateX: 0, translateY: 0 },
    } as unknown as ReturnType<typeof Object>;

    const { result } = renderHook(() => useBoardGestures(viewport as never));

    act(() => result.current.onPointerDown(pointerEvent({ clientX: 100, clientY: 100 })));
    act(() => result.current.onPointerMove(pointerEvent({ clientX: 130, clientY: 90 })));

    expect(panBy).toHaveBeenCalledWith(30, -10);
  });

  it('should not pan after the pointer is released', () => {
    const panBy = vi.fn();
    const viewport = { panBy, zoomBy: vi.fn() } as unknown as never;
    const { result } = renderHook(() => useBoardGestures(viewport));

    act(() => result.current.onPointerDown(pointerEvent({ clientX: 0, clientY: 0 })));
    act(() => result.current.onPointerUp(pointerEvent({})));
    act(() => result.current.onPointerMove(pointerEvent({ clientX: 50, clientY: 50 })));

    expect(panBy).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm exec vitest run src/game/useBoardGestures.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the gesture hook**

Create `src/game/useBoardGestures.ts`:

```typescript
import { useCallback, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { BoardViewport } from './useBoardViewport';

interface Pointer {
  x: number;
  y: number;
}

export function useBoardGestures(viewport: BoardViewport) {
  const pointers = useRef(new Map<number, Pointer>());
  const lastPan = useRef<Pointer | null>(null);
  const lastPinchDistance = useRef<number | null>(null);

  const onPointerDown = useCallback((e: ReactPointerEvent) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      lastPan.current = { x: e.clientX, y: e.clientY };
    } else {
      lastPan.current = null;
      lastPinchDistance.current = null;
    }
  }, []);

  const onPointerMove = useCallback(
    (e: ReactPointerEvent) => {
      if (!pointers.current.has(e.pointerId)) {
        return;
      }
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const points = [...pointers.current.values()];

      if (points.length === 1 && lastPan.current) {
        const dx = e.clientX - lastPan.current.x;
        const dy = e.clientY - lastPan.current.y;
        lastPan.current = { x: e.clientX, y: e.clientY };
        viewport.panBy(dx, dy);
        return;
      }

      if (points.length >= 2) {
        const [a, b] = points;
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const midpoint = {
          x: (a.x + b.x) / 2 - rect.left,
          y: (a.y + b.y) / 2 - rect.top,
        };
        if (lastPinchDistance.current) {
          viewport.zoomBy(distance / lastPinchDistance.current, midpoint);
        }
        lastPinchDistance.current = distance;
      }
    },
    [viewport]
  );

  const onPointerUp = useCallback((e: ReactPointerEvent) => {
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    pointers.current.delete(e.pointerId);
    lastPan.current = null;
    lastPinchDistance.current = null;
  }, []);

  return { onPointerDown, onPointerMove, onPointerUp };
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `pnpm exec vitest run src/game/useBoardGestures.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/useBoardGestures.ts src/game/useBoardGestures.test.ts
git commit -m "feat: drag-pan and pinch-zoom gesture handlers for board viewport"
```

---

### Task 6: Zoom controls (non-gesture path)

**Files:**

- Create: `src/game/ZoomControls/ZoomControls.tsx`, `ZoomControls.module.css`, `index.ts`
- Test: `src/game/ZoomControls/ZoomControls.test.tsx`

**Interfaces:**

- Produces: `ZoomControls({ onZoomIn, onZoomOut, onFit }: { onZoomIn(): void; onZoomOut(): void; onFit(): void })` — three buttons with accessible names "Zoom in", "Zoom out", "Fit whole board". Targets ≥ 44px.

- [ ] **Step 1: Write the failing test**

Create `src/game/ZoomControls/ZoomControls.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ZoomControls } from './ZoomControls';

describe('ZoomControls', () => {
  it('should call the matching handler for each control', async () => {
    const onZoomIn = vi.fn();
    const onZoomOut = vi.fn();
    const onFit = vi.fn();
    const user = userEvent.setup();

    render(<ZoomControls onZoomIn={onZoomIn} onZoomOut={onZoomOut} onFit={onFit} />);

    await user.click(screen.getByRole('button', { name: 'Zoom in' }));
    await user.click(screen.getByRole('button', { name: 'Zoom out' }));
    await user.click(screen.getByRole('button', { name: 'Fit whole board' }));

    expect(onZoomIn).toHaveBeenCalledTimes(1);
    expect(onZoomOut).toHaveBeenCalledTimes(1);
    expect(onFit).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm exec vitest run src/game/ZoomControls/ZoomControls.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the component and CSS**

Create `src/game/ZoomControls/ZoomControls.module.css`:

```css
.controls {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-block-end: 16px;
}

.btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid var(--border-subtle, #3a3a5a);
  background: var(--surface-raised, #2a2a44);
  color: var(--text-primary, #e8e8f4);
  cursor: pointer;
}

.fit {
  width: auto;
  padding-inline: 12px;
  font-size: 0.8rem;
}
```

Create `src/game/ZoomControls/ZoomControls.tsx`:

```typescript
import styles from './ZoomControls.module.css';

interface ZoomControlsProps {
  onZoomIn(): void;
  onZoomOut(): void;
  onFit(): void;
}

export function ZoomControls({ onZoomIn, onZoomOut, onFit }: ZoomControlsProps) {
  return (
    <div className={styles.controls}>
      <button type="button" className={styles.btn} aria-label="Zoom out" onClick={onZoomOut}>
        −
      </button>
      <button type="button" className={styles.btn} aria-label="Zoom in" onClick={onZoomIn}>
        +
      </button>
      <button
        type="button"
        className={`${styles.btn} ${styles.fit}`}
        aria-label="Fit whole board"
        onClick={onFit}
      >
        Fit
      </button>
    </div>
  );
}
```

Create `src/game/ZoomControls/index.ts`:

```typescript
export { ZoomControls } from './ZoomControls';
```

- [ ] **Step 4: Run it to verify it passes**

Run: `pnpm exec vitest run src/game/ZoomControls/ZoomControls.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/ZoomControls
git commit -m "feat: add zoom in/out/fit controls"
```

---

### Task 7: Keyboard navigation keeps the focused cell in view

**Files:**

- Modify: `src/game/useSudokuGrid.ts`
- Test: `src/game/useSudokuGrid.test.ts`

**Interfaces:**

- `useSudokuGrid` gains an optional input field `onCellNavigate?(id: CellId): void`, invoked after a successful arrow/Home/End move (where the hook already calls `target?.focus()` at the navigation branch). The `focus()` call becomes `focus({ preventScroll: true })` so the browser does not fight the transform.
- `GameInner` (Task 8) supplies `onCellNavigate` that pans the cell into view via `viewport.ensureVisible(rect)`.

- [ ] **Step 1: Write the failing test**

Add to `src/game/useSudokuGrid.test.ts` (follow the file's existing render/setup helpers; the snippet below shows the assertion shape — adapt to the harness already in that file):

```typescript
it('should call onCellNavigate with the destination cell on arrow navigation', () => {
  const onCellNavigate = vi.fn();
  // render the hook/board with onCellNavigate, focus r0c0, press ArrowRight
  // (reuse the file's existing setup for cells/model/values)
  // ...
  // fireEvent/userEvent ArrowRight on the focused cell
  expect(onCellNavigate).toHaveBeenCalledWith('r0c1');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm exec vitest run src/game/useSudokuGrid.test.ts -t "onCellNavigate"`
Expected: FAIL — `onCellNavigate` is not yet supported.

- [ ] **Step 3: Implement the callback + preventScroll**

In `src/game/useSudokuGrid.ts`:

1. Add `onCellNavigate` to the hook's options interface and destructure it.
2. In the navigation branch (currently around lines 266–273), change:
   ```typescript
   if (nextId) {
     event.preventDefault();
     selectCell(nextId);
     const grid = event.currentTarget.closest?.('[role="grid"]');
     const target = grid?.querySelector<HTMLElement>(`[data-cell="${nextId}"]`);
     target?.focus({ preventScroll: true });
     onCellNavigate?.(nextId);
     return;
   }
   ```
3. Add `onCellNavigate` to the `handleKey` `useCallback` dependency array.

- [ ] **Step 4: Run it to verify it passes**

Run: `pnpm exec vitest run src/game/useSudokuGrid.test.ts`
Expected: PASS (new case + existing cases).

- [ ] **Step 5: Commit**

```bash
git add src/game/useSudokuGrid.ts src/game/useSudokuGrid.test.ts
git commit -m "feat: notify on keyboard cell navigation and preventScroll on focus"
```

---

### Task 8: Wire core navigation into `GamePage`

**Files:**

- Modify: `src/game/GamePage.tsx`, `src/game/GamePage.module.css`

**Interfaces:**

- Consumes: `useBoardViewport`, `useBoardGestures`, `useElementSize`, `isOversized`, `ZoomControls`, and `BoardViewportState`.
- Produces: an oversized board that renders inside the clipping viewport, pans/zooms by gesture and by the zoom controls, and pans the keyboard-focused cell into view.

- [ ] **Step 1: Build the viewport plumbing in `GameInner`**

After `size` is computed (GamePage.tsx:81-84), add:

```typescript
const viewportRef = useRef<HTMLDivElement>(null);
const viewportSize = useElementSize(viewportRef);
const oversized = isOversized(size, viewportSize) && viewportSize.w > 0;
const boardViewport = useBoardViewport(size, viewportSize);
const gestures = useBoardGestures(boardViewport);

const cellRectById = rects; // Map<CellId, Rect>
const ensureCellVisible = useCallback(
  (id: CellId) => {
    const rect = cellRectById.get(id);
    if (rect) boardViewport.ensureVisible(rect);
  },
  [boardViewport, cellRectById]
);

const viewportState: BoardViewportState | undefined = oversized
  ? {
      transform: boardViewport.transform,
      viewportRef,
      onPointerDown: gestures.onPointerDown,
      onPointerMove: gestures.onPointerMove,
      onPointerUp: gestures.onPointerUp,
    }
  : undefined;
```

Add the needed imports (`useRef`, `useCallback` are already imported) and the new modules. Pass `onCellNavigate={oversized ? ensureCellVisible : undefined}` into the `useSudokuGrid({ ... })` call.

- [ ] **Step 2: Pass `viewport` to `Board` and render `ZoomControls`**

Add `viewport={viewportState}` to the `<Board ... />` props. In `.gameRight`, render `<ZoomControls .../>` only when `oversized`:

```tsx
{
  oversized ? (
    <ZoomControls
      onZoomIn={() => boardViewport.zoomBy(1.2)}
      onZoomOut={() => boardViewport.zoomBy(1 / 1.2)}
      onFit={boardViewport.fitWhole}
    />
  ) : null;
}
```

- [ ] **Step 3: Constrain the viewport height in CSS**

In `GamePage.module.css`, cap the board column so the clipping viewport has a bounded height on mobile (otherwise an 840px-tall board defines the page height and there is nothing to pan within). Add, inside the existing mobile layout block and base rules, a max block-size on `.gameLeft` driven by viewport units, e.g.:

```css
.gameLeft {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-block-size: 70vh;
}

@media (min-width: 768px) {
  .gameLeft {
    max-block-size: none;
  }
}
```

(The `BoardViewport` `.viewport` already sets `overflow: hidden` + `max-width: 100%`; `.gameLeft`'s `max-block-size` gives the clip a height to work against on small screens. Confirm during Step 4 that classic 9×9 — which never sets `viewport` — is visually unchanged, since its board is shorter than 70vh.)

- [ ] **Step 4: Manual verification at 320–414px**

Run: `pnpm dev`, open Samurai and Super in devtools responsive mode at 320px and 414px.
Expected: board renders at ~40px cells inside a clipped area; drag pans; pinch zooms; zoom buttons work; "Fit" shows the whole board; arrow-key navigation to an off-screen cell scrolls it into view. Classic 9×9 is unchanged (no clip, no controls).

- [ ] **Step 5: Run the full suite**

Run: `pnpm build && pnpm test && pnpm lint`
Expected: all pass. `GamePage.test.tsx` still passes (classic path unchanged; jsdom reports `viewportSize.w === 0`, so `oversized` is false and the viewport stays inert under test unless a test mocks the size).

- [ ] **Step 6: Commit**

```bash
git add src/game/GamePage.tsx src/game/GamePage.module.css
git commit -m "feat: enable pan/zoom navigation for oversized boards"
```

---

## Phase 2 — Minimap & controls reflow

### Task 9: Minimap overview with viewport indicator

**Files:**

- Create: `src/game/Minimap/Minimap.tsx`, `Minimap.module.css`, `index.ts`
- Test: `src/game/Minimap/Minimap.test.tsx`

**Interfaces:**

- Consumes: `indicatorRect` from `@/game/boardViewport`; `Rect`, `Size` from gameTypes; `CellId`, `Values` from `@/engine/types`; the current `transform`, `board` size, `viewport` size, the `rects` map, `givens`, and `values`.
- Produces:
  ```typescript
  interface MinimapProps {
    rects: Map<CellId, Rect>;
    filled: Set<CellId>; // givens ∪ entered values
    board: Size;
    viewport: Size;
    transform: { scale: number; translateX: number; translateY: number };
    onSeek(point: { x: number; y: number }): void; // point in minimap-local px
  }
  function Minimap(props: MinimapProps): JSX.Element;
  ```
- An SVG sized to the board's bounding box (aspect-matched), drawing a faint cell square for each `rects` entry, a stronger square for each `filled` cell, and a stroked `indicatorRect`. Tapping or dragging within the SVG calls `onSeek` with the local coordinate. It carries `role="img"` plus an accessible name and a visually-hidden instruction; full keyboard board navigation already pans the focused cell into view (Task 7), satisfying the keyboard path.

- [ ] **Step 1: Write the failing test**

Create `src/game/Minimap/Minimap.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { CellId } from '@/engine/types';
import type { Rect } from '@/game/gameTypes';
import { Minimap } from './Minimap';

const rects = new Map<CellId, Rect>([
  ['r0c0' as CellId, { x: 0, y: 0, w: 40, h: 40 }],
  ['r0c1' as CellId, { x: 40, y: 0, w: 40, h: 40 }],
]);

const baseProps = {
  rects,
  filled: new Set<CellId>(['r0c0' as CellId]),
  board: { w: 840, h: 840 },
  viewport: { w: 360, h: 360 },
  transform: { scale: 1, translateX: 0, translateY: 0 },
};

describe('Minimap', () => {
  it('should expose an accessible name', () => {
    render(<Minimap {...baseProps} onSeek={vi.fn()} />);
    expect(screen.getByRole('img', { name: /board overview/i })).toBeInTheDocument();
  });

  it('should call onSeek when clicked', async () => {
    const onSeek = vi.fn();
    const user = userEvent.setup();
    render(<Minimap {...baseProps} onSeek={onSeek} />);
    await user.click(screen.getByRole('img', { name: /board overview/i }));
    expect(onSeek).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm exec vitest run src/game/Minimap/Minimap.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the component and CSS**

Create `src/game/Minimap/Minimap.module.css`:

```css
.minimap {
  display: block;
  inline-size: 150px;
  block-size: auto;
  border: 1px solid var(--border-subtle, #3a3a5a);
  border-radius: 6px;
  background: var(--surface-sunken, #1c1c30);
  touch-action: none;
  cursor: pointer;
}

.cell {
  fill: var(--minimap-cell, #3a3a5a);
}

.filled {
  fill: var(--minimap-filled, #6a6a9a);
}

.indicator {
  fill: var(--accent-blue, #f1be32);
  fill-opacity: 0.25;
  stroke: var(--accent-blue, #f1be32);
  stroke-width: 2;
}
```

Create `src/game/Minimap/Minimap.tsx`:

```typescript
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { CellId } from '@/engine/types';
import type { Rect, Size } from '@/game/gameTypes';
import { indicatorRect } from '@/game/boardViewport';
import styles from './Minimap.module.css';

const MINIMAP_WIDTH = 150;

interface MinimapProps {
  rects: Map<CellId, Rect>;
  filled: Set<CellId>;
  board: Size;
  viewport: Size;
  transform: { scale: number; translateX: number; translateY: number };
  onSeek(point: { x: number; y: number }): void;
}

export function Minimap({ rects, filled, board, viewport, transform, onSeek }: MinimapProps) {
  const scale = MINIMAP_WIDTH / board.w;
  const height = board.h * scale;
  const minimap: Size = { w: MINIMAP_WIDTH, h: height };
  const indicator = indicatorRect(transform, board, viewport, minimap);

  function seek(e: ReactPointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    onSeek({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  return (
    <svg
      role="img"
      aria-label="Board overview. Tap to move the visible area."
      viewBox={`0 0 ${MINIMAP_WIDTH} ${height}`}
      className={styles.minimap}
      onPointerDown={seek}
      onPointerMove={(e) => {
        if (e.buttons === 1) seek(e);
      }}
    >
      {[...rects.entries()].map(([id, r]) => (
        <rect
          key={id}
          className={filled.has(id) ? styles.filled : styles.cell}
          x={r.x * scale}
          y={r.y * scale}
          width={r.w * scale}
          height={r.h * scale}
        />
      ))}
      <rect
        className={styles.indicator}
        x={indicator.x}
        y={indicator.y}
        width={indicator.w}
        height={indicator.h}
      />
    </svg>
  );
}
```

Create `src/game/Minimap/index.ts`:

```typescript
export { Minimap } from './Minimap';
```

- [ ] **Step 4: Run it to verify it passes**

Run: `pnpm exec vitest run src/game/Minimap/Minimap.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/Minimap
git commit -m "feat: add board minimap with viewport indicator"
```

---

### Task 10: Dock the minimap and reflow the number pad

**Files:**

- Modify: `src/game/GamePage.tsx`, `src/game/GamePage.module.css`

**Interfaces:**

- Consumes: `Minimap`, `boardViewport.panToMinimapPoint`, and the oversized flag from Task 8.
- Produces: a docked minimap beside a compact number pad for oversized boards; classic 9×9 controls unchanged.

- [ ] **Step 1: Compute the filled set and render the minimap**

In `GameInner`, derive the filled set and a minimap size, then render the minimap (above the number pad) when `oversized`:

```typescript
const filled = useMemo(() => {
  const set = new Set<CellId>(givens.keys());
  for (const id of state.values.keys()) set.add(id);
  return set;
}, [givens, state.values]);
```

```tsx
{
  oversized ? (
    <div className={styles.navDock}>
      <Minimap
        rects={rects}
        filled={filled}
        board={size}
        viewport={viewportSize}
        transform={boardViewport.transform}
        onSeek={(point) =>
          boardViewport.panToMinimapPoint(point, { w: 150, h: (size.h / size.w) * 150 })
        }
      />
    </div>
  ) : null;
}
```

- [ ] **Step 2: Reflow the number pad to compact 3×3 for oversized 9-symbol boards**

The `columns` prop already drives a compact grid + full-width erase. Extend the existing `columns` expression in the `<NumberPad>` call so oversized 9-symbol boards (Samurai, Gattai3, Tripledoku) pass `3`:

```tsx
columns={
  model.symbols.length === 16
    ? 4
    : model.symbols.length === 4
      ? 4
      : model.symbols.length === 6
        ? 3
        : oversized && model.symbols.length === 9
          ? 3
          : undefined
}
```

- [ ] **Step 3: Lay out the dock beside the number pad on mobile**

In `GamePage.module.css`, add a `.navDock` rule and place the minimap + number pad side by side within `.gameRight` on small screens (roughly 150px minimap + ~132px pad fits 320px per the spec), reverting to stacked on wider layouts:

```css
.navDock {
  display: flex;
  justify-content: center;
  margin-block-end: 16px;
}

@media (max-width: 1280px) {
  /* keep base mobile stacking; the compact 3×3 pad + 150px minimap fit 320px */
}
```

(If the side-by-side arrangement is desired rather than stacked, wrap the `Minimap` and `NumberPad` in a flex row container in `GameInner` and style that container here. Keep classic 9×9 — which never renders `.navDock` — untouched.)

- [ ] **Step 4: Manual verification**

Run: `pnpm dev`, open Samurai at 320px. Confirm the minimap and compact number pad fit without horizontal scroll; tapping/dragging the minimap recenters the board; the indicator tracks pan/zoom; entering a value updates the minimap's filled cells.

- [ ] **Step 5: Run the full suite**

Run: `pnpm build && pnpm test && pnpm lint`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/game/GamePage.tsx src/game/GamePage.module.css
git commit -m "feat: dock minimap and reflow number pad for oversized boards"
```

---

## Self-Review

- **Spec coverage:**
  - Scope = all oversized boards, variant-agnostic → `isOversizedVariant` (Task 3) + `isOversized` gate (Tasks 1, 8) ✓
  - Free pan + pinch + fit control, no snap → Tasks 5, 6; `panBy`/`zoomBy`/`fitWhole` (Task 2) ✓
  - Pinch in first ship + `touch-action: none` → Task 5 + `.viewport` CSS (Task 4) ✓
  - Comfortable ~40px render, scale=1 working zoom, fit < 1 orientation-only → `COMFORTABLE_CELL_SIZE` (Task 3), `fitScale`/`clampScale` (Task 1) ✓
  - Transform state in runtime (not reducer) with bounds + scale clamping → `useBoardViewport` (Task 2), `clampTranslate`/`clampScale` (Task 1) ✓
  - Transform applied to wrapper containing `.grid` + overlays → `BoardViewport` (Task 4) ✓
  - Minimap = schematic outlines + filled cells, aspect-matched, viewport indicator, two-way free-pan sync → Task 9 (`indicatorRect`, `panToMinimapPoint`) ✓
  - Engagement only when board exceeds viewport, any device → `oversized` gate (Task 8) ✓
  - Controls reflow to compact 3×3 + erase only when minimap present → Task 10 (`columns={3}`); classic unchanged ✓
  - Keyboard keeps focused cell in view, `preventScroll`, non-gesture zoom path, accessible names → Task 7 (`onCellNavigate` + `ensureVisible`), Task 6, Task 9 ✓
  - Cells clear 24px AA; number pad keeps 44px → 40px comfortable cell (Task 3); `.numBtn` unchanged; `.btn` 44px (Task 6) ✓
  - Testing: unit-test transform math, bounds, fit-scale, minimap↔translate, controls reflow, keyboard-into-view; thin gesture handlers → Tasks 1, 2, 5, 7, 9 ✓
- **Placeholder scan:** No TBD/TODO. The one intentionally abbreviated block is Task 7 Step 1 (test assertion shape) because it must adapt to `useSudokuGrid.test.ts`'s existing render harness, which the implementer has in front of them; the assertion (`onCellNavigate` called with `'r0c1'`) and implementation (Task 7 Step 3) are fully specified.
- **Type consistency:** `Transform` is defined once in `boardViewport.ts` and reused; `BoardViewport` (hook return) vs `BoardViewportState` (Board prop / serialized handlers) are distinct and used consistently; `Size`/`Rect` come from `gameTypes`; `minimapPointToTranslate`/`indicatorRect`/`ensureVisibleTranslate` signatures match their call sites in Tasks 2, 8, 9; `COMFORTABLE_CELL_SIZE` is imported, not re-declared.
- **Open items verified in-task:** oversized variant export names (Task 3 Step 3); `useSudokuGrid.test.ts` harness shape (Task 7 Step 1).
- **Decomposition:** Phase 1 (Tasks 1–8) ships usable navigation without the minimap; Phase 2 (Tasks 9–10) adds the minimap and reflow. Each task ends with an independently testable, committable deliverable.
