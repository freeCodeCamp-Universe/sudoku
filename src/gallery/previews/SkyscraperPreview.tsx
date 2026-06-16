import { useCallback } from 'react';
import { useTheme } from '@/app/ThemeProvider';
import styles from './Preview.module.css';
import { PREVIEW_CANVAS_SIZE, usePreviewCanvas } from './usePreviewCanvas';

export function SkyscraperPreview() {
  const { theme } = useTheme();
  const canvasRef = usePreviewCanvas(useCallback((ctx, { width }) => {
    const isLight = theme === 'light';
    const offset = 18;
    const cell = (width - offset * 2) / 6;
    const gridColor = isLight ? '#c8c8d8' : '#2a2a3a';
    const clueColor = isLight ? '#5060a0' : '#9898b8';
    const fillColor = isLight ? '#dcdcf8' : '#28284c';

    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.7;

    for (let row = 0; row < 6; row += 1) {
      for (let col = 0; col < 6; col += 1) {
        ctx.strokeRect(offset + col * cell, offset + row * cell, cell, cell);
      }
    }

    ctx.fillStyle = clueColor;
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    [2, 3, 1, 4, 2, 3].forEach((value, index) => ctx.fillText(String(value), offset + index * cell + cell / 2, offset / 2));
    [3, 2, 4, 1, 3, 2].forEach((value, index) => ctx.fillText(String(value), offset + index * cell + cell / 2, offset + 6 * cell + offset / 2));
    [2, 4, 1, 3, 2, 3].forEach((value, index) => ctx.fillText(String(value), offset / 2, offset + index * cell + cell / 2));
    [3, 1, 4, 2, 3, 2].forEach((value, index) => ctx.fillText(String(value), offset + 6 * cell + offset / 2, offset + index * cell + cell / 2));
    ctx.fillStyle = fillColor;
    [[0, 0], [1, 3], [2, 5], [3, 2], [4, 1], [5, 4]].forEach(([row, col]) => {
      ctx.fillRect(offset + col * cell + 1, offset + row * cell + 1, cell - 2, cell - 2);
    });

    const lw = 1.5;
    ctx.strokeStyle = clueColor;
    ctx.lineWidth = lw;
    ctx.strokeRect(offset + lw / 2, offset + lw / 2, 6 * cell - lw, 6 * cell - lw);
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
