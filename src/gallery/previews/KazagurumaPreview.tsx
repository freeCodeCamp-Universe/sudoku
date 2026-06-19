import { useCallback } from 'react';
import { useTheme } from '@/app/ThemeProvider';
import { readThemeColor } from '@/app/readThemeColor';
import styles from './Preview.module.css';
import { PREVIEW_CANVAS_SIZE, usePreviewCanvas } from './usePreviewCanvas';

const CELLS = 21;

const SUB_GRIDS = [
  { originRow: 0, originCol: 3 },
  { originRow: 3, originCol: 12 },
  { originRow: 6, originCol: 6 },
  { originRow: 9, originCol: 0 },
  { originRow: 12, originCol: 9 },
];

function membership(r: number, c: number): number {
  return SUB_GRIDS.reduce(
    (bits, { originRow, originCol }, i) =>
      r >= originRow && r < originRow + 9 && c >= originCol && c < originCol + 9
        ? bits | (1 << i)
        : bits,
    0
  );
}

function isBoxH(r: number, c: number): boolean {
  return SUB_GRIDS.some(
    ({ originRow, originCol }) =>
      r > originRow &&
      r < originRow + 9 &&
      c >= originCol &&
      c < originCol + 9 &&
      (r - originRow) % 3 === 0
  );
}

function isBoxV(r: number, c: number): boolean {
  return SUB_GRIDS.some(
    ({ originRow, originCol }) =>
      r >= originRow &&
      r < originRow + 9 &&
      c > originCol &&
      c < originCol + 9 &&
      (c - originCol) % 3 === 0
  );
}

function addSeg(map: Map<number, number[][]>, key: number, a: number, b: number) {
  const s = map.get(key) ?? [];
  s.push([a, b]);
  map.set(key, s);
}

function mergeAndDraw(
  ctx: CanvasRenderingContext2D,
  hMap: Map<number, number[][]>,
  vMap: Map<number, number[][]>
) {
  function merged(segs: number[][]): number[][] {
    const sorted = [...segs].sort((a, b) => a[0] - b[0]);
    const out: number[][] = [];
    let cur = sorted[0];
    for (let i = 1; i < sorted.length; i += 1) {
      if (sorted[i][0] <= cur[1] + 0.01) cur = [cur[0], Math.max(cur[1], sorted[i][1])];
      else {
        out.push(cur);
        cur = sorted[i];
      }
    }
    out.push(cur);
    return out;
  }
  ctx.beginPath();
  for (const [y, segs] of hMap) {
    for (const [x1, x2] of merged(segs)) {
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
    }
  }
  for (const [x, segs] of vMap) {
    for (const [y1, y2] of merged(segs)) {
      ctx.moveTo(x, y1);
      ctx.lineTo(x, y2);
    }
  }
  ctx.stroke();
}

export function KazagurumaPreview() {
  const { theme } = useTheme();
  const canvasRef = usePreviewCanvas(
    useCallback(
      (ctx, { width }) => {
        const cell = width / CELLS;
        const isLight = theme === 'light';
        const fillOverlap2 = readThemeColor('--cell-overlap-2-bg');
        const fillSingle = isLight ? '#f5f5f0' : '#1b1b32';
        const cellLine = isLight ? '#c8c8d8' : '#2a2a3a';
        const boxLine = isLight ? '#a0a0c0' : '#3b3b4f';
        const borderColor = isLight ? '#5060a0' : '#9898b8';

        // Fills
        for (let r = 0; r < CELLS; r += 1) {
          for (let c = 0; c < CELLS; c += 1) {
            const m = membership(r, c);
            if (m === 0) continue;
            const count = SUB_GRIDS.filter(
              ({ originRow, originCol }) =>
                r >= originRow && r < originRow + 9 && c >= originCol && c < originCol + 9
            ).length;
            ctx.fillStyle = count >= 2 ? fillOverlap2 : fillSingle;
            ctx.fillRect(c * cell, r * cell, cell, cell);
          }
        }

        // Collect cell lines and box lines - only between cells with identical membership
        const hCell = new Map<number, number[][]>();
        const vCell = new Map<number, number[][]>();
        const hBox = new Map<number, number[][]>();
        const vBox = new Map<number, number[][]>();

        for (let r = 1; r < CELLS; r += 1) {
          for (let c = 0; c < CELLS; c += 1) {
            const mT = membership(r - 1, c);
            const mB = membership(r, c);
            if (mT === 0 || mB === 0 || mT !== mB) continue;
            if (isBoxH(r, c)) addSeg(hBox, r * cell, c * cell, (c + 1) * cell);
            else addSeg(hCell, r * cell, c * cell, (c + 1) * cell);
          }
        }
        for (let c = 1; c < CELLS; c += 1) {
          for (let r = 0; r < CELLS; r += 1) {
            const mL = membership(r, c - 1);
            const mR = membership(r, c);
            if (mL === 0 || mR === 0 || mL !== mR) continue;
            if (isBoxV(r, c)) addSeg(vBox, c * cell, r * cell, (r + 1) * cell);
            else addSeg(vCell, c * cell, r * cell, (r + 1) * cell);
          }
        }

        ctx.strokeStyle = cellLine;
        ctx.lineWidth = 0.4;
        mergeAndDraw(ctx, hCell, vCell);

        ctx.strokeStyle = boxLine;
        ctx.lineWidth = 1.2;
        mergeAndDraw(ctx, hBox, vBox);

        // Outer boundary and membership-transition borders
        const lw = 1.5;
        const hw = lw / 2;
        const hBorder = new Map<number, number[][]>();
        const vBorder = new Map<number, number[][]>();

        for (let r = 0; r < CELLS; r += 1) {
          for (let c = 0; c < CELLS; c += 1) {
            const m = membership(r, c);
            if (m === 0) continue;
            const mT = membership(r - 1, c);
            const mB = membership(r + 1, c);
            const mL = membership(r, c - 1);
            const mR = membership(r, c + 1);
            if (mT !== m) addSeg(hBorder, r * cell + (r === 0 ? hw : 0), c * cell, (c + 1) * cell);
            if (mB !== m)
              addSeg(
                hBorder,
                (r + 1) * cell - (r + 1 === CELLS ? hw : 0),
                c * cell,
                (c + 1) * cell
              );
            if (mL !== m) addSeg(vBorder, c * cell + (c === 0 ? hw : 0), r * cell, (r + 1) * cell);
            if (mR !== m)
              addSeg(
                vBorder,
                (c + 1) * cell - (c + 1 === CELLS ? hw : 0),
                r * cell,
                (r + 1) * cell
              );
          }
        }

        ctx.strokeStyle = borderColor;
        ctx.lineWidth = lw;
        mergeAndDraw(ctx, hBorder, vBorder);
      },
      [theme]
    )
  );

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      width={PREVIEW_CANVAS_SIZE}
      height={PREVIEW_CANVAS_SIZE}
    />
  );
}
