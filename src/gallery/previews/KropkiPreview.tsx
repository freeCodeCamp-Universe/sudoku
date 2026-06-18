import { useCallback } from 'react';
import { useTheme } from '@/app/ThemeProvider';
import styles from './Preview.module.css';
import { PREVIEW_CANVAS_SIZE, usePreviewCanvas } from './usePreviewCanvas';

const N = 5;

// [row, col, direction ('h'=right, 'v'=below), kind ('w'=white, 'b'=black)]
const DOTS: Array<[number, number, 'h' | 'v', 'w' | 'b']> = [
  [0, 0, 'h', 'w'],
  [0, 2, 'h', 'b'],
  [1, 1, 'v', 'w'],
  [2, 0, 'h', 'b'],
  [2, 3, 'v', 'w'],
  [3, 2, 'h', 'w'],
  [1, 3, 'h', 'b'],
  [3, 0, 'v', 'b'],
];

const DIGITS: Array<[number, number, number]> = [
  [0, 1, 2],
  [0, 4, 5],
  [1, 0, 3],
  [1, 2, 4],
  [2, 2, 8],
  [2, 4, 7],
  [3, 1, 6],
  [3, 4, 2],
  [4, 0, 2],
  [4, 3, 4],
];

export function KropkiPreview() {
  const { theme } = useTheme();
  const canvasRef = usePreviewCanvas(
    useCallback(
      (ctx, { width }) => {
        const cell = width / N;
        const isLight = theme === 'light';
        const gridColor = isLight ? '#c8c8d8' : '#2a2a3a';
        const borderColor = isLight ? '#5060a0' : '#9898b8';
        const digitColor = isLight ? '#2a2a40' : '#d0d0d5';
        const whiteDotFill = '#f8f8ff';
        const whiteDotStroke = '#5060a0';
        const blackDotFill = isLight ? '#4050a0' : '#9898cc';
        const radius = Math.max(3, Math.round((5 * cell) / 52));

        if (isLight) {
          ctx.fillStyle = '#f5f5f0';
          ctx.fillRect(0, 0, width, width);
        }

        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        for (let i = 1; i < N; i += 1) {
          ctx.moveTo(i * cell, 0);
          ctx.lineTo(i * cell, N * cell);
          ctx.moveTo(0, i * cell);
          ctx.lineTo(N * cell, i * cell);
        }
        ctx.stroke();

        const lw = 1.5;
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = lw;
        ctx.strokeRect(lw / 2, lw / 2, N * cell - lw, N * cell - lw);

        for (const [row, col, dir, kind] of DOTS) {
          const cx = dir === 'h' ? (col + 1) * cell : (col + 0.5) * cell;
          const cy = dir === 'h' ? (row + 0.5) * cell : (row + 1) * cell;

          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);

          if (kind === 'w') {
            ctx.fillStyle = whiteDotFill;
            ctx.fill();
            ctx.strokeStyle = whiteDotStroke;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          } else {
            ctx.fillStyle = blackDotFill;
            ctx.fill();
          }
        }

        ctx.fillStyle = digitColor;
        ctx.font = `bold ${Math.round(cell * 0.42)}px 'Fira Mono', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (const [row, col, value] of DIGITS) {
          ctx.fillText(String(value), (col + 0.5) * cell, (row + 0.5) * cell);
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
