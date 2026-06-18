import { useCallback, useMemo } from 'react';
import { useTheme } from '@/app/ThemeProvider';
import styles from './Preview.module.css';
import { PREVIEW_CANVAS_SIZE, usePreviewCanvas } from './usePreviewCanvas';
import { hashVariantId, seeded } from './seeded';

const CELLS = 9;
const BOX = 3;

const COLORS_DARK = [
  '#3a1a1a',
  '#1a3a1a',
  '#1a1a3a',
  '#3a3a1a',
  '#1a2a3a',
  '#2a1a3a',
  '#3a2a1a',
  '#1a3a2a',
  '#2a2a2a',
];
const COLORS_LIGHT = [
  '#f0c8c8',
  '#c8f0c8',
  '#c8d4f8',
  '#f0f0b8',
  '#c0e4f0',
  '#e0c8f8',
  '#f8e0c0',
  '#c0f0dc',
  '#d8d8d8',
];

export function ColorPreview({ variantId }: { variantId: string }) {
  const { theme } = useTheme();
  const cellColors = useMemo(() => {
    const random = seeded(hashVariantId(variantId));
    return Array.from({ length: 81 }, (_, index) => {
      const row = Math.floor(index / 9);
      const col = index % 9;
      return random() < 0.45 ? (row + col * 3 + Math.floor(row / 3)) % 9 : -1;
    });
  }, [variantId]);

  const canvasRef = usePreviewCanvas(
    useCallback(
      (ctx, { width }) => {
        const cell = width / CELLS;
        const isLight = theme === 'light';
        const colors = isLight ? COLORS_LIGHT : COLORS_DARK;
        const cellLine = isLight ? '#c8c8d8' : '#2a2a3a';
        const boxLine = isLight ? '#8080a8' : '#3b3b4f';
        const borderColor = isLight ? '#5060a0' : '#9898b8';

        if (isLight) {
          ctx.fillStyle = '#f5f5f0';
          ctx.fillRect(0, 0, width, width);
        }

        for (let i = 0; i < 81; i += 1) {
          const colorIdx = cellColors[i];
          if (colorIdx < 0) continue;
          const r = Math.floor(i / CELLS);
          const c = i % CELLS;
          ctx.fillStyle = colors[colorIdx];
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
      },
      [theme, cellColors]
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
