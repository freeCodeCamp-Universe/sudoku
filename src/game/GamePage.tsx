import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '@/app/Header';
import { buildModel } from '@/engine/buildModel';
import { generate } from '@/engine/generate';
import type { CellId, SymbolValue } from '@/engine/types';
import { buildMarkerGaps } from '@/game/markerGaps';
import { getVariant } from '@/variants/registry';
import { COLOR_PALETTE } from '@/variants/color';
import { isJigsawStructure, makeJigsawVariant } from '@/variants/jigsaw';
import { resolveAnnotators } from './annotators/registry';
import { jigsawAnnotator } from './annotators/jigsaw';
import { Board } from './Board';
import { findCompletedSymbols } from './completedSymbols';
import { useGameContext } from './GameContext';
import { HelpDialog } from './HelpDialog';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog/KeyboardShortcutsDialog';
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
  const navigate = useNavigate();
  const [candidateMode, toggleCandidateMode] = useReducer((mode: boolean) => !mode, false);
  const [newGameConfirmOpen, setNewGameConfirmOpen] = useState(false);
  const [winOpen, setWinOpen] = useState(false);

  const isBoardFull = state.values.size === solution.size;
  const effectiveSolved = state.solved && settings.checkEnabled;
  const showCheckPrompt = isBoardFull && !settings.checkEnabled && !state.solved;

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
  const markerGaps = useMemo(() => buildMarkerGaps(structure), [structure]);
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
    solution,
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

  useEffect(() => {
    if (state.solved) {
      setWinOpen(true);
    }
  }, [state.solved]);

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
    setWinOpen(false);
    if (hasProgress && !state.solved) {
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

  const wordCellIds = useMemo((): Set<CellId> => {
    if (!state.solved || variant.id !== 'wordoku') return new Set();
    for (let r = 0; r < 9; r++) {
      if (Array.from({ length: 9 }, (_, c) => c).every(
        (c) => solution.get(`r${r}c${c}` as CellId) === c + 1
      )) {
        return new Set(Array.from({ length: 9 }, (_, c) => `r${r}c${c}` as CellId));
      }
    }
    for (let c = 0; c < 9; c++) {
      if (Array.from({ length: 9 }, (_, r) => r).every(
        (r) => solution.get(`r${r}c${c}` as CellId) === r + 1
      )) {
        return new Set(Array.from({ length: 9 }, (_, r) => `r${r}c${c}` as CellId));
      }
    }
    return new Set();
  }, [state.solved, variant.id, solution]);
  const hasProgress =
    state.values.size > givens.size || state.candidates.size > 0 || state.revealed.size > 0;

  function formatElapsedSpaced(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

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
            markerGaps={markerGaps}
            wordCells={wordCellIds}
          />
          {liveVariant.id === 'wordoku' ? (
            <div className={styles.variantLegend} aria-label="Wordoku rule legend">
              <span>There is a hidden word somewhere. Try to find it!</span>
            </div>
          ) : null}
          {liveVariant.id === 'greater-than' ? (
            <div className={styles.variantLegend} aria-label="Greater-than rule legend">
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                aria-hidden="true"
                style={{ flexShrink: 0 }}
              >
                <polygon points="10,5 0,0 0,10" fill="#f1be32" />
              </svg>
              <span>Triangle points toward the smaller of the two adjacent digits.</span>
            </div>
          ) : null}
          {liveVariant.id === 'consecutive' ? (
            <div className={styles.variantLegend} aria-label="Consecutive rule legend">
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                aria-hidden="true"
                style={{ flexShrink: 0 }}
              >
                <circle cx="5" cy="5" r="4" fill="#d0d0e8" stroke="#1b1b32" strokeWidth="1.5" />
              </svg>
              <span>
                A dot between two cells means those digits differ by exactly 1. Cells without a dot
                must not differ by 1.
              </span>
            </div>
          ) : null}
          {liveVariant.id === 'even-odd' ? (
            <div className={styles.variantLegend} aria-label="Even-Odd rule legend">
              <span
                className={styles.legendSwatch}
                style={{ background: 'rgba(58,128,224,0.35)' }}
              />
              <span>Even (2, 4, 6, 8)</span>
              <span
                className={styles.legendSwatch}
                style={{ background: 'rgba(212,168,40,0.35)' }}
              />
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
          {liveVariant.id === 'color' ? (
            <div className={styles.colorLegend} aria-label="Color sudoku rule legend">
              <div className={styles.colorSwatches} aria-hidden="true">
                {COLOR_PALETTE.map((swatch) => (
                  <span key={swatch} className={styles.legendSwatch} style={{ background: swatch }} />
                ))}
              </div>
              <span>Each color appears exactly once per row, column, and 3×3 box.</span>
            </div>
          ) : null}
          <ModeSwitcher candidateMode={candidateMode} onToggle={toggleCandidateMode} />
          <NumberPad
            symbols={liveVariant.symbolKind === 'letter'
              ? [...model.symbols].sort((a, b) => renderSymbol(a).localeCompare(renderSymbol(b)))
              : model.symbols}
            usedSymbols={usedSymbols}
            columns={model.symbols.length === 16 ? 4 : model.symbols.length === 4 ? 4 : undefined}
            onEnter={(value) => {
              if (!selectedCellId) {
                return;
              }

              const isCorrectlyFilled =
                settings.checkEnabled &&
                solution.has(selectedCellId) &&
                state.values.get(selectedCellId) === solution.get(selectedCellId);

              if (isCorrectlyFilled) {
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
      {winOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Puzzle solved"
          className={styles.confirmOverlay}
        >
          <div className={styles.modal}>
            <button
              type="button"
              className={styles.winClose}
              aria-label="Close"
              onClick={() => setWinOpen(false)}
            >
              ×
            </button>
            <div className={styles.winEmoji} aria-hidden="true">🎉</div>
            <div className={styles.winTitle}>Great job,<br />puzzle master!</div>
            <div className={styles.winSub}>
              {settings.timerEnabled
                ? `You solved ${variant.name} in:`
                : `You solved ${variant.name}`}
            </div>
            {settings.timerEnabled ? (
              <div className={styles.winTimeBox}>{formatElapsedSpaced(state.elapsedSeconds)}</div>
            ) : null}
            <div className={styles.modalActions}>
              <button
                type="button"
                className={`${styles.modalBtn} ${styles.primary}`}
                onClick={() => {
                  setWinOpen(false);
                  onNewGame?.();
                  dispatch({ type: 'newGame' });
                }}
              >
                Play Again
              </button>
              <button
                type="button"
                className={`${styles.modalBtn} ${styles.secondary}`}
                onClick={() => setWinOpen(false)}
              >
                View Puzzle
              </button>
              <button
                type="button"
                className={`${styles.modalBtn} ${styles.secondary}`}
                onClick={() => navigate('/')}
              >
                Start Page
              </button>
            </div>
          </div>
        </div>
      ) : null}
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
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  if (!variantId) {
    throw new Error('Missing variant id');
  }

  const variant = useMemo(() => getVariant(variantId), [variantId]);
  const { settings, toggleCheck, toggleTimer } = usePersistence(variantId);
  const [genKey, setGenKey] = useState(0);
  const { model, givens, solution } = useMemo(() => {
    const builtModel = buildModel(variant);
    const puzzle = generate(builtModel, variant.difficulty);
    return { model: builtModel, givens: puzzle.givens, solution: puzzle.solution };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, genKey]);

  return (
    <>
      <Header
        title={variant.name}
        backHref="/"
        onHelpOpen={() => setHelpOpen(true)}
        onKeyboardShortcutsOpen={() => setShortcutsOpen(true)}
        checkEnabled={settings.checkEnabled}
        timerEnabled={settings.timerEnabled}
        onToggleCheck={toggleCheck}
        onToggleTimer={toggleTimer}
      />
      <main id="main-content" tabIndex={-1} className={styles.mainContent}>
        <GameProvider variant={variant} model={model} givens={givens} solution={solution}>
          <GameInner settings={settings} toggleCheck={toggleCheck} onNewGame={() => setGenKey((k) => k + 1)} />
        </GameProvider>
      </main>

      <HelpDialog
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        help={variant.help}
        description={variant.description}
      />
      <KeyboardShortcutsDialog
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
        shortcuts={[
          ...(variant.id === 'super'
            ? [
                { keys: ['1–9'], description: 'Enter a digit' },
                { keys: ['A–G'], description: 'Enter a letter' },
              ]
            : [
                {
                  keys: [variant.symbolKind === 'letter' ? 'A–Z' : `1–${variant.symbols.length}`],
                  description: variant.symbolKind === 'letter' ? 'Enter a letter' : 'Enter a digit',
                },
              ]),
          { keys: ['Backspace', 'Delete'], separator: 'or' as const, description: 'Erase' },
          { keys: ['↑', '↓', '←', '→'], description: 'Move between cells' },
          { keys: ['Escape'], description: 'Deselect cell' },
        ]}
      />
    </>
  );
}
