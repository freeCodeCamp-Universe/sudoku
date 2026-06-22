# Mobile fit for 9×9 boards

Date: 2026-06-23
Branch: `fix/mobile-layout`
Status: Approved, ready for implementation plan

## Problem

On small screens the classic 9×9 board is cut off and the board container falls
back to horizontal scrolling. Root cause: `useResponsiveCellSize` picks the cell
size from hardcoded `window.innerWidth` steps that are decoupled from the actual
board width. The smallest bucket today is `w <= 375 → 38px`, which yields a
`9 × 38 + 6 = 348px` board. Any viewport narrower than ~348px (including the
320px baseline) overflows, triggering the `overflow-x: auto` fallback in
`Board.module.css` (`@media (max-width: 1280px)`).

This spec covers the 9×9 (classic) case only. Large boards (Samurai 21×21,
Super 16×16, Gattai3) are a separate effort and are explicitly out of scope.

## Goal

The entire 9×9 grid fits within the viewport down to the 320px baseline, with no
horizontal scroll, while keeping touch targets accessible.

## Constraints

- Keep the breakpoint-stepped approach. Do **not** introduce a `ResizeObserver`
  or fluid container measurement (explicit decision).
- Board width = `9 × cellSize + 6px` (a 3px frame each side, content-box; no
  inter-cell gaps — the board is a single canvas with absolutely-positioned
  cells).
- Each bucket must be sized for the **smallest** device it serves, with ~8–12px
  of breathing room at the bucket's lower bound.
- Accessibility: every step clears **WCAG 2.5.8 AA (24px minimum)**. Cells sit
  below the Apple 44pt / Material 48dp ideal, which is unavoidable for a 9-wide
  grid on a phone; the number pad remains the primary input and keeps its 44px+
  target, so cell tapping is selection only.

## Design

### Cell-size step table (classic 9×9 only)

| Viewport (`window.innerWidth`) | Cell | Board width | Slack at lower bound |
| ------------------------------ | ---- | ----------- | -------------------- |
| ≤ 359                          | 34px | 312px       | 320 → 8px            |
| ≤ 413                          | 38px | 348px       | 360 → 12px           |
| ≤ 519                          | 44px | 402px       | 414 → 12px           |
| else                           | 52px | 468px       | desktop              |

The floor is 34px (not 32px): with the corrected bucket math and a small gutter,
34px is the largest cell that still fits the 320px baseline, so it is strictly
better than 32px (larger touch target, same fit).

### Changes

1. `src/game/useResponsiveCellSize.ts` — for the classic grid (`kind === 'grid'`
   and `size === 9`), compute the cell size from the absolute step table above
   instead of the ratio-based steps. Leave 16×16 and multigrid variants on the
   current ratio behavior unchanged (deferred to the large-board work). The
   resize listener stays as-is.

2. Side padding — verify nothing in the parent chain (`.gamePage`, `.boardWrap`,
   `Layout`) blocks the fit. `.gamePage` has no side padding and `.boardWrap`
   centers via `width: max-content`, so once cells shrink the board should fit
   without further CSS changes. Confirm during implementation; only adjust if a
   real blocker is found.

### Testing

Add a colocated `useResponsiveCellSize.test.ts(x)` (mirrors the unit; never
`index.test`). Mock `window.innerWidth` and assert the returned cell size at
representative widths for the classic 9×9 variant:

- 319 / 320 → 34px (baseline fits)
- 359 → 34px (top of first bucket)
- 360 / 413 → 38px
- 414 / 519 → 44px
- 520+ → 52px

Assert that for each width the resulting board width (`9 × cell + 6`) is ≤ the
viewport, so the fit guarantee is encoded in the test, not just the size value.

## Notes

- The JS thresholds (359/413/519) are not CSS media queries, so they do not
  conflict with the project's `css-styling.md` min-width breakpoint rule
  (768/1024/1440/2560). They follow the existing `useResponsiveCellSize` pattern.
- Stepping wastes some width inside a bucket (e.g. a 359px phone gets 34px cells
  with 47px of slack). This is the accepted cost of breakpoints over a
  ResizeObserver.

## Out of scope

- Large-board navigation (minimap / sub-grid focus / pinch-zoom) for Samurai,
  Super, and Gattai3.
- Number pad, toolbar, and mode-switcher touch-target changes (already at/above
  44px on mobile per current CSS).
