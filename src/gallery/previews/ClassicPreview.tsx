import { useCallback } from 'react';
import { useTheme } from '@/app/ThemeProvider';
import styles from './Preview.module.css';
import { PREVIEW_CANVAS_SIZE, usePreviewCanvas } from './usePreviewCanvas';

const CELLS = 9;
const BOX = 3;

const DIGITS = [5,3,0,6,0,0,0,9,8,0,7,0,1,9,5,0,0,0,0,0,0,9,8,0,6,0,0,8,0,0,0,6,0,0,0,3,4,0,0,8,0,3,0,0,1,7,0,0,0,2,0,0,0,6,0,6,0,0,0,0,2,8,0,0,0,0,4,1,9,0,0,5,0,0,0,0,8,0,0,7,9];

export function ClassicPreview() {
  const { theme } = useTheme();
  const canvasRef = usePreviewCanvas(useCallback((ctx, { width }) => {
    const cell = width / CELLS;
    const isLight = theme === 'light';
    const cellLine    = isLight ? '#c8c8d8' : '#2a2a3a';
    const boxLine     = isLight ? '#8080a8' : '#3b3b4f';
    const borderColor = isLight ? '#5060a0' : '#9898b8';

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
    ctx.lineWidth = 1.2;
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

    ctx.fillStyle = isLight ? '#2a2a40' : '#d0d0d5';
    ctx.font = `600 ${Math.round(cell * 0.55)}px 'Fira Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < 81; i += 1) {
      if (!DIGITS[i]) continue;
      const r = Math.floor(i / CELLS);
      const c = i % CELLS;
      ctx.fillText(String(DIGITS[i]), (c + 0.5) * cell, (r + 0.5) * cell);
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
