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
        const gridColor = isLight ? '#c8c8d8' : '#2a2a3a';
        const regionBorder = isLight ? '#8080a8' : '#9898b8';
        const borderColor = isLight ? '#5060a0' : '#9898b8';
        const textColor = isLight ? '#2a2a40' : '#d0d0d5';

        if (isLight) {
          ctx.fillStyle = '#f5f5f0';
          for (let row = 0; row < n; row += 1) {
            for (let col = 0; col <= row; col += 1) {
              ctx.fillRect(offset + col * size, offset + row * size, size, size);
            }
          }
        }

        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 0.6;

        for (let row = 0; row < n; row += 1) {
          for (let col = 0; col <= row; col += 1) {
            ctx.strokeRect(offset + col * size, offset + row * size, size, size);
          }
        }

        ctx.strokeStyle = regionBorder;
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

        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(offset, offset);
        for (let i = 0; i < n; i += 1) {
          ctx.lineTo(offset + (i + 1) * size, offset + i * size);
          ctx.lineTo(offset + (i + 1) * size, offset + (i + 1) * size);
        }
        ctx.lineTo(offset, offset + n * size);
        ctx.closePath();
        ctx.stroke();

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
