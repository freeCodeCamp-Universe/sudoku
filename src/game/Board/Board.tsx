import type { GutterCell, GutterSlots, Rect } from '@/game/gameTypes';
import { Cell } from '@/game/Cell';
import { LiveRegion } from '@/game/LiveRegion';
import type { BoardProps } from '@/game/gameTypes';
import { ANTI_DIAGONAL_CELLS, MAIN_DIAGONAL_CELLS } from '@/variants/sudoku-x';
import { WINDOKU_WINDOWS } from '@/variants/windoku';
import { ASTERISK_CELLS } from '@/variants/asterisk';
import { CENTER_DOT_CELLS } from '@/variants/centerDot';
import { GIRANDOLA_CELLS } from '@/variants/girandola';
import { ARGYLE_D1_OFFSETS, ARGYLE_D2_SUMS } from '@/variants/argyle';

const argyleD1Set = new Set(
  ARGYLE_D1_OFFSETS.flatMap((offset) =>
    Array.from({ length: 9 }, (_, r) => ({ r, c: r - offset }))
      .filter(({ c }) => c >= 0 && c < 9)
      .map(({ r, c }) => `r${r}c${c}`)
  )
);
const argyleD2Set = new Set(
  ARGYLE_D2_SUMS.flatMap((sum) =>
    Array.from({ length: 9 }, (_, r) => ({ r, c: sum - r }))
      .filter(({ c }) => c >= 0 && c < 9)
      .map(({ r, c }) => `r${r}c${c}`)
  )
);

const windokuWindowSet = new Set(WINDOKU_WINDOWS.flat().map(([r, c]) => `r${r}c${c}`));
const asteriskCellSet = new Set(ASTERISK_CELLS.map(([r, c]) => `r${r}c${c}`));
const centerDotCellSet = new Set(CENTER_DOT_CELLS.map(([r, c]) => `r${r}c${c}`));
const girandolaCellSet = new Set(GIRANDOLA_CELLS.map(([r, c]) => `r${r}c${c}`));
import styles from './Board.module.css';

const diagonalSet = new Set([...MAIN_DIAGONAL_CELLS, ...ANTI_DIAGONAL_CELLS]);

export type { BoardProps };

function buildGutterAriaLabel(side: keyof GutterSlots, cell: GutterCell): string {
  if (cell.description) {
    return cell.description;
  }

  switch (side) {
    case 'top':
      return `Top clue for column ${(cell.col ?? 0) + 1}: ${cell.label}`;
    case 'bottom':
      return `Bottom clue for column ${(cell.col ?? 0) + 1}: ${cell.label}`;
    case 'start':
      return `Start clue for row ${(cell.row ?? 0) + 1}: ${cell.label}`;
    case 'end':
      return `End clue for row ${(cell.row ?? 0) + 1}: ${cell.label}`;
    default:
      return cell.label;
  }
}

function isBoxBoundary(
  variant: BoardProps['variant'],
  cell: BoardProps['cells'][number],
  axis: 'row' | 'col'
): boolean {
  switch (variant.layout.kind) {
    case 'grid': {
      const size = variant.layout.size;
      const step = axis === 'row' ? variant.layout.box.rows : variant.layout.box.cols;
      const value = axis === 'row' ? cell.row : cell.col;

      return (value + 1) % step === 0 && value < size - 1;
    }
    case 'triangular': {
      const size = variant.layout.size;
      const value = axis === 'row' ? cell.row : cell.col;

      return (value + 1) % 3 === 0 && value < size - 1;
    }
    case 'multigrid': {
      const { subGrids, subGridSize, box, canvasCols, canvasRows } = variant.layout;
      const step = axis === 'row' ? box.rows : box.cols;
      const value = axis === 'row' ? cell.row : cell.col;
      const canvasMax = axis === 'row' ? canvasRows : canvasCols;
      const isLocalBoundary = subGrids.some(({ originRow, originCol }) => {
        const inGrid =
          cell.row >= originRow &&
          cell.row < originRow + subGridSize &&
          cell.col >= originCol &&
          cell.col < originCol + subGridSize;

        if (!inGrid) {
          return false;
        }

        const local = axis === 'row' ? cell.row - originRow : cell.col - originCol;

        return (local + 1) % step === 0 && local < subGridSize - 1;
      });

      return isLocalBoundary && value < canvasMax - 1;
    }
    default:
      return false;
  }
}

function mergeRanges(
  ranges: Array<{ start: number; end: number }>
): Array<{ start: number; end: number }> {
  const sorted = [...ranges].sort((left, right) => left.start - right.start);
  const merged: Array<{ start: number; end: number }> = [];

  for (const range of sorted) {
    const previous = merged[merged.length - 1];

    if (!previous || range.start > previous.end) {
      merged.push({ ...range });
      continue;
    }

    previous.end = Math.max(previous.end, range.end);
  }

  return merged;
}

