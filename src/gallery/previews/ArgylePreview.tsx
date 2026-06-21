import { useCallback } from 'react';
import { useTheme } from '@/app/ThemeProvider';
import styles from './Preview.module.css';
import { PREVIEW_CANVAS_SIZE, usePreviewCanvas } from './usePreviewCanvas';
import { previewBaseFill } from './previewColors';

const CELLS = 9;
const BOX = 3;

const D1_OFFSETS = new Set([-4, -1, 1, 4]); // col - row
const D2_SUMS = new Set([4, 7, 9, 12]); // row + col

export function ArgylePreview() {
  const { theme } = useTheme();
  const canvasRef = usePreviewCanvas(
    useCallback(
      (ctx, { width }) => {
        const cell = width / CELLS;
        const isLight = theme === 'light';
        const cellLine = isLight ? '#c8c8d8' : '#2a2a3a';
        const boxLine = isLight ? '#8080a8' : '#3b3b4f';
        const borderColor = isLight ? '#5060a0' : '#9898b8';
        const diagColor = isLight ? '#8080a8' : '#9898b8';

        ctx.fillStyle = previewBaseFill(isLight);
        ctx.fillRect(0, 0, width, width);

        ctx.strokeStyle = cellLine;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        for (let i = 1; i < CELLS; i += 1) {
          if (i % BOX === 0) continue;
          ctx.moveTo(i * cell, 0);
          ctx.lineTo(i * cell, CELLS * cell);
          ctx.moveTo(0, i * cell);
          ctx.lineTo(CELLS * cell, i * cell);
        }
        ctx.stroke();

        ctx.strokeStyle = boxLine;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let i = BOX; i < CELLS; i += BOX) {
          ctx.moveTo(i * cell, 0);
          ctx.lineTo(i * cell, CELLS * cell);
          ctx.moveTo(0, i * cell);
          ctx.lineTo(CELLS * cell, i * cell);
        }
        ctx.stroke();

        const lw = 1.5;
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = lw;
        ctx.strokeRect(lw / 2, lw / 2, CELLS * cell - lw, CELLS * cell - lw);

        ctx.strokeStyle = diagColor;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = isLight ? 0.9 : 0.8;
        ctx.beginPath();
        for (let r = 0; r < CELLS; r += 1) {
          for (let c = 0; c < CELLS; c += 1) {
            if (D1_OFFSETS.has(c - r)) {
              ctx.moveTo(c * cell, r * cell);
              ctx.lineTo((c + 1) * cell, (r + 1) * cell);
            }
            if (D2_SUMS.has(r + c)) {
              ctx.moveTo((c + 1) * cell, r * cell);
              ctx.lineTo(c * cell, (r + 1) * cell);
            }
          }
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
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
