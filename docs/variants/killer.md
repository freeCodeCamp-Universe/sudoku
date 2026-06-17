# Killer Sudoku

Baseline specification for the Killer Sudoku variant. The purpose of this document
is to pin a single canonical interpretation of the rules so the implementation is
not re-derived from memory or a conflicting source. Before changing how Killer is
generated, modeled, or rendered, confirm the change against the canonical source
below and keep the enforcing tests green.

## Canonical source

- Killer Sudoku (also "sumdoku", "addoku"). No single trademark owner; rules are a
  worldwide convention.
- Primary source: https://en.wikipedia.org/wiki/Killer_sudoku (core rules).
- Secondary references: https://sudoku.com/killer and
  https://artisanalsudoku.substack.com/p/the-basics-of-killer-sudoku (cage and
  single-cell conventions).
- Last verified: 2026-06-18.

Quoted rules (Wikipedia): "Each row, column, and nonet contains each number exactly
once." "The sum of all numbers in a cage must match the small number printed in its
corner." "No number appears more than once in a cage. (This is the standard rule for
killer sudokus, and implies that no cage can include more than 9 cells.)" "The
solution must be unique."

## Shape

- A standard 9x9 grid with 3x3 boxes (`layout: { kind: 'grid', size: 9, box: { rows: 3, cols: 3 } }`).
- Symbols: digits 1 to 9 (`symbolKind: 'digit'`).

## Rules (constraint set)

- **Standard sudoku uniqueness** (`uniqueness` constraint): no digit repeats in any
  row, column, or 3x3 box.
- **Cage sum** (`cageSum` constraint): cells are partitioned into cages. The digits
  in a cage must sum to the cage's target, and no digit may repeat within a cage.
  Cages must cover all 81 cells exactly once (a partition).

## Interpretation decisions

These are the choices made where the rules left room, with the reasoning. Revisit
them only with a reason that overrides the one recorded here.

- **Cage sizes are 2 to 4 cells.** The rules permit any cage size from 1 to 9.
  Single-cell cages are legal but degenerate: a one-cell cage with clue 5 is just a
  given 5, and standard puzzles avoid them. This implementation deliberately targets
  cages of 2, 3, or 4 cells. The minimum of 2 keeps every cage a genuine sum
  constraint; the maximum of 4 keeps cage-combination reasoning tractable for an
  intermediate-difficulty puzzle. A size-1 cage is treated as a defect: orphaned
  cells are merged into an adjacent cage, and a carve that cannot satisfy the 2-to-4
  range is discarded and retried (see Generation).
- **No repeated digit within a cage, enforced at carve time too.** `cageSum` enforces
  the no-repeat rule during play, but a carve that groups two cells sharing the same
  solution digit would make the solution itself invalid under `cageSum`. Carving
  therefore rejects any cage whose solution digits are not all distinct, both when
  growing a cage and when merging an orphan into one.
- **Starting clues are provided, and intentionally kept plentiful (~24).**
  Traditional Killer Sudoku starts with *no* given digits and is solved purely from
  cage sums. This implementation pre-fills roughly a quarter of the board. That is a
  deliberate difficulty choice: a clue-free Killer is hard and intimidating, and this
  variant is labeled intermediate for a broad audience, so the extra givens make it
  more approachable. The engine's clue-removal keeps the solution unique. The
  configured `15` is a target floor the generator never actually reaches for Killer
  (see Generation for why), not a hard cap.
- **Cages carry no per-cage uniqueness beyond the no-repeat rule.** `cageSum`
  enforces both the target sum (only when the cage is fully filled) and the
  no-duplicate-digit rule within the cage. There is no constraint that a cage's
  digits be consecutive or otherwise patterned.

## Generation

- **Cage carving** (`deriveStructure: carveCages` in `src/variants/killer.ts`):
  starting from a shuffled cell order, each unassigned cell seeds a cage with an
  intended size of 2, 3, or 4, grown by attaching unassigned orthogonal neighbors.
  The cage sum is the sum of the solution digits in its cells. `carveCagesOnce`
  produces one raw partition; `mergeOrphans` folds any size-1 cage into the smallest
  adjacent cage that keeps digits distinct; `carveCages` retries the carve (up to
  `MAX_CARVE_ATTEMPTS`) until every cage is size 2-4 with distinct digits, falling
  back to the first attempt if the cap is somehow reached.
- **Givens** (`generateGivens: makeGenerateGivens(15)`): the shared 9x9 generator in
  `src/variants/generateGivens9x9.ts`. It begins with the full solution (81 cells)
  and removes cells one at a time, keeping a removal only if the puzzle still has a
  unique solution, stopping when it reaches the target (15) or can remove no more.
  **The target is a floor, not the resulting count, and Killer never reaches it.**
  The reason is the wiring: `generate` runs against the model built from the variant
  spec (`GamePage.tsx`), which does **not** carry the carved cage structure — cages
  are derived separately, afterward. So `cageSum.conflicts` sees no cages during
  generation and clue removal is driven by plain row/column/box uniqueness alone,
  never by cage sums. That bottoms out around ~24 givens, well above 15. Two
  consequences worth knowing: the `15` argument is effectively inert for Killer, and
  the resulting clue density is the plain-sudoku density, which (per the difficulty
  decision above) is kept as-is rather than pushed lower. This is current behavior,
  not a regression.

## Known issues

Documented here so they are not mistaken for correct behavior. These are live as of
2026-06-18.

- **`carveCages` ignores the provided rng.** It calls `Math.random()` and
  `shuffle(range(N*N))` directly instead of threading the `rng` argument that the
  rest of the pipeline uses. Carving is therefore non-deterministic even when a
  seeded rng is supplied, which makes any test that asserts on the carved structure
  inherently non-reproducible. (The size-1 defect above is frequent enough that the
  size test fails regardless.)

## Implementation

- Variant spec, cage carving, and help text: `src/variants/killer.ts`.
- Shared givens generator: `src/variants/generateGivens9x9.ts`.
- Cage sum / no-repeat constraint: `src/engine/constraints/cageSum.ts`.
- Cage outline overlay: `src/game/overlays/CageOverlay/`.
- Cage-sum corner annotator: `src/game/annotators/cage.ts`.
- Gallery preview: `src/gallery/previews/KillerPreview.tsx`.

## Enforcing tests

These tests encode the spec above and will fail if the behavior drifts. Keep them in
sync with this document.

- `src/variants/killer.test.ts` — layout, constraint/overlay/annotator ids, cages
  cover all 81 cells, cage sizes are 2 to 4, cage sums match cell values, a cage-sum
  violation is detected, the solution validates, and generated givens match the
  solution.
- `src/engine/constraints/cageSum.test.ts` — the cage-sum and no-repeat constraint
  in isolation.
