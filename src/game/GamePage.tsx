import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Header } from '@/app/Header';
import { useTheme } from '@/app/ThemeProvider';
import { createSeededRng, hashSeed } from '@/engine/rng';
import type { CellId, SymbolValue } from '@/engine/types';
import { validate } from '@/engine/validate';
import {
  boardFrameEdge,
  framedBoardSize,
  gutteredBoardSize,
  gutterOrigin,
  isOversized,
} from '@/game/boardViewport';
import { Button } from '@/game/Button';
import { Dialog } from '@/game/Dialog';
import type { BoardViewportState } from '@/game/gameTypes';
import { Minimap } from '@/game/Minimap';
import { buildMarkerGaps } from '@/game/markerGaps';
import { BoardZoomControls } from '@/game/BoardZoomControls';
import { useBoardGestures } from '@/game/useBoardGestures';
import { useBoardViewport } from '@/game/useBoardViewport';
import { useElementSize } from '@/game/useElementSize';
import { useMediaQuery } from '@/game/useMediaQuery';
import { getVariant } from '@/variants/registry';
import { isJigsawStructure } from '@/variants/jigsaw';
import { assemblePuzzle } from './assemblePuzzle';
import { resolveAnnotators } from './annotators/registry';
import { jigsawAnnotator } from './annotators/jigsaw';
import { Board } from './Board';
import { DPad } from '@/game/DPad';
import { Tabs, type Tab } from './Tabs';
import { Toggle } from '@/app/Toggle';
import { findCompletedSymbols } from './completedSymbols';
import { buildPuzzle } from './buildPuzzle';
import { useGameContext } from './GameContext';
import { HelpDialog } from './HelpDialog';
import { OnboardingDialog } from './OnboardingDialog';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog/KeyboardShortcutsDialog';
import { GameProvider } from './GameProvider';
import { resolveLayout } from './layouts/registry';
import { useResponsiveCellSize } from './useResponsiveCellSize';
import { NumberPad } from './NumberPad';
import { resolveOverlays } from './overlays/registry';
import { Timer } from './Timer';
import { Toolbar } from './Toolbar';
import { usePersistence } from './usePersistence';
import { clearProgress, loadProgress, saveProgress } from './useProgressPersistence';
import { useSudokuGrid } from './useSudokuGrid';
import styles from './GamePage.module.css';

type VariantWithColorNames = {
  colorNames?: string[];
};

