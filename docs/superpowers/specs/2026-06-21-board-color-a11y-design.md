# Board Color Accessibility — Design

_Date: 2026-06-21_

## Goal

Make the sudoku board's color usage meet WCAG 2.1 AA across every cell state, every
variant, and both themes; replace the conflict/incorrect warning icon with a
color-based (luminance-safe) error treatment backed by the existing screen-reader
announcements; and add tooling that computes contrast ratios so regressions fail CI.

State colors should stay shared across variants so a color means the same thing
everywhere. Glyphs and icons are used sparingly.

## Decisions (settled during brainstorming)

- **Contrast scope:** comprehensive — text-on-background, state-background
  distinctness, and overlay strokes/dots.
- **WCAG level:** AA (4.5:1 normal text, 3:1 large text and UI-component/state
  indicators).
- **Error states:** "incorrect" and "in conflict" collapse into one shared visual
  "error" look. Screen readers still distinguish them via the announcement.
- **Colorblind safety (default palette):** the single error look is a tinted cell
  **background** (luminance-distinct), not hue alone. This satisfies WCAG 1.4.1 for
  sighted colorblind users without stacking extra cues or reintroducing a glyph.
- **High-contrast theme:** deferred to a later pass. The default dark/light palette
  must be compliant on its own.
- **"Correct" signal:** kept (green text). Confusing green-correct with blue
  normal-entry is harmless because neither means "error"; the error background is what
  carries the critical distinction.

## Background — how the board works today

- Cells render as DOM elements in `src/game/Cell/Cell.tsx`, styled by
  `Cell.module.css` via `data-*` state attributes. Overlays/annotators draw on canvas.
- Cell state is derived in `src/game/useSudokuGrid.ts` (`CellState` in
  `src/game/gameTypes.ts`): `selected`, `conflict`, `correct` (true/false/undefined),
  `sameValue`, `peer`, `given`, `revealed`, plus per-variant markers.
- The conflict/incorrect indicator is a red warning-triangle SVG in `Cell.tsx`
  (rendered when `conflict || correct === false`), filled with `--accent-red`, styled
  by `.incorrectIcon` in `Cell.module.css`.
- A11y already exists: a `role="status" aria-live="polite"` live region
  (`src/game/LiveRegion/LiveRegion.tsx`) plus `getCellLabel()` in `useSudokuGrid.ts`
  append "correct", "incorrect", and "in conflict" to cell announcements.
- Color tokens live in `src/app/theme.css` (`:root` dark, `.light` light). A
  declarative `src/game/testing/colorSpecs.ts` plus the drift test
  `src/game/testing/colorDocs.test.ts` keep `docs/colors.md` honest.

## Architecture

Three parts, buildable in order: tooling first (so palette fixes can be measured),
then palette updates, then the icon removal.

### Part A — Contrast tooling

Mirror the existing `colorSpecs` / `colorDocs` pattern.

- `src/game/testing/contrast.ts` — pure module, no React:
  - `relativeLuminance(hex): number` — WCAG relative luminance.
  - `contrastRatio(fg, bg): number` — WCAG contrast ratio.
  - `compositeOver(top, bottom): hex` — alpha-composite a translucent color over an
    opaque base, for overlays drawn with opacity.
  - Threshold constants: `TEXT_AA = 4.5`, `LARGE_AA = 3`, `UI_AA = 3`.
  - Input parsing handles `#rgb`, `#rrggbb`, and `rgba()`/`#rrggbbaa`.
- `src/game/testing/contrastSpecs.ts` — declarative list of pairs that must pass.
  Each entry: `{ label, fg, bg, threshold, themes }` where `fg`/`bg` are token names
  (or a composed background descriptor for overlays). Only **reachable** combinations
  are listed, so impossible stacks (e.g. given-text on an error background) don't
  produce false failures. Covers:
  1. Value text and candidate text against every reachable resolved cell background
     (base odd/even, peer shades, same-value, per-variant tint, error tint), per
     theme.
  2. State-background distinctness: selected/peer/same-value/error backgrounds vs the
     base cell background at the UI threshold, so each state is perceptible.
  3. Overlay strokes/dots (cage, jigsaw, arrow, kropki, consecutive, argyle) vs their
     resolved background, compositing alpha where the overlay is translucent.
