import { useCallback, useMemo } from 'react';
import { useTheme } from '@/app/ThemeProvider';
import styles from './Preview.module.css';
import { PREVIEW_CANVAS_SIZE, usePreviewCanvas } from './usePreviewCanvas';
import { previewBaseFill, previewShadedFill, previewShadedText } from './previewColors';
import { hashVariantId, seeded } from './seeded';

const CELLS = 9;
const BOX = 3;

// A real solved 9x9 grid. Even-odd shades every cell by the parity of its
// solved digit, so the preview must derive its pattern from an actual solution
// — a checkerboard is impossible (it would need five even digits in a row, but
// only four exist), which is exactly the shape the board produces.
const SOLUTION = [
  5, 3, 4, 6, 7, 8, 9, 1, 2, 6, 7, 2, 1, 9, 5, 3, 4, 8, 1, 9, 8, 3, 4, 2, 5, 6, 7, 8, 5, 9, 7, 6, 1,
  4, 2, 3, 4, 2, 6, 8, 5, 3, 7, 9, 1, 7, 1, 3, 9, 2, 4, 8, 5, 6, 9, 6, 1, 5, 3, 7, 2, 8, 4, 2, 8, 7,
  4, 1, 9, 6, 3, 5, 3, 4, 5, 2, 8, 6, 1, 7, 9,
];

export function EvenOddPreview({ variantId }: { variantId: string }) {
  const { theme } = useTheme();
  const shown = useMemo(() => {
    const random = seeded(hashVariantId(variantId));
    return SOLUTION.map((value) => (random() < 0.15 ? value : 0));
  }, [variantId]);

  const canvasRef = usePreviewCanvas(
    useCallback(
      (ctx, { width }) => {
        const cell = width / CELLS;
        const isLight = theme === 'light';
        const fillEven = previewShadedFill();
        const fillOdd = previewBaseFill(isLight);
        const evenText = previewShadedText();
        const cellLine = isLight ? '#c8c8d8' : '#2a2a3a';
        const boxLine = isLight ? '#8080a8' : '#3b3b4f';
        const borderColor = isLight ? '#5060a0' : '#9898b8';
        const textColor = isLight ? '#2a2a40' : '#d0d0d5';

        for (let r = 0; r < CELLS; r += 1) {
          for (let c = 0; c < CELLS; c += 1) {
            ctx.fillStyle = SOLUTION[r * CELLS + c] % 2 === 0 ? fillEven : fillOdd;
            ctx.fillRect(c * cell, r * cell, cell, cell);
          }
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
        for (let i = 0; i < 81; i += 1) {
          if (!shown[i]) continue;
          const r = Math.floor(i / CELLS);
          const c = i % CELLS;
          ctx.fillStyle = shown[i] % 2 === 0 ? evenText : textColor;
          ctx.fillText(String(shown[i]), (c + 0.5) * cell, (r + 0.5) * cell);
        }
      },
      [theme, shown]
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
