import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Header } from '@/app/Header';
import { buildModel } from '@/engine/buildModel';
import { generate } from '@/engine/generate';
import type { CellId, SymbolValue } from '@/engine/types';
import { getVariant } from '@/variants/registry';
import { isJigsawStructure, makeJigsawVariant } from '@/variants/jigsaw';
import { resolveAnnotators } from './annotators/registry';
import { jigsawAnnotator } from './annotators/jigsaw';
import { Board } from './Board';
import { findCompletedSymbols } from './completedSymbols';
import { useGameContext } from './GameContext';
import { HelpDialog } from './HelpDialog';
import { GameProvider } from './GameProvider';
import { resolveLayout } from './layouts/registry';
import { useResponsiveCellSize } from './useResponsiveCellSize';
import { ModeSwitcher } from './ModeSwitcher';
import { NumberPad } from './NumberPad';
import { resolveOverlays } from './overlays/registry';
import { Timer } from './Timer';
import { Toolbar } from './Toolbar';
import { usePersistence } from './usePersistence';
import { useSudokuGrid } from './useSudokuGrid';
import styles from './GamePage.module.css';

type VariantWithColorNames = {
  colorNames?: string[];
};

interface GameInnerProps {
  settings: { checkEnabled: boolean; timerEnabled: boolean };
  toggleCheck: () => void;
  onNewGame?: () => void;
}

