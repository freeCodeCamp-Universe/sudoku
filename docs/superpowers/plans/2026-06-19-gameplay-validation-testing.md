# Per-Variant Gameplay and Validation Test Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Prerequisite:** the board-color effort (`2026-06-19-board-color-testing.md`) must be merged first; this plan imports `makeFixture` / `seeded` from `src/game/testing/makeFixture.ts`.

**Goal:** Systematic, fixture-backed per-variant coverage of validation (conflicts) and gameplay (reducer actions, win detection), uniform across the variant registry.

**Architecture:** Parameterized suites iterate the variant registry, build a deterministic board with `makeFixture`, and assert engine and reducer behavior. Conflict tests use `validate` directly; gameplay tests drive `GameProvider` through its context; cell-state tests use `renderHook(useSudokuGrid)`.

**Tech Stack:** TypeScript, React, Vitest + @testing-library/react + jest-dom (jsdom), pnpm.

## Global Constraints

- Package manager **pnpm**. Single-run tests only: `pnpm exec vitest run <path>`.
- Verify before done: `pnpm build && pnpm test && pnpm lint`.
- File naming: name files after their export; never `index.test.tsx`. Named exports only.
- Tests: `should`-style names; query by role/label; `userEvent` for interaction; assert focus with `toHaveFocus()`.
- Imports: `@/` alias for `src`.
- All randomness through `seeded(n)`; record the seed in each suite.
- Commits: conventional `<type>: <description>`; no `Co-Authored-By: Claude` trailer.
- Branch: create a new branch off `main` (e.g. `test/gameplay-validation`) once the color branch is merged.

---

### Task 1: Variant registry iteration helper

A single list of every registered variant so the parameterized suites cover new variants automatically, plus an allowlist for documented exceptions.

**Files:**

- Create: `src/game/testing/allVariants.ts`
- Create: `src/game/testing/allVariants.test.ts`

**Interfaces:**

- Produces: `allVariants(): Variant[]` and `houseCellIds(house): CellId[]` (normalizes the house shape).

- [ ] **Step 1: Confirm the registry and house shapes**

Run: `grep -rn "export" src/variants/registry.ts; grep -rn "interface House\|type House\|houses" src/engine/types.ts`
Expected: the variant-registry export (a map or array) and the `House` shape (whether `house.cells` or a bare `CellId[]`). Use these in Steps 3-4.

- [ ] **Step 2: Write the failing test**

```ts
// src/game/testing/allVariants.test.ts
import { describe, expect, it } from 'vitest';
import { allVariants } from './allVariants';

describe('allVariants', () => {
  it('should include the classic variant', () => {
    expect(allVariants().some((v) => v.id === 'classic')).toBe(true);
  });

  it('should expose a unique id per variant', () => {
    const ids = allVariants().map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `pnpm exec vitest run src/game/testing/allVariants.test.ts`
Expected: FAIL ("Failed to resolve import './allVariants'").

- [ ] **Step 4: Implement the helper**

```ts
// src/game/testing/allVariants.ts
import type { CellId, Variant } from '@/engine/types';
import { variantRegistry } from '@/variants/registry'; // adjust to the name Step 1 found

export function allVariants(): Variant[] {
  return Object.values(variantRegistry);
}

// Normalize a house to its cell ids (adjust per the House shape from Step 1).
export function houseCellIds(house: unknown): CellId[] {
  if (Array.isArray(house)) {
    return house as CellId[];
  }
  return (house as { cells: CellId[] }).cells;
}

// Variants that intentionally do not guarantee a unique solution.
// Add ids here with a reason; Layer 1 skips only their uniqueness assertion.
export const NON_UNIQUE_VARIANTS = new Set<string>();
```

If `variantRegistry` is an array, return it directly. Confirm `classic`'s id string.

- [ ] **Step 5: Run to verify it passes, then commit**

Run: `pnpm exec vitest run src/game/testing/allVariants.test.ts` (PASS).

```bash
git add src/game/testing/allVariants.ts src/game/testing/allVariants.test.ts
git commit -m "test: add variant registry iteration helper"
```

---

### Task 2: Generation soundness across all variants

**Files:**

- Create: `src/game/testing/generationSoundness.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/game/testing/generationSoundness.test.ts
import { describe, expect, it } from 'vitest';
import { validate } from '@/engine/validate';
import { solve } from '@/engine/solve';
import { allVariants, NON_UNIQUE_VARIANTS } from './allVariants';
import { makeFixture } from './makeFixture';

