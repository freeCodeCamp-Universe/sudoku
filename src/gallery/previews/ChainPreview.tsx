import { useCallback } from 'react';
import { useTheme } from '@/app/ThemeProvider';
import styles from './Preview.module.css';
import { PREVIEW_CANVAS_SIZE, usePreviewCanvas } from './usePreviewCanvas';

const CHAINS = [
  [
    [0, 1],
    [1, 1],
    [1, 2],
  ],
  [
    [0, 6],
    [0, 7],
    [1, 7],
    [2, 7],
  ],
  [
    [3, 0],
    [4, 0],
    [4, 1],
    [4, 2],
  ],
  [
    [3, 5],
    [3, 6],
    [4, 6],
    [5, 6],
  ],
  [
    [5, 2],
    [5, 3],
    [6, 3],
  ],
  [
    [7, 5],
    [7, 6],
    [8, 6],
    [8, 7],
  ],
  [
    [0, 3],
    [0, 4],
    [0, 5],
  ],
  [
    [2, 0],
    [2, 1],
    [2, 2],
  ],
  [
    [1, 3],
    [1, 4],
    [1, 5],
    [1, 6],
  ],
  [
    [2, 3],
    [2, 4],
    [3, 4],
    [3, 3],
  ],
  [
    [6, 0],
    [7, 0],
    [7, 1],
    [7, 2],
  ],
  [
    [5, 8],
    [6, 8],
    [7, 8],
  ],
] as const;

const COLORS = [
  '#99c9ff',
  '#acd157',
  '#f1be32',
  '#ff9966',
  '#cc88ff',
  '#55ddbb',
  '#ff88aa',
  '#88ddff',
  '#ffcc55',
  '#dd88cc',
  '#88ccaa',
  '#ffaa66',
] as const;

export function ChainPreview() {
  const { theme } = useTheme();
  const canvasRef = usePreviewCanvas(
    useCallback(
      (ctx, { width, height }) => {
        const isLight = theme === 'light';
        const n = 9;
        const cell = width / n;
        const gridColor = isLight ? '#c8c8d8' : '#2a2a3a';
        const boxColor = isLight ? '#8080a8' : '#3b3b4f';

        if (isLight) {
          ctx.fillStyle = '#f5f5f0';
          ctx.fillRect(0, 0, width, width);
        }

        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 0.5;

        for (let row = 0; row < n; row += 1) {
          for (let col = 0; col < n; col += 1) {
            ctx.strokeRect(col * cell, row * cell, cell, cell);
          }
        }

        ctx.strokeStyle = boxColor;
        ctx.lineWidth = 1.5;
        [3, 6].forEach((index) => {
          ctx.beginPath();
          ctx.moveTo(index * cell, 0);
          ctx.lineTo(index * cell, height);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, index * cell);
          ctx.lineTo(width, index * cell);
          ctx.stroke();
        });
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        CHAINS.forEach((chain, index) => {
          ctx.strokeStyle = COLORS[index];
          ctx.globalAlpha = 0.7;
          ctx.beginPath();
          chain.forEach(([row, col], pointIndex) => {
            const x = col * cell + cell / 2;
            const y = row * cell + cell / 2;

            if (pointIndex === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          });
          ctx.stroke();
        });
        ctx.globalAlpha = 1;
        const lw = 1.5;
        ctx.strokeStyle = isLight ? '#5060a0' : '#9898b8';
        ctx.lineWidth = lw;
        ctx.lineCap = 'butt';
        ctx.strokeRect(lw / 2, lw / 2, n * cell - lw, n * cell - lw);
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
