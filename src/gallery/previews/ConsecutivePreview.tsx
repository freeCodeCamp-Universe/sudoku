import { useCallback } from 'react';
import { useTheme } from '@/app/ThemeProvider';
import styles from './Preview.module.css';
import { PREVIEW_CANVAS_SIZE, usePreviewCanvas } from './usePreviewCanvas';

export function ConsecutivePreview() {
  const { theme } = useTheme();
  const canvasRef = usePreviewCanvas(
    useCallback(
      (ctx, { width }) => {
        const isLight = theme === 'light';
        const n = 5;
        const cell = width / n;
        const gridColor = isLight ? '#c8c8d8' : '#2a2a3a';
        const borderColor = isLight ? '#5060a0' : '#9898b8';
        const digitColor = isLight ? '#2a2a40' : '#d0d0d5';

        if (isLight) {
          ctx.fillStyle = '#f5f5f0';
          ctx.fillRect(0, 0, width, width);
        }

        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        for (let i = 1; i < n; i += 1) {
          ctx.moveTo(i * cell, 0);
          ctx.lineTo(i * cell, n * cell);
          ctx.moveTo(0, i * cell);
          ctx.lineTo(n * cell, i * cell);
        }
        ctx.stroke();

        const lw = 1.5;
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = lw;
        ctx.strokeRect(lw / 2, lw / 2, n * cell - lw, n * cell - lw);

        const markerColor = isLight ? '#5060a0' : '#9898b8';
        const markers: Array<[number, number, 'h' | 'v']> = [
          [0, 0, 'h'],
          [1, 2, 'v'],
          [2, 1, 'h'],
          [3, 3, 'v'],
          [1, 0, 'v'],
        ];

        ctx.fillStyle = markerColor;
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        markers.forEach(([row, col, direction]) => {
          if (direction === 'h') {
            ctx.fillText('▪', col * cell + cell, row * cell + cell / 2);
          } else {
            ctx.fillText('▪', col * cell + cell / 2, row * cell + cell);
          }
        });

        ctx.fillStyle = digitColor;
        ctx.font = 'bold 10px sans-serif';
        const digits: Array<[number, number, number]> = [
          [0, 0, 3],
          [0, 2, 4],
          [1, 1, 5],
          [2, 3, 2],
          [3, 0, 6],
          [4, 4, 1],
        ];

        digits.forEach(([row, col, value]) => {
          ctx.fillText(String(value), col * cell + cell / 2, row * cell + cell / 2);
        });
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
