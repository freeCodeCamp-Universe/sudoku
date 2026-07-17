import type React from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { validate } from '@/engine/validate';
import type { Cell, CellId, SymbolValue, Values, VariantModel } from '@/engine/types';
import type { CellAnnotator, CellState, Direction, GridInteraction } from './gameTypes';
import { findOverusedSymbols } from './overusedSymbols';

function stepCellId(cell: { row: number; col: number }, direction: Direction): CellId {
  switch (direction) {
    case 'up':
      return `r${cell.row - 1}c${cell.col}`;
    case 'down':
      return `r${cell.row + 1}c${cell.col}`;
    case 'left':
      return `r${cell.row}c${cell.col - 1}`;
    case 'right':
      return `r${cell.row}c${cell.col + 1}`;
  }
}

interface UseSudokuGridOptions {
  cells: Cell[];
  model: VariantModel;
  values: Values;
  candidates?: Map<CellId, SymbolValue[]>;
  givens: Set<CellId>;
  revealed?: Set<CellId>;
  solution?: Values;
  onCellNavigate?: (id: CellId) => void;
  onEnterValue: (id: CellId, value: SymbolValue | 0) => void;
  onToggleCandidate: (id: CellId, value: SymbolValue) => void;
  checkEnabled?: boolean;
  highlightPeers?: boolean;
  candidateMode?: boolean;
  annotators?: CellAnnotator[];
  renderSymbol?: (value: SymbolValue) => string;
  describeSymbol?: (value: SymbolValue) => string;
  // Order the number pad displays symbols in; digit keys pick by pad
  // position rather than internal value, so letter variants don't let
  // typing 1-9 spell out the hidden word.
  displaySymbols?: SymbolValue[];
  onSetCandidateMode?: (candidate: boolean) => void;
}

function formatLocation(cell: Cell, boxNumber: number | undefined): string {
  return `Row ${cell.row + 1}, column ${cell.col + 1}${
    boxNumber !== undefined ? `, box ${boxNumber}` : ''
  }`;
}

