# Implementation Plan: overlap-region tint + toggle (feat/region-overlay)

## Overview

Tint the cells where subgrids overlap on the 9 multigrid variants (`samurai`,
`sohei`, `flower`, `cross`, `kazaguruma`, `butterfly`, `gattai-3`, `twodoku`,
`tripledoku`), with a per-page "Highlight overlaps" toggle: ON by default, not
persisted. Generalize the Color variant's toggle slot so future toggles slot in.

## Architecture Decisions

- **Cell background, not an SVG overlay.** Cells are opaque DOM divs
  (`Cell.module.css:24`), so a layer beneath them is invisible. Tint via a
  `data-overlap` cell attribute — inert CSS for this already exists
  (`Cell.module.css:224-229, 444-449`). Digits render above automatically.
- **New board-only token ladder** `--board-overlap-2..5-bg` in all four
  palettes, contrast-gated. Gallery's `--cell-overlap-*-bg` stays untouched
  (decorative, no text). Approved 2026-07-18.
- **Overlap detection** = count containment in `layout.subGrids` (same
  algorithm the gallery previews use). No structure/engine changes.
- **Toggle** gated on `variant.layout.kind === 'multigrid'`; session-only
  `useState(true)` in `GameInner`, outside `usePersistence`.
- **Butterfly/cross/flower** currently tint via bespoke `data-butterfly`/
  `data-cross`/`data-flower`; migrate them to the shared scheme so the toggle
  controls them (slight color shift approved).
- Existing `overlap` screen-reader annotator already covers a11y announcement;
  no changes there.

## Task List

### Phase 1: Foundation (no user-visible change)

#### Task 1: Board overlap color ladder, gated

**Description:** Add `--board-overlap-2-bg` … `--board-overlap-5-bg` to
`src/app/theme.css` in all four palettes (dark, `.light`, `.high-contrast`,
`.light.high-contrast` — cascade guard requires the HC pair). Start from the
gallery's `--cell-overlap-*` values; tune with `pnpm contrast:ladder` /
`pnpm contrast:report`. Register pairs in
`src/game/testing/contrastSpecs.ts`; regenerate docs.

**Acceptance criteria:**

- [ ] Digit text roles (given, entered, candidate) hold 4.5:1 on every ladder
      step, all four palettes (HC gates at AA, no exceptions)
- [ ] Ladder steps are visually distinguishable from `--bg-secondary`
      (target 3:1 tint-vs-base per `docs/color-contrast.md`, or record an
      accepted shortfall with rationale — the SR annotator is a second carrier)
- [ ] `pnpm docs:colors` run; drift test green

**Verification:** `pnpm test` (contrast + colorDocs suites), `pnpm build`.
**Dependencies:** None. **Files:** `theme.css`, `contrastSpecs.ts`,
`docs/colors.md` (generated). **Scope:** S

#### Task 2: Overlap-count helper

**Description:** Pure function (new `src/game/overlapCounts.ts` + colocated
test): `MultiGridLayout → Map<CellId, 2|3|4|5>` (cells in one subgrid
excluded), by counting subgrid containment per canvas cell.

**Acceptance criteria:**

- [ ] Correct counts for a 2-grid layout (twodoku shape) and the 5-grid
      samurai shape, including a cell in 0 grids and in 1 grid (absent)
- [ ] Uses the same `CellId` scheme as `multigrid.ts` `cellRects`

**Verification:** `pnpm exec vitest run src/game/overlapCounts.test.ts`.
**Dependencies:** None (parallel with Task 1). **Files:** `overlapCounts.ts`,
`overlapCounts.test.ts`. **Scope:** S

### Checkpoint: Foundation

- [ ] `pnpm build && pnpm test && pnpm lint` green; no visual change yet

### Phase 2: Rendering + toggle

#### Task 3: Cell tint rendering

**Description:** Thread an optional `overlapCounts` map from `GamePage`
(memoized next to `rects`) through `Board` to `Cell`. `Cell` sets
`data-overlap="2".."5"`. Replace the inert `data-overlap='two'|'four'` CSS
with rules mapping each level to its `--board-overlap-N-bg` token, keeping
their original intent (error fill wins in check mode).

**Acceptance criteria:**

- [ ] All 9 variants show tinted overlap cells; non-multigrid variants
      unaffected (no attribute set)
- [ ] Selection / peer / same-value / error fills still win over the tint
- [ ] Cell test covers: attribute set for overlap cell, absent otherwise

