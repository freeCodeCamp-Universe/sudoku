import { useCallback } from 'react';
import { useTheme } from '@/app/ThemeProvider';
import styles from './Preview.module.css';
import { PREVIEW_CANVAS_SIZE, usePreviewCanvas } from './usePreviewCanvas';

const ROW_CLUES = [3, 0, 7, 14, 20, 8];
const COL_CLUES = [17, 2, 0, 5, 25, 11];

export function SandwichPreview() {
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
    for (let r = 0; r < 6; r += 1) {
      for (let c = 0; c < 6; c += 1) {
        ctx.strokeRect(offset + c * cell, offset + r * cell, cell, cell);
      }
    }

    ctx.fillStyle = fillColor;
    [[0, 4], [1, 1], [2, 3], [3, 0], [4, 5], [5, 2]].forEach(([r, c]) => {
      ctx.fillRect(offset + c * cell + 1, offset + r * cell + 1, cell - 2, cell - 2);
    });

    ctx.fillStyle = clueColor;
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ROW_CLUES.forEach((value, index) => {
      ctx.fillText(String(value), offset + 6 * cell + offset / 2, offset + index * cell + cell / 2);
    });
    COL_CLUES.forEach((value, index) => {
      ctx.fillText(String(value), offset + index * cell + cell / 2, offset + 6 * cell + offset / 2);
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
