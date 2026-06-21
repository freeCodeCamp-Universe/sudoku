import { useCallback } from 'react';
import { useTheme } from '@/app/ThemeProvider';
import styles from './Preview.module.css';
import { PREVIEW_CANVAS_SIZE, usePreviewCanvas } from './usePreviewCanvas';
import { previewBaseFill, previewShadedFill, previewShadedText } from './previewColors';

const CELLS = 9;
const BOX = 3;

const CENTER_DOT_DIGITS = new Map<number, number>([
  [1 * 9 + 1, 6],
  [1 * 9 + 4, 2],
  [1 * 9 + 7, 9],
  [4 * 9 + 1, 3],
  [4 * 9 + 4, 7],
  [4 * 9 + 7, 1],
  [7 * 9 + 1, 5],
  [7 * 9 + 4, 4],
  [7 * 9 + 7, 8],
]);

export function CenterDotPreview() {
  const { theme } = useTheme();
  const canvasRef = usePreviewCanvas(
    useCallback(
      (ctx, { width }) => {
        const cell = width / CELLS;
        const isLight = theme === 'light';
        const fillShaded = previewShadedFill();
        const cellLine = isLight ? '#c8c8d8' : '#2a2a3a';
        const boxLine = isLight ? '#8080a8' : '#3b3b4f';
        const borderColor = isLight ? '#5060a0' : '#9898b8';

        ctx.fillStyle = previewBaseFill(isLight);
        ctx.fillRect(0, 0, CELLS * cell, CELLS * cell);

        for (const [idx] of CENTER_DOT_DIGITS) {
          const r = Math.floor(idx / CELLS);
          const c = idx % CELLS;
          ctx.fillStyle = fillShaded;
          ctx.fillRect(c * cell, r * cell, cell, cell);
        }

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

        ctx.fillStyle = previewShadedText();
        ctx.font = `600 ${Math.round(cell * 0.55)}px 'Fira Mono', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (const [idx, digit] of CENTER_DOT_DIGITS) {
          const r = Math.floor(idx / CELLS);
          const c = idx % CELLS;
          ctx.fillText(String(digit), (c + 0.5) * cell, (r + 0.5) * cell);
        }
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