describe('generation soundness', () => {
  it.each(allVariants())('should produce a complete, valid solution for $id', (variant) => {
    const { model, solution } = makeFixture(variant, 1);
    expect(solution.size).toBe(model.cells.length);
    expect(validate(solution, model)).toEqual([]);
  });

  it.each(allVariants().filter((v) => !NON_UNIQUE_VARIANTS.has(v.id)))(
    'should generate a uniquely solvable puzzle for $id',
    (variant) => {
      const { model, givens } = makeFixture(variant, 2);
      expect(solve(model, givens, { max: 2 })).toHaveLength(1);
    }
  );
});
```

- [ ] **Step 2: Run it**

Run: `pnpm exec vitest run src/game/testing/generationSoundness.test.ts`
Expected: most pass. Any variant that fails uniqueness either has a generation bug (investigate per `superpowers:systematic-debugging`) or is intentionally non-unique (add its id to `NON_UNIQUE_VARIANTS` with a reason comment). Any that times out: raise the seed or note a slow-variant skip with a logged reason. Do not silently widen the allowlist.

- [ ] **Step 3: Commit**

```bash
git add src/game/testing/generationSoundness.test.ts src/game/testing/allVariants.ts
git commit -m "test: verify generation soundness across all variants"
```

---

### Task 3: Uniqueness conflict detection across all variants

**Files:**

- Create: `src/game/testing/uniquenessConflicts.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/game/testing/uniquenessConflicts.test.ts
import { describe, expect, it } from 'vitest';
import type { Values } from '@/engine/types';
import { validate } from '@/engine/validate';
import { allVariants, houseCellIds } from './allVariants';
import { makeFixture } from './makeFixture';

describe('uniqueness conflict detection', () => {
  it.each(allVariants())('should report no conflict on the $id solution', (variant) => {
    const { model, solution } = makeFixture(variant, 3);
    expect(validate(solution, model)).toEqual([]);
  });

  it.each(allVariants())('should flag a duplicate within a house on $id', (variant) => {
    const { model, solution } = makeFixture(variant, 3);
    const house = model.houses.find((h) => houseCellIds(h).length >= 2);
    expect(house).toBeDefined();
    const [a, b] = houseCellIds(house);
    const bad: Values = new Map(solution);
    bad.set(b, solution.get(a)!); // force a duplicate of a's value into the same house

    const conflicts = validate(bad, model);
    expect(conflicts.some((c) => c.constraintId === 'uniqueness')).toBe(true);
  });
});
```

- [ ] **Step 2: Run it**

Run: `pnpm exec vitest run src/game/testing/uniquenessConflicts.test.ts`
Expected: PASS. If a variant's first usable house has a quirk (e.g. the duplicate happens to remain valid under that variant's house definition), pick the house differently or use `model.houses[0]`; the injected duplicate must violate uniqueness within one house.

- [ ] **Step 3: Commit**

```bash
git add src/game/testing/uniquenessConflicts.test.ts
git commit -m "test: verify uniqueness conflicts across all variants"
```

---

### Task 4: Special-constraint conflict detection

One small suite per non-uniqueness constraint, deriving a violating placement from the fixture's `structure`. Each constraint is independent; do them as separate `describe` blocks (or files) so a failure isolates cleanly.

**Files:**

- Create: `src/game/testing/specialConstraints.test.ts`

**Interfaces consumed:** `validate(values, model)`; the fixture `structure` shapes from the color spec table (parity `Map<CellId,0|1>`, cages `{cells,sum}[]`, kropki/consecutive marks, greater-than `{greater,lesser}[]`, arrows `{bulb,path}[]`, etc.).

- [ ] **Step 1: Write one fully-worked case first (even-odd)**

```ts
// src/game/testing/specialConstraints.test.ts
import { describe, expect, it } from 'vitest';
import type { CellId, Values } from '@/engine/types';
import { validate } from '@/engine/validate';
import { evenOdd } from '@/variants/evenOdd';
import { makeFixture } from './makeFixture';

