import { useCallback } from 'react';
import { useTheme } from '@/app/ThemeProvider';
import styles from './Preview.module.css';
import { PREVIEW_CANVAS_SIZE, usePreviewCanvas } from './usePreviewCanvas';

const CELLS = 9;
const BOX = 3;

const GIVENS = new Map<number, string>([
  [0 * 9 + 2, 'S'],
  [0 * 9 + 5, 'U'],
  [0 * 9 + 8, 'D'],
  [1 * 9 + 1, 'O'],
  [1 * 9 + 4, 'K'],
  [2 * 9 + 3, 'U'],
  [2 * 9 + 7, 'S'],
  [3 * 9 + 0, 'D'],
  [3 * 9 + 8, 'K'],
  [4 * 9 + 4, 'O'],
  [5 * 9 + 0, 'U'],
  [5 * 9 + 8, 'D'],
  [6 * 9 + 1, 'K'],
  [6 * 9 + 5, 'O'],
  [7 * 9 + 4, 'S'],
  [7 * 9 + 7, 'U'],
  [8 * 9 + 0, 'D'],
  [8 * 9 + 3, 'K'],
  [8 * 9 + 6, 'S'],
]);

export function WordokuPreview() {
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

        if (isLight) {
          ctx.fillStyle = '#f5f5f0';
          ctx.fillRect(0, 0, width, width);
        }

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
        ctx.font = `bold ${Math.round(cell * 0.54)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (const [idx, letter] of GIVENS) {
          const r = Math.floor(idx / CELLS);
          const c = idx % CELLS;
          ctx.fillText(letter, (c + 0.5) * cell, (r + 0.5) * cell);
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
