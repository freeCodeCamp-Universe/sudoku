import type React from 'react';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { CellId, SymbolValue, Values } from '@/engine/types';
import { classic } from '@/variants/classic';
import { useSudokuGrid } from '@/game/useSudokuGrid';
import { makeFixture } from './makeFixture';

const noop = () => {};

describe('useSudokuGrid cell state derivation', () => {
  it('should mark the clicked cell selected and its house peers as peer', () => {
    const fixture = makeFixture(classic, 4);
    const { result } = renderHook(() =>
      useSudokuGrid({
        cells: fixture.model.cells,
        model: fixture.model,
        values: new Map() as Values,
        givens: new Set<CellId>(),
        onEnterValue: noop,
        onToggleCandidate: noop,
      })
    );

    act(() => {
      result.current.cellProps('r0c0').onClick?.({} as React.MouseEvent<HTMLDivElement>);
    });

    expect(result.current.cellState('r0c0').selected).toBe(true);
    expect(result.current.cellState('r0c1').peer).toBe(true);
    expect(result.current.cellState('r5c5').peer).toBe(false);
  });

  it('should mark another cell holding the selected cell value as sameValue', () => {
    const fixture = makeFixture(classic, 4);
    const values: Values = new Map([
      ['r0c0', 1],
      ['r8c8', 1],
      ['r1c1', 2],
    ] as Array<[CellId, SymbolValue]>);
    const { result } = renderHook(() =>
      useSudokuGrid({
        cells: fixture.model.cells,
        model: fixture.model,
        values,
        givens: new Set<CellId>(),
        onEnterValue: noop,
        onToggleCandidate: noop,
      })
    );

    act(() => {
      result.current.cellProps('r0c0').onClick?.({} as React.MouseEvent<HTMLDivElement>);
    });

    expect(result.current.cellState('r8c8').sameValue).toBe(true);
    expect(result.current.cellState('r1c1').sameValue).toBe(false);
  });

  it('should surface conflict for a duplicate within a house', () => {
    const fixture = makeFixture(classic, 4);
    const values: Values = new Map([
      ['r0c0', 1],
      ['r0c1', 1],
    ] as Array<[CellId, SymbolValue]>);
    const { result } = renderHook(() =>
      useSudokuGrid({
        cells: fixture.model.cells,
        model: fixture.model,
        values,
        givens: new Set<CellId>(),
        onEnterValue: noop,
        onToggleCandidate: noop,
      })
    );

    expect(result.current.cellState('r0c0').conflict).toBe(true);
  });

  it('should report correct and let a correct cell escape conflict under checkEnabled', () => {
    const fixture = makeFixture(classic, 4);
    const correctId = 'r0c0' as CellId;
    const wrongId = 'r0c1' as CellId;
    const correctValue = fixture.solution.get(correctId)! as SymbolValue;
    // Give the wrong cell the correct cell's value so they collide in their shared row/box.
    // That forces the correct cell into the conflict set, so its `conflict === false`
    // assertion below actually exercises the "correct suppresses conflict" path. The value
    // still differs from the wrong cell's own solution (no row has duplicates), so its
    // `correct === false` assertion holds too.
    const wrongValue = correctValue;
    const values: Values = new Map([
      [correctId, correctValue],
      [wrongId, wrongValue],
    ] as Array<[CellId, SymbolValue]>);
    const { result } = renderHook(() =>
      useSudokuGrid({
        cells: fixture.model.cells,
        model: fixture.model,
        values,
        solution: fixture.solution,
        givens: new Set<CellId>(),
        onEnterValue: noop,
        onToggleCandidate: noop,
        checkEnabled: true,
      })
    );

    expect(result.current.cellState(correctId).correct).toBe(true);
    expect(result.current.cellState(correctId).conflict).toBe(false);
    expect(result.current.cellState(wrongId).correct).toBe(false);
  });
});
