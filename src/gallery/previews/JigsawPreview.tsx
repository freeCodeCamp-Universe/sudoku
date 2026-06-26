import { useCallback, useMemo } from 'react';
import { useTheme } from '@/app/ThemeProvider';
import { PRESET_LAYOUTS } from '@/variants/jigsaw';
import styles from './Preview.module.css';
import { PREVIEW_CANVAS_SIZE, usePreviewCanvas } from './usePreviewCanvas';
import { hashVariantId, seeded } from './seeded';

const CELLS = 9;
const REGIONS_2D = PRESET_LAYOUTS[0];

export function JigsawPreview({ variantId }: { variantId: string }) {
  const { theme } = useTheme();
  const givenDigits = useMemo(() => {
    const random = seeded(hashVariantId(variantId));
    return Array.from({ length: 81 }, () => (random() < 0.18 ? Math.ceil(random() * 9) : 0));
  }, [variantId]);

  const canvasRef = usePreviewCanvas(
    useCallback(
      (ctx, { width }) => {
        const cell = width / CELLS;
        const isLight = theme === 'light';
        const cellLine = isLight ? '#c8c8d8' : '#2a2a3a';
        const regionBorder = isLight ? '#8080a8' : '#3b3b4f';
        const borderColor = isLight ? '#5060a0' : '#9898b8';
        const textColor = isLight ? '#2a2a40' : '#d0d0d5';

        if (isLight) {
          ctx.fillStyle = '#f5f5f0';
          ctx.fillRect(0, 0, CELLS * cell, CELLS * cell);
        }

        ctx.strokeStyle = cellLine;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        for (let i = 1; i < CELLS; i += 1) {
          ctx.moveTo(i * cell, 0);
          ctx.lineTo(i * cell, CELLS * cell);
          ctx.moveTo(0, i * cell);
          ctx.lineTo(CELLS * cell, i * cell);
        }
        ctx.stroke();

        ctx.strokeStyle = regionBorder;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let r = 0; r < CELLS; r += 1) {
          for (let c = 0; c < CELLS; c += 1) {
            if (c < CELLS - 1 && REGIONS_2D[r][c] !== REGIONS_2D[r][c + 1]) {
              ctx.moveTo((c + 1) * cell, r * cell);
              ctx.lineTo((c + 1) * cell, (r + 1) * cell);
            }
            if (r < CELLS - 1 && REGIONS_2D[r][c] !== REGIONS_2D[r + 1][c]) {
              ctx.moveTo(c * cell, (r + 1) * cell);
              ctx.lineTo((c + 1) * cell, (r + 1) * cell);
            }
          }
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
      },
      [theme, givenDigits]
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