function getCellLabel(
  cell: Cell,
  boxNumber: number | undefined,
  value: SymbolValue | undefined,
  candidates: SymbolValue[],
  extras: string[],
  correct: boolean | undefined,
  inConflict: boolean,
  overused: boolean,
  isReadonly: boolean,
  describeSymbol: (value: SymbolValue) => string
): string {
  const location = formatLocation(cell, boxNumber);

  let base: string;

  if (value !== undefined) {
    base = `${location}, ${describeSymbol(value)}`;
  } else if (candidates.length > 0) {
    const candidateList = candidates.map((s) => describeSymbol(s)).join(', ');
    const prefix = candidates.length === 1 ? 'candidate' : 'candidates';
    base = `${location}, ${prefix} ${candidateList}`;
  } else {
    base = `${location}, empty`;
  }

  const flags: string[] = [];

  if (correct === true) {
    flags.push('correct');
  } else if (correct === false) {
    flags.push('incorrect');
  }

  if (inConflict) {
    flags.push('in conflict');
  }

  if (overused) {
    flags.push('more placed than needed');
  }

  flags.push(...extras);

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
  solution = new Map(),
  onCellNavigate,
  onEnterValue,
  onToggleCandidate,
  checkEnabled = false,
  highlightPeers = true,
  candidateMode = false,
  annotators = [],
  renderSymbol = (value) => String(value),
  describeSymbol = renderSymbol,
  displaySymbols,
  onSetCandidateMode,
}: UseSudokuGridOptions): GridInteraction {
  const [selectedId, setSelectedId] = useState<CellId | null>(null);
  const announcerRef = useRef<HTMLDivElement | null>(null);
  const mouseDownSelectionRef = useRef<{ active: boolean; selectedId: CellId | null }>({
    active: false,
    selectedId: null,
  });

  const cellsById = useMemo(() => new Map(cells.map((cell) => [cell.id, cell])), [cells]);

  const boxNumberByCell = useMemo(() => {
    const map = new Map<CellId, number>();

    model.houses
      .filter((house) => /^box-\d+-\d+$/.test(house.id))
      .forEach((house, index) => {
        for (const id of house.cells) {
          map.set(id, index + 1);
        }
      });

    return map;
  }, [model.houses]);

  const conflictSet = useMemo(
    () => new Set(validate(values, model).flatMap((conflict) => conflict.cells)),
    [values, model]
  );

  const peerIds = useMemo(() => {
    const peers = new Set<CellId>();

    if (selectedId === null || !highlightPeers) {
      return peers;
    }

    const peerHouses = model.peerHouseFilter
      ? model.houses.filter(model.peerHouseFilter)
      : model.houses;

    for (const house of peerHouses) {
      if (house.cells.includes(selectedId)) {
        for (const cellInHouse of house.cells) {
          peers.add(cellInHouse);
        }
      }
    }

    peers.delete(selectedId);

    return peers;
  }, [selectedId, highlightPeers, model.houses, model.peerHouseFilter]);

  const getCellState = useCallback(
    (id: CellId): CellState => {
      const value = values.get(id);
      const given = givens.has(id) || revealed.has(id);
      const correct =
        checkEnabled && !given && value !== undefined && solution.has(id)
          ? value === solution.get(id)
          : undefined;
      const selectedValue = selectedId !== null ? values.get(selectedId) : undefined;

      return {
        value,
        candidates: candidates.get(id) ?? [],
        given,
        revealed: revealed.has(id),
        selected: selectedId === id,
        conflict: conflictSet.has(id),
        correct,
        sameValue: selectedValue !== undefined && value === selectedValue,
        peer: peerIds.has(id),
      };
    },
    [candidates, checkEnabled, conflictSet, givens, peerIds, revealed, selectedId, solution, values]
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
      const sortedCandidates = model.symbols.filter((s) => state.candidates.includes(s));

      const extras = annotators
        .map((annotator) => annotator.describe(id, { values, model, cellState: getCellState }))
        .filter((message): message is string => message !== null);

      return getCellLabel(
        cell,
        boxNumberByCell.get(id),
        state.value,
        sortedCandidates,
        extras,
        state.correct,
        state.conflict,
        false,
        state.given,
        describeSymbol
      );
    },
    [annotators, boxNumberByCell, cellsById, describeSymbol, getCellState, model, values]
  );

  // Announce an in-place change (value entry, deletion) with the same builder
  // and projected state that navigation uses, so the spoken description matches
  // arrowing onto the cell. `values` still holds the pre-change state when this
  // runs, so callers pass the projected `nextValues` and this helper computes the
  // correct/conflict flags consistently for both keyboard and numpad paths.
  const announceCellState = useCallback(
    (id: CellId, nextValues: Values) => {
      const cell = cellsById.get(id);

      if (!cell) {
        return;
      }

      const value = nextValues.get(id);
      const sortedCandidates =
        value === undefined
          ? model.symbols.filter((s) => (candidates.get(id) ?? []).includes(s))
          : [];
      const extras = annotators
        .map((annotator) =>
          annotator.describe(id, { values: nextValues, model, cellState: getCellState })
        )
        .filter((message): message is string => message !== null);

      const correct =
        checkEnabled && value !== undefined && solution.has(id)
          ? value === solution.get(id)
          : undefined;
      const inConflict =
        value !== undefined &&
        correct !== true &&
        checkEnabled &&
        validate(nextValues, model).some((c) => c.cells.includes(id));
      const overused =
        value !== undefined && findOverusedSymbols(nextValues, solution, model.symbols).has(value);

      announce(
        getCellLabel(
          cell,
          boxNumberByCell.get(id),
          value,
          sortedCandidates,
          extras,
          correct,
          inConflict,
          overused,
          givens.has(id) || revealed.has(id),
          describeSymbol
        )
      );
    },
    [
      announce,
      annotators,
      boxNumberByCell,
      candidates,
      cellsById,
      checkEnabled,
      describeSymbol,
      getCellState,
      givens,
      model,
      revealed,
      solution,
    ]
  );

  // Selection only moves DOM focus; the focused cell's accessible name is what
  // the screen reader speaks. Pushing the same description into the live region
  // here would double-announce every move, so navigation stays silent and the
  // live region is reserved for in-place changes (value entry, mode switch).
  const selectCell = useCallback((id: CellId | null) => {
    setSelectedId(id);
  }, []);

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
          nextId = stepCellId(cell, 'up');
          break;
        case 'ArrowDown':
          nextId = stepCellId(cell, 'down');
          break;
        case 'ArrowLeft':
          nextId = stepCellId(cell, 'left');
          break;
        case 'ArrowRight':
          nextId = stepCellId(cell, 'right');
          break;
        case 'Home':
          nextId = `r${cell.row}c${Math.min(...rowCols)}`;
          break;
        case 'End':
          nextId = `r${cell.row}c${Math.max(...rowCols)}`;
          break;
        case 'Escape':
          event.preventDefault();
          selectCell(null);
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
        target?.focus({ preventScroll: true });
        onCellNavigate?.(nextId);
        return;
      }

      // Mode switching stays on the board, so it must run before the givens
      // guard (any focused cell counts) and before symbol matching (Shift+C
      // wins over entering C in letter variants; a plain C still enters the
      // value).
      if (event.shiftKey && (key === 'N' || key === 'C')) {
        event.preventDefault();
        const toCandidate = key === 'C';
        onSetCandidateMode?.(toCandidate);
        announce(toCandidate ? 'Candidate mode' : 'Normal mode');
        return;
      }

      if (givens.has(currentId) || revealed.has(currentId)) {
        return;
      }

      if (key === 'Backspace' || key === 'Delete') {
        const isCorrectCell =
          checkEnabled &&
          solution.has(currentId) &&
          values.get(currentId) === solution.get(currentId);
        if (!isCorrectCell) {
          event.preventDefault();
          onEnterValue(currentId, 0);

          const nextValues = new Map(values);
          nextValues.delete(currentId);
          announceCellState(currentId, nextValues);
        }
        return;
      }

      const normalizedKey = key.trim().toUpperCase();
      const renderedSymbol = model.symbols.find((symbol) => {
        const label = renderSymbol(symbol).trim().toUpperCase();

        return label.length === 1 && label === normalizedKey;
      });
      const keyIndex = Number.parseInt(key, 10);
      const digit = renderedSymbol ?? (displaySymbols ? displaySymbols[keyIndex - 1] : keyIndex);

      if (
        digit === undefined ||
        Number.isNaN(digit) ||
        digit < 1 ||
        !model.symbols.includes(digit)
      ) {
        return;
      }

      event.preventDefault();

      const isCorrectlyFilled =
        checkEnabled &&
        solution.has(currentId) &&
        values.get(currentId) === solution.get(currentId);
      if (isCorrectlyFilled) {
        return;
      }

      if (candidateMode) {
        const current = candidates.get(currentId) ?? [];
        const adding = !current.includes(digit as SymbolValue);

        onToggleCandidate(currentId, digit as SymbolValue);

        const action = adding ? 'added' : 'removed';
        announce(
          `${formatLocation(cell, boxNumberByCell.get(currentId))}, candidate ${describeSymbol(digit as SymbolValue)} ${action}`
        );
      } else {
        onEnterValue(currentId, digit as SymbolValue);

        const nextValues = new Map(values);
        nextValues.set(currentId, digit as SymbolValue);

        announceCellState(currentId, nextValues);
      }
    },
    [
      announce,
      announceCellState,
      boxNumberByCell,
      candidateMode,
      candidates,
      cells,
      cellsById,
      checkEnabled,
      describeSymbol,
      displaySymbols,
      givens,
      model,
      onCellNavigate,
      onEnterValue,
      onSetCandidateMode,
      onToggleCandidate,
      renderSymbol,
      revealed,
      selectCell,
      solution,
      values,
    ]
  );

  const firstCellId = cells[0]?.id ?? null;

  const moveSelection = useCallback(
    (direction: Direction) => {
      if (!selectedId) {
        if (firstCellId) {
          selectCell(firstCellId);
          document
            .querySelector<HTMLElement>(`[data-cell="${firstCellId}"]`)
            ?.focus({ preventScroll: true });
          onCellNavigate?.(firstCellId);
        }
        return;
      }
      const cell = cellsById.get(selectedId);
      if (!cell) {
        return;
      }
      const nextId = stepCellId(cell, direction);
      if (!cellsById.has(nextId)) {
        return;
      }
      selectCell(nextId);
      document
        .querySelector<HTMLElement>(`[data-cell="${nextId}"]`)
        ?.focus({ preventScroll: true });
      onCellNavigate?.(nextId);
    },
    [selectedId, firstCellId, cellsById, selectCell, onCellNavigate]
  );

  const cellProps = useCallback(
    (id: CellId): React.HTMLAttributes<HTMLDivElement> & { 'data-cell': CellId } => ({
      'data-cell': id,
      tabIndex: selectedId === id || (selectedId === null && firstCellId === id) ? 0 : -1,
      onMouseDown() {
        mouseDownSelectionRef.current = { active: true, selectedId };
      },
      onClick() {
        const wasSelected = mouseDownSelectionRef.current.active
          ? mouseDownSelectionRef.current.selectedId === id
          : selectedId === id;

        mouseDownSelectionRef.current = { active: false, selectedId: null };
        selectCell(wasSelected ? null : id);
      },
      onFocus() {
        if (selectedId !== id) {
          selectCell(id);
        }
      },
      onKeyDown(event) {
        handleKey(event.key, id, event);
      },
    }),
    [firstCellId, handleKey, selectCell, selectedId]
  );

  return {
    cellState: getCellState,
    cellProps,
    describeCell,
    announcerRef,
    announce,
    announceCellState,
    moveSelection,
  };
}
