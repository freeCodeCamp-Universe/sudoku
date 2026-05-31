import React from 'react';
import { renderHook, act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, should } from 'vitest';
import { uniqueness } from '@/engine/constraints/uniqueness';
import { gridCells, standardHouses } from '@/engine/grid';
import type { Values, Variant, VariantModel } from '@/engine/types';
import { Board } from '@/game/Board/Board';
import { gridLayout } from '@/game/layouts/grid';
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
const shouldAssert = should();
const classicVariant: Variant = {
  id: 'classic',
  name: 'Classic Sudoku',
  description: 'Test variant.',
  popularity: 0,
  difficulty: 'intermediate',
  layout: { kind: 'grid', size: 9, box: { rows: 3, cols: 3 } },
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  constraintIds: [],
};

function TestBoard() {
  const grid = useSudokuGrid({
    cells,
    model,
    values: emptyValues,
    givens: new Set(),
    onEnterValue: noop,
    onToggleCandidate: noop,
  });

  return React.createElement(Board, {
    variant: classicVariant,
    cells,
    rects: gridLayout.cellRects(classicVariant),
    size: gridLayout.canvasSize(classicVariant),
    grid,
    renderSymbol: (value) => String(value),
  });
}

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

  it('should describe values with the provided symbol label function', () => {
    const values: Values = new Map([['r0c0', 3]]);
    const { result } = renderHook(() =>
      useSudokuGrid({
        cells,
        model,
        values,
        givens: new Set(),
        onEnterValue: noop,
        onToggleCandidate: noop,
        describeSymbol: (value) => ['Red', 'Orange', 'Yellow'][value - 1] ?? String(value),
      })
    );

    expect(result.current.cellProps('r0c0')['aria-label']).toBe('Row 1, column 1, Yellow');
  });

  it('should move focus with arrow-key navigation in the rendered board', () => {
    render(React.createElement(TestBoard));

    const firstCell = screen.getByRole('gridcell', { name: 'Row 1, column 1, empty' });

    fireEvent.focus(firstCell);
    fireEvent.keyDown(firstCell, { key: 'ArrowRight' });

    // eslint-disable-next-line testing-library/no-node-access
    const rightCell = document.activeElement as HTMLElement | null;

    expect(rightCell).toBeTruthy();
    shouldAssert.exist(rightCell);
    shouldAssert.equal(rightCell?.getAttribute('data-cell'), 'r0c1');
    shouldAssert.equal(rightCell?.getAttribute('aria-selected'), 'true');

    fireEvent.keyDown(rightCell as HTMLElement, { key: 'ArrowDown' });

    // eslint-disable-next-line testing-library/no-node-access
    const downCell = document.activeElement as HTMLElement | null;

    expect(downCell).toBeTruthy();
    shouldAssert.exist(downCell);
    shouldAssert.equal(downCell?.getAttribute('data-cell'), 'r1c1');
    shouldAssert.equal(downCell?.getAttribute('aria-selected'), 'true');
  });
});
