# Large-board navigation (pan / zoom / minimap)

Date: 2026-06-23
Branch: `fix/mobile-layout`
Status: Approved, ready for implementation plan

## Problem

Oversized boards do not fit a phone and cannot be made to fit accessibly.
Samurai is 21 cells wide; fitting that to a ~360px screen yields ~17px cells,
below the WCAG 2.5.8 AA floor of 24px. There is no compliant fit-to-width
option, so the board must render larger than the viewport and the user must be
able to navigate it.

Affected variants (all boards whose rendered size exceeds the viewport):

- Samurai: 21×21 canvas (5 overlapping 9×9 grids)
- Super: 16×16 single grid
- Gattai3: 15×13 canvas
- Tripledoku: 12×9 canvas

This spec is independent of the 9×9 fit work
(`2026-06-23-mobile-9x9-fit-design.md`). The two do not overlap: Problem 1
changes cell sizing for classic 9×9 only; this spec governs how oversized boards
are sized and navigated.

## Goal

Make oversized boards usable on mobile: render cells at an accessible, tappable
size and let the user pan, zoom, and orient via a minimap, without breaking the
existing tap and keyboard interaction model.

## Decisions

- **Scope:** all oversized boards (Samurai, Super, Gattai3, Tripledoku). The
  mechanism is variant-agnostic.
- **Navigation:** free pan (tap/drag the minimap recenters the viewport on that
  point) plus pinch-to-zoom and a "fit whole board" control. No snap-to-grid.
  Free pan matches conventions (maps, canvas tools, game minimaps) and avoids
  defining snap targets that do not exist for 16×16 and are ambiguous across
  Samurai's overlapping boxes.
- **Pinch is in the first ship**, not deferred. It is the gesture mobile users
  reach for first, and `touch-action` handling is required for drag-pan anyway.
- **Minimap placement:** docked in the controls area next to the number pad,
  only for oversized boards. Classic 9×9 has no minimap and its number pad is
  untouched.

## Why a CSS transform works here

The board is pure DOM: each cell is an absolutely-positioned `.cellSlot` div
carrying its own `onClick` and `data-cell` (`src/game/Board/Board.tsx`,
`src/game/useSudokuGrid.ts`). There is no canvas pixel-to-cell hit-testing.
Consequences:

- A `transform: scale()/translate()` on the board subtree preserves taps and
  arrow-key navigation; the browser maps pointer events through the transform.
- Overlays render _inside_ `.grid`, so transforming `.grid` (or a wrapper that
  contains it) scales overlays with the same subtree. No overlay coordinate
  re-mapping is required.

## Design

### Rendering and zoom model

- Oversized boards render their DOM at a fixed **comfortable cell size** (target
  ~40px) rather than the current responsive shrink. `scale = 1` is the
  comfortable working zoom; the user pans to reach off-screen regions.
- A **"fit whole board"** control sets `scale = viewportSize / boardSize` (< 1)
  so the entire board is visible for orientation. At that zoom cells are too
  small to tap, so the fit view is orientation-only; the user zooms back in to
  play.
- Initial state: `scale = 1`, panned to a sensible origin (top-left grid for
  Samurai).

### Transform state

- State: `scale`, `translateX`, `translateY`, held in the game runtime.
- Bounds clamping: pan is clamped so the board cannot be dragged entirely out of
  the viewport; `scale` is clamped between the fit scale and a sensible max.
- The transform is applied to the wrapper that contains `.grid` and its
  overlays.

### Gestures and controls

- **Drag-to-pan:** pointer events on the board viewport update `translate`.
- **Pinch-to-zoom:** two-pointer tracking; zoom about the pinch midpoint.
  `touch-action: none` on the board viewport suppresses native page zoom/scroll.
- **Zoom controls:** zoom-in / zoom-out buttons and a "fit whole board" button,
  as a non-gesture path (also serves desktop and accessibility).

### Minimap

- A schematic overview of the board: grid outlines plus filled cells (givens and
  entered values), drawn small (SVG or a small canvas). It is not a live clone
  of the DOM board.
- **Shape:** mirrors the board's bounding box. Square for Samurai (21×21) and
  Super (16×16); aspect-matched for Gattai3 (15×13) and Tripledoku (12×9).
- **Viewport indicator:** a rectangle marking the slice currently visible in the
  board viewport. Its proportions follow the on-screen viewport, not the board,
  so it is generally not square.
- **Interaction:** free pan. Tapping or dragging within the minimap sets the
  board `translate` to center on that point. Two-way synced: board transform
  updates the indicator; minimap input updates the transform.

### Engagement

- Pan/zoom and the minimap engage only when the rendered board exceeds its
  viewport container, regardless of device. When the board fits (e.g. on a wide
  desktop), they are inert/hidden and the board renders normally.

### Controls layout when minimap is present

- Mobile (stacked controls): a square minimap and the number pad sit side by
  side in the controls column. To fit beside the minimap on a ~320px phone, the
  number pad reflows to a compact **3×3 (digits 1-9) + erase** block. Roughly
  150px minimap + ~132px number pad fits 320px.
- This reflow applies only when a minimap is present (oversized boards). The
  classic 9×9 number pad layout is unchanged.

### Keyboard and accessibility

- Keyboard navigation must keep the focused cell in view. Browser scroll-on-focus
  is disabled (`focus({ preventScroll: true })`); replace it with custom logic
  that pans the focused cell into the viewport, accounting for `scale`.
- Zoom buttons and the "fit" control provide a full non-gesture path.
- Minimap interactive controls carry accessible names; the minimap is operable
  by keyboard or has an equivalent keyboard path (arrow-key cell nav already pans
  the focused cell into view, satisfying the navigation need without the mouse).
- Cells at the comfortable zoom clear WCAG 2.5.8 AA; the number pad keeps its
  44px+ targets.

## Testing

- Unit-test the transform math: bounds clamping, fit-scale computation, and
  minimap point -> translate mapping (and the inverse for the indicator).
- Test the controls reflow: minimap present -> compact 3×3 + erase number pad;
  absent -> unchanged.
- Test that keyboard navigation to an off-screen cell pans it into view.
- Gesture sequences are hard to drive in jsdom; cover the pure math and state
  reducers directly, and keep gesture handlers thin over tested functions.

## Risks

- **Pinch correctness across browsers** and suppressing native page zoom
  (`touch-action: none`). Primary bug surface.
- **Keeping the accessible keyboard path working** under transform (pan focused
  cell into view). Easy to omit; breaks a11y if skipped.

## Out of scope

- 9×9 classic fit (separate spec).
- Snap-to-grid navigation.
- A live DOM clone in the minimap (schematic only).
