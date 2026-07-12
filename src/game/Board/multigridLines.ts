import type { BoardProps, Rect, Size } from '@/game/gameTypes';

export interface MultigridLine extends Rect {
  id: string;
  /* True for strips lying on the canvas end edge (inline or block). The
     pan/zoom viewport clamps and clips at the canvas box, so these must be
     anchored to the end edge and grow inward — positioning them by start
     coordinate would leave part of the CSS-var thickness outside the canvas,
     where it gets clipped when the board sits flush against the viewport. */
  anchorEnd: boolean;
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

export function buildMultigridLines(
  variant: BoardProps['variant'],
  rects: BoardProps['rects'],
  size: Size
): MultigridLine[] {
  if (variant.layout.kind !== 'multigrid') {
    return [];
  }

  const { subGrids, subGridSize, box } = variant.layout;
  /* The strips' cross dimension is set in CSS (--box-boundary-width, so high
     contrast can widen it); stroke only fills the Rect shape here. */
  const stroke = 3;
  /* Interior strips sit 1px before their grid line so they cover the cells'
     own 1px gridlines; strips on the canvas boundary are clamped fully inside
     the canvas instead (see MultigridLine.anchorEnd). */
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

  const edges: MultigridLine[] = [];

  for (const [y, ranges] of horizontal.entries()) {
    const anchorEnd = y + stroke > size.h;
    const yPos = anchorEnd ? size.h - stroke : Math.max(0, y);

    for (const [index, range] of mergeRanges(ranges).entries()) {
      const start = Math.max(0, range.start);
      const end = Math.min(size.w, range.end);

      edges.push({
        id: `h-${y}-${index}`,
        x: start,
        y: yPos,
        w: end - start,
        h: stroke,
        anchorEnd,
      });
    }
  }

  for (const [x, ranges] of vertical.entries()) {
    const anchorEnd = x + stroke > size.w;
    const xPos = anchorEnd ? size.w - stroke : Math.max(0, x);

    for (const [index, range] of mergeRanges(ranges).entries()) {
      const start = Math.max(0, range.start);
      const end = Math.min(size.h, range.end);

      edges.push({
        id: `v-${x}-${index}`,
        x: xPos,
        y: start,
        w: stroke,
        h: end - start,
        anchorEnd,
      });
    }
  }

  return edges;
}
