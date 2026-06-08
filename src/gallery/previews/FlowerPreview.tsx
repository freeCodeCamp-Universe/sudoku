import { useCallback } from 'react';
import { useTheme } from '@/app/ThemeProvider';
import styles from './Preview.module.css';
import { PREVIEW_CANVAS_SIZE, usePreviewCanvas } from './usePreviewCanvas';

const SUB_GRIDS = [
  { originRow: 0, originCol: 3 },
  { originRow: 3, originCol: 0 },
  { originRow: 3, originCol: 3 },
  { originRow: 3, originCol: 6 },
  { originRow: 6, originCol: 3 },
];

export function FlowerPreview() {
  const { theme } = useTheme();
  const canvasRef = usePreviewCanvas(useCallback((ctx, { width }) => {
    const cells = 15;
    const cell = width / cells;
    const isLight = theme === 'light';
    const fillOverlap5 = isLight ? '#dfdff2' : '#313163';
    const fillOverlap4 = isLight ? '#e4e4f4' : '#2c2c5a';
    const fillOverlap3 = isLight ? '#e9e9f6' : '#272751';
    const fillOverlap2 = isLight ? '#eeeef8' : '#222248';
    const fillSingle = isLight ? '#f5f5f0' : '#1b1b32';
    const cellLine = isLight ? '#c8c8d8' : '#2a2a3a';
    const boxLine = isLight ? '#a0a0c0' : '#3b3b4f';
    const borderColor = isLight ? '#5060a0' : '#9898b8';

    for (let row = 0; row < cells; row += 1) {
      for (let col = 0; col < cells; col += 1) {
        const count = SUB_GRIDS.filter(({ originRow, originCol }) =>
          row >= originRow && row < originRow + 9 && col >= originCol && col < originCol + 9
        ).length;

        if (count === 0) continue;
        ctx.fillStyle =
          count === 5 ? fillOverlap5 :
          count === 4 ? fillOverlap4 :
          count === 3 ? fillOverlap3 :
          count === 2 ? fillOverlap2 :
          fillSingle;
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
