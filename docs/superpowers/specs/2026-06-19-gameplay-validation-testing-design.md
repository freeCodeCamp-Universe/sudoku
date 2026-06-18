# Per-Variant Gameplay and Validation Test Suite

Date: 2026-06-19

## Goal

Give every variant systematic, fixture-backed coverage of the two things that make a
puzzle correct and playable: **validation** (the engine flags rule violations and only
rule violations) and **gameplay** (placing, erasing, undoing, revealing, protecting
givens, and detecting a win behave correctly). Today this is covered ad hoc, a few
variants at a time. This suite makes it uniform across the variant registry.

## Relationship to the color effort

This effort depends on `makeFixture(variant, seed)` from the board-color effort
(`2026-06-19-board-color-testing-design.md`), which returns a deterministic
`{ model, solution, givens, structure, parityMap }`. That fixture is the stable board
every test here runs against. The color effort builds it; this effort consumes it. Do
this effort after the color effort lands.

## What already exists (do not duplicate)

`src/engine/validate.test.ts`, `solve.test.ts`, `generate.test.ts` cover the engine
primitives on hand-built models. `src/game/GameProvider.test.tsx` and
`useSudokuGrid.test.ts` cover the reducer and grid hook on a single synthetic variant.
The new value is **per-variant breadth** over the registry, plus **per-constraint**
conflict coverage, both anchored to a shared fixture, not new primitive tests.

## Engine and runtime surface this builds on

- `validate(values, model): Conflict[]`, `Conflict = { cells: CellId[]; constraintId: string }`
  (`src/engine/validate.ts:3`, `src/engine/types.ts:18`).
- `Constraint = { id; conflicts(values, model); permits?(values, cellId, value, model) }`
  (`src/engine/types.ts:51`). Registry of `arrowSum`, `chain`, `cageSum`, `consecutive`,
  `kropki`, `evenOdd`, `greaterThan`, `sandwichSum`, `skyscraperVisibility`, `uniqueness`
  (`src/engine/constraints/registry.ts`).
- `solve(model, givens, { max })`, `hasUniqueSolution(model, givens, { nodeBudget })`,
  `generateSolution(model, rng)`, `generate(model, difficulty, rng)`
  (`src/engine/solve.ts`, `generate.ts`).
- Reducer via `GameProvider` (`src/game/GameProvider.tsx:53`), state shape and actions in
  `src/game/GameContext.ts:11-29`: actions `enterValue`, `toggleCandidate`, `erase`,
  `clearAll`, `undo`, `reveal`, `tick`, `newGame`; `isSolved(values, solution)` win check
  (`GameProvider.tsx:25`); given/revealed cells are edit-protected.
- Grid hook `useSudokuGrid(...)` returns `cellState(id): CellState` with `value`,
  `candidates`, `given`, `revealed`, `selected`, `conflict`, `correct`, `sameValue`,
  `peer` (`src/game/gameTypes.ts:45`, `useSudokuGrid.ts:142`). `conflict` is
  `conflictSet.has(id) && correct !== true`, where `conflictSet` comes from
  `validate(values, model)`.

## Test layers

### Layer 1: Generation soundness (parameterized over all variants)

For each registered variant, `makeFixture(variant, seed)` must produce a solution that is
complete (`solution.size === model.cells.length`) and conflict-free
(`validate(solution, model)` is empty). For variants that guarantee a unique solution,
`solve(model, givens, { max: 2 })` has length 1. Variants that intentionally do not
guarantee uniqueness are marked in a small allowlist and skip only the uniqueness
assertion, with the reason recorded.

### Layer 2: Conflict detection (per constraint)

Two parameterized suites:

- **Uniqueness (all variants):** take the fixture solution, copy it, introduce a
  duplicate within a house (set a second cell in some row to an existing value), and
  assert `validate` returns a conflict whose `constraintId` is `uniqueness` and whose
  `cells` include the offending pair. Then assert the untouched solution validates clean.
- **Special constraints (the variants that carry them):** for `cageSum`, `kropki`,
  `consecutive`, `greaterThan`, `arrowSum`, `sandwichSum`, `skyscraperVisibility`,
  `evenOdd`, `chain`, craft one placement that violates that specific constraint (derived
  from the fixture's `structure`, e.g. a cage's cells, a kropki pair, a parity cell) and
  assert a conflict with the matching `constraintId` appears. Also assert the valid
  fixture solution produces no conflict for that constraint. This is the part that needs
  per-constraint knowledge; each gets its own small, explicit test.

### Layer 3: Gameplay simulation (reducer, fixture-backed)

Render `GameProvider` with a fixture's `givens` and `solution` and drive it through a
small test consumer that dispatches actions and reads state:

- `enterValue` places a value into an empty cell and records history.
- A given cell rejects `enterValue` (protected).
- `erase` clears a placed value; `undo` reverts the last placement.
- `toggleCandidate` adds/removes a pencil mark only on a non-given, value-less cell.
- `reveal` sets a cell to its solution value and marks it revealed (and protected).
- Filling every non-given cell with its solution value flips `state.solved` to true
  (win detection).

This runs on a representative set first (classic plus one multigrid and one
clue-overlay variant), then parameterizes the placement/given-protection/win checks
across the registry where the fixture makes them cheap.

### Layer 4: Grid-hook cell state (representative)

Using `renderHook(useSudokuGrid, …)` with a fixture, assert the derived `CellState`:
selecting a cell sets `selected`; its house members get `peer`; a cell sharing the
selected value gets `sameValue`; a duplicate placement surfaces `conflict`; with
`checkEnabled`, a wrong value gets `correct: false` and `conflict` yields to it.

## Approach notes

- All randomness goes through the `seeded()` LCG so every board is reproducible; record
  the seed in each suite.
- Iterate the variant registry for parameterized layers rather than importing variants
  one by one, so new variants are covered automatically. A variant that needs an
  exception (no uniqueness guarantee, no special constraint) is listed explicitly.
- Reducer tests go through `GameProvider`'s public context (`useGameContext().dispatch`),
  not the unexported reducer, mirroring `GameProvider.test.tsx`.

## Out of scope

- Persistence (`usePersistence` localStorage round-trips): a separate, smaller concern.
- Keyboard navigation: already covered in `useSudokuGrid.test.ts`.
- Any color or visual assertion (that is the color effort).
- Performance/solver-budget tuning.

## Sequencing

1. Registry iteration helper for parameterized suites.
2. Layer 1: generation soundness across all variants.
3. Layer 2a: uniqueness conflict across all variants.
4. Layer 2b: special-constraint conflicts, one suite per constraint.
5. Layer 3: reducer gameplay simulation.
6. Layer 4: grid-hook cell state.
