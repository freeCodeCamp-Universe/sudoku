# Argyle

Baseline specification for the Argyle variant. The purpose of this document is to
pin a single canonical interpretation of the rules so the implementation is not
re-derived from memory or a conflicting source. Before changing how Argyle is
generated, modeled, or rendered, confirm the change against the canonical source
below and keep the enforcing tests green.

## Canonical source

- Argyle Sudoku is named for the argyle (diamond lattice) knitting pattern.
- Primary reference: https://sudopedia.org/wiki/Argyle_Sudoku
- Secondary reference: https://sudoku-puzzles.net/sudoku-variations/ and
  https://www.funwithpuzzles.com/2016/01/argyle-sudoku.html
- Last verified: 2026-06-18.

Quoted rule (Sudopedia): "Argyle is a Sudoku Variant that has various additional
(diagonal) regions. Remarkably, it does **not** have the main diagonals, such as in
Sudoku-X, and **4 of the extra regions contain 5 cells, and 4 of them contain 8
cells**. Because they do not contain the full digit range (1-9), the logic you use
differs from regular Sudoku."

## Shape

- A standard 9x9 grid with the usual nine 3x3 boxes.
- Symbols: digits 1 to 9.
- Diagonal stripes are overlaid in an argyle (diamond lattice) pattern. They are the
  only addition over classic sudoku.

## Rules (constraint set)

A digit may not repeat within any of these houses. There are **35 houses** total:
the 27 standard houses (9 rows, 9 columns, 9 boxes) plus **8 argyle stripes**.

The stripes are addressed by the diagonal they sit on:

- **D1 (top-left to bottom-right)**, identified by `offset = row - col`.
- **D2 (top-right to bottom-left)**, identified by `sum = row + col`.

| Group | Count | House IDs      | Length | Cells                                     |
| ----- | ----- | -------------- | ------ | ----------------------------------------- |
| D1    | 1     | `argyle-d1-m4` | 5      | `r0c4 r1c5 r2c6 r3c7 r4c8`                |
| D1    | 1     | `argyle-d1-m1` | 8      | `r0c1 r1c2 r2c3 r3c4 r4c5 r5c6 r6c7 r7c8` |
| D1    | 1     | `argyle-d1-1`  | 8      | `r1c0 r2c1 r3c2 r4c3 r5c4 r6c5 r7c6 r8c7` |
| D1    | 1     | `argyle-d1-4`  | 5      | `r4c0 r5c1 r6c2 r7c3 r8c4`                |
| D2    | 1     | `argyle-d2-4`  | 5      | `r0c4 r1c3 r2c2 r3c1 r4c0`                |
| D2    | 1     | `argyle-d2-7`  | 8      | `r0c7 r1c6 r2c5 r3c4 r4c3 r5c2 r6c1 r7c0` |
| D2    | 1     | `argyle-d2-9`  | 8      | `r1c8 r2c7 r3c6 r4c5 r5c4 r6c3 r7c2 r8c1` |
| D2    | 1     | `argyle-d2-12` | 5      | `r4c8 r5c7 r6c6 r7c5 r8c4`                |

The negative D1 offsets use an `m` prefix in the house id (`-4` -> `m4`).

Defined by the constants in `src/variants/argyle.ts`:

```
ARGYLE_D1_OFFSETS = [-4, -1, 1, 4]   // row - col
ARGYLE_D2_SUMS    = [4, 7, 9, 12]    // row + col
```

## Interpretation decisions

These are the choices made where the rules left room, with the reasoning. Revisit
them only with a reason that overrides the one recorded here.

- **No main diagonals.** The canonical source is explicit that Argyle, unlike
  Sudoku-X, does not constrain the two main diagonals (`offset = 0`, `sum = 8`). An
  earlier implementation used `ARGYLE_D1_OFFSETS = [-3, 0, 3]` and
  `ARGYLE_D2_SUMS = [5, 8, 11]`, which produced 6 stripes of lengths 9/6/6 and
  **included** the main diagonals. That is not Argyle; it is closer to a custom
  three-stripe diagonal variant. The current `[-4, -1, 1, 4]` / `[4, 7, 9, 12]` set
  is the canonical one.
- **Eight stripes, lengths 5 and 8.** The four `±4` / `4,12` stripes hold 5 cells and
  the four `±1` / `7,9` stripes hold 8 cells, matching the source's "4 of 5, 4 of 8."
  None spans the full diagonal, so each stripe is a _partial_ house (it cannot contain
  all of 1-9) and supplies elimination logic rather than a full permutation.
- **Empty-diamond center.** The grid center `r4c4` (`offset = 0`, `sum = 8`) lies on
  neither set and belongs to no stripe. It sits inside an empty diamond and follows
  only the standard row/column/box rules. This is the visual hole at the middle of the
  argyle lattice.
- **Stripes are not peers for generation.** The variant sets
  `peerHouseFilter: (house) => !house.id.startsWith('argyle-')` so the stripes still
  constrain placement but are excluded where peer-based logic would otherwise treat a
  partial house as a full one.
- **Rendering.** The overlay draws the diamond lattice as diagonal line segments
  through each striped cell (D1 corner-to-corner, D2 corner-to-corner the other way),
  not as filled cells. The annotator labels a cell "argyle diagonal" when it lies on
  one stripe and "two argyle diagonals" when it lies on a D1 and a D2 stripe at once.

## Implementation

- Variant spec, stripe constants, and `extraHouses`: `src/variants/argyle.ts`.
- Overlay (diamond lattice lines): `src/game/overlays/ArgyleOverlay.tsx`.
- Annotator (cell descriptions): `src/game/annotators/argyle.ts`.
- Gallery preview: `src/gallery/previews/ArgylePreview.tsx`.

## Enforcing tests

These tests encode the spec above and will fail if the constraint set drifts. Keep
them in sync with this document.

- `src/variants/argyle.test.ts` — house count (35), the eight stripe houses and their
  cells, stripe conflict detection, and that a generated puzzle is uniquely solvable.
- `src/game/annotators/argyle.test.ts` — annotator wording for one-stripe,
  two-stripe, and off-stripe cells.
- `src/game/overlays/ArgyleOverlay.test.tsx` — the overlay renders the lattice.
