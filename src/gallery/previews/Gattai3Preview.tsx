import { useCallback } from 'react';
import { useTheme } from '@/app/ThemeProvider';
import styles from './Preview.module.css';
import { PREVIEW_CANVAS_SIZE, usePreviewCanvas } from './usePreviewCanvas';

const CELLS = 15;
const SUB_GRIDS = [
  { originRow: 0, originCol: 3 },  // top-center
  { originRow: 6, originCol: 0 },  // bottom-left
  { originRow: 3, originCol: 6 },  // right
];

export function Gattai3Preview() {
  const { theme } = useTheme();
  const canvasRef = usePreviewCanvas(useCallback((ctx, { width }) => {
    const cell = width / CELLS;
    const isLight = theme === 'light';
    const fillOverlap2 = isLight ? '#e8e8f8' : '#1f1f3a';
    const fillSingle   = isLight ? '#f5f5f0' : '#1b1b32';
    const cellLine     = isLight ? '#c8c8d8' : '#2a2a3a';
    const boxLine      = isLight ? '#a0a0c0' : '#3b3b4f';
    const borderColor  = isLight ? '#5060a0' : '#9898b8';

    for (let row = 0; row < CELLS; row += 1) {
      for (let col = 0; col < CELLS; col += 1) {
        const count = SUB_GRIDS.filter(({ originRow, originCol }) =>
          row >= originRow && row < originRow + 9 && col >= originCol && col < originCol + 9
        ).length;
        if (count === 0) continue;
        ctx.fillStyle = count >= 2 ? fillOverlap2 : fillSingle;
        ctx.fillRect(col * cell, row * cell, cell, cell);
      }
    }

    ctx.strokeStyle = cellLine;
    ctx.lineWidth = 0.4;
    SUB_GRIDS.forEach(({ originRow, originCol }) => {
      for (let i = 1; i < 9; i += 1) {
        ctx.beginPath();
        ctx.moveTo((originCol + i) * cell, originRow * cell);
        ctx.lineTo((originCol + i) * cell, (originRow + 9) * cell);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(originCol * cell, (originRow + i) * cell);
        ctx.lineTo((originCol + 9) * cell, (originRow + i) * cell);
        ctx.stroke();
      }
    });

    ctx.strokeStyle = boxLine;
    ctx.lineWidth = 1.2;
    SUB_GRIDS.forEach(({ originRow, originCol }) => {
      [3, 6].forEach((offset) => {
        ctx.beginPath();
        ctx.moveTo((originCol + offset) * cell, originRow * cell);
        ctx.lineTo((originCol + offset) * cell, (originRow + 9) * cell);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(originCol * cell, (originRow + offset) * cell);
        ctx.lineTo((originCol + 9) * cell, (originRow + offset) * cell);
        ctx.stroke();
      });
    });

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1.5;
    SUB_GRIDS.forEach(({ originRow, originCol }) => {
      ctx.strokeRect(originCol * cell + 0.75, originRow * cell + 0.75, 9 * cell - 1.5, 9 * cell - 1.5);
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
