import { useCallback, useMemo } from 'react';
import { useTheme } from '@/app/ThemeProvider';
import styles from './Preview.module.css';
import { hashVariantId, seeded } from './seeded';
import { PREVIEW_CANVAS_SIZE, usePreviewCanvas } from './usePreviewCanvas';

export function SujikenPreview({ variantId }: { variantId: string }) {
  const { theme } = useTheme();
  const filledCells = useMemo(() => {
    const random = seeded(hashVariantId(variantId));
    const cells = new Set<string>();

    for (let row = 0; row < 9; row += 1) {
      for (let col = 0; col <= row; col += 1) {
        if (random() < 0.22) {
          cells.add(`${row},${col}`);
        }
      }
    }

    return cells;
  }, [variantId]);
  const canvasRef = usePreviewCanvas(useCallback((ctx, { width }) => {
    const n = 9;
    const size = width / (n + 1);
    const offset = size * 0.4;
    const isLight = theme === 'light';
    const gridColor = isLight ? '#c8c8d8' : '#3b3b4f';
    const fillColor = isLight ? '#d0d0ec' : '#2a2a50';
    const diagonalColor = isLight ? '#6060a0' : '#9898b8';
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.6;

    for (let row = 0; row < n; row += 1) {
      for (let col = 0; col <= row; col += 1) {
        ctx.strokeRect(offset + col * size, offset + row * size, size, size);

        if (filledCells.has(`${row},${col}`)) {
          ctx.fillStyle = fillColor;
          ctx.fillRect(offset + col * size + 0.5, offset + row * size + 0.5, size - 1, size - 1);
        }
      }
    }

    ctx.strokeStyle = diagonalColor;
    ctx.lineWidth = 1.2;

    for (let diagonal = 0; diagonal < n; diagonal += 1) {
      ctx.strokeRect(offset + diagonal * size, offset + diagonal * size, size, size);
    }
  }, [filledCells, theme]));

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      width={PREVIEW_CANVAS_SIZE}
      height={PREVIEW_CANVAS_SIZE}
    />
  );
}
