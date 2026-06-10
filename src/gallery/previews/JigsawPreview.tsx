import { useCallback, useMemo } from 'react';
import { useTheme } from '@/app/ThemeProvider';
import styles from './Preview.module.css';
import { PREVIEW_CANVAS_SIZE, usePreviewCanvas } from './usePreviewCanvas';
import { hashVariantId, seeded } from './seeded';

const CELLS = 9;

const REGIONS = [
  0, 0, 0, 1, 1, 2, 2, 2, 2,
  0, 0, 1, 1, 2, 2, 3, 3, 2,
  0, 0, 1, 4, 4, 3, 3, 3, 3,
  0, 4, 4, 4, 5, 5, 3, 6, 6,
  4, 4, 7, 5, 5, 5, 6, 6, 6,
  7, 7, 7, 5, 8, 5, 6, 6, 6,
  7, 7, 8, 8, 8, 5, 5, 6, 6,
  7, 8, 8, 8, 8, 8, 5, 6, 6,
  7, 7, 8, 8, 8, 8, 8, 8, 6,
];

const REGION_COLORS_DARK  = ['#1e2030','#1e2820','#2a1e1e','#1e1e2a','#2a2a1e','#1e2a2a','#2a1e2a','#2a2014','#14202a'];
const REGION_COLORS_LIGHT = ['#d8d8ec','#d8ead8','#ead8d8','#d8d8ea','#eaead8','#d8eaea','#ead8ea','#eae0d0','#d0d8ea'];

export function JigsawPreview({ variantId }: { variantId: string }) {
  const { theme } = useTheme();
  const givenDigits = useMemo(() => {
    const random = seeded(hashVariantId(variantId));
    return Array.from({ length: 81 }, () => (random() < 0.18 ? Math.ceil(random() * 9) : 0));
  }, [variantId]);

  const canvasRef = usePreviewCanvas(useCallback((ctx, { width }) => {
    const cell = width / CELLS;
    const isLight = theme === 'light';
    const regionColors = isLight ? REGION_COLORS_LIGHT : REGION_COLORS_DARK;
    const cellLine     = isLight ? '#c8c8d8' : '#2a2a3a';
    const borderColor  = isLight ? '#5060a0' : '#9898b8';
    const textColor    = isLight ? '#2a2a40' : '#d0d0d5';

    for (let i = 0; i < 81; i += 1) {
      const r = Math.floor(i / CELLS);
      const c = i % CELLS;
      ctx.fillStyle = regionColors[REGIONS[i]];
      ctx.fillRect(c * cell, r * cell, cell, cell);
    }

    ctx.strokeStyle = cellLine;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let i = 1; i < CELLS; i += 1) {
      ctx.moveTo(i * cell, 0);        ctx.lineTo(i * cell, CELLS * cell);
      ctx.moveTo(0,         i * cell); ctx.lineTo(CELLS * cell, i * cell);
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
      if (!givenDigits[i]) continue;
      const r = Math.floor(i / CELLS);
      const c = i % CELLS;
      ctx.fillText(String(givenDigits[i]), (c + 0.5) * cell, (r + 0.5) * cell);
    }
  }, [theme, givenDigits]));

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      width={PREVIEW_CANVAS_SIZE}
      height={PREVIEW_CANVAS_SIZE}
    />
  );
}
