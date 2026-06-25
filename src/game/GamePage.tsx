import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '@/app/Header';
import { buildModel } from '@/engine/buildModel';
import { generate } from '@/engine/generate';
import type { CellId, SymbolValue } from '@/engine/types';
import { validate } from '@/engine/validate';
import { buildMarkerGaps } from '@/game/markerGaps';
import { getVariant } from '@/variants/registry';
import { isJigsawStructure, makePlayableJigsawVariant, PRESET_LAYOUTS } from '@/variants/jigsaw';
import { assemblePuzzle } from './assemblePuzzle';
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
  settings: {
    checkEnabled: boolean;
    timerEnabled: boolean;
    colorblindEnabled: boolean;
    highlightPeers: boolean;
  };
  onNewGame?: () => void;
}

function GameInner({ settings, onNewGame }: GameInnerProps) {
  const { state, dispatch, variant, model: baseModel, givens, solution } = useGameContext();
  const navigate = useNavigate();
  const [candidateMode, toggleCandidateMode] = useReducer((mode: boolean) => !mode, false);
  const [newGameConfirmOpen, setNewGameConfirmOpen] = useState(false);
  const [winOpen, setWinOpen] = useState(false);
  const [verifyMode, setVerifyMode] = useState(false);
  const [isVisible, setIsVisible] = useState(!document.hidden);

  useEffect(() => {
    setVerifyMode(false);
  }, [solution]);

  useEffect(() => {
    function handleVisibilityChange() {
      setIsVisible(!document.hidden);
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const checkEnabled = settings.checkEnabled || verifyMode;
  const isBoardFull = state.values.size === solution.size;
  const effectiveSolved = state.solved && checkEnabled;
  const showCheckPrompt = isBoardFull && !checkEnabled;

  const { model, structure } = useMemo(
    () => assemblePuzzle(variant, baseModel, solution),
    [baseModel, solution, variant]
  );
  const layoutStrategy = useMemo(() => resolveLayout(variant.layout.kind), [variant.layout.kind]);
  const cellSize = useResponsiveCellSize(variant);
  const rects = useMemo(
    () => layoutStrategy.cellRects(variant, cellSize),
    [layoutStrategy, variant, cellSize]
  );
  const size = useMemo(
    () => layoutStrategy.canvasSize(variant, cellSize),
    [layoutStrategy, variant, cellSize]
  );
  const gutters = useMemo(
    () => variant.deriveGutters?.(structure) ?? layoutStrategy.gutters?.(variant),
    [layoutStrategy, variant, structure]
  );
  const overlays = useMemo(
    () =>
      resolveOverlays(variant.overlayIds ?? []).map((Overlay, index) => (
        <Overlay key={`${variant.id}-overlay-${index}`} rects={rects} structure={structure} />
      )),
    [variant.id, variant.overlayIds, rects, structure]
  );
  const annotators = useMemo(
    () =>
      variant.id === 'jigsaw' && isJigsawStructure(structure)
        ? [jigsawAnnotator(structure)]
        : resolveAnnotators(variant.annotatorIds ?? []),
    [variant.annotatorIds, structure, variant.id]
  );
  const renderSymbol = useMemo(
    () =>
      variant.renderSymbol
        ? (value: SymbolValue) => variant.renderSymbol!(value, structure)
        : (value: SymbolValue) => String(value),
    [variant, structure]
  );
  const describeSymbol = useMemo(() => {
    const colorNames = (variant as VariantWithColorNames).colorNames;

    if (Array.isArray(colorNames)) {
      return (value: SymbolValue) => colorNames[value - 1] ?? renderSymbol(value);
    }

    return renderSymbol;
  }, [variant, renderSymbol]);
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
    checkEnabled,
    highlightPeers: settings.highlightPeers,
    candidateMode,
    annotators,
    renderSymbol,
    describeSymbol,
  });

  useEffect(() => {
    if (!settings.timerEnabled || !state.timerStarted || effectiveSolved || !isVisible) {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      dispatch({ type: 'tick' });
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [dispatch, effectiveSolved, isVisible, settings.timerEnabled, state.timerStarted]);

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
    if (effectiveSolved) {
      setWinOpen(true);
    }
  }, [effectiveSolved]);

  const selectedCellId = model.cells.find((cell) => grid.cellState(cell.id).selected)?.id ?? null;

  function handleReveal() {
    if (!selectedCellId || givensSet.has(selectedCellId) || state.revealed.has(selectedCellId)) {
      return;
    }

    const solutionValue = solution.get(selectedCellId);

    if (solutionValue === undefined) {
      return;
    }

    const selectedCell = model.cells.find((c) => c.id === selectedCellId);

    dispatch({ type: 'reveal', cellId: selectedCellId, solutionValue });

    if (selectedCell) {
      grid.announce(
        `Row ${selectedCell.row + 1}, column ${selectedCell.col + 1}, ${describeSymbol(solutionValue)}, revealed`
      );
    }
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
      if (
        Array.from({ length: 9 }, (_, c) => c).every(
          (c) => solution.get(`r${r}c${c}` as CellId) === c + 1
        )
      ) {
        return new Set(Array.from({ length: 9 }, (_, c) => `r${r}c${c}` as CellId));
      }
    }
    for (let c = 0; c < 9; c++) {
      if (
        Array.from({ length: 9 }, (_, r) => r).every(
          (r) => solution.get(`r${r}c${c}` as CellId) === r + 1
        )
      ) {
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
            variant={variant}
            cells={model.cells}
            rects={rects}
            size={size}
            gutters={gutters}
            overlays={overlays}
            grid={grid}
            renderSymbol={renderSymbol}
            markerGaps={markerGaps}
            wordCells={wordCellIds}
            colorblindMode={settings.colorblindEnabled}
            parityMap={(structure as { parityMap?: Map<CellId, 0 | 1> } | undefined)?.parityMap}
            checkEnabled={checkEnabled}
          />
          {variant.id === 'wordoku' ? (
            <div className={styles.variantLegend} aria-label="Wordoku rule legend">
              <span>There is a hidden word somewhere. Try to find it!</span>
            </div>
          ) : null}
          {variant.id === 'greater-than' ? (
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
          {variant.id === 'consecutive' ? (
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
          {variant.id === 'kropki' ? (
            <div className={styles.variantLegend} aria-label="Kropki rule legend">
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                aria-hidden="true"
                style={{ flexShrink: 0 }}
              >
                <circle cx="5" cy="5" r="4" fill="#f0f0fc" stroke="#5060a0" strokeWidth="1.5" />
              </svg>
              <span>Consecutive (differ by 1)</span>
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                aria-hidden="true"
                style={{ flexShrink: 0 }}
              >
                <circle cx="5" cy="5" r="4" fill="#5060a0" />
              </svg>
              <span>One is double the other</span>
            </div>
          ) : null}
          {variant.id === 'even-odd' ? (
            <div className={styles.variantLegend} aria-label="Even-Odd rule legend">
              <span className={`${styles.legendSwatch} ${styles.legendSwatchEven}`} />
              <span>Even (2, 4, 6, 8)</span>
              <span className={`${styles.legendSwatch} ${styles.legendSwatchOdd}`} />
              <span>Odd (1, 3, 5, 7, 9)</span>
            </div>
          ) : null}
          {variant.id === 'arrow' ? (
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
            symbols={
              variant.symbolKind === 'letter'
                ? [...model.symbols].sort((a, b) => renderSymbol(a).localeCompare(renderSymbol(b)))
                : model.symbols
            }
            usedSymbols={usedSymbols}
            columns={
              model.symbols.length === 16
                ? 4
                : model.symbols.length === 4
                  ? 4
                  : model.symbols.length === 6
                    ? 3
                    : undefined
            }
            onEnter={(value) => {
              if (!selectedCellId) {
                return;
              }

              const isCorrectlyFilled =
                checkEnabled &&
                solution.has(selectedCellId) &&
                state.values.get(selectedCellId) === solution.get(selectedCellId);

              if (isCorrectlyFilled) {
                return;
              }

              const selectedCell = model.cells.find((c) => c.id === selectedCellId);
              const loc = selectedCell
                ? `Row ${selectedCell.row + 1}, column ${selectedCell.col + 1}`
                : null;

              if (value === 0) {
                dispatch({ type: 'erase', cellId: selectedCellId });
                if (loc) grid.announce(`${loc}, empty`);
                return;
              }

              if (candidateMode) {
                const current = state.candidates.get(selectedCellId) ?? [];
                const adding = !current.includes(value);
                onToggleCandidate(selectedCellId, value);
                if (loc) {
                  grid.announce(
                    `${loc}, candidate ${describeSymbol(value)} ${adding ? 'added' : 'removed'}`
                  );
                }
                return;
              }

              onEnterValue(selectedCellId, value);
              if (loc) {
                const nextValues = new Map(state.values);
                nextValues.set(selectedCellId, value);
                const isCorrect =
                  checkEnabled &&
                  solution.has(selectedCellId) &&
                  value === solution.get(selectedCellId);
                const correctness =
                  checkEnabled && solution.has(selectedCellId)
                    ? isCorrect
                      ? ', correct'
                      : ', incorrect'
                    : '';
                const inConflict =
                  !isCorrect &&
                  checkEnabled &&
                  validate(nextValues, model).some((c) => c.cells.includes(selectedCellId));
                grid.announce(
                  `${loc}, ${describeSymbol(value)}${correctness}${inConflict ? ', in conflict' : ''}`
                );
              }
            }}
            candidateMode={candidateMode}
            renderSymbol={renderSymbol}
            describeSymbol={describeSymbol}
            symbolKind={variant.symbolKind}
          />
          <Toolbar onClearAll={() => dispatch({ type: 'clearAll' })} onReveal={handleReveal} />
        </div>
      </div>
      {showCheckPrompt ? (
        <div className={styles.checkPrompt}>
          Looks like you&apos;re done!
          <button
            type="button"
            className={styles.checkPromptBtn}
            onClick={() => {
              setVerifyMode(true);
              grid.announce('Answers checked');
            }}
          >
            Check your answers
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
            <div className={styles.winEmoji} aria-hidden="true">
              🎉
            </div>
            <div className={styles.winTitle}>
              Great job,
              <br />
              puzzle master!
            </div>
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
  const { settings, toggleCheck, toggleTimer, toggleColorblind, toggleHighlightPeers } =
    usePersistence(variantId);
  const [genKey, setGenKey] = useState(0);
  // Randomize which jigsaw region layout a session starts on; rotating by genKey
  // then guarantees a different layout on every New Game.
  const [jigsawLayoutStart] = useState(() => Math.floor(Math.random() * PRESET_LAYOUTS.length));
  const { model, gameVariant, givens, solution } = useMemo(() => {
    const activeVariant =
      variant.id === 'jigsaw'
        ? makePlayableJigsawVariant(
            PRESET_LAYOUTS[(jigsawLayoutStart + genKey) % PRESET_LAYOUTS.length]
          )
        : variant;
    const builtModel = buildModel(activeVariant);
    const puzzle = generate(builtModel, variant.difficulty);
    return {
      model: builtModel,
      gameVariant: activeVariant,
      givens: puzzle.givens,
      solution: puzzle.solution,
    };
  }, [variant, genKey, jigsawLayoutStart]);

  return (
    <>
      <Header
        title={variant.name}
        backHref="/"
        onHelpOpen={() => setHelpOpen(true)}
        onKeyboardShortcutsOpen={() => setShortcutsOpen(true)}
        checkEnabled={settings.checkEnabled}
        timerEnabled={settings.timerEnabled}
        colorblindEnabled={settings.colorblindEnabled}
        highlightPeersEnabled={settings.highlightPeers}
        onToggleCheck={toggleCheck}
        onToggleTimer={toggleTimer}
        onToggleColorblind={variant.symbolKind === 'color' ? toggleColorblind : undefined}
        onToggleHighlightPeers={toggleHighlightPeers}
      />
      <main id="main-content" tabIndex={-1} className={styles.mainContent}>
        <GameProvider variant={gameVariant} model={model} givens={givens} solution={solution}>
          <GameInner settings={settings} onNewGame={() => setGenKey((k) => k + 1)} />
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
                { keys: ['1-9'], description: 'Enter a digit' },
                { keys: ['A-G'], description: 'Enter a letter' },
              ]
            : [
                {
                  keys: [variant.symbolKind === 'letter' ? 'A-Z' : `1-${variant.symbols.length}`],
                  description:
                    variant.symbolKind === 'letter'
                      ? 'Enter a letter'
                      : variant.symbolKind === 'color'
                        ? 'Enter a color'
                        : 'Enter a digit',
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
