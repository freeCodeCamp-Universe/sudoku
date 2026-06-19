# Gameplay validation: test-coverage gap analysis and plan

Scope: the `test/gameplay-validation` work. This doc inventories what gameplay/validation
coverage exists today, identifies the gaps, and proposes a per-variant play-simulation
suite that fills them without duplicating the engine-level tests.

## Goal

Tests that **generate a board, play moves into it, and assert the resulting scenario/state**
(conflict, correct/incorrect, solved, locked) surfaces through the runtime — for every
variant, not just classic.

## Runtime facts the tests must exercise

These are the moving parts a "played" test touches, top to bottom:

- **Reducer actions** (`GameProvider` / `GameContext`): `enterValue`, `toggleCandidate`,
  `erase`, `clearAll`, `undo`, `reveal`, `tick`, `newGame`.
  - `enterValue`/`erase`/`toggleCandidate`/`reveal` are no-ops on **given** or **revealed** cells.
  - `solved` is recomputed on every mutation via exact-match `isSolved(values, solution)`.
- **Derivation** (`useSudokuGrid`): builds `conflictSet` from `validate(values, model)`,
  derives per-cell `CellState`: `value`, `candidates`, `given`, `revealed`, `selected`,
  `conflict`, `correct`, `sameValue`, `peer`.
  - Rule under test: `conflict = conflictSet.has(id) && correct !== true` — a provably
    correct cell is never flagged. Conflict shows regardless of `checkEnabled`; `correct`
    only when `checkEnabled`.
  - Peers come from `model.houses` filtered by `model.peerHouseFilter` (matters for multigrid).
- **Render** (`Cell`): paints `data-conflict`, `data-correct`/`data-incorrect`, `data-peer`,
  `data-same-value`, and the warning icon from those props.

The validation pipeline is therefore: `dispatch → state.values → useSudokuGrid(validate) →
CellState → Cell data-*`. No existing test drives that whole path from a played move.

## Coverage today

Three layers exist. Only the engine layer is broad; only the play layer is "played"; they
never meet on the same model.

| Layer        | Files                                                              | Variants                  | Drives state by                                                        | Asserts                                                        |
| ------------ | ------------------------------------------------------------------ | ------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------- |
| Engine logic | `uniquenessConflicts`, `specialConstraints`, `generationSoundness` | **all 32**                | calls `validate()` / `generate()` / `solve()` directly                 | conflict arrays, solvability, uniqueness                       |
| Derivation   | `cellStateDerivation`, `useSudokuGrid.test`                        | classic + 1 synthetic 9x9 | **injects** a `values` Map                                             | `conflict`/`correct`/`peer`/`sameValue`, aria-label, announcer |
| Play         | `gameplaySimulation`, `GameProvider.test`                          | classic only              | **dispatches** reducer actions (synthetic Probe, hardcoded `value: 5`) | `value` / `history` / `solved`                                 |

Runtime tests touch only classic, jigsaw, color, skyscraper, arrow, samurai — and the latter
five only for rendering/announcements, never conflict/solve via play. The play layer never
asserts conflict or correct; the derivation layer never plays.

## Gaps

### Wiring (highest value)

- **G1. Play → conflict never connected.** No test dispatches a move that duplicates a peer,
  then reads `cellState(id).conflict`. `gameplaySimulation` plays but checks only
  value/history/solved; `cellStateDerivation` checks conflict but injects state.
- **G2. Real UI interaction → rendered marker untested.** `GamePage` tests click cells/numpad
  but assert only rendering and announcer text. Clicking a real `Cell` + `NumberPad` digit and
  asserting the board paints `data-conflict` / the warning icon is never done. `Cell.test`
  proves the marker renders _from props_; nothing proves play _produces_ those props.
- **G3. Special constraints never surface at runtime.** `specialConstraints` proves
  `kropki`/`cageSum`/`arrowSum`/etc. `conflicts()` fire in isolation. Nothing proves a
  violating play turns into a flagged cell through `useSudokuGrid`'s `validate()` aggregation.

