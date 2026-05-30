import type React from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { uniqueness } from '@/engine/constraints/uniqueness';
import { gridCells, standardHouses } from '@/engine/grid';
import type { Values, VariantModel } from '@/engine/types';
import { useSudokuGrid } from './useSudokuGrid';

const cells = gridCells(9);
const model: VariantModel = {
  cells,
  houses: standardHouses(9, { rows: 3, cols: 3 }),
  constraints: [uniqueness],
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
};

const emptyValues: Values = new Map();
const noop = () => {};

describe('useSudokuGrid', () => {
  it('should start with no selection', () => {
    const { result } = renderHook(() =>
      useSudokuGrid({
        cells,
        model,
        values: emptyValues,
        givens: new Set(),
        onEnterValue: noop,
        onToggleCandidate: noop,
      })
    );

    expect(result.current.cellState('r0c0').selected).toBe(false);
  });

  it('should select a cell via cellProps onClick', () => {
    const { result } = renderHook(() =>
      useSudokuGrid({
        cells,
        model,
        values: emptyValues,
        givens: new Set(),
        onEnterValue: noop,
        onToggleCandidate: noop,
      })
    );

    act(() => {
      result.current.cellProps('r3c4').onClick?.({} as React.MouseEvent<HTMLDivElement>);
    });

    expect(result.current.cellState('r3c4').selected).toBe(true);
  });

  it('should deselect a cell when clicking the already-selected cell', () => {
    const { result } = renderHook(() =>
      useSudokuGrid({
        cells,
        model,
        values: emptyValues,
        givens: new Set(),
        onEnterValue: noop,
        onToggleCandidate: noop,
      })
    );

    act(() => {
      result.current.cellProps('r0c0').onClick?.({} as React.MouseEvent<HTMLDivElement>);
    });

    act(() => {
      result.current.cellProps('r0c0').onClick?.({} as React.MouseEvent<HTMLDivElement>);
    });

    expect(result.current.cellState('r0c0').selected).toBe(false);
  });

  it('should mark conflict cells when checking is enabled', () => {
    const conflictValues: Values = new Map([
      ['r0c0', 5],
      ['r0c4', 5],
    ]);
    const { result } = renderHook(() =>
      useSudokuGrid({
        cells,
        model,
        values: conflictValues,
        givens: new Set(),
        onEnterValue: noop,
        onToggleCandidate: noop,
        checkEnabled: true,
      })
    );

    expect(result.current.cellState('r0c0').conflict).toBe(true);
    expect(result.current.cellState('r0c4').conflict).toBe(true);
    expect(result.current.cellState('r0c1').conflict).toBe(false);
  });

  it('should expose a stable announcerRef', () => {
    const { result } = renderHook(() =>
      useSudokuGrid({
        cells,
        model,
        values: emptyValues,
        givens: new Set(),
        onEnterValue: noop,
        onToggleCandidate: noop,
      })
    );

    expect(result.current.announcerRef).toBeTruthy();
  });
});
