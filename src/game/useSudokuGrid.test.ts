import React from 'react';
import { renderHook, act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, should, vi } from 'vitest';
import { uniqueness } from '@/engine/constraints/uniqueness';
import { gridCells, standardHouses } from '@/engine/grid';
import type { CellId, SymbolValue, Values, Variant, VariantModel } from '@/engine/types';
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

interface TestBoardProps {
  candidates?: Map<CellId, SymbolValue[]>;
  candidateMode?: boolean;
  onToggleCandidate?: (id: CellId, value: SymbolValue) => void;
  describeSymbol?: (value: SymbolValue) => string;
  values?: Values;
  checkEnabled?: boolean;
}

function TestBoard({
  candidates = new Map(),
  candidateMode = false,
  onToggleCandidate = noop,
  describeSymbol,
  values = emptyValues,
  checkEnabled = false,
}: TestBoardProps) {
  const grid = useSudokuGrid({
    cells,
    model,
    values,
    candidates,
    candidateMode,
    givens: new Set(),
    onEnterValue: noop,
    onToggleCandidate,
    describeSymbol,
    checkEnabled,
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

    expect(result.current.cellProps('r0c0')['aria-label']).toBe('Row 1, column 1, box 1, Yellow');
  });

  it('should move focus with arrow-key navigation in the rendered board', () => {
    render(React.createElement(TestBoard, {}));

    const firstCell = screen.getByRole('gridcell', { name: 'Row 1, column 1, box 1, empty' });

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

  it('should keep a clicked cell selected after focus moves to it', () => {
    render(React.createElement(TestBoard, {}));

    const targetCell = screen.getByRole('gridcell', { name: 'Row 1, column 1, box 1, empty' });

    fireEvent.mouseDown(targetCell);
    fireEvent.focus(targetCell);
    fireEvent.click(targetCell);

    expect(targetCell).toBeTruthy();
    shouldAssert.equal(targetCell.getAttribute('aria-selected'), 'true');
    shouldAssert.equal(targetCell.getAttribute('tabindex'), '0');
  });

  it('should include sorted candidates in the cell label when no value is present', () => {
    const { result } = renderHook(() =>
      useSudokuGrid({
        cells,
        model,
        values: emptyValues,
        candidates: new Map([['r0c0', [5, 2, 7]]]),
        givens: new Set(),
        onEnterValue: noop,
        onToggleCandidate: noop,
      })
    );

    expect(result.current.cellProps('r0c0')['aria-label']).toBe('Row 1, column 1, box 1, candidates 2, 5, 7');
  });

  it('should use singular "candidate" for exactly one candidate', () => {
    const { result } = renderHook(() =>
      useSudokuGrid({
        cells,
        model,
        values: emptyValues,
        candidates: new Map([['r0c0', [4]]]),
        givens: new Set(),
        onEnterValue: noop,
        onToggleCandidate: noop,
      })
    );

    expect(result.current.cellProps('r0c0')['aria-label']).toBe('Row 1, column 1, box 1, candidate 4');
  });

  it('should render candidates through describeSymbol', () => {
    const { result } = renderHook(() =>
      useSudokuGrid({
        cells,
        model,
        values: emptyValues,
        candidates: new Map([['r0c0', [1, 3]]]),
        givens: new Set(),
        onEnterValue: noop,
        onToggleCandidate: noop,
        describeSymbol: (value) => (value === 1 ? 'Red' : value === 3 ? 'Yellow' : String(value)),
      })
    );

    expect(result.current.cellProps('r0c0')['aria-label']).toBe('Row 1, column 1, box 1, candidates Red, Yellow');
  });

  it('should ignore candidates if a value is present', () => {
    const values: Values = new Map([['r0c0', 9]]);
    const { result } = renderHook(() =>
      useSudokuGrid({
        cells,
        model,
        values,
        candidates: new Map([['r0c0', [1, 2, 3]]]),
        givens: new Set(),
        onEnterValue: noop,
        onToggleCandidate: noop,
      })
    );

    expect(result.current.cellProps('r0c0')['aria-label']).toBe('Row 1, column 1, box 1, 9');
  });

  it('should announce candidate added/removed when toggling', async () => {
    vi.useFakeTimers();
    const onToggleCandidate = vi.fn();

    const { rerender } = render(React.createElement(TestBoard, { candidateMode: true, onToggleCandidate }));

    const cell = screen.getByRole('gridcell', { name: 'Row 1, column 1, box 1, empty' });
    const getAnnouncer = () => screen.getByRole('status');

    fireEvent.focus(cell);
    fireEvent.keyDown(cell, { key: '5' });

    act(() => {
      vi.runAllTimers();
    });

    expect(onToggleCandidate).toHaveBeenCalledWith('r0c0', 5);
    expect(getAnnouncer()?.textContent).toBe('Row 1, column 1, candidate 5 added');

    // Test removal
    rerender(
      React.createElement(TestBoard, {
        candidateMode: true,
        onToggleCandidate,
        candidates: new Map([['r0c0', [5]]]),
      })
    );

    const cellWithCandidate = screen.getByRole('gridcell', { name: 'Row 1, column 1, box 1, candidate 5' });

    fireEvent.focus(cellWithCandidate);
    fireEvent.keyDown(cellWithCandidate, { key: '5' });

    act(() => {
      vi.runAllTimers();
    });

    expect(getAnnouncer()?.textContent).toBe('Row 1, column 1, candidate 5 removed');
    vi.useRealTimers();
  });

  it('should include "in conflict" in the cell label when checkEnabled is true and there is a conflict', () => {
    const values: Values = new Map([
      ['r0c0', 5],
      ['r0c4', 5],
    ]);
    const { result } = renderHook(() =>
      useSudokuGrid({
        cells,
        model,
        values,
        givens: new Set(),
        onEnterValue: noop,
        onToggleCandidate: noop,
        checkEnabled: true,
      })
    );

    expect(result.current.cellProps('r0c0')['aria-label']).toBe('Row 1, column 1, box 1, 5, in conflict');
    expect(result.current.cellProps('r0c4')['aria-label']).toBe('Row 1, column 5, box 2, 5, in conflict');
    expect(result.current.cellProps('r0c1')['aria-label']).toBe('Row 1, column 2, box 1, empty');
  });

  it('should not include "in conflict" in the cell label when checkEnabled is false', () => {
    const values: Values = new Map([
      ['r0c0', 5],
      ['r0c4', 5],
    ]);
    const { result } = renderHook(() =>
      useSudokuGrid({
        cells,
        model,
        values,
        givens: new Set(),
        onEnterValue: noop,
        onToggleCandidate: noop,
        checkEnabled: false,
      })
    );

    expect(result.current.cellProps('r0c0')['aria-label']).toBe('Row 1, column 1, box 1, 5');
  });

  it('should announce conflict immediately when a value entry creates one', async () => {
    vi.useFakeTimers();
    const values = new Map([['r0c4', 5]]);
    render(React.createElement(TestBoard, { values, checkEnabled: true }));

    const cell = screen.getByRole('gridcell', { name: 'Row 1, column 1, box 1, empty' });
    const getAnnouncer = () => screen.getByRole('status');

    fireEvent.focus(cell);
    fireEvent.keyDown(cell, { key: '5' });

    act(() => {
      vi.runAllTimers();
    });

    expect(getAnnouncer()?.textContent).toBe('Row 1, column 1, 5, in conflict');
    vi.useRealTimers();
  });

  it('should not announce conflict immediately when a value entry does not create one', async () => {
    vi.useFakeTimers();
    render(React.createElement(TestBoard, { checkEnabled: true }));

    const cell = screen.getByRole('gridcell', { name: 'Row 1, column 1, box 1, empty' });
    const getAnnouncer = () => screen.getByRole('status');

    fireEvent.focus(cell);
    fireEvent.keyDown(cell, { key: '5' });

    act(() => {
      vi.runAllTimers();
    });

    expect(getAnnouncer()?.textContent).toBe('Row 1, column 1, 5');
    vi.useRealTimers();
  });
});