### Breadth ("each variant")

- **G4. 26 of 32 variants have zero play/runtime coverage.**
- **G5. Extra-house variants unexercised through play.** `asterisk`, `windoku`, `sudoku-x`,
  `center-dot`, `girandola` add houses via `extraHouses`; a duplicate in the _extra_ house
  surfacing a conflict at runtime is untested.
- **G6. Multigrid overlap untested through play.** `samurai`, `twodoku`, `tripledoku`,
  `gattai-3`, `kazaguruma`, `sohei`, `flower`, `butterfly`, `cross` rely on `peerHouseFilter`
  and overlapping houses. Peer highlighting and cross-grid conflict via play are untested.
- **G7. Non-digit symbol entry per variant.** `super` (A-G), `color`, `wordoku` route through
  `renderSymbol` / letter-key handling. Entering a non-digit symbol and having it land + conflict
  is only tested on the synthetic model.
- **G8. Triangular layout (`sujiken`)** has no runtime play coverage.

### Reducer actions (incomplete play matrix)

- **G9.** `clearAll`, `toggleCandidate`, `newGame`, `tick` are never dispatched in a simulation.
  `gameplaySimulation` covers enter/undo/reveal/solve-all; `GameProvider.test` adds erase.
  Candidate pencil-marks and clear-all have no play coverage.
- **G10. Revealed-cell immutability through play.** Given-cell rejection is tested; that a
  _revealed_ cell then rejects `enterValue`/`erase`/`toggleCandidate` is not (reducer guards on
  `revealed`, untested).

### Scenarios / state

- **G11. `checkEnabled` correct/incorrect never played per variant** (only injected on classic
  and the synthetic model).
- **G12. Negative solved case.** `solve all` always fills the real solution, so `solved === true`
  is the only path tested. Filling the board fully but _wrong_ and asserting `solved === false`
  is untested.
- **G13. Conflict clears on erase/undo through play** is untested (only the set path is, via
  injection).

## Collision with existing tests

No file/name collision (new file). A per-variant play suite **would duplicate**:

- `gameplaySimulation.test.tsx` (classic enter/undo/reveal/solve), and
- the played assertions of `cellStateDerivation.test.ts` (classic conflict/correct).

Resolution:

- **Keep** the engine-logic tests untouched — they remain the source of truth for _whether_ a
  constraint fires. The new suite asserts conflicts _surface at runtime_, not the constraint math.
- **Fold** `gameplaySimulation` and the played parts of `cellStateDerivation` into the new
  parametrized suite (classic becomes one row of the matrix) rather than leaving a classic-only
  duplicate beside it.
- **Tier the assertions** so 32x full-UI renders don't bloat runtime (see below).

## Proposed suite

One new `src/game/testing/variantGameplay.test.ts`, parametrized over `allVariants()`, reusing
`makeFixture` / the `findFixture`-across-seeds helper and a harness wrapping `GameProvider` +
`useSudokuGrid`.

- **Validation assertions run on all 32 variants.** Conflict, correct/incorrect, and solved are
  played and asserted for every variant — this is where each variant's distinct constraint gets
  exercised (`kropki` relationship, `killer` cage sum, `asterisk` extra house, multigrid overlap,
  etc.). Drive `useSudokuGrid` + reducer; no full `GamePage` render needed at this level.
- **Real-DOM click-through is plumbing, not per-variant.** Clicking a `Cell` + `NumberPad` digit
  and asserting the board paints `data-conflict` exercises the same `Cell` / `NumberPad` /
  `useSudokuGrid` wiring regardless of constraint. Assert it once (classic), plus optionally one
  non-grid layout (a multigrid) to cover layout-specific rendering. Not run 32x.

### Cases

1. **Duplicate-in-house conflict (matrix).** Play a value that duplicates a shared-house peer →
   assert `cellState(b).conflict`; undo/erase → assert it clears. Covers G1, G4, G5, G6, G13.
