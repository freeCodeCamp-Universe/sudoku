import type React from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { validate } from '@/engine/validate';
import type { Cell, CellId, SymbolValue, Values, VariantModel } from '@/engine/types';
import type { CellAnnotator, CellState, GridInteraction } from './gameTypes';

interface UseSudokuGridOptions {
  cells: Cell[];
  model: VariantModel;
  values: Values;
  candidates?: Map<CellId, SymbolValue[]>;
  givens: Set<CellId>;
  revealed?: Set<CellId>;
  onEnterValue: (id: CellId, value: SymbolValue | 0) => void;
  onToggleCandidate: (id: CellId, value: SymbolValue) => void;
  checkEnabled?: boolean;
  candidateMode?: boolean;
  annotators?: CellAnnotator[];
  renderSymbol?: (value: SymbolValue) => string;
  describeSymbol?: (value: SymbolValue) => string;
}

function getCellLabel(
  cell: Cell,
  value: SymbolValue | undefined,
  extras: string[],
  isReadonly: boolean,
  describeSymbol: (value: SymbolValue) => string
): string {
  const base = value !== undefined
    ? `Row ${cell.row + 1}, column ${cell.col + 1}, ${describeSymbol(value)}`
    : `Row ${cell.row + 1}, column ${cell.col + 1}, empty`;

  const flags = [...extras];

  if (isReadonly) {
    flags.push('readonly');
  }

  return flags.length > 0 ? `${base}, ${flags.join(', ')}` : base;
}

export function useSudokuGrid({
  cells,
  model,
  values,
  candidates = new Map(),
  givens,
  revealed = new Set(),
  onEnterValue,
  onToggleCandidate,
  checkEnabled = false,
  candidateMode = false,
  annotators = [],
  renderSymbol = (value) => String(value),
  describeSymbol = renderSymbol,
}: UseSudokuGridOptions): GridInteraction {
  const [selectedId, setSelectedId] = useState<CellId | null>(null);
  const announcerRef = useRef<HTMLDivElement | null>(null);
  const mouseDownSelectionRef = useRef<{ active: boolean; selectedId: CellId | null }>({
    active: false,
    selectedId: null,
  });

  const cellsById = useMemo(() => new Map(cells.map((cell) => [cell.id, cell])), [cells]);

  const conflictSet = useMemo(
    () => (checkEnabled ? new Set(validate(values, model).flatMap((conflict) => conflict.cells)) : new Set<CellId>()),
    [checkEnabled, values, model]
  );

  const getCellState = useCallback(
    (id: CellId): CellState => ({
      value: values.get(id),
      candidates: candidates.get(id) ?? [],
      given: givens.has(id) || revealed.has(id),
      selected: selectedId === id,
      conflict: conflictSet.has(id),
    }),
    [candidates, conflictSet, givens, revealed, selectedId, values]
  );

  const announce = useCallback((message: string) => {
    const region = announcerRef.current;

    if (!region) {
      return;
    }

    region.textContent = '';
    window.setTimeout(() => {
      if (announcerRef.current) {
        announcerRef.current.textContent = message;
      }
    }, 0);
  }, []);

  const describeCell = useCallback(
    (id: CellId) => {
      const cell = cellsById.get(id);

      if (!cell) {
        return id;
      }

      const state = getCellState(id);
      const extras = annotators
        .map((annotator) => annotator.describe(id, { values, model, cellState: getCellState }))
        .filter((message): message is string => message !== null);

      return getCellLabel(cell, state.value, extras, state.given, describeSymbol);
    },
    [annotators, cellsById, describeSymbol, getCellState, model, values]
  );

  const selectCell = useCallback(
    (id: CellId | null, shouldAnnounce = true) => {
      setSelectedId(id);

      if (id && shouldAnnounce) {
        announce(describeCell(id));
      }
    },
    [announce, describeCell]
  );

  const handleKey = useCallback(
    (key: string, currentId: CellId, event: React.KeyboardEvent<HTMLDivElement>) => {
      const cell = cellsById.get(currentId);

      if (!cell) {
        return;
      }

      let nextId: CellId | null = null;
      const rowCols = cells.filter((entry) => entry.row === cell.row).map((entry) => entry.col);

      switch (key) {
        case 'ArrowUp':
          nextId = `r${cell.row - 1}c${cell.col}`;
          break;
        case 'ArrowDown':
          nextId = `r${cell.row + 1}c${cell.col}`;
          break;
        case 'ArrowLeft':
          nextId = `r${cell.row}c${cell.col - 1}`;
          break;
        case 'ArrowRight':
          nextId = `r${cell.row}c${cell.col + 1}`;
          break;
        case 'Home':
          nextId = `r${cell.row}c${Math.min(...rowCols)}`;
          break;
        case 'End':
          nextId = `r${cell.row}c${Math.max(...rowCols)}`;
          break;
        case 'Escape':
          event.preventDefault();
          selectCell(null, false);
          return;
        default:
          break;
      }

      if (nextId && !cellsById.has(nextId)) {
        nextId = null;
      }

      if (nextId) {
        event.preventDefault();
        selectCell(nextId);
        const grid = event.currentTarget.closest?.('[role="grid"]');
        const target = grid?.querySelector<HTMLElement>(`[data-cell="${nextId}"]`);
        target?.focus();
        return;
      }

      if (givens.has(currentId) || revealed.has(currentId)) {
        return;
      }

      if (key === 'Backspace' || key === 'Delete' || key === '0') {
        event.preventDefault();
        onEnterValue(currentId, 0);
        announce(`Row ${cell.row + 1}, column ${cell.col + 1}, empty`);
        return;
      }

      const normalizedKey = key.trim().toUpperCase();
      const renderedSymbol = model.symbols.find((symbol) => {
        const label = renderSymbol(symbol).trim().toUpperCase();

        return label.length === 1 && label === normalizedKey;
      });
      const digit = renderedSymbol ?? Number.parseInt(key, 10);

      if (Number.isNaN(digit) || digit < 1 || !model.symbols.includes(digit)) {
        return;
      }

      event.preventDefault();

      if (candidateMode) {
        onToggleCandidate(currentId, digit as SymbolValue);
      } else {
        onEnterValue(currentId, digit as SymbolValue);
      }

      announce(`Row ${cell.row + 1}, column ${cell.col + 1}, ${describeSymbol(digit as SymbolValue)}`);
    },
    [announce, candidateMode, cells, cellsById, describeSymbol, givens, model.symbols, onEnterValue, onToggleCandidate, renderSymbol, revealed, selectCell]
  );

  const firstCellId = cells[0]?.id ?? null;

  const cellProps = useCallback(
    (id: CellId): React.HTMLAttributes<HTMLDivElement> & { 'data-cell': CellId } => ({
      'data-cell': id,
      tabIndex: selectedId === id || (selectedId === null && firstCellId === id) ? 0 : -1,
      'aria-label': describeCell(id),
      onMouseDown() {
        mouseDownSelectionRef.current = { active: true, selectedId };
      },
      onClick() {
        const wasSelected =
          mouseDownSelectionRef.current.active
            ? mouseDownSelectionRef.current.selectedId === id
            : selectedId === id;

        mouseDownSelectionRef.current = { active: false, selectedId: null };
        selectCell(wasSelected ? null : id);
      },
      onFocus() {
        if (selectedId !== id) {
          selectCell(id, false);
        }
      },
      onKeyDown(event) {
        handleKey(event.key, id, event);
      },
    }),
    [describeCell, firstCellId, handleKey, selectCell, selectedId]
  );

  return {
    cellState: getCellState,
    cellProps,
    announcerRef,
  };
}