describe('special-constraint conflicts', () => {
  describe('even-odd', () => {
    it('should report no parity conflict on the solution', () => {
      const { model, solution } = makeFixture(evenOdd, 5);
      expect(validate(solution, model).some((c) => c.constraintId === 'evenOdd')).toBe(false);
    });

    it('should flag a cell whose value breaks its required parity', () => {
      const { model, solution, parityMap } = makeFixture(evenOdd, 5);
      // find an even-required cell and a value of the wrong parity from the symbols
      const evenCell = [...(parityMap ?? [])].find(([, p]) => p === 0)?.[0] as CellId;
      const oddValue = model.symbols.find((s) => Number(s) % 2 === 1)!;
      const bad: Values = new Map(solution);
      bad.set(evenCell, oddValue);

      expect(validate(bad, model).some((c) => c.constraintId === 'evenOdd')).toBe(true);
    });
  });
});
```

Confirm the `evenOdd` constraint id string and the parity convention (`0` = even) by reading `src/engine/constraints/evenOdd.ts` and `src/variants/evenOdd.ts`.

- [ ] **Step 2: Run the even-odd case**

Run: `pnpm exec vitest run src/game/testing/specialConstraints.test.ts -t "even-odd"`
Expected: PASS.

- [ ] **Step 3: Add a `describe` block per remaining constraint**

For each of `cageSum` (killer), `kropki`, `consecutive`, `greaterThan`, `arrowSum`,
`sandwichSum`, `skyscraperVisibility`, `chain`: read its constraint file in
`src/engine/constraints/` to learn the conflict rule and the relevant `structure` shape,
then write two `it`s mirroring the even-odd pair: (a) the fixture solution has no conflict
for that `constraintId`; (b) a deliberately violating placement derived from `structure`
(over-sum a cage, break a kropki ratio/consecutive adjacency, invert a greater-than pair,
mis-sum an arrow, etc.) produces a conflict with that `constraintId`. Run each block as
you add it:

Run: `pnpm exec vitest run src/game/testing/specialConstraints.test.ts -t "<constraint>"`
Expected: PASS per block.

- [ ] **Step 4: Full run and commit**

Run: `pnpm exec vitest run src/game/testing/specialConstraints.test.ts && pnpm build`
Expected: PASS.

```bash
git add src/game/testing/specialConstraints.test.ts
git commit -m "test: verify special-constraint conflict detection"
```

---

### Task 5: Reducer gameplay simulation

Drive `GameProvider` through its context with a fixture-backed board.

**Files:**

- Create: `src/game/testing/GameHarness.tsx` (reusable test consumer)
- Create: `src/game/testing/gameplaySimulation.test.tsx`

**Interfaces:**

- Produces: `GameHarness` exposing dispatch buttons and state readouts via testids, and `renderGame(variant, seed)` that wraps `GameProvider` with a fixture's `givens`/`solution`.

- [ ] **Step 1: Confirm GameProvider props and context**

Run: `grep -n "GameProvider\|useGameContext\|interface GameContextValue" src/game/GameProvider.tsx src/game/GameContext.ts`
Expected: `GameProvider` props (`variant`, `model`, `givens`, `solution`) and `useGameContext()` returning `{ state, dispatch, … }`, matching `GameProvider.test.tsx`.

- [ ] **Step 2: Write the failing test and harness**

```tsx
// src/game/testing/GameHarness.tsx
import { render, screen } from '@testing-library/react';
import type { CellId, Variant } from '@/engine/types';
import { GameProvider } from '@/game/GameProvider';
import { useGameContext } from '@/game/GameContext';
import { makeFixture } from './makeFixture';

function Probe({ cell }: { cell: CellId }) {
  const { state, dispatch, solution } = useGameContext();
  return (
    <div>
      <span data-testid="value">{String(state.values.get(cell) ?? '')}</span>
      <span data-testid="history">{state.history.length}</span>
      <span data-testid="solved">{String(state.solved)}</span>
      <button onClick={() => dispatch({ type: 'enterValue', cellId: cell, value: 5 })}>
        enter
      </button>
      <button onClick={() => dispatch({ type: 'erase', cellId: cell })}>erase</button>
      <button onClick={() => dispatch({ type: 'undo' })}>undo</button>
      <button
        onClick={() =>
          dispatch({ type: 'reveal', cellId: cell, solutionValue: solution.get(cell)! })
        }
      >
        reveal
      </button>
    </div>
  );
}

export function renderGame(variant: Variant, cell: CellId, seed = 9) {
  const { model, givens, solution } = makeFixture(variant, seed);
  render(
    <GameProvider variant={variant} model={model} givens={givens} solution={solution}>
      <Probe cell={cell} />
    </GameProvider>
  );
  return { screen, givens, solution };
}
```

```tsx
// src/game/testing/gameplaySimulation.test.tsx
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import { classic } from '@/variants/classic';
import { renderGame } from './GameHarness';

