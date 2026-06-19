import { describe, expect, it } from 'vitest';
import type { CellId, Values, Variant } from '@/engine/types';
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
import { makeFixture } from './makeFixture';
import type { Cage } from '@/game/gameTypes';
import type { Arrow as ArrowType } from '@/game/gameTypes';
import type { Mark as ConsecutiveMark } from '@/engine/constraints/consecutive';
import type { Relation } from '@/engine/constraints/greaterThan';
import type { KropkiMark } from '@/engine/constraints/kropki';
import type { Chain as ChainType } from '@/engine/constraints/chain';

function findFixture(
  variant: Variant,
  predicate: (structure: unknown) => boolean
): ReturnType<typeof makeFixture> {
  for (let seed = 1; seed <= 50; seed += 1) {
    const fixture = makeFixture(variant, seed);

    if (predicate(fixture.structure)) {
      return fixture;
    }
  }

  throw new Error(`no suitable fixture found for ${variant.id}`);
}

function withStructure(fixture: ReturnType<typeof makeFixture>) {
  return { ...fixture.model, structure: fixture.structure };
}

describe('special-constraint conflicts', () => {
  describe('even-odd', () => {
    it('should report no parity conflict on the solution', () => {
      const fixture = makeFixture(evenOdd, 5);
      expect(
        validate(fixture.solution, withStructure(fixture)).some((c) => c.constraintId === 'evenOdd')
      ).toBe(false);
    });

    it('should flag a cell whose value breaks its required parity', () => {
      const fixture = makeFixture(evenOdd, 5);
      const evenCell = [...(fixture.parityMap ?? [])].find(([, p]) => p === 0)?.[0] as CellId;
      const oddValue = fixture.model.symbols.find((s) => Number(s) % 2 === 1)!;
      const bad: Values = new Map(fixture.solution);
      bad.set(evenCell, oddValue);
      expect(validate(bad, withStructure(fixture)).some((c) => c.constraintId === 'evenOdd')).toBe(
        true
      );
    });
  });

  describe('cageSum', () => {
    it('should report no cage-sum conflict on the solution', () => {
      const fixture = findFixture(killer, (structure) =>
        Boolean((structure as { cages?: Cage[] } | undefined)?.cages?.length)
      );
      expect(
        validate(fixture.solution, withStructure(fixture)).some((c) => c.constraintId === 'cageSum')
      ).toBe(false);
    });

    it('should flag a cage whose total no longer matches its target', () => {
      const fixture = findFixture(killer, (structure) =>
        Boolean((structure as { cages?: Cage[] } | undefined)?.cages?.length)
      );
      const cages = (fixture.structure as { cages?: Cage[] } | undefined)?.cages ?? [];
      const cage = cages.find((entry) => entry.cells.length >= 2);
      if (!cage) throw new Error('no cage in killer fixture');

      const candidates = fixture.model.symbols.filter(
        (value) => !cage.cells.some((cell) => fixture.solution.get(cell) === value)
      );
      const replacement = candidates[0];
      if (replacement === undefined)
        throw new Error('no replacement value found for killer fixture');

      const targetCell = cage.cells[0] as CellId;
      const bad: Values = new Map(fixture.solution);
      bad.set(targetCell, replacement);

      expect(validate(bad, withStructure(fixture)).some((c) => c.constraintId === 'cageSum')).toBe(
        true
      );
    });
  });

  describe('kropki', () => {
    it('should report no kropki conflict on the solution', () => {
      const fixture = findFixture(kropki, (structure) =>
        Boolean((structure as { kropkiMarks?: KropkiMark[] } | undefined)?.kropkiMarks?.length)
      );
      expect(
        validate(fixture.solution, withStructure(fixture)).some((c) => c.constraintId === 'kropki')
      ).toBe(false);
    });

    it('should flag a pair that breaks its kropki relationship', () => {
      const fixture = findFixture(kropki, (structure) =>
        Boolean((structure as { kropkiMarks?: KropkiMark[] } | undefined)?.kropkiMarks?.length)
      );
      const marks =
        (fixture.structure as { kropkiMarks?: KropkiMark[] } | undefined)?.kropkiMarks ?? [];
      const mark = marks[0];
      if (!mark) throw new Error('no kropki mark in kropki fixture');

      const bad: Values = new Map(fixture.solution);
      if (mark.kind === 'black') {
        bad.set(mark.a, 3);
        bad.set(mark.b, 5);
      } else {
        bad.set(mark.a, 2);
        bad.set(mark.b, 6);
      }

      expect(validate(bad, withStructure(fixture)).some((c) => c.constraintId === 'kropki')).toBe(
        true
      );
    });
  });

  describe('consecutive', () => {
    it('should report no consecutive conflict on the solution', () => {
      const fixture = findFixture(consecutiveVariant, (structure) =>
        Boolean((structure as { marks?: ConsecutiveMark[] } | undefined)?.marks?.length)
      );
      expect(
        validate(fixture.solution, withStructure(fixture)).some(
          (c) => c.constraintId === 'consecutive'
        )
      ).toBe(false);
    });

    it('should flag an adjacent pair that is no longer consecutive when it should be', () => {
      const fixture = findFixture(consecutiveVariant, (structure) =>
        Boolean((structure as { marks?: ConsecutiveMark[] } | undefined)?.marks?.length)
      );
      const marks = (fixture.structure as { marks?: ConsecutiveMark[] } | undefined)?.marks ?? [];
      const mark = marks[0];
      if (!mark) throw new Error('no consecutive mark in consecutive fixture');

      const bad: Values = new Map(fixture.solution);
      bad.set(mark.a, 2);
      bad.set(mark.b, 7);

      expect(
        validate(bad, withStructure(fixture)).some((c) => c.constraintId === 'consecutive')
      ).toBe(true);
    });
  });

  describe('greaterThan', () => {
    it('should report no greater-than conflict on the solution', () => {
      const fixture = findFixture(greaterThanVariant, (structure) =>
        Boolean((structure as { relations?: Relation[] } | undefined)?.relations?.length)
      );
      expect(
        validate(fixture.solution, withStructure(fixture)).some(
          (c) => c.constraintId === 'greaterThan'
        )
      ).toBe(false);
    });

    it('should flag an adjacent pair whose inequality is inverted', () => {
      const fixture = findFixture(greaterThanVariant, (structure) =>
        Boolean((structure as { relations?: Relation[] } | undefined)?.relations?.length)
      );
      const relations =
        (fixture.structure as { relations?: Relation[] } | undefined)?.relations ?? [];
      const relation = relations[0];
      if (!relation) throw new Error('no greater-than relation in greaterThan fixture');

      const bad: Values = new Map(fixture.solution);
      bad.set(relation.greater, fixture.solution.get(relation.lesser) ?? 1);

      expect(
        validate(bad, withStructure(fixture)).some((c) => c.constraintId === 'greaterThan')
      ).toBe(true);
    });
  });

  describe('arrowSum', () => {
    it('should report no arrow-sum conflict on the solution', () => {
      const fixture = findFixture(arrow, (structure) =>
        Boolean((structure as { arrows?: ArrowType[] } | undefined)?.arrows?.length)
      );
      expect(
        validate(fixture.solution, withStructure(fixture)).some(
          (c) => c.constraintId === 'arrowSum'
        )
      ).toBe(false);
    });

    it('should flag an arrow whose path sum no longer matches its bulb', () => {
      const fixture = findFixture(arrow, (structure) =>
        Boolean((structure as { arrows?: ArrowType[] } | undefined)?.arrows?.length)
      );
      const arrows = (fixture.structure as { arrows?: ArrowType[] } | undefined)?.arrows ?? [];
      const arrowDef = arrows[0];
      if (!arrowDef) throw new Error('no arrow in arrow fixture');

      const bad: Values = new Map(fixture.solution);
      const target = arrowDef.path[0] as CellId;
      const currentValue = fixture.solution.get(target) ?? 0;
      const replacement = currentValue < 9 ? currentValue + 1 : currentValue - 1;
      bad.set(target, replacement);

      expect(validate(bad, withStructure(fixture)).some((c) => c.constraintId === 'arrowSum')).toBe(
        true
      );
    });
  });

  describe('sandwichSum', () => {
    it('should report no sandwich-sum conflict on the solution', () => {
      const fixture = findFixture(
        sandwich,
        (structure) =>
          Boolean(
            (structure as { rows?: number[]; cols?: number[] } | undefined)?.rows?.some(
              (value) => value > 0
            )
          ) ||
          Boolean(
            (structure as { rows?: number[]; cols?: number[] } | undefined)?.cols?.some(
              (value) => value > 0
            )
          )
      );
      expect(
        validate(fixture.solution, withStructure(fixture)).some(
          (c) => c.constraintId === 'sandwichSum'
        )
      ).toBe(false);
    });

    it('should flag a row or column whose between-sum no longer matches its clue', () => {
      const fixture = findFixture(
        sandwich,
        (structure) =>
          Boolean(
            (structure as { rows?: number[]; cols?: number[] } | undefined)?.rows?.some(
              (value) => value > 0
            )
          ) ||
          Boolean(
            (structure as { rows?: number[]; cols?: number[] } | undefined)?.cols?.some(
              (value) => value > 0
            )
          )
      );
      const structure = fixture.structure as { rows?: number[]; cols?: number[] } | undefined;
      const rowIndex = structure?.rows?.findIndex((value) => value > 0) ?? -1;
      if (rowIndex < 0) throw new Error('no sandwich row clue in sandwich fixture');

      const rowCells = range(9).map((col) => cellId(rowIndex, col) as CellId);
      const currentValues = rowCells.map((cellId) => fixture.solution.get(cellId) ?? 0);
      const firstOne = currentValues.indexOf(1);
      const lastNine = currentValues.lastIndexOf(9);
      if (firstOne === -1 || lastNine === -1 || lastNine <= firstOne + 1) {
        throw new Error('no sandwich between-sum cells in sandwich fixture');
      }

      const targetIndex = firstOne + 1;
      const currentValue = currentValues[targetIndex] ?? 0;
      const replacement = currentValue < 9 ? currentValue + 1 : currentValue - 1;
      const targetCell = rowCells[targetIndex] as CellId;
      const bad: Values = new Map(fixture.solution);
      bad.set(targetCell, replacement);

      expect(
        validate(bad, withStructure(fixture)).some((c) => c.constraintId === 'sandwichSum')
      ).toBe(true);
    });
  });

  describe('skyscraperVisibility', () => {
    it('should report no skyscraper conflict on the solution', () => {
      const fixture = findFixture(
        skyscraper,
        (structure) =>
          Boolean(
            (
              structure as
                | {
                    clues?: { start?: number[]; end?: number[]; top?: number[]; bottom?: number[] };
                  }
                | undefined
            )?.clues?.start?.some((value) => value > 0)
          ) ||
          Boolean(
            (
              structure as
                | {
                    clues?: { start?: number[]; end?: number[]; top?: number[]; bottom?: number[] };
                  }
                | undefined
            )?.clues?.top?.some((value) => value > 0)
          )
      );
      expect(
        validate(fixture.solution, withStructure(fixture)).some(
          (c) => c.constraintId === 'skyscraperVisibility'
        )
      ).toBe(false);
    });

    it('should flag a row whose visible count no longer matches its start clue', () => {
      const fixture = findFixture(skyscraper, (structure) =>
        Boolean(
          (
            structure as
              | { clues?: { start?: number[]; end?: number[]; top?: number[]; bottom?: number[] } }
              | undefined
          )?.clues?.start?.some((value) => value > 0)
        )
      );
      const clues = (
        fixture.structure as
          | { clues?: { start?: number[]; end?: number[]; top?: number[]; bottom?: number[] } }
          | undefined
      )?.clues;
      const rowIndex = clues?.start?.findIndex((value) => value > 0) ?? -1;
      if (rowIndex < 0) throw new Error('no skyscraper start clue in skyscraper fixture');
      const clue = clues?.start?.[rowIndex] ?? 0;

      // Build a row whose visible-from-start count is provably different from the clue:
      // ascending [1..9] has visible count 9, descending has visible count 1.
      const ascending = range(9).map((n) => n + 1);
      const arrangement = clue === 9 ? [...ascending].reverse() : ascending;
      const bad: Values = new Map(fixture.solution);
      arrangement.forEach((value, col) => bad.set(cellId(rowIndex, col), value));

      expect(
        validate(bad, withStructure(fixture)).some((c) => c.constraintId === 'skyscraperVisibility')
      ).toBe(true);
    });
  });

  describe('chain', () => {
    it('should report no chain conflict on the solution', () => {
      const fixture = findFixture(chainVariant, (structure) =>
        Boolean((structure as { chains?: ChainType[] } | undefined)?.chains?.length)
      );
      expect(
        validate(fixture.solution, withStructure(fixture)).some((c) => c.constraintId === 'chain')
      ).toBe(false);
    });

    it('should flag a chain whose values are no longer consecutive or unique', () => {
      const fixture = findFixture(chainVariant, (structure) =>
        Boolean((structure as { chains?: ChainType[] } | undefined)?.chains?.length)
      );
      const chains = (fixture.structure as { chains?: ChainType[] } | undefined)?.chains ?? [];
      const chain = chains[0];
      if (!chain) throw new Error('no chain in chain fixture');

      const bad: Values = new Map(fixture.solution);
      bad.set(chain.cells[0] as CellId, 5);
      bad.set(chain.cells[1] as CellId, 5);

      expect(validate(bad, withStructure(fixture)).some((c) => c.constraintId === 'chain')).toBe(
        true
      );
    });
  });
});
