import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Header, HeaderUtilityRow } from '@/components/Header';
import type { Tab } from '@/components/Tabs';
import { useTheme } from '@/app/ThemeProvider';
import type { CellId, Mode, SymbolValue } from '@/engine/types';
import { isOversized } from '@/game/boardViewport';
import {
  boardFrameEdge,
  framedBoardSize,
  gutteredBoardSize,
  gutterOrigin,
} from '@/board/boardFrame';
import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import type { BoardViewportState } from '@/board/boardTypes';
import { Minimap } from '@/game/Minimap';
import { BoardZoomControls } from './BoardZoomControls';
import { DesktopControls } from '@/game/GameControls/DesktopControls';
import { PortraitControls } from '@/game/GameControls/PortraitControls';
import { useBoardGestures } from '@/game/useBoardGestures';
import { useBoardViewport } from '@/game/useBoardViewport';
import { useElementSize } from '@/hooks/useElementSize';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { getVariant } from '@/variants/registry';
import { Board } from '@/board/Board';
import { Toggle } from '@/components/Toggle';
import { SegmentedControl, type SegmentedControlOption } from '@/components/SegmentedControl';
import { buildPuzzle } from './buildPuzzle';
import { useGameContext } from './GameContext';
import { HelpDialog } from './HelpDialog';
import { OnboardingDialog } from './OnboardingDialog';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog/KeyboardShortcutsDialog';
import { GameProvider } from './GameProvider';
import { useResponsiveCellSize } from './useResponsiveCellSize';
import { NumberPad } from '@/board/NumberPad';
import { Timer } from './Timer';
import { ToastStack } from '@/components/ToastStack';
import { Toolbar } from './Toolbar';
import { usePersistence } from './usePersistence';
import { clearProgress, loadProgress, saveProgress } from './useProgressPersistence';
import { usePlayableBoard } from '@/board/usePlayableBoard';
import { useSeoMeta } from '@/hooks/useSeoMeta';
import { seoConfig } from '@/utils/seo.config';
import { useFavorites } from '@/gallery/useFavorites';
import styles from './GamePage.module.css';

const MODE_OPTIONS: SegmentedControlOption<Mode>[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'expert', label: 'Expert' },
];

const MODE_LABELS: Record<Mode, string> = Object.fromEntries(
  MODE_OPTIONS.map((option) => [option.value, option.label])
) as Record<Mode, string>;

interface GameInnerProps {
  title: string;
  onBack: () => void;
  onHelpOpen: () => void;
  onKeyboardShortcutsOpen: () => void;
  settings: {
    checkEnabled: boolean;
    timerEnabled: boolean;
    highlightPeers: boolean;
    showColorLabels: boolean;
    navOnLeft: boolean;
    mode: Mode;
  };
  onNewGame?: (mode?: Mode) => void;
  onModeChange?: (mode: Mode) => void;
  onFirstWin?: () => void;
  onToggleColorLabels?: () => void;
  onToggleCheck: () => void;
  onToggleTimer: () => void;
  onToggleHighlightPeers: () => void;
  onToggleNavOnLeft: () => void;
  seedBase: number;
  jigsawLayoutStart: number;
  genKey: number;
  activeMode: Mode;
}

