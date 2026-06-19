import { act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { CellId, SymbolValue, Values, Variant } from '@/engine/types';
import { cellId, range } from '@/engine/grid';
import { validate } from '@/engine/validate';
import { evenOdd } from '@/variants/evenOdd';
import { killer } from '@/variants/killer';
import { arrow } from '@/variants/arrow';
import { consecutiveVariant } from '@/variants/consecutive';
import { greaterThanVariant } from '@/variants/greaterThan';
import { kropki } from '@/variants/kropki';
import { sandwich } from '@/variants/sandwich';
import { skyscraper } from '@/variants/skyscraper';
import { chainVariant } from '@/variants/chain';
import type { Arrow, Cage } from '@/game/gameTypes';
import type { Mark as ConsecutiveMark } from '@/engine/constraints/consecutive';
import type { Relation } from '@/engine/constraints/greaterThan';
import type { KropkiMark } from '@/engine/constraints/kropki';
import type { Chain } from '@/engine/constraints/chain';
import { makeFixture, type Fixture } from './makeFixture';
import { renderPlay } from './renderPlay';

// Pass 2 (gap G3): prove a special constraint's violation surfaces as a runtime
// conflict through the full play path (dispatch -> reducer -> validate ->
// cellState), not just at the engine layer.
//
// A single `cellState.conflict` boolean can't say *which* constraint fired, and
// almost any change to a filled grid also trips a uniqueness conflict. So the
// search below isolates the special constraint: it plays a violation, then picks
// a "witness" cell that the special constraint flags but uniqueness does not.
// Asserting conflict on that witness can only be explained by the special
// constraint, which proves its structure is wired into the model the UI reads.

type Instances = (fixture: Fixture) => CellId[][];

interface VariantCase {
  variant: Variant;
  constraintId: string;
  instances: Instances;
}

interface Violation {
  fixture: Fixture;
  instanceCells: CellId[];
  target: CellId;
  value: SymbolValue;
  witness: CellId;
}

function structureOf<T>(fixture: Fixture): T {
  return fixture.structure as T;
}

function lineCells(index: number, orientation: 'row' | 'col'): CellId[] {
  return range(9).map((n) => (orientation === 'row' ? cellId(index, n) : cellId(n, index)));
}

const VARIANT_CASES: VariantCase[] = [
  {
    variant: kropki,
    constraintId: 'kropki',
    instances: (fixture) =>
      (structureOf<{ kropkiMarks?: KropkiMark[] }>(fixture).kropkiMarks ?? []).map((mark) => [
        mark.a,
        mark.b,
      ]),
  },
  {
    variant: killer,
    constraintId: 'cageSum',
    instances: (fixture) =>
      (structureOf<{ cages?: Cage[] }>(fixture).cages ?? []).map((cage) => [...cage.cells]),
  },
  {
    variant: arrow,
    constraintId: 'arrowSum',
    instances: (fixture) =>
      (structureOf<{ arrows?: Arrow[] }>(fixture).arrows ?? []).map((entry) => [
        entry.bulb,
        ...entry.path,
      ]),
  },
  {
    variant: consecutiveVariant,
    constraintId: 'consecutive',
    instances: (fixture) =>
      (structureOf<{ marks?: ConsecutiveMark[] }>(fixture).marks ?? []).map((mark) => [
        mark.a,
        mark.b,
      ]),
  },
  {
    variant: greaterThanVariant,
    constraintId: 'greaterThan',
    instances: (fixture) =>
      (structureOf<{ relations?: Relation[] }>(fixture).relations ?? []).map((relation) => [
        relation.greater,
        relation.lesser,
      ]),
  },
  {
    variant: evenOdd,
    constraintId: 'evenOdd',
    instances: (fixture) => [...(fixture.parityMap ?? new Map())].map(([id]) => [id as CellId]),
  },
  {
    variant: chainVariant,
    constraintId: 'chain',
    instances: (fixture) =>
      (structureOf<{ chains?: Chain[] }>(fixture).chains ?? []).map((chain) => [...chain.cells]),
  },
  {
    variant: sandwich,
    constraintId: 'sandwichSum',
    instances: (fixture) => {
      const structure = structureOf<{ rows?: number[]; cols?: number[] }>(fixture);
      const rows = (structure.rows ?? [])
        .map((clue, index) => (clue > 0 ? lineCells(index, 'row') : null))
        .filter((cells): cells is CellId[] => cells !== null);
      const cols = (structure.cols ?? [])
        .map((clue, index) => (clue > 0 ? lineCells(index, 'col') : null))
        .filter((cells): cells is CellId[] => cells !== null);
      return [...rows, ...cols];
    },
  },
  {
    variant: skyscraper,
    constraintId: 'skyscraperVisibility',
    instances: (fixture) => {
      const clues = structureOf<{
        clues?: { start?: number[]; end?: number[]; top?: number[]; bottom?: number[] };
      }>(fixture).clues;
      const rowClued = range(9).filter(
        (index) => (clues?.start?.[index] ?? 0) > 0 || (clues?.end?.[index] ?? 0) > 0
      );
      const colClued = range(9).filter(
        (index) => (clues?.top?.[index] ?? 0) > 0 || (clues?.bottom?.[index] ?? 0) > 0
      );
      return [
        ...rowClued.map((index) => lineCells(index, 'row')),
        ...colClued.map((index) => lineCells(index, 'col')),
      ];
    },
  },
];

// Search seeds and per-instance single-cell mutations for a played state where
// the target constraint flags a cell that uniqueness leaves alone (the witness).
function findViolation({ variant, constraintId, instances }: VariantCase): Violation {
  for (let seed = 1; seed <= 50; seed += 1) {
    const fixture = makeFixture(variant, seed);
    const withStructureModel = { ...fixture.model, structure: fixture.structure };

    for (const cells of instances(fixture)) {
      const openCells = cells.filter((id) => !fixture.givens.has(id));

      for (const target of openCells) {
        const solutionValue = fixture.solution.get(target);

        for (const candidate of fixture.model.symbols) {
          if (candidate === solutionValue) {
            continue;
          }

          const played: Values = new Map(fixture.givens);
          for (const id of cells) {
            const value = id === target ? candidate : fixture.solution.get(id);
            if (value !== undefined) {
              played.set(id, value);
            }
          }

          const special = new Set(
            validate(played, withStructureModel)
              .filter((conflict) => conflict.constraintId === constraintId)
              .flatMap((conflict) => conflict.cells)
          );
          const uniqueness = new Set(
            validate(played, fixture.model).flatMap((conflict) => conflict.cells)
          );
          const witness = [...special].find((id) => !uniqueness.has(id));

          if (witness !== undefined) {
            return { fixture, instanceCells: cells, target, value: candidate, witness };
          }
        }
      }
    }
  }

  throw new Error(`no isolating ${constraintId} violation found for ${variant.id}`);
}

describe('special-constraint gameplay', () => {
  it.each(VARIANT_CASES)(
    'should surface a played $constraintId violation as a runtime conflict and clear it on erase',
    (variantCase) => {
      const violation = findViolation(variantCase);
      const { fixture } = violation;
      const { result } = renderPlay(variantCase.variant, { fixture });
      const openCells = violation.instanceCells.filter((id) => !fixture.givens.has(id));

      act(() => {
        for (const id of openCells) {
          const value = id === violation.target ? violation.value : fixture.solution.get(id)!;
          result.current.dispatch({ type: 'enterValue', cellId: id, value });
        }
      });

      expect(result.current.cellState(violation.witness).conflict).toBe(true);

      act(() => result.current.dispatch({ type: 'erase', cellId: violation.target }));

      expect(result.current.cellState(violation.witness).conflict).toBe(false);
    }
  );
});