2. **Special-constraint conflict surfaces (per applicable variant).** Reuse
   `specialConstraints`' fixture-finding, play the violating value, assert the cell flags
   conflict at runtime. Covers G3.
3. **check mode (matrix).** With `checkEnabled`, play wrong then right value → assert
   incorrect → correct, and that correct suppresses conflict. Covers G11.
4. **Solved transitions.** Play to solved → `solved === true`; fill fully-but-wrong →
   `solved === false`. Covers G12.
5. **Locked cells.** Reveal a cell, then attempt enter/erase/toggle → assert no change.
   Covers G10.
6. **Action coverage.** `toggleCandidate`, `clearAll`, `newGame` dispatched and asserted.
   Covers G9.
7. **Rendered marker via real interaction (plumbing, ~1-2 variants).** Click a real `Cell` +
   `NumberPad` digit that creates a duplicate → assert the board paints `data-conflict` and the
   warning icon. Covers G2.

### Conventions to honor

- `should`-style names; mirror file name (never `index.test.tsx`).
- Query by role/accessible name; `userEvent` for interaction; no `container.querySelector`,
  no `document.activeElement`.
- `@/` import alias; CSS-module / logical-property rules are irrelevant here (test-only).
- Verify gate before done: `pnpm build && pnpm test && pnpm lint`.

## Implementation status

- **Pass 1 (done):** `variantGameplay.test.ts` + `renderPlay` harness. Duplicate-in-house
  conflict, check mode, solved transition, locked cells, and action coverage across all 32
  variants. Folded in and deleted the classic-only `gameplaySimulation.test.tsx` and the played
  cases of `cellStateDerivation.test.ts`.
- **Pass 2 (done):** `specialConstraintGameplay.test.ts`, parametrized over the 9
  constraint-bearing variants (kropki, killer, arrow, consecutive, greaterThan, evenOdd, chain,
  sandwich, skyscraper). Two harness fixes were required:
  1. `renderPlay` now attaches the variant's derived `structure` to the model (mirroring
     `GamePage.tsx`). Without it `validate()` runs every special constraint against an undefined
     structure, so they silently no-op and no special conflict can ever surface.
  2. `renderPlay` accepts a pre-built `fixture`. Some variants derive structure with `Math.random`
     (e.g. killer's cage carving), so `makeFixture(variant, seed)` is **not** reproducible across
     calls. The test must reuse the exact fixture it inspected to find the violation.

  Isolation technique: a single `cellState.conflict` boolean can't attribute a conflict to a
  specific constraint, and most grid edits also trip a uniqueness conflict. So the test searches
  for a played violation, then asserts on a **witness** cell that the special constraint flags but
  uniqueness does not — a conflict there can only come from the wired special constraint.

- **Known pre-existing flake (out of scope):** `generationSoundness.test.ts`'s cross-seed
  uniqueness check occasionally fails because `src/engine/generate.ts` (and several variant
  structure derivations) use unseeded `Math.random`, so generation is not reproducible from a
  seed. Unrelated to this work; flagged for a separate fix.

## Decisions (resolved)

- **Delete the duplication.** Once classic is a row in the new matrix, remove
  `gameplaySimulation.test.tsx` and the played cases of `cellStateDerivation.test.ts` rather than
  leaving classic-only duplicates. (Engine-logic tests stay as the source of truth for constraint
  math.)
- **All 32 variants get the validation assertions; click-through plumbing does not.** See
  "Proposed suite" — conflict/correct/solved run on every variant; the real-DOM click-to-render
  check runs on ~1-2 (classic plus optionally one multigrid) since that path is
  constraint-independent.
- **jigsaw:** included in every Pass 1 case, no skip. The original plan was to `.skip` the
  solved/check cases, but on implementation none of Pass 1's assertions depend on the solution
  being _unique_ — `isSolved` and `correct` both compare against the stored reference solution,
  which is well-defined for jigsaw. A skip belongs only on a later assertion that genuinely
  depends on uniqueness (e.g. anything calling `solve` and expecting a single result).
