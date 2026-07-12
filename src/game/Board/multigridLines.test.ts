import { describe, expect, it } from 'vitest';
import { multigridLayout } from '@/game/layouts/multigrid';
import { samurai } from '@/variants/samurai';
import { buildMultigridLines } from './multigridLines';

const rects = multigridLayout.cellRects(samurai);
const size = multigridLayout.canvasSize(samurai);
const lines = buildMultigridLines(samurai, rects, size);
const STROKE = 3;

describe('buildMultigridLines', () => {
  it('should return no lines for non-multigrid layouts', () => {
    const classic = {
      ...samurai,
      layout: { kind: 'grid' as const, size: 9, box: { rows: 3, cols: 3 } },
    };

    expect(buildMultigridLines(classic, new Map(), size)).toEqual([]);
  });

  it('should keep every strip inside the canvas bounds', () => {
    for (const line of lines) {
      expect(line.x).toBeGreaterThanOrEqual(0);
      expect(line.y).toBeGreaterThanOrEqual(0);
      expect(line.x + line.w).toBeLessThanOrEqual(size.w);
      expect(line.y + line.h).toBeLessThanOrEqual(size.h);
    }
  });

  it('should place start-edge strips flush with the canvas start edges', () => {
    const verticalAtStart = lines.filter((line) => line.id.startsWith('v-') && line.x === 0);
    const horizontalAtStart = lines.filter((line) => line.id.startsWith('h-') && line.y === 0);

    expect(verticalAtStart.length).toBeGreaterThan(0);
    expect(horizontalAtStart.length).toBeGreaterThan(0);
  });

  it('should flag only end-edge strips as anchorEnd', () => {
    const anchored = lines.filter((line) => line.anchorEnd);

    expect(anchored.length).toBeGreaterThan(0);

    for (const line of lines) {
      const onEndEdge = line.id.startsWith('v-')
        ? line.x === size.w - STROKE
        : line.y === size.h - STROKE;

      expect(line.anchorEnd).toBe(onEndEdge);
    }
  });
});
