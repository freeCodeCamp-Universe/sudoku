import { useCallback, useMemo, useState } from 'react';
import type { ComponentProps } from 'react';
import type { CellId, Solution, SymbolValue, Variant, VariantModel } from '@/engine/types';
import type { BoardAction, BoardState } from '@/board/boardReducer';
import { NumberPad } from '@/board/NumberPad';
import { findOverusedSymbols } from '@/board/overusedSymbols';
import { findUsedSymbols } from '@/board/usedSymbols';
import type { BoardHighlights, BoardProps, GridInteraction } from '@/board/boardTypes';
import { useBoardInput } from '@/board/useBoardInput';
import { useBoardView } from '@/board/useBoardView';
import { useSudokuGrid } from '@/board/useSudokuGrid';

interface UsePlayableBoardOptions {
  variant: Variant;
  baseModel: VariantModel;
  givens: Solution;
  solution: Solution;
  seedBase: number;
  cellSize: number;
  highlights?: BoardHighlights;
  cellSelection?: 'single' | 'multiple';
  selectedIds?: Set<CellId>;
  onSelectionChange?: (ids: Set<CellId>) => void;
  state: BoardState;
  dispatch: (action: BoardAction) => void;
  checkEnabled?: boolean;
  inputLocked?: boolean;
  onCellNavigate?: (id: CellId) => void;
}

type BoardViewProps = Omit<
  BoardProps,
  'viewport' | 'checkEnabled' | 'showColorLabel' | 'wordCells'
>;

type NumberPadProps = Omit<Required<ComponentProps<typeof NumberPad>>, 'columns' | 'symbolKind'> & {
  columns: number | undefined;
  symbolKind: ComponentProps<typeof NumberPad>['symbolKind'];
};

interface InputModeProps {
  activeId: 'normal' | 'candidate';
  onSelect: (id: string) => void;
}

export function usePlayableBoard({
  variant,
  baseModel,
  givens,
  solution,
  seedBase,
  cellSize,
  highlights,
  cellSelection,
  selectedIds,
  onSelectionChange,
  state,
  dispatch,
  checkEnabled = false,
  inputLocked = false,
  onCellNavigate,
}: UsePlayableBoardOptions): {
  boardProps: BoardViewProps;
  numberPadProps: NumberPadProps;
  inputModeProps: InputModeProps;
  candidateMode: boolean;
  grid: GridInteraction;
  model: VariantModel;
  describeSymbol: (value: SymbolValue) => string;
} {
  const [candidateMode, setCandidateMode] = useState(false);
  const view = useBoardView({ variant, baseModel, solution, cellSize, seedBase });
  const givensSet = useMemo(() => new Set(givens.keys()), [givens]);
  const {
    onEnterValue,
    onToggleCandidate,
    handleNumberEntry: enterNumber,
  } = useBoardInput({
    state,
    solution,
    dispatch,
    candidateMode,
    checkEnabled,
    inputLocked,
  });
  const grid = useSudokuGrid({
    cells: view.model.cells,
    model: view.model,
    values: state.values,
    candidates: state.candidates,
    givens: givensSet,
    revealed: state.revealed,
    solution,
    onEnterValue,
    onToggleCandidate,
    checkEnabled,
    highlights,
    cellSelection,
    selectedIds,
    onSelectionChange,
    candidateMode,
    annotators: view.annotators,
    renderSymbol: view.renderSymbol,
    describeSymbol: view.describeSymbol,
    displaySymbols: view.displaySymbols,
    onSetCandidateMode: setCandidateMode,
    onCellNavigate,
  });
  const focusedCellId =
    view.model.cells.find((cell) => grid.cellState(cell.id).focused)?.id ?? null;
  const overusedSymbols = findOverusedSymbols(state.values, solution, view.model.symbols);
  const usedSymbols = findUsedSymbols(state.values, solution, view.model.symbols);

  const handleNumberEntry = useCallback(
    (value: Parameters<typeof enterNumber>[0]) => enterNumber(value, focusedCellId, grid),
    [enterNumber, focusedCellId, grid]
  );
  const onSelectInputMode = useCallback((id: string) => {
    if (id === 'normal' || id === 'candidate') {
      setCandidateMode(id === 'candidate');
    }
  }, []);

  const boardProps: BoardViewProps = {
    variant,
    cells: view.model.cells,
    rects: view.rects,
    overlapCounts: view.overlapMap,
    size: view.size,
    gutters: view.gutters,
    overlays: view.overlays,
    grid,
    renderSymbol: view.renderSymbol,
    displaySymbols: view.displaySymbols,
    markerGaps: view.markerGaps,
    parityMap: view.parityMap,
  };
  const numberPadProps: NumberPadProps = {
    symbols: view.displaySymbols,
    overusedSymbols,
    usedSymbols,
    columns:
      view.model.symbols.length === 16
        ? 4
        : view.model.symbols.length === 4
          ? 4
          : view.model.symbols.length === 6
            ? 3
            : undefined,
    onEnter: handleNumberEntry,
    candidateMode,
    renderSymbol: view.renderSymbol,
    describeSymbol: view.describeSymbol,
    symbolKind: variant.symbolKind,
  };
  const inputModeProps: InputModeProps = {
    activeId: candidateMode ? 'candidate' : 'normal',
    onSelect: onSelectInputMode,
  };

  return {
    boardProps,
    numberPadProps,
    inputModeProps,
    candidateMode,
    grid,
    model: view.model,
    describeSymbol: view.describeSymbol,
  };
}
