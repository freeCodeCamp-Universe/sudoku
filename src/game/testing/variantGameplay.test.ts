import { act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { CellId } from '@/engine/types';
import { allVariants, houseCellIds } from './allVariants';
import { renderPlay, type Fixture } from './renderPlay';

// Every assertion below is relative to the stored reference solution
// (isSolved and `correct` both compare against it) and none asserts that the
// solution is unique, so jigsaw — the lone NON_UNIQUE_VARIANTS entry — is safe
// to include. A skip would only be warranted by an assertion that depends on
// uniqueness, which Pass 1 has none of.

function openCells(fixture: Fixture): CellId[] {
  return fixture.model.cells.filter((cell) => !fixture.givens.has(cell.id)).map((cell) => cell.id);
}

function firstOpenCell(fixture: Fixture): CellId {
  const id = openCells(fixture)[0];

  if (!id) {
    throw new Error('Expected at least one non-given cell');
  }

  return id;
}

function openPairInHouse(fixture: Fixture): [CellId, CellId] {
  for (const house of fixture.model.houses) {
    const open = houseCellIds(house).filter((id) => !fixture.givens.has(id));

    if (open.length >= 2) {
      return [open[0], open[1]];
    }
  }

  throw new Error('Expected a house with at least two non-given cells');
}

function otherSymbol(fixture: Fixture, value: number): number {
  const symbol = fixture.model.symbols.find((candidate) => candidate !== value);

  if (symbol === undefined) {
    throw new Error('Expected a second symbol in the symbol set');
  }

  return symbol;
}

describe('variant gameplay: duplicate-in-house conflict', () => {
  it.each(allVariants())(
    'should flag a played duplicate within a house on $id and clear it on undo',
    (variant) => {
      const { result, fixture } = renderPlay(variant);
      const [a, b] = openPairInHouse(fixture);
      const symbol = fixture.model.symbols[0];

      act(() => result.current.dispatch({ type: 'enterValue', cellId: a, value: symbol }));
      act(() => result.current.dispatch({ type: 'enterValue', cellId: b, value: symbol }));

      expect(result.current.cellState(b).conflict).toBe(true);

      act(() => result.current.dispatch({ type: 'undo' }));

      expect(result.current.cellState(b).conflict).toBe(false);
    }
  );
});

describe('variant gameplay: check mode', () => {
  it.each(allVariants())(
    'should mark a solution entry correct and a wrong entry incorrect on $id',
    (variant) => {
      const { result, fixture } = renderPlay(variant, { checkEnabled: true });
      const cell = firstOpenCell(fixture);
      const correctValue = fixture.solution.get(cell)!;

      act(() => result.current.dispatch({ type: 'enterValue', cellId: cell, value: correctValue }));

      expect(result.current.cellState(cell).correct).toBe(true);
      expect(result.current.cellState(cell).conflict).toBe(false);

      const wrongValue = otherSymbol(fixture, correctValue);

      act(() => result.current.dispatch({ type: 'enterValue', cellId: cell, value: wrongValue }));

      expect(result.current.cellState(cell).correct).toBe(false);
    }
  );
});

describe('variant gameplay: solved transition', () => {
  it.each(allVariants())(
    'should mark $id solved only when every non-given cell matches the solution',
    (variant) => {
      const { result, fixture } = renderPlay(variant);
      const open = openCells(fixture);

      // Fill every open cell with the solution except the first, which gets a
      // wrong value: the board is full but unsolved, proving solved demands an
      // exact match rather than a full grid.
      act(() => {
        open.forEach((id, index) => {
          const correctValue = fixture.solution.get(id)!;
          const value = index === 0 ? otherSymbol(fixture, correctValue) : correctValue;
          result.current.dispatch({ type: 'enterValue', cellId: id, value });
        });
      });

      expect(result.current.cellState(open[0]).value).toBeDefined();
      expect(result.current.state.solved).toBe(false);

      act(() =>
        result.current.dispatch({
          type: 'enterValue',
          cellId: open[0],
          value: fixture.solution.get(open[0])!,
        })
      );

      expect(result.current.state.solved).toBe(true);
    }
  );
});

describe('variant gameplay: revealed cells are locked', () => {
  it.each(allVariants())(
    'should ignore enter, erase, and toggle on a revealed cell on $id',
    (variant) => {
      const { result, fixture } = renderPlay(variant);
      const cell = firstOpenCell(fixture);
      const revealedValue = fixture.solution.get(cell)!;

      act(() =>
        result.current.dispatch({ type: 'reveal', cellId: cell, solutionValue: revealedValue })
      );

      expect(result.current.cellState(cell).revealed).toBe(true);

      const other = otherSymbol(fixture, revealedValue);

      act(() => result.current.dispatch({ type: 'enterValue', cellId: cell, value: other }));
      act(() => result.current.dispatch({ type: 'erase', cellId: cell }));
      act(() => result.current.dispatch({ type: 'toggleCandidate', cellId: cell, value: other }));

      expect(result.current.cellState(cell).value).toBe(revealedValue);
      expect(result.current.cellState(cell).candidates).toEqual([]);
    }
  );
});

describe('variant gameplay: reducer actions', () => {
  it.each(allVariants())('should toggle a candidate on and off on $id', (variant) => {
    const { result, fixture } = renderPlay(variant);
    const cell = firstOpenCell(fixture);
    const symbol = fixture.model.symbols[0];

    act(() => result.current.dispatch({ type: 'toggleCandidate', cellId: cell, value: symbol }));

    expect(result.current.cellState(cell).candidates).toContain(symbol);

    act(() => result.current.dispatch({ type: 'toggleCandidate', cellId: cell, value: symbol }));

    expect(result.current.cellState(cell).candidates).not.toContain(symbol);
  });

  it.each(allVariants())(
    'should clear non-given values but keep givens on clearAll for $id',
    (variant) => {
      const { result, fixture } = renderPlay(variant);
      const cell = firstOpenCell(fixture);
      const givenCell = [...fixture.givens.keys()][0];
      const givenValue = fixture.givens.get(givenCell)!;

      act(() =>
        result.current.dispatch({
          type: 'enterValue',
          cellId: cell,
          value: fixture.model.symbols[0],
        })
      );
      act(() => result.current.dispatch({ type: 'clearAll' }));

      expect(result.current.cellState(cell).value).toBeUndefined();
      expect(result.current.cellState(givenCell).value).toBe(givenValue);
    }
  );

  it.each(allVariants())('should clear revealed cells on clearAll for $id', (variant) => {
    const { result, fixture } = renderPlay(variant);
    const cell = firstOpenCell(fixture);
    const solutionValue = fixture.solution.get(cell)!;

    act(() => result.current.dispatch({ type: 'reveal', cellId: cell, solutionValue }));

    expect(result.current.cellState(cell).revealed).toBe(true);

    act(() => result.current.dispatch({ type: 'clearAll' }));

    expect(result.current.cellState(cell).value).toBeUndefined();
    expect(result.current.cellState(cell).revealed).toBe(false);
  });

  it.each(allVariants())('should reset to givens on newGame for $id', (variant) => {
    const { result, fixture } = renderPlay(variant);
    const cell = firstOpenCell(fixture);

    act(() =>
      result.current.dispatch({
        type: 'enterValue',
        cellId: cell,
        value: fixture.model.symbols[0],
      })
    );
    act(() => result.current.dispatch({ type: 'newGame' }));

    expect(result.current.cellState(cell).value).toBeUndefined();
  });
});
