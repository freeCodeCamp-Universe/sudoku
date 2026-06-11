import { useCallback } from 'react';
import { useTheme } from '@/app/ThemeProvider';
import styles from './Preview.module.css';
import { PREVIEW_CANVAS_SIZE, usePreviewCanvas } from './usePreviewCanvas';

const CELLS = 6;
const BOX_ROWS = 2;
const BOX_COLS = 3;

const GRID: Array<number | ''> = [
  1, '', '', 4, '', '',
  '', 5, '', '', '', 3,
  '', '', 1, '', 6, '',
  5, '', '', 2, '', '',
  '', '', 2, '', '', 5,
  '', 4, '', '', 1, '',
];

export function SixBySixPreview() {
  const { theme } = useTheme();
  const canvasRef = usePreviewCanvas(useCallback((ctx, { width }) => {
    const cell = width / CELLS;
    const isLight = theme === 'light';
    const cellLine    = isLight ? '#c8c8d8' : '#2a2a3a';
    const boxLine     = isLight ? '#8080a8' : '#3b3b4f';
    const borderColor = isLight ? '#5060a0' : '#9898b8';
    const textColor   = isLight ? '#2a2a40' : '#d0d0d5';

    if (isLight) {
      ctx.fillStyle = '#f5f5f0';
      ctx.fillRect(0, 0, width, width);
    }

    ctx.strokeStyle = cellLine;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let i = 1; i < CELLS; i += 1) {
      const isBoxV = i % BOX_COLS === 0;
      const isBoxH = i % BOX_ROWS === 0;
      if (!isBoxV) {
        ctx.moveTo(i * cell, 0);
        ctx.lineTo(i * cell, CELLS * cell);
      }
      if (!isBoxH) {
        ctx.moveTo(0, i * cell);
        ctx.lineTo(CELLS * cell, i * cell);
      }
    }
    ctx.stroke();

    ctx.strokeStyle = boxLine;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = BOX_COLS; i < CELLS; i += BOX_COLS) {
      ctx.moveTo(i * cell, 0);
      ctx.lineTo(i * cell, CELLS * cell);
    }
    for (let i = BOX_ROWS; i < CELLS; i += BOX_ROWS) {
      ctx.moveTo(0, i * cell);
      ctx.lineTo(CELLS * cell, i * cell);
    }
    ctx.stroke();

    const lw = 1.5;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = lw;
    ctx.strokeRect(lw / 2, lw / 2, CELLS * cell - lw, CELLS * cell - lw);

    ctx.fillStyle = textColor;
    ctx.font = `600 ${Math.round(cell * 0.5)}px 'Fira Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < CELLS * CELLS; i += 1) {
      if (GRID[i] === '') continue;
      const r = Math.floor(i / CELLS);
      const c = i % CELLS;
      ctx.fillText(String(GRID[i]), (c + 0.5) * cell, (r + 0.5) * cell);
    }
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
