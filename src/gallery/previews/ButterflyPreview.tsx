import { useCallback } from 'react';
import { useTheme } from '@/app/ThemeProvider';
import { readThemeColor } from '@/app/readThemeColor';
import styles from './Preview.module.css';
import { PREVIEW_CANVAS_SIZE, usePreviewCanvas } from './usePreviewCanvas';

export function ButterflyPreview() {
  const { theme } = useTheme();
  const canvasRef = usePreviewCanvas(
    useCallback(
      (ctx, { width, height }) => {
        const cells = 12;
        const cell = width / cells;
        const isLight = theme === 'light';
        const fillOverlap4 = readThemeColor('--cell-overlap-4-bg');
        const fillOverlap2 = readThemeColor('--cell-overlap-2-bg');
        const fillSingle = isLight ? '#f5f5f0' : '#1b1b32';
        const cellLine = isLight ? '#c8c8d8' : '#2a2a3a';
        const boxLine = isLight ? '#a0a0c0' : '#3b3b4f';
        const borderColor = isLight ? '#5060a0' : '#9898b8';

        for (let row = 0; row < cells; row += 1) {
          for (let col = 0; col < cells; col += 1) {
            const overlapCount =
              (row < 9 && col < 9 ? 1 : 0) +
              (row < 9 && col >= 3 ? 1 : 0) +
              (row >= 3 && col < 9 ? 1 : 0) +
              (row >= 3 && col >= 3 ? 1 : 0);
            ctx.fillStyle =
              overlapCount === 4 ? fillOverlap4 : overlapCount === 2 ? fillOverlap2 : fillSingle;
            ctx.fillRect(col * cell, row * cell, cell, cell);
          }
        }

        ctx.strokeStyle = cellLine;
        ctx.lineWidth = 0.4;

        for (let index = 0; index <= cells; index += 1) {
          ctx.beginPath();
          ctx.moveTo(index * cell, 0);
          ctx.lineTo(index * cell, height);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, index * cell);
          ctx.lineTo(width, index * cell);
          ctx.stroke();
        }

        ctx.strokeStyle = boxLine;
        ctx.lineWidth = 1.2;
        [2, 5, 8].forEach((index) => {
          ctx.beginPath();
          ctx.moveTo(0, (index + 1) * cell);
          ctx.lineTo(width, (index + 1) * cell);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo((index + 1) * cell, 0);
          ctx.lineTo((index + 1) * cell, height);
          ctx.stroke();
        });

        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1.5;
        [
          [0, 0],
          [0, 3],
          [3, 0],
          [3, 3],
        ].forEach(([startRow, startCol]) => {
          ctx.strokeRect(
            startCol * cell + 0.75,
            startRow * cell + 0.75,
            9 * cell - 1.5,
            9 * cell - 1.5
          );
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
