import { useCallback, useMemo } from 'react';
import { useTheme } from '@/app/ThemeProvider';
import styles from './Preview.module.css';
import { PREVIEW_CANVAS_SIZE, usePreviewCanvas } from './usePreviewCanvas';
import { hashVariantId, seeded } from './seeded';

const CELLS = 9;
const BOX = 3;

export function EvenOddPreview({ variantId }: { variantId: string }) {
  const { theme } = useTheme();
  const digits = useMemo(() => {
    const random = seeded(hashVariantId(variantId));
    return Array.from({ length: 81 }, (_, index) => {
      if (random() >= 0.15) return 0;
      const row = Math.floor(index / 9);
      const col = index % 9;
      const pool = (row + col) % 2 === 0 ? [2, 4, 6, 8] : [1, 3, 5, 7, 9];
      return pool[Math.floor(random() * 4)] ?? 0;
    });
  }, [variantId]);

  const canvasRef = usePreviewCanvas(useCallback((ctx, { width }) => {
    const cell = width / CELLS;
    const isLight = theme === 'light';
    const fillEven    = isLight ? '#e8e8fa' : '#3b3b4f';
    const fillOdd     = isLight ? '#f5f5f0' : '#12123a';
    const cellLine    = isLight ? '#c8c8d8' : '#2a2a3a';
    const boxLine     = isLight ? '#8080a8' : '#3b3b4f';
    const borderColor = isLight ? '#5060a0' : '#9898b8';
    const textColor   = isLight ? '#2a2a40' : '#d0d0d5';

    for (let r = 0; r < CELLS; r += 1) {
      for (let c = 0; c < CELLS; c += 1) {
        ctx.fillStyle = (r + c) % 2 === 0 ? fillEven : fillOdd;
        ctx.fillRect(c * cell, r * cell, cell, cell);
      }
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

    ctx.fillStyle = textColor;
    ctx.font = `600 ${Math.round(cell * 0.55)}px 'Fira Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < 81; i += 1) {
      if (!digits[i]) continue;
      const r = Math.floor(i / CELLS);
      const c = i % CELLS;
      ctx.fillText(String(digits[i]), (c + 0.5) * cell, (r + 0.5) * cell);
    }
  }, [theme, digits]));

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      width={PREVIEW_CANVAS_SIZE}
      height={PREVIEW_CANVAS_SIZE}
    />
  );
}
