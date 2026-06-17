# Sujiken

Baseline specification for the Sujiken variant. The purpose of this document is to
pin a single canonical interpretation of the rules so the implementation is not
re-derived from memory or a conflicting source. Before changing how Sujiken is
generated, modeled, or rendered, confirm the change against the canonical source
below and keep the enforcing tests green.

## Canonical source

- Sujiken is a trademarked variant invented by George T. Heineman.
- Primary source: https://sujiken.com/p/ (rules and sample puzzles).
- Secondary reference: https://sudoku.today/g-sujiken/
- Last verified: 2026-06-17.

Quoted rule (sujiken.com): "Place the digits from 1 to 9 so no digit is repeated
within a horizontal row, vertical column or any diagonal in any direction. Also,
no digit is repeated within the three triangular regions and three 3x3 square
regions marked by thick borders."

## Shape

- A right triangle taken from a 9x9 grid. A cell `(row, col)` exists only when
  `col <= row`, giving 45 cells (row 0 has 1 cell, row 8 has 9 cells).
- Symbols: digits 1 to 9 (`symbolKind: 'digit'`).

## Rules (constraint set)

A digit may not repeat within any of these houses. There are **45 houses** total.

| Group | Count | House IDs | Notes |
| --- | --- | --- | --- |
| Rows | 9 | `tri-row-0` .. `tri-row-8` | Row `r` holds columns `0..r`. |
| Columns | 9 | `tri-col-0` .. `tri-col-8` | Column `c` runs downward from the diagonal. |
| Main diagonal | 1 | `tri-diagonal` | The hypotenuse, cells `(i, i)`. |
| Square regions | 3 | `tri-region-1-0`, `tri-region-2-0`, `tri-region-2-1` | Full 3x3 blocks (9 cells each), entirely below the diagonal. |
| Triangular regions | 3 | `tri-region-0-0`, `tri-region-1-1`, `tri-region-2-2` | 3x3 blocks straddling the diagonal (6 cells each). |
| Backward diagonals | 7 | `tri-bdiag-1` .. `tri-bdiag-7` | Lines parallel to the hypotenuse (`row - col = k`), length 8 down to 2. |
| Forward diagonals | 13 | `tri-fdiag-2` .. `tri-fdiag-14` | Anti-diagonals (`row + col = s`), length >= 2. |

The six regions overlay the standard 3x3 block grid onto the triangle and cover all
45 cells exactly once.

## Interpretation decisions

These are the choices made where the rules left room, with the reasoning. Revisit
them only with a reason that overrides the one recorded here.

- **Diagonals: all diagonals, both directions, length >= 2.** The source says "any
  diagonal in any direction," so both the lines parallel to the hypotenuse and the
  crossing anti-diagonals are constrained. Single-cell diagonals are trivially
  satisfied and are not modeled. An earlier implementation constrained only the main
  diagonal; that left the puzzle under-constrained and forced roughly half the board
  to be given.
- **All diagonals over main-diagonal-only.** Measured: with only the main diagonal,
  intermediate puzzles averaged ~22 of 45 givens. With all diagonals, they average
  ~18 (the difficulty target), and density becomes controlled by difficulty rather
  than pinned high by a weak constraint set.
- **Both directions over parallel-only.** The anti-diagonals add no further density
  reduction, but they are required by the literal "any direction" wording. Solution
  variety stays ample (well over 2000 distinct solution grids), so the extra
  constraints do not make puzzles repetitive.
- **No custom clue-removal logic.** Givens are produced by the engine default
  `generate`, which removes a clue only when the remaining puzzle still has a unique
  solution. A previous custom hook stripped the board to a fixed 17 clues without a
  uniqueness check and produced ambiguous puzzles.
- **Rendering.** All-diagonal rules are not drawn (there is no clean way to mark
  every diagonal). Only the six regions get thick borders, via the triangular case
  in the board's box-boundary logic.

## Implementation

- Variant spec and houses: `src/variants/sujiken.ts` (rows/columns come from the
  triangular layout in `src/engine/buildModel.ts`; the diagonal and region houses are
  added by the variant's `extraHouses`).
- Region borders: the `triangular` case in `isBoxBoundary` in
  `src/game/Board/Board.tsx`.
- Gallery preview: `src/gallery/previews/SujikenPreview.tsx`.

## Enforcing tests

These tests encode the spec above and will fail if the constraint set drifts. Keep
them in sync with this document.

- `src/variants/sujiken.test.ts` — house count (45), the diagonal, region, and
  row/column houses, and that a generated puzzle is uniquely solvable.
- `src/variants/sujiken.render.test.tsx` — the board renders all 45 cells.
