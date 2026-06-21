import { useCallback } from 'react';
import { useTheme } from '@/app/ThemeProvider';
import styles from './Preview.module.css';
import { PREVIEW_CANVAS_SIZE, usePreviewCanvas } from './usePreviewCanvas';
import { previewBaseFill } from './previewColors';

const CELLS = 16;
const BOX = 4;

const GIVENS = new Map<number, string>([
  [0 * 16 + 3, '5'],
  [0 * 16 + 9, 'C'],
  [0 * 16 + 14, '1'],
  [1 * 16 + 4, '6'],
  [1 * 16 + 11, 'B'],
  [2 * 16 + 0, 'D'],
  [2 * 16 + 11, 'A'],
  [3 * 16 + 6, '1'],
  [3 * 16 + 15, '4'],
  [4 * 16 + 7, '3'],
  [4 * 16 + 12, '8'],
  [5 * 16 + 3, '6'],
  [5 * 16 + 14, 'G'],
  [6 * 16 + 3, 'G'],
  [6 * 16 + 9, 'C'],
  [7 * 16 + 1, '9'],
  [7 * 16 + 14, '3'],
  [8 * 16 + 5, 'B'],
  [8 * 16 + 11, 'D'],
  [9 * 16 + 4, '6'],
  [9 * 16 + 10, '7'],
  [10 * 16 + 0, '2'],
  [10 * 16 + 7, 'A'],
  [11 * 16 + 3, '9'],
  [11 * 16 + 13, '2'],
  [12 * 16 + 2, 'F'],
  [12 * 16 + 10, '1'],
  [13 * 16 + 1, 'F'],
  [13 * 16 + 8, '4'],
  [14 * 16 + 5, '8'],
  [14 * 16 + 13, 'C'],
  [15 * 16 + 3, '7'],
  [15 * 16 + 15, 'E'],
]);

export function SuperPreview() {
  const { theme } = useTheme();
  const canvasRef = usePreviewCanvas(
    useCallback(
      (ctx, { width }) => {
        const cell = width / CELLS;
        const isLight = theme === 'light';
        const cellLine = isLight ? '#c8c8d8' : '#2a2a3a';
        const lineColor = isLight ? '#8080a8' : '#3b3b4f';
        const borderColor = isLight ? '#5060a0' : '#9898b8';
        const textColor = isLight ? '#2a2a40' : '#d0d0d5';

        ctx.fillStyle = previewBaseFill(isLight);
        ctx.fillRect(0, 0, width, width);

        ctx.strokeStyle = cellLine;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        for (let i = 1; i < CELLS; i += 1) {
          if (i % BOX === 0) continue;
          ctx.moveTo(i * cell, 0);
          ctx.lineTo(i * cell, CELLS * cell);
          ctx.moveTo(0, i * cell);
          ctx.lineTo(CELLS * cell, i * cell);
        }
        ctx.stroke();

        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = BOX; i < CELLS; i += BOX) {
          ctx.moveTo(i * cell, 0);
          ctx.lineTo(i * cell, CELLS * cell);
          ctx.moveTo(0, i * cell);
          ctx.lineTo(CELLS * cell, i * cell);
        }
        ctx.stroke();

        const hw = 1.5 / 2;
        ctx.strokeStyle = borderColor;
        ctx.strokeRect(hw, hw, CELLS * cell - 1.5, CELLS * cell - 1.5);

        ctx.fillStyle = textColor;
        ctx.font = `600 ${Math.round(cell * 0.6)}px 'Fira Mono', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (const [idx, symbol] of GIVENS) {
          const r = Math.floor(idx / CELLS);
          const c = idx % CELLS;
          ctx.fillText(symbol, (c + 0.5) * cell, (r + 0.5) * cell);
        }
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