function GameInner({ settings, toggleCheck, onNewGame }: GameInnerProps) {
  const { state, dispatch, variant, model: baseModel, givens, solution } = useGameContext();
  const [candidateMode, toggleCandidateMode] = useReducer((mode: boolean) => !mode, false);
  const [newGameConfirmOpen, setNewGameConfirmOpen] = useState(false);

  const isBoardFull = state.values.size === solution.size;
  const effectiveSolved = state.solved && settings.checkEnabled;
  const showCheckPrompt = isBoardFull && !settings.checkEnabled && !effectiveSolved;

  const structure = useMemo(
    () => variant.deriveStructure?.(solution, baseModel),
    [baseModel, solution, variant]
  );
  const liveVariant = useMemo(() => {
    if (variant.id === 'jigsaw' && isJigsawStructure(structure)) {
      return makeJigsawVariant(structure.regions);
    }

    return variant;
  }, [structure, variant]);
  const model = useMemo(() => {
    const liveModel = liveVariant === variant ? baseModel : buildModel(liveVariant);

    return structure === undefined ? liveModel : { ...liveModel, structure };
  }, [baseModel, liveVariant, structure, variant]);
  const layoutStrategy = useMemo(
    () => resolveLayout(liveVariant.layout.kind),
    [liveVariant.layout.kind]
  );
  const cellSize = useResponsiveCellSize(liveVariant);
  const rects = useMemo(
    () => layoutStrategy.cellRects(liveVariant, cellSize),
    [layoutStrategy, liveVariant, cellSize]
  );
  const size = useMemo(
    () => layoutStrategy.canvasSize(liveVariant, cellSize),
    [layoutStrategy, liveVariant, cellSize]
  );
  const gutters = useMemo(
    () => liveVariant.deriveGutters?.(structure) ?? layoutStrategy.gutters?.(liveVariant),
    [layoutStrategy, liveVariant, structure]
  );
  const overlays = useMemo(
    () =>
      resolveOverlays(liveVariant.overlayIds ?? []).map((Overlay, index) => (
        <Overlay key={`${liveVariant.id}-overlay-${index}`} rects={rects} structure={structure} />
      )),
    [liveVariant.id, liveVariant.overlayIds, rects, structure]
  );
  const annotators = useMemo(
    () =>
      variant.id === 'jigsaw' && isJigsawStructure(structure)
        ? [jigsawAnnotator(structure)]
        : resolveAnnotators(liveVariant.annotatorIds ?? []),
    [liveVariant.annotatorIds, structure, variant.id]
  );
  const renderSymbol = useMemo(
    () =>
      liveVariant.renderSymbol
        ? (value: SymbolValue) => liveVariant.renderSymbol!(value, structure)
        : (value: SymbolValue) => String(value),
    [liveVariant, structure]
  );
  const describeSymbol = useMemo(() => {
    const colorNames = (liveVariant as VariantWithColorNames).colorNames;

    if (Array.isArray(colorNames)) {
      return (value: SymbolValue) => colorNames[value - 1] ?? renderSymbol(value);
    }

    return renderSymbol;
  }, [liveVariant, renderSymbol]);
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
    renderSymbol,
    describeSymbol,
  });

  useEffect(() => {
    if (!settings.timerEnabled || !state.timerStarted || effectiveSolved) {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      dispatch({ type: 'tick' });
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [dispatch, effectiveSolved, settings.timerEnabled, state.timerStarted]);

  useEffect(() => {
    if (!effectiveSolved || !grid.announcerRef.current) {
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
  }, [grid.announcerRef, effectiveSolved]);

  const selectedCellId = model.cells.find((cell) => grid.cellState(cell.id).selected)?.id ?? null;

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
    if (hasProgress) {
      setNewGameConfirmOpen(true);
      return;
    }
    onNewGame?.();
    dispatch({ type: 'newGame' });
  }

  const usedSymbols = useMemo(
    () => findCompletedSymbols(state.values, model.symbols, model.cells.length),
    [model.cells.length, model.symbols, state.values]
  );
  const hasProgress =
    state.values.size > givens.size || state.candidates.size > 0 || state.revealed.size > 0;

  return (
    <div className={styles.gamePage}>
      <Timer
        elapsedSeconds={state.elapsedSeconds}
        running={settings.timerEnabled && state.timerStarted && !effectiveSolved}
        visible={settings.timerEnabled}
        done={effectiveSolved}
      />
      <div className={styles.gameLayout}>
        <div className={styles.gameLeft}>
          <Board
            variant={liveVariant}
            cells={model.cells}
            rects={rects}
            size={size}
            gutters={gutters}
            overlays={overlays}
            grid={grid}
            renderSymbol={renderSymbol}
          />
          {liveVariant.id === 'wordoku' ? (
            <div className={styles.variantLegend} aria-label="Wordoku rule legend">
              <span>There is a hidden word somewhere. Try to find it!</span>
            </div>
          ) : null}
          {liveVariant.id === 'greater-than' ? (
            <div className={styles.variantLegend} aria-label="Greater-than rule legend">
              <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" style={{ flexShrink: 0 }}>
                <polygon points="10,5 0,0 0,10" fill="#f1be32" />
              </svg>
              <span>Triangle points toward the smaller of the two adjacent digits.</span>
            </div>
          ) : null}
          {liveVariant.id === 'consecutive' ? (
            <div className={styles.variantLegend} aria-label="Consecutive rule legend">
              <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" style={{ flexShrink: 0 }}>
                <circle cx="5" cy="5" r="4" fill="#d0d0e8" stroke="#1b1b32" strokeWidth="1.5" />
              </svg>
              <span>A dot between two cells means those digits differ by exactly 1. Cells without a dot must not differ by 1.</span>
            </div>
          ) : null}
          {liveVariant.id === 'even-odd' ? (
            <div className={styles.variantLegend} aria-label="Even-Odd rule legend">
              <span className={styles.legendSwatch} style={{ background: 'rgba(58,128,224,0.35)' }} />
              <span>Even (2, 4, 6, 8)</span>
              <span className={styles.legendSwatch} style={{ background: 'rgba(212,168,40,0.35)' }} />
              <span>Odd (1, 3, 5, 7, 9)</span>
            </div>
          ) : null}
          {liveVariant.id === 'arrow' ? (
            <div className={styles.variantLegend} aria-label="Arrow rule legend">
              <svg
                width="44"
                height="18"
                viewBox="0 0 80 18"
                aria-hidden="true"
                className={styles.legendIcon}
              >
                <circle cx="9" cy="9" r="8" fill="none" stroke="#9898b8" strokeWidth="1.5" />
                <polyline points="17,9 66,9" fill="none" stroke="#9898b8" strokeWidth="1.5" />
                <polygon points="73,9 65,5 65,13" fill="#9898b8" />
              </svg>
              <span>Digits along each arrow sum to the number in the circle.</span>
            </div>
          ) : null}
        </div>
        <div className={styles.gameRight}>
          <ModeSwitcher candidateMode={candidateMode} onToggle={toggleCandidateMode} />
          <NumberPad
            symbols={model.symbols}
            usedSymbols={usedSymbols}
            columns={model.symbols.length === 16 ? 4 : undefined}
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
            describeSymbol={describeSymbol}
            symbolKind={liveVariant.symbolKind}
          />
          <Toolbar onClearAll={() => dispatch({ type: 'clearAll' })} onReveal={handleReveal} />
        </div>
      </div>
      {showCheckPrompt ? (
        <div className={styles.checkPrompt}>
          All cells filled.
          <button
            type="button"
            className={styles.checkPromptBtn}
            onClick={() => {
              toggleCheck();
            }}
          >
            Check answers
          </button>
        </div>
      ) : null}
      <button type="button" className={styles.newGameBtn} onClick={handleNewGame}>
        New Game
      </button>
      {newGameConfirmOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Start a new game?"
          className={styles.confirmOverlay}
        >
          <div className={styles.modal}>
            <div className={styles.modalTitle}>Start a new game?</div>
            <div className={styles.modalSub}>Your current progress will be lost.</div>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={`${styles.modalBtn} ${styles.primary}`}
                onClick={() => {
                  setNewGameConfirmOpen(false);
                  onNewGame?.();
                  dispatch({ type: 'newGame' });
                }}
              >
                Start New Game
              </button>
              <button
                type="button"
                className={`${styles.modalBtn} ${styles.secondary}`}
                onClick={() => setNewGameConfirmOpen(false)}
              >
                Keep Playing
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function GamePage() {
  const { variantId } = useParams<{ variantId: string }>();
  const [helpOpen, setHelpOpen] = useState(false);

  if (!variantId) {
    throw new Error('Missing variant id');
  }

  const variant = useMemo(() => getVariant(variantId), [variantId]);
  const { settings, toggleCheck, toggleTimer } = usePersistence(variantId);
  const { model, givens, solution } = useMemo(() => {
    const builtModel = buildModel(variant);
    const puzzle = generate(builtModel, variant.difficulty);
    return { model: builtModel, givens: puzzle.givens, solution: puzzle.solution };
  }, [variant]);

  return (
    <>
      <Header
        title={variant.name}
        backHref="/"
        onHelpOpen={() => setHelpOpen(true)}
        checkEnabled={settings.checkEnabled}
        timerEnabled={settings.timerEnabled}
        onToggleCheck={toggleCheck}
        onToggleTimer={toggleTimer}
      />
      <main id="main-content" tabIndex={-1} className={styles.mainContent}>
        <GameProvider variant={variant} model={model} givens={givens} solution={solution}>
          <GameInner settings={settings} toggleCheck={toggleCheck} />
        </GameProvider>
      </main>

      <HelpDialog
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        help={variant.help}
        description={variant.description}
      />
    </>
  );
}
