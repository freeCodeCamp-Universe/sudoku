import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { Board } from '@/board/Board';
import { boardReducer } from '@/board/boardReducer';
import { cellSizeForWidth } from '@/board/layouts/cellSizeForWidth';
import { InputModeTabs } from '@/board/InputModeTabs';
import { NumberPad } from '@/board/NumberPad';
import { puzzleFromConfig } from '@/board/puzzleFromConfig';
import { usePlayableBoard } from '@/board/usePlayableBoard';
import { useElementSize } from '@/hooks/useElementSize';
import type { ClientInteractiveLessonDefinition, LessonBoardConfig } from '@/curriculum/types';
import { createBoardLessonEngine } from '@/curriculum/lessonEngine';
import type { BoardLessonInput, BoardLessonState, InputReview } from '@/curriculum/lessonEngine';
import type { InteractivePanelProps } from '@/learn/LessonWorkspace/LessonWorkspace';
import { useTheme } from '@/app/ThemeProvider/context';
import type { Variant } from '@/engine/types';
import { variantRegistry } from '@/variants/registry';
import styles from './BoardPanel.module.css';

interface BoardPanelContentProps {
  lesson: ClientInteractiveLessonDefinition;
  boardConfig: LessonBoardConfig;
  variant: Variant;
  onUpdate: InteractivePanelProps['onUpdate'];
  onHint: InteractivePanelProps['onHint'];
}

/** The board plus a fresh review object per input, so a repeated hint still fires. */
interface PanelState {
  board: BoardLessonState;
  review: InputReview;
}

function BoardPanelContent({
  lesson,
  boardConfig,
  variant,
  onUpdate,
  onHint,
}: BoardPanelContentProps) {
  const givens = useMemo(() => new Map(Object.entries(boardConfig.givens)), [boardConfig.givens]);
  const solution = useMemo(
    () => new Map(Object.entries(boardConfig.solution)),
    [boardConfig.solution]
  );
  const puzzle = useMemo(
    () => puzzleFromConfig(variant, givens, solution),
    [variant, givens, solution]
  );
  const engine = useMemo(() => createBoardLessonEngine(givens, solution), [givens, solution]);
  const requirements = lesson.config.checklist;
  const [{ board: state, review }, dispatch] = useReducer(
    (current: PanelState, input: BoardLessonInput): PanelState => {
      const next = engine.feed(current.board, input);
      return {
        board: next,
        review: engine.reviewInput(current.board, next, input, requirements),
      };
    },
    undefined,
    (): PanelState => ({ board: engine.seed(lesson), review: { kind: 'none' } })
  );
  const dispatchBoard = useCallback(
    (action: Parameters<typeof boardReducer>[1]) => dispatch({ type: 'board', action }),
    []
  );
  const dispatchSelection = useCallback(
    (selectedIds: Set<string>) => dispatch({ type: 'selection', selectedIds }),
    []
  );
  const boardRegionRef = useRef<HTMLDivElement>(null);
  const boardRegionSize = useElementSize(boardRegionRef);
  const { highContrast } = useTheme();
  const cellSize = cellSizeForWidth(boardRegionSize.w, variant, highContrast);
  const board = usePlayableBoard({
    variant,
    baseModel: puzzle.model,
    givens,
    solution,
    seedBase: 0,
    cellSize,
    highlights: boardConfig.highlights,
    cellSelection: boardConfig.cellSelection,
    selectedIds: state.selectedIds,
    onSelectionChange: dispatchSelection,
    state,
    dispatch: dispatchBoard,
    checkEnabled: false,
  });

  useEffect(() => {
    const results = engine.checkRequirements(state, requirements);
    onUpdate({ complete: results.every((result) => result.passed) });
  }, [engine, requirements, onUpdate, state]);

  useEffect(() => {
    if (review.kind === 'clear') {
      onHint(null);
    } else if (review.kind === 'hint') {
      const { hint } = requirements[review.index];
      if (hint) {
        onHint(hint);
      }
    }
  }, [onHint, requirements, review]);

  return (
    <div className={styles.panel}>
      <div ref={boardRegionRef} className={styles.boardRegion}>
        <Board {...board.boardProps} checkEnabled={false} />
      </div>
      <div className={styles.inputRegion}>
        <InputModeTabs
          activeId={board.inputModeProps.activeId}
          onSelect={board.inputModeProps.onSelect}
          ariaLabel="Lesson board input mode"
          numberPad={<NumberPad {...board.numberPadProps} />}
        />
      </div>
    </div>
  );
}

export function BoardPanel({ lesson, onUpdate, onHint }: InteractivePanelProps) {
  const boardConfig = lesson.config.board;
  if (!boardConfig) {
    throw new Error(`Lesson ${lesson.id} does not have a board configuration`);
  }

  const variant = variantRegistry[boardConfig.variant];
  if (!variant) {
    throw new Error(`Lesson ${lesson.id} uses unknown board variant "${boardConfig.variant}"`);
  }

  return (
    <BoardPanelContent
      lesson={lesson}
      boardConfig={boardConfig}
      variant={variant}
      onUpdate={onUpdate}
      onHint={onHint}
    />
  );
}