function buildMultigridLines(
  variant: BoardProps['variant'],
  rects: BoardProps['rects']
): Array<Rect & { id: string }> {
  if (variant.layout.kind !== 'multigrid') {
    return [];
  }

  const { subGrids, subGridSize, box } = variant.layout;
  const stroke = 3;
  const offset = 1;
  const horizontal = new Map<number, Array<{ start: number; end: number }>>();
  const vertical = new Map<number, Array<{ start: number; end: number }>>();

  function pushHorizontal(y: number, start: number, end: number) {
    const segments = horizontal.get(y) ?? [];
    segments.push({ start, end });
    horizontal.set(y, segments);
  }

  function pushVertical(x: number, start: number, end: number) {
    const segments = vertical.get(x) ?? [];
    segments.push({ start, end });
    vertical.set(x, segments);
  }

  for (const { originRow, originCol } of subGrids) {
    const topLeft = rects.get(`r${originRow}c${originCol}`);
    const bottomRight = rects.get(`r${originRow + subGridSize - 1}c${originCol + subGridSize - 1}`);

    if (!topLeft || !bottomRight) {
      continue;
    }

    const xStart = topLeft.x - offset;
    const xEnd = bottomRight.x + bottomRight.w + offset;
    const yStart = topLeft.y - offset;
    const yEnd = bottomRight.y + bottomRight.h + offset;

    pushHorizontal(yStart, xStart, xEnd);
    pushHorizontal(bottomRight.y + bottomRight.h - offset, xStart, xEnd);
    pushVertical(xStart, yStart, yEnd);
    pushVertical(bottomRight.x + bottomRight.w - offset, yStart, yEnd);

    for (let localRow = box.rows - 1; localRow < subGridSize - 1; localRow += box.rows) {
      const boundaryCell = rects.get(`r${originRow + localRow}c${originCol}`);

      if (boundaryCell) {
        pushHorizontal(boundaryCell.y + boundaryCell.h - offset, xStart, xEnd);
      }
    }

    for (let localCol = box.cols - 1; localCol < subGridSize - 1; localCol += box.cols) {
      const boundaryCell = rects.get(`r${originRow}c${originCol + localCol}`);

      if (boundaryCell) {
        pushVertical(boundaryCell.x + boundaryCell.w - offset, yStart, yEnd);
      }
    }
  }

  const edges: Array<Rect & { id: string }> = [];

  for (const [y, ranges] of horizontal.entries()) {
    for (const [index, range] of mergeRanges(ranges).entries()) {
      edges.push({
        id: `h-${y}-${index}`,
        x: range.start,
        y,
        w: range.end - range.start,
        h: stroke,
      });
    }
  }

  for (const [x, ranges] of vertical.entries()) {
    for (const [index, range] of mergeRanges(ranges).entries()) {
      edges.push({
        id: `v-${x}-${index}`,
        x,
        y: range.start,
        w: stroke,
        h: range.end - range.start,
      });
    }
  }

  return edges;
}