**Verification:** targeted vitest files; manual: `pnpm dev`, spot-check
samurai + twodoku in dark/light/HC.
**Dependencies:** Tasks 1, 2. **Files:** `GamePage.tsx`, `Board/Board.tsx`,
`Cell/Cell.tsx`, `Cell/Cell.module.css`, `Cell.test.tsx`. **Scope:** M

#### Task 4: Generic toggle slot

**Description:** Rename `colorLabelToggle: ReactNode` to `settingToggles` on
`DesktopControls` and `PortraitControls`; `GameInner` assembles the node
(color-label toggle only, at this point). Pure refactor, no behavior change.

**Acceptance criteria:**

- [ ] Color variant still shows a working "Show numbers" toggle (desktop +
      portrait); other variants render nothing in the slot
- [ ] No remaining references to `colorLabelToggle`

**Verification:** existing GameControls/GamePage tests pass unmodified in
behavior (rename-only edits allowed).
**Dependencies:** None (parallel with 1-3). **Files:** `DesktopControls.tsx`,
`PortraitControls.tsx`, `GamePage.tsx` (+ their tests). **Scope:** S

#### Task 5: "Highlight overlaps" toggle

**Description:** `useState(true)` in `GameInner`; render
`<Toggle label="Highlight overlaps" …>` into the `settingToggles` slot when
`variant.layout.kind === 'multigrid'`; when off, don't pass `overlapCounts`
to `Board` (or pass a show flag) so no `data-overlap` attributes render.

**Acceptance criteria:**

- [ ] Toggle appears on all 9 multigrid variants, nowhere else; ON by default
- [ ] Toggling off removes the tint; back on restores it
- [ ] State is not written to localStorage; a fresh mount is ON again

**Verification:** new GamePage test (default-on, toggle-off hides attribute,
no localStorage key); `pnpm test`.
**Dependencies:** Tasks 3, 4. **Files:** `GamePage.tsx`, test file. **Scope:** S

### Checkpoint: Core

- [ ] `pnpm build && pnpm test && pnpm lint` green
- [ ] Manual: toggle works on samurai (desktop + mobile widths), tint legible
      in all four palettes — human review before Phase 3

### Phase 3: Unification + cleanup

#### Task 6: Migrate butterfly / cross / flower

**Description:** Remove the bespoke `data-butterfly` / `data-cross` /
`data-flower` tint plumbing (`Board.tsx:172-174`, `Cell.tsx:126-128`, matching
CSS) so these variants tint solely through the shared `data-overlap` scheme.
Update any tests referencing the retired attributes.

**Acceptance criteria:**

- [ ] The three variants tint overlaps via the ladder and obey the toggle
- [ ] No dead CSS/attributes/tests left behind

**Verification:** `pnpm test`; manual spot-check of the three variants.
**Dependencies:** Tasks 3, 5. **Files:** `Board.tsx`, `Cell.tsx`,
`Cell.module.css`, affected tests. **Scope:** S-M

#### Task 7: Final verification

**Acceptance criteria / verification:**

- [ ] `pnpm build && pnpm test && pnpm lint` all green
- [ ] Manual sweep: all 9 variants, dark/light × HC on/off, toggle on/off,
      check-mode error fill on an overlap cell
- [ ] Working doc updated with outcomes/lessons

**Dependencies:** all. **Scope:** XS (no code, barring findings)

## Risks and Mitigations

| Risk                                                     | Impact | Mitigation                                                                                                            |
| -------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------- |
| No HC-legible tint exists that keeps 4.5:1 text          | Med    | Task 1 is first (fail fast); fallback: single HC tint level or border-based cue — surface to human before improvising |
| Tint-vs-base 3:1 infeasible while text passes            | Low    | Documented accepted shortfall; SR annotator is second carrier                                                         |
| Hidden couplings to retired butterfly/cross/flower attrs | Low    | Task 6 greps for all usages; full suite run                                                                           |

## Parallelization

Tasks 1, 2, 4 are independent (fine for separate agents/sessions). Tasks 3→5→6
are sequential. Contract if parallelizing: Task 3 consumes Task 2's exported
function signature and Task 1's token names.

## Open Questions

(none — all resolved 2026-07-18; implement-here vs Copilot still undecided)

## Status

- [ ] Plan approved
- [ ] Phase 1 · [ ] Checkpoint · [ ] Phase 2 · [ ] Checkpoint · [ ] Phase 3
