import { useCallback } from 'react';
import { useTheme } from '@/app/ThemeProvider';
import styles from './Preview.module.css';
import { PREVIEW_CANVAS_SIZE, usePreviewCanvas } from './usePreviewCanvas';
import { previewBaseFill } from './previewColors';

export function GreaterThanPreview() {
  const { theme } = useTheme();
  const canvasRef = usePreviewCanvas(
    useCallback(
      (ctx, { width }) => {
        const isLight = theme === 'light';
        const n = 5;
        const cell = width / n;
        const gridColor = isLight ? '#c8c8d8' : '#2a2a3a';
        const borderColor = isLight ? '#5060a0' : '#9898b8';
        const symbolColor = '#e08860';

        ctx.fillStyle = previewBaseFill(isLight);
        ctx.fillRect(0, 0, width, width);

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

        ctx.fillStyle = symbolColor;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const markers: Array<[number, number, 'h' | 'v', '<' | '>']> = [
          [0, 0, 'h', '<'],
          [1, 1, 'v', '>'],
          [2, 0, 'h', '>'],
          [0, 2, 'v', '<'],
          [3, 3, 'h', '<'],
          [2, 3, 'v', '>'],
        ];

        markers.forEach(([row, col, direction, symbol]) => {
          if (direction === 'h') {
            ctx.fillText(String(symbol), col * cell + cell, row * cell + cell / 2);
          } else {
            ctx.fillText(String(symbol), col * cell + cell / 2, row * cell + cell);
          }
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
