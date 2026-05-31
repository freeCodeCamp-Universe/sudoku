import { useCallback } from 'react';
import { useTheme } from '@/app/ThemeProvider';
import styles from './Preview.module.css';
import { PREVIEW_CANVAS_SIZE, usePreviewCanvas } from './usePreviewCanvas';

export function GreaterThanPreview() {
  const { theme } = useTheme();
  const canvasRef = usePreviewCanvas(useCallback((ctx, { width }) => {
    const isLight = theme === 'light';
    const n = 5;
    const cell = width / (n + 1);
    const offset = cell / 2;
    const gridColor = isLight ? '#333' : '#333';
    const symbolColor = isLight ? '#e08860' : '#e08860';
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.7;

    for (let row = 0; row < n; row += 1) {
      for (let col = 0; col < n; col += 1) {
        ctx.strokeRect(offset + col * cell, offset + row * cell, cell, cell);
      }
    }

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
        ctx.fillText(String(symbol), offset + col * cell + cell, offset + row * cell + cell / 2);
      } else {
        ctx.fillText(String(symbol), offset + col * cell + cell / 2, offset + row * cell + cell);
      }
    });
  }, [theme]));

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      width={PREVIEW_CANVAS_SIZE}
      height={PREVIEW_CANVAS_SIZE}
    />
  );
}