- Token resolution: reuse the `theme.css` parser that `pnpm docs:colors` already uses
  to map token -> hex per theme. (If that parser is not currently importable as a
  module, extract it so both the docs script and the contrast test share it.)
- `src/game/testing/contrast.test.ts` — iterates `contrastSpecs`, `should`-style,
  asserts each pair meets its threshold in both themes. Failure message names the
  pair, theme, actual ratio, and required threshold.
- `pnpm contrast:report` (`scripts/contrast-report.ts`) — prints the full ratio table
  to stdout for humans. No committed `docs/contrast.md` and no second drift gate, to
  keep maintenance cost down. (Open to a committed doc instead if preferred — see Open
  Questions.)

### Part B — Palette review + updates

- Run the checker; collect failing pairs.
- Adjust offending token **values** in `theme.css` to pass AA with minimal aesthetic
  drift — shift lightness, preserve hue where possible.
- Add error-state tokens: `--cell-error-bg` (dark and light). This is the single
  colorblind-safe error treatment. Its CSS rule has high enough specificity to
  override per-variant, peer, and same-value backgrounds so errors look identical
  everywhere.
- Keep one shared token per state semantic (selected, peer, same-value, correct,
  error), reused across all variants.
- Re-run `pnpm docs:colors` so `docs/colors.md` and the drift test stay in sync.

### Part C — Remove the icon

- Delete the warning SVG block in `Cell.tsx` and the `.incorrectIcon` rule in
  `Cell.module.css`.
- Set a single `data-error` attribute on the cell when `conflict || correct === false`;
  style it with `--cell-error-bg`. Value text on the error background must pass the
  text threshold (verified by Part A).
- Keep the distinct `incorrect` vs `in conflict` text in `getCellLabel()` — the visual
  collapses to one look, the announcement does not.
- Verify announcements still fire on value entry and on enabling check.

## Components and interfaces

| Unit                           | Purpose                       | Depends on                                      |
| ------------------------------ | ----------------------------- | ----------------------------------------------- |
| `contrast.ts`                  | WCAG math + alpha compositing | nothing (pure)                                  |
| `contrastSpecs.ts`             | reachable pairs + thresholds  | token names from `theme.css`                    |
| `contrast.test.ts`             | CI gate                       | `contrast.ts`, `contrastSpecs.ts`, theme parser |
| `contrast-report.ts`           | human-readable table          | `contrast.ts`, `contrastSpecs.ts`, theme parser |
| theme parser (shared)          | token -> hex per theme        | `theme.css`                                     |
| `Cell.tsx` / `Cell.module.css` | render error via `data-error` | `--cell-error-bg`                               |

## Testing

- `contrast.ts`: unit tests for known ratios (e.g. black/white = 21:1, mid-greys) and
  for `compositeOver`.
- `contrast.test.ts`: every spec passes AA in both themes.
- `Cell.test.tsx`: drop the `cell-warning-icon` assertions; assert `data-error` is set
  for conflict and for incorrect, and that the error background style applies.
- Existing a11y/announcement tests continue to pass; add one asserting the
  announcement still distinguishes incorrect from in-conflict.
- Full gate: `pnpm build && pnpm test && pnpm lint`, plus `pnpm docs:colors` drift
  check.

## Out of scope

- A separate high-contrast / colorblind-dedicated theme (deferred).
- Changing the "correct" green signal or check-mode behavior beyond the error visual.
- Restyling overlays beyond what AA requires.

## Open questions

- Committed `docs/contrast.md` with its own drift test, or `pnpm contrast:report`
  stdout only? Spec currently assumes stdout-only.