describe('gameplay simulation', () => {
  it('should place a value into an empty cell and record history', async () => {
    const user = userEvent.setup();
    const { givens } = renderGame(classic, findEmptyCell());
    await user.click(screen.getByRole('button', { name: 'enter' }));
    expect(screen.getByTestId('value')).toHaveTextContent('5');
    expect(screen.getByTestId('history')).toHaveTextContent('1');
  });

  it('should revert the last placement on undo', async () => {
    const user = userEvent.setup();
    renderGame(classic, findEmptyCell());
    await user.click(screen.getByRole('button', { name: 'enter' }));
    await user.click(screen.getByRole('button', { name: 'undo' }));
    expect(screen.getByTestId('value')).toHaveTextContent('');
  });
});
```

`findEmptyCell()` picks a cell not in `givens` from the fixture; implement it as a tiny
helper in the test (build the fixture once, return the first `model.cells[i].id` whose id
is not a given). Confirm `classic`'s export name and that `value: 5` is a legal symbol
there.

- [ ] **Step 3: Run, then implement to green**

Run: `pnpm exec vitest run src/game/testing/gameplaySimulation.test.tsx`
Expected: FAIL first (missing helper/import), then PASS after wiring `findEmptyCell` and confirming names.

- [ ] **Step 4: Add given-protection, reveal, and win cases**

Add tests: clicking `enter` on a _given_ cell leaves its value unchanged (protected);
`reveal` sets the cell to its solution value; filling every non-given cell with its
solution value sets `data-testid="solved"` to `true`. For the win case, extend `Probe`
with a "solve all" button that dispatches `enterValue` for each non-given cell with its
solution value, then assert `solved` is `true`.

- [ ] **Step 5: Run and commit**

Run: `pnpm exec vitest run src/game/testing/gameplaySimulation.test.tsx && pnpm build`
Expected: PASS.

```bash
git add src/game/testing/GameHarness.tsx src/game/testing/gameplaySimulation.test.tsx
git commit -m "test: simulate reducer gameplay on fixture boards"
```

---

### Task 6: Grid-hook cell-state derivation

**Files:**

- Create: `src/game/testing/cellStateDerivation.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/game/testing/cellStateDerivation.test.ts
import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type React from 'react';
import { classic } from '@/variants/classic';
import { useSudokuGrid } from '@/game/useSudokuGrid';
import { makeFixture } from './makeFixture';

describe('cell-state derivation', () => {
  it('should mark the clicked cell selected and its house peers as peer', () => {
    const { model } = makeFixture(classic, 4);
    const { result } = renderHook(() =>
      useSudokuGrid({
        cells: model.cells,
        model,
        values: new Map(),
        givens: new Set(),
        onEnterValue: () => {},
        onToggleCandidate: () => {},
      })
    );

    act(() => {
      result.current.cellProps('r0c0').onClick?.({} as React.MouseEvent<HTMLDivElement>);
    });

    expect(result.current.cellState('r0c0').selected).toBe(true);
    expect(result.current.cellState('r0c1').peer).toBe(true);
    expect(result.current.cellState('r5c5').peer).toBe(false);
  });
});
```

Confirm the `useSudokuGrid` required args against `src/game/useSudokuGrid.ts:73` (the read shows `cells`, `model`, `values`, `givens`, `onEnterValue`, `onToggleCandidate` as the minimum) and that `r0c1` shares a house with `r0c0` in classic.

- [ ] **Step 2: Run, then add the remaining derivations**

Run: `pnpm exec vitest run src/game/testing/cellStateDerivation.test.ts`
Expected: PASS. Then add cases: a cell holding the selected cell's value gets
`sameValue: true`; a duplicate placement surfaces `conflict: true`; with
`checkEnabled: true`, a value that differs from the solution gets `correct: false`
and `conflict` yields to `correct` (per `useSudokuGrid.ts:159`,
`conflict: conflictSet.has(id) && correct !== true`).

- [ ] **Step 3: Run and commit**

Run: `pnpm exec vitest run src/game/testing/cellStateDerivation.test.ts && pnpm build && pnpm test && pnpm lint`
Expected: all pass.

```bash
git add src/game/testing/cellStateDerivation.test.ts
git commit -m "test: verify grid-hook cell-state derivation"
```

---

## Self-Review

**Spec coverage:** registry helper (Task 1), Layer 1 generation soundness (Task 2), Layer 2a uniqueness conflicts (Task 3), Layer 2b special constraints (Task 4), Layer 3 reducer gameplay (Task 5), Layer 4 cell-state (Task 6). Sequencing matches the spec.

**Placeholder scan:** `findEmptyCell`, the per-constraint blocks in Task 4, and the registry/house-shape confirmations are explicit "read this file, then write this shape" steps, each with the pattern shown, not deferred work.

**Type consistency:** `allVariants`/`houseCellIds`/`NON_UNIQUE_VARIANTS` (Task 1) are consumed by Tasks 2-3; `makeFixture` (color effort) by all; `renderGame`/`Probe` (Task 5) reused by its own cases. `Conflict.constraintId` strings must match the registry ids confirmed while writing each constraint block.

**Dependency note:** every task imports `makeFixture`/`seeded` from the color effort. If that effort is not yet merged, this plan cannot start; that prerequisite is stated in the header.
