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
}

function getCellLabel(
  cell: Cell,
  value: SymbolValue | undefined,
  extras: string[],
  isReadonly: boolean
): string {
  const base = value !== undefined
    ? `Row ${cell.row + 1}, column ${cell.col + 1}, ${value}`
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
}: UseSudokuGridOptions): GridInteraction {
  const [selectedId, setSelectedId] = useState<CellId | null>(null);
  const announcerRef = useRef<HTMLDivElement | null>(null);

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

      return getCellLabel(cell, state.value, extras, state.given);
    },
    [annotators, cellsById, getCellState, model, values]
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

      switch (key) {
        case 'ArrowUp':
          if (cell.row > 0) {
            nextId = `r${cell.row - 1}c${cell.col}`;
          }
          break;
        case 'ArrowDown':
          if (cell.row < model.cells.length ** 0.5 - 1) {
            nextId = `r${cell.row + 1}c${cell.col}`;
          }
          break;
        case 'ArrowLeft':
          if (cell.col > 0) {
            nextId = `r${cell.row}c${cell.col - 1}`;
          }
          break;
        case 'ArrowRight':
          if (cell.col < model.cells.length ** 0.5 - 1) {
            nextId = `r${cell.row}c${cell.col + 1}`;
          }
          break;
        case 'Home':
          nextId = `r${cell.row}c0`;
          break;
        case 'End':
          nextId = `r${cell.row}c${model.cells.length ** 0.5 - 1}`;
          break;
        case 'Escape':
          event.preventDefault();
          selectCell(null, false);
          return;
        default:
          break;
      }

      if (nextId) {
        event.preventDefault();
        selectCell(nextId);
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

      const digit = Number.parseInt(key, 10);

      if (Number.isNaN(digit) || digit < 1 || !model.symbols.includes(digit)) {
        return;
      }

      event.preventDefault();

      if (candidateMode) {
        onToggleCandidate(currentId, digit as SymbolValue);
      } else {
        onEnterValue(currentId, digit as SymbolValue);
      }

      announce(`Row ${cell.row + 1}, column ${cell.col + 1}, ${digit}`);
    },
    [announce, candidateMode, cellsById, givens, model.cells.length, model.symbols, onEnterValue, onToggleCandidate, revealed, selectCell]
  );

  const firstCellId = cells[0]?.id ?? null;

  const cellProps = useCallback(
    (id: CellId): React.HTMLAttributes<HTMLDivElement> & { 'data-cell': CellId } => ({
      'data-cell': id,
      tabIndex: selectedId === id || (selectedId === null && firstCellId === id) ? 0 : -1,
      'aria-label': describeCell(id),
      onClick() {
        selectCell(selectedId === id ? null : id);
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
