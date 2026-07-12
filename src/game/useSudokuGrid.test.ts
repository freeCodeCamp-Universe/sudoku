import React from 'react';
import { renderHook, act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, should, vi } from 'vitest';
import { uniqueness } from '@/engine/constraints/uniqueness';
import { gridCells, standardHouses } from '@/engine/grid';
import type { CellId, SymbolValue, Values, Variant, VariantModel } from '@/engine/types';
import { buildModel } from '@/engine/buildModel';
import { Board } from '@/game/Board/Board';
import { gridLayout } from '@/game/layouts/grid';
import { sujiken } from '@/variants/sujiken';
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
  solution?: Values;
  onCellNavigate?: (id: CellId) => void;
}

function TestBoard({
  candidates = new Map(),
  candidateMode = false,
  onToggleCandidate = noop,
  describeSymbol,
  values = emptyValues,
  checkEnabled = false,
  solution = new Map(),
  onCellNavigate,
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
    solution,
    onCellNavigate,
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

  it('should mark conflict cells regardless of the check setting', () => {
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
        checkEnabled: false,
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

    expect(result.current.cellProps('r0c0')['aria-label']).toBe(
      'Row 1, column 1, box 1, candidates 2, 5, 7'
    );
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

    expect(result.current.cellProps('r0c0')['aria-label']).toBe(
      'Row 1, column 1, box 1, candidate 4'
    );
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

    expect(result.current.cellProps('r0c0')['aria-label']).toBe(
      'Row 1, column 1, box 1, candidates Red, Yellow'
    );
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

    const { rerender } = render(
      React.createElement(TestBoard, { candidateMode: true, onToggleCandidate })
    );

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

    const cellWithCandidate = screen.getByRole('gridcell', {
      name: 'Row 1, column 1, box 1, candidate 5',
    });

    fireEvent.focus(cellWithCandidate);
    fireEvent.keyDown(cellWithCandidate, { key: '5' });

    act(() => {
      vi.runAllTimers();
    });

    expect(getAnnouncer()?.textContent).toBe('Row 1, column 1, candidate 5 removed');
    vi.useRealTimers();
  });

  it('should include "in conflict" in the cell label when there is a conflict', () => {
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
      })
    );

    expect(result.current.cellProps('r0c0')['aria-label']).toBe(
      'Row 1, column 1, box 1, 5, in conflict'
    );
    expect(result.current.cellProps('r0c4')['aria-label']).toBe(
      'Row 1, column 5, box 2, 5, in conflict'
    );
    expect(result.current.cellProps('r0c1')['aria-label']).toBe('Row 1, column 2, box 1, empty');
  });

  it('should include "in conflict" in the cell label even when checkEnabled is false', () => {
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

    expect(result.current.cellProps('r0c0')['aria-label']).toBe(
      'Row 1, column 1, box 1, 5, in conflict'
    );
  });

  it('should include "in conflict" in the label for a given cell that a user entry conflicts with', () => {
    const { result } = renderHook(() =>
      useSudokuGrid({
        cells,
        model,
        values: new Map([
          ['r0c0', 5],
          ['r0c4', 5],
        ]),
        givens: new Set(['r0c0']),
        onEnterValue: noop,
        onToggleCandidate: noop,
      })
    );

    expect(result.current.cellProps('r0c0')['aria-label']).toBe(
      'Row 1, column 1, box 1, 5, in conflict, readonly'
    );
    expect(result.current.cellProps('r0c4')['aria-label']).toBe(
      'Row 1, column 5, box 2, 5, in conflict'
    );
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

  it('should mark a filled cell correct when it matches the solution and checking is on', () => {
    const { result } = renderHook(() =>
      useSudokuGrid({
        cells,
        model,
        values: new Map([['r0c0', 5]]),
        solution: new Map([['r0c0', 5]]),
        givens: new Set(),
        onEnterValue: noop,
        onToggleCandidate: noop,
        checkEnabled: true,
      })
    );

    expect(result.current.cellState('r0c0').correct).toBe(true);
    expect(result.current.cellProps('r0c0')['aria-label']).toBe(
      'Row 1, column 1, box 1, 5, correct'
    );
  });

  it('should mark a filled cell incorrect when it does not match the solution', () => {
    const { result } = renderHook(() =>
      useSudokuGrid({
        cells,
        model,
        values: new Map([['r0c0', 3]]),
        solution: new Map([['r0c0', 5]]),
        givens: new Set(),
        onEnterValue: noop,
        onToggleCandidate: noop,
        checkEnabled: true,
      })
    );

    expect(result.current.cellState('r0c0').correct).toBe(false);
    expect(result.current.cellProps('r0c0')['aria-label']).toBe(
      'Row 1, column 1, box 1, 3, incorrect'
    );
  });

  it('should not mark correctness when checking is off', () => {
    const { result } = renderHook(() =>
      useSudokuGrid({
        cells,
        model,
        values: new Map([['r0c0', 3]]),
        solution: new Map([['r0c0', 5]]),
        givens: new Set(),
        onEnterValue: noop,
        onToggleCandidate: noop,
        checkEnabled: false,
      })
    );

    expect(result.current.cellState('r0c0').correct).toBeUndefined();
    expect(result.current.cellProps('r0c0')['aria-label']).toBe('Row 1, column 1, box 1, 3');
  });

  it('should not mark correctness for given cells', () => {
    const { result } = renderHook(() =>
      useSudokuGrid({
        cells,
        model,
        values: new Map([['r0c0', 5]]),
        solution: new Map([['r0c0', 5]]),
        givens: new Set(['r0c0']),
        onEnterValue: noop,
        onToggleCandidate: noop,
        checkEnabled: true,
      })
    );

    expect(result.current.cellState('r0c0').correct).toBeUndefined();
    expect(result.current.cellProps('r0c0')['aria-label']).toBe(
      'Row 1, column 1, box 1, 5, readonly'
    );
  });

  it('should not flag a correct cell as in conflict, but should flag the wrong cell it clashes with', () => {
    const { result } = renderHook(() =>
      useSudokuGrid({
        cells,
        model,
        values: new Map([
          ['r0c0', 5],
          ['r0c4', 5],
        ]),
        solution: new Map([
          ['r0c0', 5],
          ['r0c4', 2],
        ]),
        givens: new Set(),
        onEnterValue: noop,
        onToggleCandidate: noop,
        checkEnabled: true,
      })
    );

    // r0c0 holds the correct 5; the clash is the wrong 5 in r0c4, so r0c0 is not flagged.
    expect(result.current.cellState('r0c0').conflict).toBe(false);
    expect(result.current.cellProps('r0c0')['aria-label']).toBe(
      'Row 1, column 1, box 1, 5, correct'
    );

    expect(result.current.cellState('r0c4').conflict).toBe(true);
    expect(result.current.cellProps('r0c4')['aria-label']).toBe(
      'Row 1, column 5, box 2, 5, incorrect, in conflict'
    );
  });

  it('should announce correctness immediately when a value entry matches the solution', async () => {
    vi.useFakeTimers();
    render(
      React.createElement(TestBoard, { checkEnabled: true, solution: new Map([['r0c0', 5]]) })
    );

    const cell = screen.getByRole('gridcell', { name: 'Row 1, column 1, box 1, empty' });
    const getAnnouncer = () => screen.getByRole('status');

    fireEvent.focus(cell);
    fireEvent.keyDown(cell, { key: '5' });

    act(() => {
      vi.runAllTimers();
    });

    expect(getAnnouncer()?.textContent).toBe('Row 1, column 1, 5, correct');
    vi.useRealTimers();
  });

  it('should announce incorrect immediately when a value entry does not match the solution', async () => {
    vi.useFakeTimers();
    render(
      React.createElement(TestBoard, { checkEnabled: true, solution: new Map([['r0c0', 5]]) })
    );

    const cell = screen.getByRole('gridcell', { name: 'Row 1, column 1, box 1, empty' });
    const getAnnouncer = () => screen.getByRole('status');

    fireEvent.focus(cell);
    fireEvent.keyDown(cell, { key: '3' });

    act(() => {
      vi.runAllTimers();
    });

    expect(getAnnouncer()?.textContent).toBe('Row 1, column 1, 3, incorrect');
    vi.useRealTimers();
  });

  it('should mark cells sharing the selected cell value as sameValue', () => {
    const { result } = renderHook(() =>
      useSudokuGrid({
        cells,
        model,
        values: new Map([
          ['r0c0', 5],
          ['r3c3', 5],
          ['r1c1', 2],
        ]),
        givens: new Set(),
        onEnterValue: noop,
        onToggleCandidate: noop,
      })
    );

    act(() => {
      result.current.cellProps('r0c0').onClick?.({} as React.MouseEvent<HTMLDivElement>);
    });

    expect(result.current.cellState('r0c0').sameValue).toBe(true);
    expect(result.current.cellState('r3c3').sameValue).toBe(true);
    expect(result.current.cellState('r1c1').sameValue).toBe(false);
    expect(result.current.cellState('r2c2').sameValue).toBe(false);
  });

  it('should mark the selected cell row, column, and box peers', () => {
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

    expect(result.current.cellState('r0c0').peer).toBe(false); // the selected cell itself
    expect(result.current.cellState('r0c5').peer).toBe(true); // same row
    expect(result.current.cellState('r5c0').peer).toBe(true); // same column
    expect(result.current.cellState('r1c1').peer).toBe(true); // same box
    expect(result.current.cellState('r5c5').peer).toBe(false); // unrelated
  });

  it('should mark no peers when highlightPeers is false', () => {
    const { result } = renderHook(() =>
      useSudokuGrid({
        cells,
        model,
        values: emptyValues,
        givens: new Set(),
        onEnterValue: noop,
        onToggleCandidate: noop,
        highlightPeers: false,
      })
    );

    act(() => {
      result.current.cellProps('r0c0').onClick?.({} as React.MouseEvent<HTMLDivElement>);
    });

    expect(result.current.cellState('r0c5').peer).toBe(false);
    expect(result.current.cellState('r5c0').peer).toBe(false);
    expect(result.current.cellState('r1c1').peer).toBe(false);
  });

  it('should mark no peers when nothing is selected', () => {
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

    expect(result.current.cellState('r0c5').peer).toBe(false);
  });

  it('should call onCellNavigate with the destination cell id on arrow navigation', () => {
    const onCellNavigate = vi.fn();
    render(React.createElement(TestBoard, { onCellNavigate }));

    const firstCell = screen.getByRole('gridcell', { name: 'Row 1, column 1, box 1, empty' });

    fireEvent.focus(firstCell);
    fireEvent.keyDown(firstCell, { key: 'ArrowRight' });

    expect(onCellNavigate).toHaveBeenCalledWith('r0c1');
  });

  it('should not mark any cell sameValue when the selected cell is empty', () => {
    const { result } = renderHook(() =>
      useSudokuGrid({
        cells,
        model,
        values: new Map([['r3c3', 5]]),
        givens: new Set(),
        onEnterValue: noop,
        onToggleCandidate: noop,
      })
    );

    act(() => {
      result.current.cellProps('r0c0').onClick?.({} as React.MouseEvent<HTMLDivElement>);
    });

    expect(result.current.cellState('r3c3').sameValue).toBe(false);
  });

  it('should announce a correct entry as correct even when it clashes with a wrong cell', async () => {
    vi.useFakeTimers();
    render(
      React.createElement(TestBoard, {
        checkEnabled: true,
        values: new Map([['r0c4', 5]]),
        solution: new Map([
          ['r0c0', 5],
          ['r0c4', 2],
        ]),
      })
    );

    const cell = screen.getByRole('gridcell', { name: 'Row 1, column 1, box 1, empty' });
    const getAnnouncer = () => screen.getByRole('status');

    fireEvent.focus(cell);
    fireEvent.keyDown(cell, { key: '5' });

    act(() => {
      vi.runAllTimers();
    });

    expect(getAnnouncer()?.textContent).toBe('Row 1, column 1, 5, correct');
    vi.useRealTimers();
  });
});

describe('useSudokuGrid cell labels for Sujiken', () => {
  it('should omit box number from Sujiken cell labels', () => {
    const sujikenModel = buildModel(sujiken);

    const { result } = renderHook(() =>
      useSudokuGrid({
        cells: sujikenModel.cells,
        model: sujikenModel,
        values: new Map(),
        givens: new Set(),
        onEnterValue: noop,
        onToggleCandidate: noop,
      })
    );

    // Sujiken houses are tri-region-*, not box-*; no "box N" should appear
    expect(result.current.cellProps('r0c0')['aria-label']).toBe('Row 1, column 1, empty');
    expect(result.current.cellProps('r4c2')['aria-label']).toBe('Row 5, column 3, empty');
  });
});
