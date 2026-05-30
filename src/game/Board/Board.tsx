import { Cell } from '@/game/Cell';
import { LiveRegion } from '@/game/LiveRegion';
import type { BoardProps } from '@/game/gameTypes';
import styles from './Board.module.css';

export type { BoardProps };

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
  gutters: _gutters,
  overlays,
  grid,
  renderSymbol,
}: BoardProps) {
  return (
    <div className={styles.boardWrap}>
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
                left: rect.x,
                top: rect.y,
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
      <LiveRegion ref={grid.announcerRef} />
    </div>
  );
}
