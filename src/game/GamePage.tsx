import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { useParams } from 'react-router-dom';
import { Header } from '@/app/Header';
import { buildModel } from '@/engine/buildModel';
import { generate } from '@/engine/generate';
import type { CellId, SymbolValue } from '@/engine/types';
import { getVariant } from '@/variants/registry';
import { resolveAnnotators } from './annotators/registry';
import { Board } from './Board';
import { useGameContext } from './GameContext';
import { GameProvider } from './GameProvider';
import { resolveLayout } from './layouts/registry';
import { NumberPad } from './NumberPad';
import { resolveOverlays } from './overlays/registry';
import { Timer } from './Timer';
import { Toolbar } from './Toolbar';
import { usePersistence } from './usePersistence';
import { useSudokuGrid } from './useSudokuGrid';
import styles from './GamePage.module.css';

function GameInner() {
  const { state, dispatch, variant, model: baseModel, givens, solution } = useGameContext();
  const { settings, toggleCheck, toggleTimer } = usePersistence(variant.id);
  const [candidateMode, toggleCandidateMode] = useReducer((mode: boolean) => !mode, false);

  const structure = useMemo(
    () => variant.deriveStructure?.(solution, baseModel),
    [baseModel, solution, variant]
  );
  const model = useMemo(
    () => (structure === undefined ? baseModel : { ...baseModel, structure }),
    [baseModel, structure]
  );
  const layoutStrategy = useMemo(() => resolveLayout(variant.layout.kind), [variant.layout.kind]);
  const rects = useMemo(() => layoutStrategy.cellRects(variant), [layoutStrategy, variant]);
  const size = useMemo(() => layoutStrategy.canvasSize(variant), [layoutStrategy, variant]);
  const gutters = useMemo(() => layoutStrategy.gutters?.(variant), [layoutStrategy, variant]);
  const overlays = useMemo(
    () =>
      resolveOverlays(variant.overlayIds ?? []).map((Overlay, index) => (
        <Overlay key={`${variant.id}-overlay-${index}`} rects={rects} structure={structure} />
      )),
    [rects, structure, variant.id, variant.overlayIds]
  );
  const annotators = useMemo(
    () => resolveAnnotators(variant.annotatorIds ?? []),
    [variant.annotatorIds]
  );
  const renderSymbol = useMemo(
    () =>
      variant.renderSymbol
        ? (value: SymbolValue) => variant.renderSymbol!(value, structure)
        : (value: SymbolValue) => String(value),
    [structure, variant]
  );
  const givensSet = useMemo(() => new Set(givens.keys()), [givens]);

  const onEnterValue = useCallback(
    (cellId: CellId, value: SymbolValue | 0) => {
      dispatch({ type: 'enterValue', cellId, value });
    },
    [dispatch]
  );

  const onToggleCandidate = useCallback(
    (cellId: CellId, value: SymbolValue) => {
      dispatch({ type: 'toggleCandidate', cellId, value });
    },
    [dispatch]
  );

  const grid = useSudokuGrid({
    cells: model.cells,
    model,
    values: state.values,
    candidates: state.candidates,
    givens: givensSet,
    revealed: state.revealed,
    onEnterValue,
    onToggleCandidate,
    checkEnabled: settings.checkEnabled,
    candidateMode,
    annotators,
  });

  useEffect(() => {
    if (!settings.timerEnabled || state.solved) {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      dispatch({ type: 'tick' });
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [dispatch, settings.timerEnabled, state.solved]);

  useEffect(() => {
    if (!state.solved || !grid.announcerRef.current) {
      return;
    }

    grid.announcerRef.current.textContent = '';
    const timeoutId = window.setTimeout(() => {
      if (grid.announcerRef.current) {
        grid.announcerRef.current.textContent = 'Puzzle solved';
      }
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [grid.announcerRef, state.solved]);

  const selectedCellId =
    model.cells.find((cell) => grid.cellState(cell.id).selected)?.id ?? null;

  function handleReveal() {
    if (!selectedCellId || givensSet.has(selectedCellId) || state.revealed.has(selectedCellId)) {
      return;
    }

    const solutionValue = solution.get(selectedCellId);

    if (solutionValue === undefined) {
      return;
    }

    dispatch({ type: 'reveal', cellId: selectedCellId, solutionValue });
  }

  function handleNewGame() {
    dispatch({ type: 'newGame' });
  }

  const usedSymbols = useMemo(
    () =>
      new Set<SymbolValue>(
        model.symbols.filter(
          (symbol) =>
            [...state.values.values()].filter((value) => value === symbol).length >= model.symbols.length
        )
      ),
    [model.symbols, state.values]
  );
  const hasProgress =
    state.values.size > givens.size || state.candidates.size > 0 || state.revealed.size > 0;

  return (
    <div className={styles.gamePage}>
      <Timer
        elapsedSeconds={state.elapsedSeconds}
        running={settings.timerEnabled && !state.solved}
        visible={settings.timerEnabled}
        done={state.solved}
      />
      <div className={styles.gameLayout}>
        <div className={styles.gameLeft}>
          <Board
            cells={model.cells}
            rects={rects}
            size={size}
            gutters={gutters}
            overlays={overlays}
            grid={grid}
            renderSymbol={renderSymbol}
          />
        </div>
        <div className={styles.gameRight}>
          <NumberPad
            symbols={model.symbols}
            usedSymbols={usedSymbols}
            onEnter={(value) => {
              if (!selectedCellId) {
                return;
              }

              if (value === 0) {
                dispatch({ type: 'erase', cellId: selectedCellId });
                return;
              }

              if (candidateMode) {
                onToggleCandidate(selectedCellId, value);
                return;
              }

              onEnterValue(selectedCellId, value);
            }}
            candidateMode={candidateMode}
            renderSymbol={renderSymbol}
          />
          <Toolbar
            candidateMode={candidateMode}
            checkEnabled={settings.checkEnabled}
            timerEnabled={settings.timerEnabled}
            hasProgress={hasProgress}
            onUndo={() => dispatch({ type: 'undo' })}
            onErase={() => {
              if (selectedCellId) {
                dispatch({ type: 'erase', cellId: selectedCellId });
              }
            }}
            onToggleCandidateMode={toggleCandidateMode}
            onToggleCheck={toggleCheck}
            onToggleTimer={toggleTimer}
            onReveal={handleReveal}
            onNewGame={handleNewGame}
          />
        </div>
      </div>
    </div>
  );
}

export function GamePage() {
  const { variantId } = useParams<{ variantId: string }>();

  if (!variantId) {
    throw new Error('Missing variant id');
  }

  const variant = useMemo(() => getVariant(variantId), [variantId]);
  const { model, givens, solution } = useMemo(() => {
    const builtModel = buildModel(variant);
    const puzzle = generate(builtModel, variant.difficulty);

    return {
      model: builtModel,
      givens: puzzle.givens,
      solution: puzzle.solution,
    };
  }, [variant]);

  return (
    <>
      <Header title={variant.name} backHref="/" />
      <GameProvider variant={variant} model={model} givens={givens} solution={solution}>
        <GameInner />
      </GameProvider>
    </>
  );
}
