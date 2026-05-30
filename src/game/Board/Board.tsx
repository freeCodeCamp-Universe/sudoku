import { Cell } from '@/game/Cell';
import { LiveRegion } from '@/game/LiveRegion';
import type { BoardProps } from '@/game/gameTypes';
import styles from './Board.module.css';

export type { BoardProps };

export function Board({ cells, rects, size, gutters: _gutters, overlays, grid, renderSymbol }: BoardProps) {
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
                given={state.given}
                selected={state.selected}
                conflict={state.conflict}
                renderSymbol={renderSymbol}
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