// Letter variants can't show symbols in value order — for wordoku, values
// 1-9 spell the hidden word, so value order on the pad would give it away.
// A seeded shuffle keeps the order stable for the lifetime of the puzzle
// (including restores from saved progress) without revealing anything.
function shuffledDisplayOrder(symbols: SymbolValue[], seed: number): SymbolValue[] {
  const rng = createSeededRng(seed);
  const order = [...symbols];
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

interface GameInnerProps {
  settings: {
    checkEnabled: boolean;
    timerEnabled: boolean;
    highlightPeers: boolean;
    showColorLabels: boolean;
  };
  onNewGame?: () => void;
  onFirstWin?: () => void;
  onToggleColorLabels?: () => void;
  seedBase: number;
  jigsawLayoutStart: number;
  genKey: number;
}

function GameInner({
  settings,
  onNewGame,
  onFirstWin,
  onToggleColorLabels,
  seedBase,
  jigsawLayoutStart,
  genKey,
}: GameInnerProps) {
  const { state, dispatch, variant, model: baseModel, givens, solution } = useGameContext();
  const [candidateMode, setCandidateMode] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [navTab, setNavTab] = useState<'move' | 'map'>('move');
  const [newGameConfirmOpen, setNewGameConfirmOpen] = useState(false);
  const [winOpen, setWinOpen] = useState(false);
  const winTitleId = useId();
  const [verifyMode, setVerifyMode] = useState(false);
  const [isVisible, setIsVisible] = useState(!document.hidden);
  // At desktop width and up (aligned with VIEWPORT_DESKTOP in cellSizes.ts)
  // the board sits beside the controls, so the compact minimap + zoom +
  // Controls-tab layout gives way to the original desktop layout: plain
  // Normal/Candidate tabs, a horizontal toolbar, and a standalone New Game
  // button, with no minimap.
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const { highContrast } = useTheme();

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

  const frameEdge = boardFrameEdge(variant.layout.kind, highContrast);
  // The full rendered extent the viewport must fit and pan: framed canvas
  // plus any clue gutters around it.
  const framedSize = useMemo(
    () => gutteredBoardSize(framedBoardSize(size, frameEdge), gutters),
    [size, frameEdge, gutters]
  );

  // Pan/zoom navigation for mobile boards. `viewportRef` measures the stable
  // board frame; `clipRef` points at the mobile viewport wrapper that stays
  // mounted even before pan/zoom engages, so fitting boards do not remount
  // their cell subtree on first zoom.
  const viewportRef = useRef<HTMLDivElement>(null);
  const clipRef = useRef<HTMLDivElement>(null);
  const viewportSize = useElementSize(viewportRef);
  const oversized = isOversized(framedSize, viewportSize) && viewportSize.w > 0;
  const boardViewport = useBoardViewport(framedSize, viewportSize);
  const gestures = useBoardGestures(boardViewport);
  // The pan/zoom clip also engages when the user zooms into a board that
  // already fits its frame (scale 1 is natural size for fitting boards).
  // Never at desktop: boards render at natural size there, and the clip's
  // percentage-width wrap has no intrinsic width, so mounting it inside the
  // shrink-to-fit desktop gameLeft column collapses the board to 0px (e.g.
  // when a mobile zoom level survives a resize across the 1024px breakpoint).
  const panZoomActive = !isDesktop && (oversized || boardViewport.engaged);

  // Cell rects are in canvas coordinates; the board's origin is the gutter
  // layout's corner (when clue gutters exist), one gutter plus one frame edge
  // before the canvas.
  const cellOrigin = useMemo(() => {
    const origin = gutterOrigin(gutters);
    return { x: origin.x + frameEdge, y: origin.y + frameEdge };
  }, [gutters, frameEdge]);

  const ensureCellVisible = useCallback(
    (id: CellId) => {
      const rect = rects.get(id);
      if (rect) {
        boardViewport.ensureVisible({
          ...rect,
          x: rect.x + cellOrigin.x,
          y: rect.y + cellOrigin.y,
        });
      }
    },
    [boardViewport, rects, cellOrigin]
  );

  const viewportState: BoardViewportState | undefined = !isDesktop
    ? {
        active: panZoomActive,
        transform: boardViewport.transform,
        animated: boardViewport.animated,
        viewportRef: clipRef,
        onPointerDown: gestures.onPointerDown,
        onPointerMove: gestures.onPointerMove,
        onPointerUp: gestures.onPointerUp,
      }
    : undefined;

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
  const filled = useMemo(() => {
    const set = new Set<CellId>(givensSet);
    for (const id of state.values.keys()) set.add(id);
    return set;
  }, [givensSet, state.values]);

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

  const displaySymbols = useMemo(
    () =>
      variant.symbolKind === 'letter'
        ? shuffledDisplayOrder(model.symbols, hashSeed(seedBase, variant.id, 'display-order'))
        : model.symbols,
    [variant.symbolKind, variant.id, model.symbols, seedBase]
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
    displaySymbols,
    onSetCandidateMode: setCandidateMode,
    onCellNavigate: panZoomActive ? ensureCellVisible : undefined,
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
    clearProgress(variant.id);
    onNewGame?.();
    dispatch({ type: 'newGame' });
  }

  const usedSymbols = useMemo(
    () => findCompletedSymbols(state.values, solution, model.symbols),
    [model.symbols, solution, state.values]
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

  useEffect(() => {
    if (state.solved || !hasProgress) {
      clearProgress(variant.id);
      return;
    }
    saveProgress(variant.id, {
      seedBase,
      jigsawLayoutStart,
      genKey,
      values: [...state.values],
      candidates: [...state.candidates],
      revealed: [...state.revealed],
      elapsedSeconds: state.elapsedSeconds,
    });
  }, [state, hasProgress, variant.id, seedBase, jigsawLayoutStart, genKey]);

  function formatElapsedSpaced(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  const zoomControls = (
    <BoardZoomControls
      viewport={boardViewport}
      viewportSize={viewportSize}
      selectedCellId={selectedCellId}
      rects={rects}
      frameEdge={frameEdge}
    />
  );

  const minimap = (
    <div className={styles.navDock}>
      <Minimap
        rects={rects}
        filled={filled}
        board={framedSize}
        viewport={viewportSize}
        origin={cellOrigin}
        // Without the clip the board renders untransformed, so the indicator
        // must reflect identity even if the viewport state has drifted.
        transform={
          panZoomActive ? boardViewport.transform : { scale: 1, translateX: 0, translateY: 0 }
        }
        onSeek={(point) =>
          boardViewport.panToMinimapPoint(point, { w: 120, h: (framedSize.h / framedSize.w) * 120 })
        }
      />
    </div>
  );

  const handleNumberEntry = (value: SymbolValue | 0) => {
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
    const loc = selectedCell ? `Row ${selectedCell.row + 1}, column ${selectedCell.col + 1}` : null;

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
        grid.announce(`${loc}, candidate ${describeSymbol(value)} ${adding ? 'added' : 'removed'}`);
      }
      return;
    }

    onEnterValue(selectedCellId, value);
    if (loc) {
      const nextValues = new Map(state.values);
      nextValues.set(selectedCellId, value);
      const isCorrect =
        checkEnabled && solution.has(selectedCellId) && value === solution.get(selectedCellId);
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
  };

  const numberPad = (
    <NumberPad
      symbols={displaySymbols}
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
      onEnter={handleNumberEntry}
      candidateMode={candidateMode}
      renderSymbol={renderSymbol}
      describeSymbol={describeSymbol}
      symbolKind={variant.symbolKind}
    />
  );

  // Normal and Candidate share the input panel (the number pad) and differ only
  // in pen vs. pencil. Below tablet width a Controls tab is appended to swap in
  // the reveal/clear/new-game actions; at desktop width those actions live in a
  // standalone toolbar + New Game button instead, so the tab is dropped.
  const controlTabs: Tab[] = [
    { id: 'normal', label: 'Normal', panelId: 'control-panel-input' },
    { id: 'candidate', label: 'Candidate', panelId: 'control-panel-input' },
    ...(isDesktop
      ? []
      : [{ id: 'controls', label: 'Controls', panelId: 'control-panel-controls' }]),
  ];
  const activeControlTab =
    !isDesktop && controlsOpen ? 'controls' : candidateMode ? 'candidate' : 'normal';
  const selectControlTab = (id: string) => {
    if (id === 'controls') {
      setControlsOpen(true);
      return;
    }
    setControlsOpen(false);
    setCandidateMode(id === 'candidate');
  };
  const navTabs: Tab[] = [
    { id: 'move', label: 'Move', panelId: 'nav-panel-move' },
    { id: 'map', label: 'Map', panelId: 'nav-panel-map' },
  ];

  const isColor = variant.symbolKind === 'color';
  const colorLabelToggle = isColor ? (
    <Toggle
      label="Show numbers"
      checked={settings.showColorLabels}
      onChange={onToggleColorLabels ?? (() => {})}
    />
  ) : null;

  const controlsPanel = (
    <div className={styles.actionColumn}>
      {colorLabelToggle}
      <Toolbar vertical onClearAll={() => dispatch({ type: 'clearAll' })} onReveal={handleReveal} />
      <Button variant="primary" onClick={handleNewGame}>
        New Game
      </Button>
    </div>
  );

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
          <div
            ref={viewportRef}
            className={
              panZoomActive
                ? `${styles.boardFrame} ${styles.boardFrameOversized}`
                : styles.boardFrame
            }
          >
            <Board
              variant={variant}
              cells={model.cells}
              rects={rects}
              size={size}
              gutters={gutters}
              overlays={overlays}
              grid={grid}
              renderSymbol={renderSymbol}
              displaySymbols={displaySymbols}
              markerGaps={markerGaps}
              wordCells={wordCellIds}
              parityMap={(structure as { parityMap?: Map<CellId, 0 | 1> } | undefined)?.parityMap}
              viewport={viewportState}
              checkEnabled={checkEnabled}
              showColorLabel={settings.showColorLabels}
            />
          </div>
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
                className={styles.legendIcon}
              >
                <polygon points="10,5 0,0 0,10" className={styles.legendTriangle} />
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
                className={styles.legendIcon}
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
                className={styles.legendIcon}
              >
                <circle cx="5" cy="5" r="4" fill="#f0f0fc" stroke="#5060a0" strokeWidth="1.5" />
              </svg>
              <span>Consecutive (differ by 1)</span>
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                aria-hidden="true"
                className={styles.legendIcon}
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
          {isDesktop ? (
            <>
              <Tabs
                tabs={controlTabs}
                activeId={activeControlTab}
                onSelect={selectControlTab}
                ariaLabel="Input mode"
              />
              <div
                role="tabpanel"
                id="control-panel-input"
                aria-labelledby={`${candidateMode ? 'candidate' : 'normal'}-tab`}
                className={styles.panel}
              >
                {numberPad}
              </div>
              <div className={styles.actionStack}>
                <Toolbar
                  onClearAll={() => dispatch({ type: 'clearAll' })}
                  onReveal={handleReveal}
                />
                {colorLabelToggle ? (
                  <div className={styles.settingRow}>{colorLabelToggle}</div>
                ) : null}
              </div>
            </>
          ) : (
            <div className={styles.controlsRow}>
              <div className={styles.controlsMain}>
                <Tabs
                  tabs={controlTabs}
                  activeId={activeControlTab}
                  onSelect={selectControlTab}
                  ariaLabel="Input mode and controls"
                />
                <div className={styles.inputPanels}>
                  <div
                    role="tabpanel"
                    id="control-panel-input"
                    aria-labelledby={`${candidateMode ? 'candidate' : 'normal'}-tab`}
                    className={styles.panel}
                    data-active={!controlsOpen}
                  >
                    {numberPad}
                  </div>
                  <div
                    role="tabpanel"
                    id="control-panel-controls"
                    aria-labelledby="controls-tab"
                    className={styles.panel}
                    data-active={controlsOpen}
                  >
                    {controlsPanel}
                  </div>
                </div>
              </div>
              <div className={styles.mapGroup}>
                <Tabs
                  tabs={navTabs}
                  activeId={navTab}
                  onSelect={(id) => setNavTab(id as 'move' | 'map')}
                  ariaLabel="Board navigation"
                />
                <div className={styles.navPanels}>
                  <div
                    role="tabpanel"
                    id="nav-panel-move"
                    aria-labelledby="move-tab"
                    className={`${styles.panel} ${styles.navPanel}`}
                    data-active={navTab === 'move'}
                  >
                    <DPad onMove={grid.moveSelection} />
                  </div>
                  <div
                    role="tabpanel"
                    id="nav-panel-map"
                    aria-labelledby="map-tab"
                    className={`${styles.panel} ${styles.navPanel}`}
                    data-active={navTab === 'map'}
                  >
                    {minimap}
                  </div>
                </div>
                <div className={styles.zoomRow}>{zoomControls}</div>
              </div>
            </div>
          )}
        </div>
      </div>
      {isDesktop ? (
        <Button variant="primary" className={styles.desktopNewGame} onClick={handleNewGame}>
          New Game
        </Button>
      ) : null}
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
      <Dialog
        open={winOpen}
        onClose={() => {
          setWinOpen(false);
          onFirstWin?.();
        }}
        labelledBy={winTitleId}
      >
        <div className={styles.modalBody}>
          <div className={styles.winEmoji} aria-hidden="true">
            🎉
          </div>
          <div id={winTitleId} className={styles.winTitle}>
            Great job, puzzle master!
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
                clearProgress(variant.id);
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
            <Link to="/" className={`${styles.modalBtn} ${styles.secondary}`}>
              Home
            </Link>
          </div>
        </div>
      </Dialog>
      <Dialog
        open={newGameConfirmOpen}
        onClose={() => setNewGameConfirmOpen(false)}
        title="Start a new game?"
      >
        <div className={styles.modalBody}>
          <div className={styles.modalSub}>Your progress on this puzzle will be lost.</div>
          <div className={styles.modalActions}>
            <button
              type="button"
              className={`${styles.modalBtn} ${styles.primary}`}
              onClick={() => {
                clearProgress(variant.id);
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
      </Dialog>
    </div>
  );
}

export function GamePage() {
  const { variantId } = useParams<{ variantId: string }>();
  const navigate = useNavigate();
  const [helpOpen, setHelpOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  if (!variantId) {
    throw new Error('Missing variant id');
  }

  const variant = useMemo(() => getVariant(variantId), [variantId]);
  const {
    settings,
    toggleCheck,
    toggleTimer,
    toggleHighlightPeers,
    toggleColorLabels,
    onboardingShown,
    acknowledgeOnboarding,
  } = usePersistence(variantId);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  const savedProgress = useMemo(() => loadProgress(variantId), [variantId]);

  // Restore the puzzle seed from saved progress so the same puzzle is resumed.
  const [jigsawLayoutStart] = useState(
    () => savedProgress?.jigsawLayoutStart ?? Math.floor(Math.random() * 0x7fffffff)
  );
  const [seedBase] = useState(
    () => savedProgress?.seedBase ?? Math.floor(Math.random() * 0x7fffffff)
  );
  const [genKey, setGenKey] = useState(() => savedProgress?.genKey ?? 0);

  const { model, gameVariant, givens, solution } = useMemo(
    () => buildPuzzle(variant, jigsawLayoutStart, genKey, seedBase),
    [variant, jigsawLayoutStart, genKey, seedBase]
  );

  return (
    <>
      <Header
        title={variant.name}
        onBack={() => navigate('/')}
        onHelpOpen={() => setHelpOpen(true)}
        onKeyboardShortcutsOpen={() => setShortcutsOpen(true)}
        checkEnabled={settings.checkEnabled}
        timerEnabled={settings.timerEnabled}
        highlightPeersEnabled={settings.highlightPeers}
        onToggleCheck={toggleCheck}
        onToggleTimer={toggleTimer}
        onToggleHighlightPeers={toggleHighlightPeers}
      />
      <main id="main-content" tabIndex={-1} className={styles.mainContent}>
        <GameProvider
          variant={gameVariant}
          model={model}
          givens={givens}
          solution={solution}
          initialProgress={savedProgress}
        >
          <GameInner
            settings={settings}
            onNewGame={() => setGenKey((k) => k + 1)}
            onFirstWin={onboardingShown ? undefined : () => setOnboardingOpen(true)}
            onToggleColorLabels={toggleColorLabels}
            seedBase={seedBase}
            jigsawLayoutStart={jigsawLayoutStart}
            genKey={genKey}
          />
        </GameProvider>
      </main>
      <HelpDialog
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        basicRules={variant.help?.find((s) => s.tone === 'basic')?.rules}
        help={variant.help?.filter((s) => s.tone === 'extra')}
      />
      <OnboardingDialog
        open={onboardingOpen}
        onClose={() => {
          setOnboardingOpen(false);
          acknowledgeOnboarding();
        }}
      />
      <KeyboardShortcutsDialog
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
        shortcuts={[
          ...(variant.id === 'super'
            ? [{ keys: ['1-9', 'A-G'], separator: 'and' as const, description: 'Enter a symbol' }]
            : [
                {
                  keys: [variant.symbolKind === 'letter' ? 'A-Z' : `1-${variant.symbols.length}`],
                  description: 'Enter a symbol',
                },
              ]),
          { keys: ['Backspace', 'Delete'], separator: 'or' as const, description: 'Erase' },
          { keys: ['↑', '↓', '←', '→'], description: 'Move between cells' },
          { keys: ['Shift + N'], description: 'Normal mode' },
          { keys: ['Shift + C'], description: 'Candidate mode' },
          { keys: ['Escape'], description: 'Deselect cell' },
        ]}
      />
    </>
  );
}
