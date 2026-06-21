import { useCallback } from 'react';
import { useTheme } from '@/app/ThemeProvider';
import styles from './Preview.module.css';
import { PREVIEW_CANVAS_SIZE, usePreviewCanvas } from './usePreviewCanvas';
import { previewBaseFill, previewShadedFill, previewShadedText } from './previewColors';

const CELLS = 9;
const BOX = 3;

const DIAGONAL_CELLS = new Set<number>();
for (let i = 0; i < 9; i += 1) {
  DIAGONAL_CELLS.add(i * 9 + i);
  DIAGONAL_CELLS.add(i * 9 + (8 - i));
}

const GIVENS = new Set([2, 6, 12, 19, 21, 40, 59, 61, 68, 74, 78]);
const GIVEN_DIGITS = [3, 7, 5, 4, 2, 9, 8, 6, 1];

export function SudokuXPreview() {
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
        const textColor = isLight ? '#2a2a40' : '#d0d0d5';
        const shadedText = previewShadedText();

        ctx.fillStyle = previewBaseFill(isLight);
        ctx.fillRect(0, 0, CELLS * cell, CELLS * cell);

        for (let i = 0; i < 81; i += 1) {
          if (!DIAGONAL_CELLS.has(i)) continue;
          const r = Math.floor(i / CELLS);
          const c = i % CELLS;
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

        ctx.font = `600 ${Math.round(cell * 0.55)}px 'Fira Mono', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (const i of GIVENS) {
          const digit = GIVEN_DIGITS[i % 9];
          if (!digit) continue;
          const r = Math.floor(i / CELLS);
          const c = i % CELLS;
          ctx.fillStyle = DIAGONAL_CELLS.has(i) ? shadedText : textColor;
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
