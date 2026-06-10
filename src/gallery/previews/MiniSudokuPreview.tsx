import { useCallback } from 'react';
import { useTheme } from '@/app/ThemeProvider';
import styles from './Preview.module.css';
import { PREVIEW_CANVAS_SIZE, usePreviewCanvas } from './usePreviewCanvas';

const CELLS = 4;
const BOX = 2;

const GRID: Array<number | ''> = [
  1, '', 3, '',
  3, '', 1,  2,
  '', 2, '', 3,
  2,  3, '', 1,
];

export function MiniSudokuPreview() {
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
      if (i % BOX === 0) continue;
      ctx.moveTo(i * cell, 0);       ctx.lineTo(i * cell, CELLS * cell);
      ctx.moveTo(0,        i * cell); ctx.lineTo(CELLS * cell, i * cell);
    }
    ctx.stroke();

    ctx.strokeStyle = boxLine;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = BOX; i < CELLS; i += BOX) {
      ctx.moveTo(i * cell, 0);       ctx.lineTo(i * cell, CELLS * cell);
      ctx.moveTo(0,        i * cell); ctx.lineTo(CELLS * cell, i * cell);
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