function GameInner({
  title,
  onBack,
  onHelpOpen,
  onKeyboardShortcutsOpen,
  settings,
  onNewGame,
  onModeChange,
  onFirstWin,
  onToggleColorLabels,
  onToggleCheck,
  onToggleTimer,
  onToggleHighlightPeers,
  onToggleNavOnLeft,
  seedBase,
  jigsawLayoutStart,
  genKey,
  activeMode,
}: GameInnerProps) {
  const { state, dispatch, variant, model: baseModel, givens, solution } = useGameContext();
  const { favorites, toggleFavorite } = useFavorites();
  // Per-page "Highlight overlaps" state for multigrid variants: ON by default,
  // session-only (deliberately outside usePersistence, so a fresh mount is ON).
  const [highlightOverlaps, setHighlightOverlaps] = useState(true);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [navTab, setNavTab] = useState<'move' | 'map'>('move');
  const [newGameConfirmOpen, setNewGameConfirmOpen] = useState(false);
  // The mode requested by the pending New Game, held between opening the
  // confirm dialog and the user's later "Start New Game" click.
  const [pendingMode, setPendingMode] = useState<Mode | undefined>(undefined);
  const [winOpen, setWinOpen] = useState(false);
  const winTitleId = useId();
  const [verifyMode, setVerifyMode] = useState(false);
  // One toast per overused-symbol crossing; each carries a unique id so the
  // stack can run an independent auto-dismiss countdown per toast.
  const [overusedToasts, setOverusedToasts] = useState<{ id: number; symbol: SymbolValue }[]>([]);
  const overusedToastIdRef = useRef(0);
  const [isPaused, setIsPaused] = useState(false);
  // Completion is terminal for this board: once the solve is confirmed,
  // flipping the check setting afterwards must not restart the timer,
  // reopen the win dialog, re-arm Reveal, or make the board editable again.
  const [completed, setCompleted] = useState(false);
  // The board's own live region unmounts with the board while paused, so
  // pause state changes are announced through this dedicated region instead.
  const [pauseAnnouncement, setPauseAnnouncement] = useState('');
  const [isVisible, setIsVisible] = useState(!document.hidden);
  // At desktop width and up (aligned with VIEWPORT_DESKTOP in cellSizes.ts)
  // the board sits beside the controls, so the compact minimap + zoom +
  // Controls-tab layout gives way to the original desktop layout: plain
  // Normal/Candidate tabs, a horizontal toolbar, and a standalone New Game
  // button, with no minimap.
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isLandscape = useMediaQuery('(orientation: landscape)');
  const isLandscapeMobile = !isDesktop && isLandscape;
  const { highContrast } = useTheme();
  const cellNavigationRef = useRef<(id: CellId) => void>(() => {});
  const onCellNavigate = useCallback((id: CellId) => cellNavigationRef.current(id), []);

  useEffect(() => {
    setVerifyMode(false);
    setOverusedToasts([]);
    setIsPaused(false);
    setCompleted(false);
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
  const done = effectiveSolved || completed;
  const showCheckPrompt = isBoardFull && !checkEnabled && !completed;

  useEffect(() => {
    if (effectiveSolved) {
      setCompleted(true);
    }
  }, [effectiveSolved]);

  // The check prompt's one-time verify only applies to the completed board that
  // triggered it. Once the board is no longer full (cleared or a cell erased),
  // drop verify mode so entries aren't auto-checked when the global setting is off.
  useEffect(() => {
    if (!isBoardFull) {
      setVerifyMode(false);
    }
  }, [isBoardFull]);

  const cellSize = useResponsiveCellSize(variant);
  const { boardProps, numberPadProps, inputModeProps, grid, model, describeSymbol } =
    usePlayableBoard({
      variant,
      baseModel,
      givens,
      solution,
      seedBase,
      cellSize,
      state,
      dispatch,
      checkEnabled,
      highlights: { peers: settings.highlightPeers },
      inputLocked: isPaused || completed,
      onCellNavigate,
    });
  const { rects, size, gutters } = boardProps;

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
  cellNavigationRef.current = panZoomActive ? ensureCellVisible : () => {};

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

  const givensSet = useMemo(() => new Set(givens.keys()), [givens]);
  const filled = useMemo(() => {
    const set = new Set<CellId>(givensSet);
    for (const id of state.values.keys()) set.add(id);
    return set;
  }, [givensSet, state.values]);

  // Ticks unconditionally (independent of settings.timerEnabled) so
  // elapsed time keeps accumulating in the background while the timer is
  // hidden. settings.timerEnabled only gates whether that time is *shown*
  // (Timer's visible prop, the win dialog's time row) — otherwise turning
  // the timer on mid-game would misleadingly "restart" from 0:00 instead of
  // revealing the true time already spent solving.
  useEffect(() => {
    if (!state.timerStarted || done || !isVisible || isPaused) {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      dispatch({ type: 'tick' });
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [dispatch, done, isPaused, isVisible, state.timerStarted]);

  // Announce the solve itself, not the check toggle re-deriving
  // effectiveSolved on an already-completed board. A ref (not the completed
  // state) guards the re-announce so the latch flipping in the next commit
  // does not re-run this effect and cancel the pending announcement.
  const solvedAnnouncedRef = useRef(false);
  useEffect(() => {
    solvedAnnouncedRef.current = false;
  }, [solution]);
  useEffect(() => {
    if (!effectiveSolved || solvedAnnouncedRef.current || !grid.announcerRef.current) {
      return;
    }

    solvedAnnouncedRef.current = true;
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
    if (effectiveSolved && !completed) {
      setWinOpen(true);
    }
  }, [effectiveSolved, completed]);

  const selectedCellId = model.cells.find((cell) => grid.cellState(cell.id).selected)?.id ?? null;

  function handleReveal() {
    if (
      isPaused ||
      done ||
      !selectedCellId ||
      givensSet.has(selectedCellId) ||
      state.revealed.has(selectedCellId)
    ) {
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

  // Clearing a finished board is a deliberate restart of the same puzzle,
  // so it lifts the completion latch (unlike the passive check toggle).
  function handleClearAll() {
    dispatch({ type: 'clearAll' });
    setCompleted(false);
  }

  function handleNewGame(requestedMode?: Mode) {
    setWinOpen(false);
    if (hasProgress && !state.solved) {
      setPendingMode(requestedMode);
      setNewGameConfirmOpen(true);
      return;
    }
    clearProgress(variant.id);
    onNewGame?.(requestedMode);
    dispatch({ type: 'newGame' });
  }

  // Selecting a Mode always saves the preference immediately, then requests a
  // new game the same way the New Game button does — same progress-loss
  // confirmation if there's something to lose, immediate otherwise.
  function handleModeSelect(mode: Mode) {
    if (mode === settings.mode) {
      return;
    }
    onModeChange?.(mode);
    handleNewGame(mode);
  }

  const { overusedSymbols } = numberPadProps;

  // The hint fires each time a symbol crosses into the overused state, however
  // the entry was made (numpad tap or keyboard on the board), so it watches the
  // derived set instead of living in an input handler. Placing further copies
  // of an already-overused symbol stays silent; erasing back under the limit
  // and crossing it again re-arms the toast. The ref starts as the initial set
  // so saved progress that is already overused does not fire on mount.
  const prevOverusedSymbolsRef = useRef(overusedSymbols);
  useEffect(() => {
    const previous = prevOverusedSymbolsRef.current;
    prevOverusedSymbolsRef.current = overusedSymbols;

    const newlyOverused = [...overusedSymbols].filter((symbol) => !previous.has(symbol));

    if (newlyOverused.length > 0) {
      // Each crossing gets its own toast. A symbol that re-crosses while its
      // toast is still open replaces that toast (fresh id restarts the
      // countdown) instead of stacking a duplicate message.
      setOverusedToasts((current) => [
        ...current.filter((toast) => !newlyOverused.includes(toast.symbol)),
        ...newlyOverused.map((symbol) => ({ id: (overusedToastIdRef.current += 1), symbol })),
      ]);
    }
  }, [overusedSymbols]);

  const dismissOverusedToast = useCallback((id: number) => {
    setOverusedToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

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
      mode: activeMode,
    });
  }, [state, hasProgress, variant.id, seedBase, jigsawLayoutStart, genKey, activeMode]);

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

  const numberPad = <NumberPad {...numberPadProps} />;

  // The stack's live region is the sole overuse announcement (the persistent
  // numpad label carries ongoing state), so no cell announcement duplicates it.
  const overusedEdgeHint = (
    <ToastStack
      toasts={overusedToasts.map(({ id, symbol }) => ({
        id,
        message: `Symbol ${describeSymbol(symbol)} is placed more times than the puzzle needs.`,
        content: (
          <>
            Symbol <span className={styles.overusedHintSymbols}>{describeSymbol(symbol)}</span> is
            placed more times than the puzzle needs.
          </>
        ),
      }))}
      onDismiss={dismissOverusedToast}
    />
  );

  // Normal and Candidate share the input panel (the number pad) and differ only
  // in pen vs. pencil. Below tablet width a Controls tab is appended to swap in
  // the reveal/clear/new-game actions; at desktop width those actions live in a
  // standalone toolbar + New Game button instead, so the tab is dropped.
  const activeControlTab = !isDesktop && controlsOpen ? 'controls' : inputModeProps.activeId;
  const selectControlTab = (id: string) => {
    if (id === 'controls') {
      setControlsOpen(true);
      return;
    }
    setControlsOpen(false);
    inputModeProps.onSelect(id);
  };
  const navTabs: Tab[] = [
    { id: 'move', label: 'Move', panelId: 'nav-panel-move' },
    { id: 'map', label: 'Map', panelId: 'nav-panel-map' },
  ];
  const isColor = variant.symbolKind === 'color';
  const isMultigrid = variant.layout.kind === 'multigrid';
  const settingToggles =
    isColor || isMultigrid ? (
      <>
        {isColor ? (
          <Toggle
            label="Show numbers"
            checked={settings.showColorLabels}
            onChange={onToggleColorLabels ?? (() => {})}
          />
        ) : null}
        {isMultigrid ? (
          <Toggle
            label="Highlight overlaps"
            checked={highlightOverlaps}
            onChange={() => setHighlightOverlaps((on) => !on)}
          />
        ) : null}
      </>
    ) : null;

  const modeControl =
    variant.supportsMode === false ? null : (
      <div className={styles.modeRow}>
        <span className={styles.modeLabel}>Mode</span>
        <SegmentedControl
          ariaLabel="Mode"
          value={settings.mode}
          onChange={handleModeSelect}
          options={MODE_OPTIONS}
          className={styles.modeSegmented}
        />
      </div>
    );
  const mobileModeControl =
    !isDesktop && variant.supportsMode !== false ? (
      <label className={styles.utilityMode}>
        <span className="sr-only">Mode</span>
        <select
          aria-label="Mode"
          value={settings.mode}
          onChange={(event) => handleModeSelect(event.target.value as Mode)}
        >
          {MODE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    ) : null;

  const controlsPanel = (
    <div className={styles.actionColumn}>
      <Toolbar vertical onClearAll={handleClearAll} onReveal={handleReveal} />
      <Button variant="cta" onClick={() => handleNewGame()}>
        New Game
      </Button>
    </div>
  );
  const canPause = settings.timerEnabled && state.timerStarted && !done;
  const togglePause = () => {
    const next = !isPaused;
    setIsPaused(next);
    setPauseAnnouncement(next ? 'Game paused, puzzle hidden.' : 'Game resumed.');
  };
  const timer = (
    <Timer
      elapsedSeconds={state.elapsedSeconds}
      running={settings.timerEnabled && state.timerStarted && !done && !isPaused}
      visible={settings.timerEnabled}
      done={done}
      compact={isLandscapeMobile}
      paused={isPaused}
      onTogglePause={canPause ? togglePause : undefined}
    />
  );
  const variantLegend =
    variant.id === 'wordoku' ? (
      <div className={styles.variantLegend} aria-label="Wordoku rule legend">
        <span>There is a hidden word somewhere. Try to find it!</span>
      </div>
    ) : variant.id === 'greater-than' ? (
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
    ) : variant.id === 'consecutive' ? (
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
          A dot between two cells means those digits differ by exactly 1. Cells without a dot must
          not differ by 1.
        </span>
      </div>
    ) : variant.id === 'kropki' ? (
      <div className={styles.variantLegend} aria-label="Kropki rule legend">
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          aria-hidden="true"
          className={styles.legendIcon}
        >
          <circle cx="5" cy="5" r="4" className={styles.legendKropkiWhite} />
        </svg>
        <span>Consecutive (differ by 1)</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          aria-hidden="true"
          className={styles.legendIcon}
        >
          <circle cx="5" cy="5" r="4" className={styles.legendKropkiBlack} />
        </svg>
        <span>One is double the other</span>
      </div>
    ) : variant.id === 'even-odd' ? (
      <div className={styles.variantLegend} aria-label="Even-Odd rule legend">
        <span className={`${styles.legendSwatch} ${styles.legendSwatchEven}`} />
        <span>Even (2, 4, 6, 8)</span>
        <span className={`${styles.legendSwatch} ${styles.legendSwatchOdd}`} />
        <span>Odd (1, 3, 5, 7, 9)</span>
      </div>
    ) : variant.id === 'arrow' ? (
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
    ) : null;

  return (
    <div
      className={[styles.gamePage, isLandscapeMobile ? styles.landscapeMobile : null]
        .filter(Boolean)
        .join(' ')}
    >
      {overusedEdgeHint}
      <Header
        title={title}
        isFavorite={favorites.has(variant.id)}
        onToggleFavorite={() => toggleFavorite(variant.id)}
        compact={!isDesktop}
        onBack={onBack}
        onHelpOpen={onHelpOpen}
        onKeyboardShortcutsOpen={onKeyboardShortcutsOpen}
        timer={timer}
        checkEnabled={settings.checkEnabled}
        timerEnabled={settings.timerEnabled}
        highlightPeersEnabled={settings.highlightPeers}
        navOnLeftEnabled={settings.navOnLeft}
        onToggleCheck={onToggleCheck}
        onToggleTimer={onToggleTimer}
        onToggleHighlightPeers={onToggleHighlightPeers}
        onToggleNavOnLeft={onToggleNavOnLeft}
        renderUtilityRow={false}
      />
      <div className={styles.gameLayout}>
        <div className={styles.gameLeft}>
          <HeaderUtilityRow timer={timer} onHelpOpen={onHelpOpen} modeControl={mobileModeControl} />
          <div
            ref={viewportRef}
            className={
              panZoomActive
                ? `${styles.boardFrame} ${styles.boardFrameOversized}`
                : styles.boardFrame
            }
          >
            {isPaused ? (
              <div
                className={styles.pauseCover}
                style={{ width: framedSize.w, height: isDesktop ? framedSize.h : undefined }}
              >
                <span className={styles.pauseTitle}>Paused</span>
                <Button variant="cta" onClick={togglePause}>
                  Resume
                </Button>
              </div>
            ) : (
              <Board
                {...boardProps}
                overlapCounts={highlightOverlaps ? boardProps.overlapCounts : undefined}
                wordCells={wordCellIds}
                viewport={viewportState}
                checkEnabled={checkEnabled}
                showColorLabel={settings.showColorLabels}
              />
            )}
          </div>
          {isLandscapeMobile ? null : variantLegend}
        </div>
        <div className={styles.gameRight}>
          {isDesktop ? (
            <DesktopControls
              activeControlTab={activeControlTab}
              onSelectControlTab={selectControlTab}
              numberPad={numberPad}
              onClearAll={handleClearAll}
              onReveal={handleReveal}
              settingToggles={settingToggles}
              modeControl={modeControl}
            />
          ) : (
            <PortraitControls
              activeControlTab={activeControlTab}
              onSelectControlTab={selectControlTab}
              numberPad={numberPad}
              controlsPanel={controlsPanel}
              settingToggles={settingToggles}
              navTabs={navTabs}
              navTab={navTab}
              onSelectNavTab={setNavTab}
              onMoveSelection={grid.moveSelection}
              minimap={minimap}
              zoomControls={zoomControls}
              landscape={isLandscapeMobile}
              navOnLeft={settings.navOnLeft}
            />
          )}
          {isLandscapeMobile ? variantLegend : null}
        </div>
      </div>
      {isDesktop ? (
        <Button variant="cta" className={styles.desktopNewGame} onClick={() => handleNewGame()}>
          New Game
        </Button>
      ) : null}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {pauseAnnouncement}
      </div>
      <div role="status" aria-live="polite">
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
      </div>
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
                onNewGame?.(pendingMode);
                setPendingMode(undefined);
                dispatch({ type: 'newGame' });
              }}
            >
              Start New Game
            </button>
            <button
              type="button"
              className={`${styles.modalBtn} ${styles.secondary}`}
              onClick={() => {
                setNewGameConfirmOpen(false);
                // pendingMode is only set when this confirm was opened by a
                // Mode change (not a plain New Game click). Declining here
                // keeps the current puzzle, so the Mode preference reverts
                // to match it too -- the control shows what's actually being
                // played, not a choice that never took effect.
                if (pendingMode !== undefined) {
                  onModeChange?.(activeMode);
                  grid.announce(`${MODE_LABELS[activeMode]} kept for this puzzle.`);
                }
                setPendingMode(undefined);
              }}
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
  useSeoMeta({
    title: `${variant.name} | ${seoConfig.publisherName}`,
    description: variant.description,
    path: `/${variant.id}`,
  });
  const {
    settings,
    toggleCheck,
    toggleTimer,
    toggleHighlightPeers,
    toggleColorLabels,
    toggleNavOnLeft,
    setMode,
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
  // The mode a resumed puzzle was actually generated under, kept separate
  // from the stored preference (settings.mode) so switching the preference
  // never silently regenerates the board already on screen. It only ever
  // updates alongside genKey, at the moment a new puzzle is requested.
  const [activeMode, setActiveMode] = useState<Mode>(() => savedProgress?.mode ?? settings.mode);

  const { model, gameVariant, givens, solution } = useMemo(
    () => buildPuzzle(variant, jigsawLayoutStart, genKey, seedBase, activeMode),
    [variant, jigsawLayoutStart, genKey, seedBase, activeMode]
  );

  return (
    <>
      <main id="main-content" tabIndex={-1} className={styles.mainContent}>
        <GameProvider
          variant={gameVariant}
          model={model}
          givens={givens}
          solution={solution}
          initialProgress={savedProgress}
        >
          <GameInner
            title={variant.name}
            onBack={() => navigate('/')}
            onHelpOpen={() => setHelpOpen(true)}
            onKeyboardShortcutsOpen={() => setShortcutsOpen(true)}
            settings={settings}
            onNewGame={(explicitMode) => {
              setActiveMode(explicitMode ?? settings.mode);
              setGenKey((k) => k + 1);
            }}
            onModeChange={setMode}
            onFirstWin={onboardingShown ? undefined : () => setOnboardingOpen(true)}
            onToggleColorLabels={toggleColorLabels}
            seedBase={seedBase}
            jigsawLayoutStart={jigsawLayoutStart}
            genKey={genKey}
            activeMode={activeMode}
            onToggleCheck={toggleCheck}
            onToggleTimer={toggleTimer}
            onToggleHighlightPeers={toggleHighlightPeers}
            onToggleNavOnLeft={toggleNavOnLeft}
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
