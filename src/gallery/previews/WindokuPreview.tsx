import { useCallback } from 'react';
import { useTheme } from '@/app/ThemeProvider';
import styles from './Preview.module.css';
import { PREVIEW_CANVAS_SIZE, usePreviewCanvas } from './usePreviewCanvas';

const CELLS = 9;
const BOX = 3;

const WINDOW_ORIGINS: Array<[number, number]> = [[1, 1], [1, 5], [5, 1], [5, 5]];

export function WindokuPreview() {
  const { theme } = useTheme();
  const canvasRef = usePreviewCanvas(useCallback((ctx, { width }) => {
    const cell = width / CELLS;
    const isLight = theme === 'light';
    const fillWindow  = isLight ? '#e8e8fa' : '#3b3b4f';
    const cellLine    = isLight ? '#c8c8d8' : '#2a2a3a';
    const boxLine     = isLight ? '#8080a8' : '#3b3b4f';
    const borderColor = isLight ? '#5060a0' : '#9898b8';

    if (isLight) {
      ctx.fillStyle = '#f5f5f0';
      ctx.fillRect(0, 0, CELLS * cell, CELLS * cell);
    }

    for (const [wr, wc] of WINDOW_ORIGINS) {
      ctx.fillStyle = fillWindow;
      ctx.fillRect(wc * cell, wr * cell, BOX * cell, BOX * cell);
    }

    ctx.strokeStyle = cellLine;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let i = 1; i < CELLS; i += 1) {
      if (i % BOX === 0) continue;
      ctx.moveTo(i * cell, 0);       ctx.lineTo(i * cell, CELLS * cell);
      ctx.moveTo(0,        i * cell); ctx.lineTo(CELLS * cell, i * cell);
    }
    ctx.stroke();

    ctx.strokeStyle = boxLine;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = BOX; i < CELLS; i += BOX) {
      ctx.moveTo(i * cell, 0);       ctx.lineTo(i * cell, CELLS * cell);
      ctx.moveTo(0,        i * cell); ctx.lineTo(CELLS * cell, i * cell);
    }
    ctx.stroke();

    const lw = 1.5;
    const hw = lw / 2;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = lw;
    ctx.strokeRect(hw, hw, CELLS * cell - lw, CELLS * cell - lw);
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
