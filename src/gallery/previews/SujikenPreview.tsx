import { useCallback } from 'react';
import { useTheme } from '@/app/ThemeProvider';
import { PREVIEW_CANVAS_SIZE, usePreviewCanvas } from './usePreviewCanvas';
import styles from './Preview.module.css';

const DIGITS: Array<[number, number, number]> = [
  [1, 0, 3],
  [3, 2, 7],
  [5, 4, 2],
  [7, 1, 5],
  [8, 6, 9],
];

export function SujikenPreview() {
  const { theme } = useTheme();
  const canvasRef = usePreviewCanvas(
    useCallback(
      (ctx, { width }) => {
        const n = 9;
        const size = width / (n + 1);
        const offset = size * 0.4;
        const isLight = theme === 'light';
        const gridColor = isLight ? '#c8c8d8' : '#3b3b4f';
        const diagonalColor = isLight ? '#6060a0' : '#9898b8';
        const textColor = isLight ? '#2a2a40' : '#d0d0d5';

        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 0.6;

        for (let row = 0; row < n; row += 1) {
          for (let col = 0; col <= row; col += 1) {
            ctx.strokeRect(offset + col * size, offset + row * size, size, size);
          }
        }

        ctx.strokeStyle = diagonalColor;
        ctx.lineWidth = 1.8;
        ctx.beginPath();

        for (const boundary of [2, 5]) {
          const y = offset + (boundary + 1) * size;

          ctx.moveTo(offset, y);
          ctx.lineTo(offset + (boundary + 1) * size, y);
        }

        for (const boundary of [2, 5]) {
          const x = offset + (boundary + 1) * size;
          const yStart = offset + (boundary + 1) * size;

          ctx.moveTo(x, yStart);
          ctx.lineTo(x, offset + n * size);
        }

        ctx.stroke();

        ctx.strokeStyle = diagonalColor;
        ctx.lineWidth = 1.2;

        for (let diagonal = 0; diagonal < n; diagonal += 1) {
          ctx.strokeRect(offset + diagonal * size, offset + diagonal * size, size, size);
        }

        ctx.fillStyle = textColor;
        ctx.font = `600 ${Math.round(size * 0.55)}px 'Fira Mono', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (const [row, col, digit] of DIGITS) {
          ctx.fillText(
            String(digit),
            offset + col * size + size / 2,
            offset + row * size + size / 2
          );
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