export function Board({
  variant,
  cells,
  rects,
  size,
  gutters,
  overlays,
  grid,
  renderSymbol,
  markerGaps,
  wordCells,
  colorblindMode,
  parityMap,
}: BoardProps) {
  const hasGutters = Boolean(gutters?.top || gutters?.bottom || gutters?.start || gutters?.end);
  const rowCount = cells.reduce((max, cell) => Math.max(max, cell.row), -1) + 1;
  const colCount = cells.reduce((max, cell) => Math.max(max, cell.col), -1) + 1;
  const multigridLines = buildMultigridLines(variant, rects);
  const rowGroups = new Map<number, typeof cells>();

  for (const cell of cells) {
    const group = rowGroups.get(cell.row);

    if (group) {
      group.push(cell);
    } else {
      rowGroups.set(cell.row, [cell]);
    }
  }

  const sortedRows = [...rowGroups.entries()].sort(([a], [b]) => a - b);
  const gridCanvas = (
    <div
      role="grid"
      aria-label="Sudoku grid"
      aria-rowcount={rowCount}
      aria-colcount={colCount}
      className={`${styles.grid}${variant.layout.kind === 'multigrid' ? ` ${styles.multigrid}` : ''}`}
      style={{ width: size.w, height: size.h }}
    >
      {sortedRows.map(([rowIndex, rowCells]) => (
        <div key={`row-${rowIndex}`} role="row" aria-rowindex={rowIndex + 1} className={styles.row}>
          {rowCells.map((cell) => {
            const rect = rects.get(cell.id);

            if (!rect) {
              return null;
            }

            const state = grid.cellState(cell.id);
            const props = grid.cellProps(cell.id);

            return (
              <div
                key={cell.id}
                role="presentation"
                className={styles.cellSlot}
                style={{
                  insetInlineStart: rect.x,
                  insetBlockStart: rect.y,
                  width: rect.w,
                  height: rect.h,
                  zIndex: state.selected ? 2 : 0,
                }}
              >
                <Cell
                  id={cell.id}
                  value={state.value}
                  candidates={state.candidates}
                  symbols={variant.symbols}
                  given={state.given}
                  revealed={state.revealed}
                  selected={state.selected}
                  conflict={state.conflict}
                  correct={state.correct}
                  sameValue={state.sameValue}
                  peer={state.peer}
                  renderSymbol={renderSymbol}
                  symbolKind={variant.symbolKind}
                  boxBoundaryRight={variant.id !== 'jigsaw' && isBoxBoundary(variant, cell, 'col')}
                  boxBoundaryBottom={variant.id !== 'jigsaw' && isBoxBoundary(variant, cell, 'row')}
                  overlayBorders={variant.layout.kind === 'multigrid'}
                  diagonal={variant.id === 'sudoku-x' && diagonalSet.has(cell.id)}
                  window={variant.id === 'windoku' && windokuWindowSet.has(cell.id)}
                  asterisk={variant.id === 'asterisk' && asteriskCellSet.has(cell.id)}
                  centerDot={variant.id === 'center-dot' && centerDotCellSet.has(cell.id)}
                  girandola={variant.id === 'girandola' && girandolaCellSet.has(cell.id)}
                  argyleD1={variant.id === 'argyle' && argyleD1Set.has(cell.id)}
                  argyleD2={variant.id === 'argyle' && argyleD2Set.has(cell.id)}
                  small={rect.w <= 30}
                  medium={rect.w > 30 && rect.w <= 44}
                  butterfly={variant.id === 'butterfly'}
                  cross={variant.id === 'cross'}
                  flower={variant.id === 'flower'}
                  markerEdges={markerGaps?.get(cell.id)}
                  word={wordCells?.has(cell.id)}
                  colorblind={colorblindMode}
                  even={parityMap?.get(cell.id) === 0}
                  odd={parityMap?.get(cell.id) === 1}
                  aria-colindex={cell.col + 1}
                  onClick={props.onClick ?? (() => {})}
                  {...props}
                />
              </div>
            );
          })}
        </div>
      ))}
      {multigridLines.map((line) => (
        <div
          key={line.id}
          aria-hidden="true"
          data-testid="multigrid-line"
          className={styles.samuraiEdge}
          style={{
            insetInlineStart: line.x,
            insetBlockStart: line.y,
            width: line.w,
            height: line.h,
          }}
        />
      ))}
      {overlays}
    </div>
  );

  if (!hasGutters || !gutters) {
    return (
      <div className={styles.boardWrap}>
        {gridCanvas}
        <LiveRegion ref={grid.announcerRef} />
      </div>
    );
  }

  return (
    <div className={styles.boardWrap}>
      <div className={styles.gutterLayout}>
        {gutters.top ? (
          <div className={styles.gutterRow}>
            <div className={styles.gutterCorner} />
            <div data-gutter="top" className={styles.gutterTrack}>
              {gutters.top.map((cell) => (
                <div key={cell.id} className={styles.gutterCell} aria-label={buildGutterAriaLabel('top', cell)}>
                  {cell.label}
                </div>
              ))}
            </div>
            <div className={styles.gutterCorner} />
          </div>
        ) : null}
        <div className={styles.gutterRow}>
          {gutters.start ? (
            <div data-gutter="start" className={styles.gutterCol}>
              {gutters.start.map((cell) => (
                <div
                  key={cell.id}
                  className={styles.gutterCell}
                  aria-label={buildGutterAriaLabel('start', cell)}
                >
                  {cell.label}
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.gutterCorner} />
          )}
          {gridCanvas}
          {gutters.end ? (
            <div data-gutter="end" className={styles.gutterCol}>
              {gutters.end.map((cell) => (
                <div key={cell.id} className={styles.gutterCell} aria-label={buildGutterAriaLabel('end', cell)}>
                  {cell.label}
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.gutterCorner} />
          )}
        </div>
        {gutters.bottom ? (
          <div className={styles.gutterRow}>
            <div className={styles.gutterCorner} />
            <div data-gutter="bottom" className={styles.gutterTrack}>
              {gutters.bottom.map((cell) => (
                <div
                  key={cell.id}
                  className={styles.gutterCell}
                  aria-label={buildGutterAriaLabel('bottom', cell)}
                >
                  {cell.label}
                </div>
              ))}
            </div>
            <div className={styles.gutterCorner} />
          </div>
        ) : null}
      </div>
      <LiveRegion ref={grid.announcerRef} />
    </div>
  );
}
