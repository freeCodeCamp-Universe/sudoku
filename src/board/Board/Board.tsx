import type React from 'react';
import type { GutterCell, GutterSlots } from '@/engine/types';
import { Cell } from '@/board/Cell';
import { LiveRegion } from '@/board/LiveRegion';
import type { BoardProps } from '@/board/boardTypes';
import { BoardViewport } from './BoardViewport';
import { isBoxBoundary } from './boxBoundary';
import { buildMultigridLines } from './multigridLines';
import styles from './Board.module.css';

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

export function Board({
  variant,
  cells,
  rects,
  overlapCounts,
  size,
  gutters,
  overlays,
  grid,
  renderSymbol,
  displaySymbols,
  markerGaps,
  wordCells,
  parityMap,
  viewport,
  checkEnabled,
  showColorLabel,
}: BoardProps) {
  const hasGutters = Boolean(gutters?.top || gutters?.bottom || gutters?.start || gutters?.end);
  const caged = variant.overlayIds?.includes('cage') ?? false;
  // Clue cells in the gutters must track the responsive cell size so each
  // clue stays centered on its row/column; gutters only exist on uniform
  // grid layouts, so any rect carries the size.
  const gutterCellSize = rects.values().next().value?.w;
  const rowCount = cells.reduce((max, cell) => Math.max(max, cell.row), -1) + 1;
  const colCount = cells.reduce((max, cell) => Math.max(max, cell.col), -1) + 1;
  const multigridLines = buildMultigridLines(variant, rects, size);
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
      aria-multiselectable={grid.cellSelection === 'multiple' || undefined}
      data-check={checkEnabled || undefined}
      data-variant={variant.id}
      className={`${styles.grid}${variant.layout.kind === 'multigrid' || variant.layout.kind === 'triangular' ? ` ${styles.multigrid}` : ''}`}
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
            const cellTags = variant.cellTags?.(cell.id) ?? [];

            return (
              <div
                key={cell.id}
                role="presentation"
                className={
                  state.selected || state.focused
                    ? `${styles.cellSlot} ${styles.cellSlotSelected}`
                    : styles.cellSlot
                }
                style={{
                  insetInlineStart: rect.x,
                  insetBlockStart: rect.y,
                  width: rect.w,
                  height: rect.h,
                }}
              >
                <Cell
                  id={cell.id}
                  description={grid.describeCell(cell.id)}
                  value={state.value}
                  candidates={state.candidates}
                  symbols={displaySymbols ?? variant.symbols}
                  given={state.given}
                  revealed={state.revealed}
                  focused={state.focused}
                  selected={state.selected}
                  conflict={state.conflict}
                  correct={state.correct}
                  sameValue={state.sameValue}
                  peer={state.peer}
                  renderSymbol={renderSymbol}
                  symbolKind={variant.symbolKind}
                  showColorLabel={showColorLabel}
                  boxBoundaryRight={
                    variant.id !== 'sujiken' &&
                    variant.id !== 'jigsaw' &&
                    isBoxBoundary(variant, cell, 'col')
                  }
                  boxBoundaryBottom={
                    variant.id !== 'sujiken' &&
                    variant.id !== 'jigsaw' &&
                    isBoxBoundary(variant, cell, 'row')
                  }
                  overlayBorders={variant.layout.kind === 'multigrid'}
                  diagonal={cellTags.includes('diagonal')}
                  window={cellTags.includes('window')}
                  asterisk={cellTags.includes('asterisk')}
                  centerDot={cellTags.includes('center-dot')}
                  girandola={cellTags.includes('girandola')}
                  argyleD1={cellTags.includes('argyle-d1')}
                  argyleD2={cellTags.includes('argyle-d2')}
                  small={rect.w <= 30}
                  medium={rect.w > 30 && rect.w <= 44}
                  overlap={overlapCounts?.get(cell.id)}
                  markerEdges={markerGaps?.get(cell.id)}
                  word={wordCells?.has(cell.id)}
                  even={parityMap?.get(cell.id) === 0}
                  odd={parityMap?.get(cell.id) === 1}
                  caged={caged}
                  aria-colindex={cell.col + 1}
                  onClick={props.onClick ?? (() => {})}
                  {...props}
                />
              </div>
            );
          })}
        </div>
      ))}
      {multigridLines.map((line) => {
        const horizontal = line.id.startsWith('h-');

        return (
          <div
            key={line.id}
            aria-hidden="true"
            data-testid="multigrid-line"
            data-orientation={horizontal ? 'h' : 'v'}
            className={styles.samuraiEdge}
            style={
              horizontal
                ? {
                    insetInlineStart: line.x,
                    width: line.w,
                    ...(line.anchorEnd ? { insetBlockEnd: 0 } : { insetBlockStart: line.y }),
                  }
                : {
                    insetBlockStart: line.y,
                    height: line.h,
                    ...(line.anchorEnd ? { insetInlineEnd: 0 } : { insetInlineStart: line.x }),
                  }
            }
          />
        );
      })}
      {overlays}
    </div>
  );

  function wrap(node: React.ReactNode) {
    return viewport ? <BoardViewport viewport={viewport}>{node}</BoardViewport> : node;
  }

  // When the board is wrapped in a clipping viewport, the wrapper must fill the
  // sized frame so the clip's percentage dimensions resolve against it; the
  // default `width: max-content` collapses around the absolutely-positioned clip.
  const boardWrapClass = viewport?.active
    ? `${styles.boardWrap} ${styles.boardWrapViewport}`
    : styles.boardWrap;

  if (!hasGutters || !gutters) {
    return (
      <div className={boardWrapClass}>
        {wrap(gridCanvas)}
        <LiveRegion ref={grid.announcerRef} />
      </div>
    );
  }

  return (
    <div className={boardWrapClass}>
      {wrap(
        <div
          className={styles.gutterLayout}
          style={
            gutterCellSize
              ? ({ '--gutter-cell-size': `${gutterCellSize}px` } as React.CSSProperties)
              : undefined
          }
        >
          {gutters.top ? (
            <div className={styles.gutterRow}>
              <div className={styles.gutterCorner} />
              <div data-gutter="top" className={styles.gutterTrack}>
                {gutters.top.map((cell) => (
                  <div
                    key={cell.id}
                    className={styles.gutterCell}
                    aria-label={buildGutterAriaLabel('top', cell)}
                  >
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
                  <div
                    key={cell.id}
                    className={styles.gutterCell}
                    aria-label={buildGutterAriaLabel('end', cell)}
                  >
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
      )}
      <LiveRegion ref={grid.announcerRef} />
    </div>
  );
}
