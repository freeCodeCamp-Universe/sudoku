# Mobile control area: D-pad navigation + Move/Map tabs

Date: 2026-07-09 (revised 2026-07-14 against `feat/mobile-navigation` @ `bbdd5fd`)
Status: Design (revised; the original design was written before PR #92 landed and most of its groundwork has since shipped)

## Summary

The original 2026-07-09 design proposed collapsing two divergent mobile control branches into one structure. That unification **already shipped** in PR #92 ("board viewport engine, navigation UI, and mobile layout") along with the zoom/viewport generalization. What remains is the navigation half of the design: an on-screen **D-pad** for moving the selected cell, and a **Move / Map tab group** in the map column so the minimap and zoom controls sit behind a tab instead of always occupying the column.

Scope is mobile only (below the 1024px desktop cutoff). Desktop keeps its current behavior.

## Already shipped (do not re-implement)

Verified in the current source:

- **Unified mobile control structure** — below 1024px every variant renders the same two-column `.controlsRow`: `.controlsMain` (Normal / Candidate / Controls tab group + active panel) and `.mapGroup` (minimap + zoom controls). `GamePage.tsx` has a single `isDesktop` branch; there is no oversized/non-oversized control split anymore.
- **Controls tab in every variant** — the third tab is labeled **"Controls"** (the original design called it "Tools"; the shipped name stays). Its panel holds the vertical Toolbar (Reveal Cell / Clear All) and New Game. The bottom New Game button is desktop-only.
- **Pan/zoom on all mobile boards** — `panZoomActive = !isDesktop && (oversized || scale > 1)` in `GamePage.tsx`; any mobile board can be zoomed past fit and then pans.
- **Natural-size zoom floor** — `fitWholeScale` / `clampScale` in `boardViewport.ts` floor a fitting board at scale 1 (no forced upscaling); `MAX_SCALE` is 2. Covered by `boardViewport.test.ts`.
- **Viewport auto-follow** — `onCellNavigate: panZoomActive ? ensureCellVisible : undefined` is already wired into `useSudokuGrid`, so any selection movement pans the board when zoomed.
- **Selected-cell-centered button zoom** — `BoardZoomControls` (wrapping the presentational `ZoomControls`) zooms about the selected cell.
- **Mobile-first CSS** — `GamePage.module.css` uses only `min-width` queries (600px, 1024px); the old `max-width` blocks are gone.
- **Control-height floor** — `.controlsRow { min-block-size: 134px }` keeps short variants' controls docked consistently.
- **Tabs component** — the reusable tablist is `src/game/Tabs/` (`Tabs`, `Tab` — renamed from the `ControlTabs` the original design references). Panels hide via the native `hidden` attribute (`.panel[hidden] { display: none }`), so hidden panels do NOT reserve space.

## Remaining design

### Move / Map tab group in the map column

`.mapGroup` becomes a second `Tabs` group (`aria-label="Board navigation"`), tabs **Move** (default) and **Map**:

- **Move panel** (`nav-panel-move`): the D-pad.
- **Map panel** (`nav-panel-map`): the existing minimap + zoom controls, unchanged.

The minimap is no longer gated on an `overflowing` computation (the original design's contextual-disclosure mechanism). The Map tab itself is the disclosure: the minimap never clutters the default view, and `indicatorRect` already renders a full-map indicator when the board fits, so showing it unconditionally inside the Map panel is correct and simpler.

### D-pad

New component `src/game/DPad/` — four ≥44px arrow buttons in a 3×3 cross, calling `onMove(direction)` with `direction ∈ up | down | left | right`.

- `onMove` is wired to a new `moveSelection(direction)` exposed from `useSudokuGrid`, sharing the arrow-key code path (`stepCellId`) so on-screen and keyboard navigation cannot drift. Moving the selection while zoomed auto-pans via the existing `ensureCellVisible` wiring; no extra work.
- With no selection, the first move selects the first cell (same as keyboard focus entry).
- Tap-to-select stays the primary selection method; the D-pad is the precision / accessibility supplement and the WCAG 2.5.7 single-pointer alternative to swipe-panning.

## Accessibility

- Both tab groups keep the `Tabs` WAI-ARIA semantics; distinct `aria-label`s ("Input mode and controls" / "Board navigation") keep the two tablists distinguishable.
- D-pad buttons ≥44px with accessible names ("Move up" etc.); board cells stay above the WCAG 2.5.8 AA 24px floor, with zoom + D-pad as the precise-selection alternates on dense grids.
- Destructive actions (Clear All, New Game) keep their confirm modals.

## Layout stability

Tab panels use `hidden` (display: none), so the nav column's height would change when switching Move ↔ Map. Reserve `min-block-size` on the nav column sized to its tallest panel, and raise the `.controlsRow` floor (currently 134px, derived from the numpad column) since the Move panel (~tab row + 3×44px D-pad rows) will now be the tallest content. Values are hand-tuned and verified manually; the goal is that tab switches never move the board.

## Known risk: D-pad width vs. the map column

`.mapGroup` is the flex-1 column of a 2:1 split with `min-inline-size: 88px` / `max-inline-size: 200px`; at 320–375px viewports it gets roughly 99–117px. A 3-column 44px D-pad needs ~132–140px. Resolution is deferred to implementation-time device verification, in preference order:

1. Raise `.mapGroup`'s `min-inline-size` to fit the D-pad and let the numpad grid flex down (its buttons already shrink below 44px under width pressure by design).
2. Tighten the D-pad gap (44px keys, 2px gap = 136px).
3. Only if both leave the numpad unusably cramped at 320px: revisit key size (WCAG 2.5.8 AA floor is 24px; 44px is the HIG ideal, not a hard gate).

## Non-goals

- Undo/redo — still absent, still deferred (reducer move-history work, not a layout concern).
- Changing desktop layout, the puzzle engine, variants, or input semantics beyond wiring the D-pad to existing navigation.
- Re-gating the minimap on an overflow computation (superseded by the Map tab, above).

## Superseded from the original design

- **768px `isWide` split** — the shipped cutoff is the existing `isDesktop` (`min-width: 1024px`), documented in AGENTS.md ("pan/zoom viewport is mobile-only; at ≥1024px boards render at natural size"). Do not introduce a 768px control-layout breakpoint.
- **"Tools" tab** — shipped as "Controls"; keep.
- **3-column mobile numpad for 9 symbols** — obsolete; PR #94 converted the NumberPad to a flexing 5-across grid that handles width pressure itself.
- **Overflow-gated minimap** — superseded by the Map tab (above).
