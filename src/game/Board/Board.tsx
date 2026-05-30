import type { GutterCell, GutterSlots } from '@/game/gameTypes';
import { Cell } from '@/game/Cell';
import { LiveRegion } from '@/game/LiveRegion';
import type { BoardProps } from '@/game/gameTypes';
import styles from './Board.module.css';

export type { BoardProps };

function buildGutterAriaLabel(side: keyof GutterSlots, cell: GutterCell): string {
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
    case 'multigrid': {
      if (cell.grid === undefined) {
        return false;
      }

      const origin = variant.layout.subGrids[cell.grid];

      if (!origin) {
        return false;
      }

      const localValue =
        axis === 'row' ? cell.row - origin.originRow : cell.col - origin.originCol;
      const step = axis === 'row' ? variant.layout.box.rows : variant.layout.box.cols;

      return (localValue + 1) % step === 0 && localValue < variant.layout.subGridSize - 1;
    }
    default:
      return false;
  }
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
}: BoardProps) {
  const hasGutters = Boolean(gutters?.top || gutters?.bottom || gutters?.start || gutters?.end);
  const gridCanvas = (
    <div
      role="grid"
      aria-label="Sudoku grid"
      className={styles.grid}
      style={{ width: size.w, height: size.h, position: 'relative' }}
    >
      {cells.map((cell) => {
        const rect = rects.get(cell.id);

        if (!rect) {
          return null;
        }

        const state = grid.cellState(cell.id);
        const props = grid.cellProps(cell.id);

        return (
          <div
            key={cell.id}
            style={{
              position: 'absolute',
              insetInlineStart: rect.x,
              insetBlockStart: rect.y,
              width: rect.w,
              height: rect.h,
            }}
          >
            <Cell
              id={cell.id}
              value={state.value}
              candidates={state.candidates}
              symbols={variant.symbols}
              given={state.given}
              selected={state.selected}
              conflict={state.conflict}
              renderSymbol={renderSymbol}
              symbolKind={variant.symbolKind}
              boxBoundaryRight={isBoxBoundary(variant, cell, 'col')}
              boxBoundaryBottom={isBoxBoundary(variant, cell, 'row')}
              onClick={props.onClick ?? (() => {})}
              {...props}
            />
          </div>
        );
      })}
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
