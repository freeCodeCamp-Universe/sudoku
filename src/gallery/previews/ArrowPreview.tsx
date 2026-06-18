import { useCallback } from 'react';
import { useTheme } from '@/app/ThemeProvider';
import styles from './Preview.module.css';
import { PREVIEW_CANVAS_SIZE, usePreviewCanvas } from './usePreviewCanvas';

export function ArrowPreview() {
  const { theme } = useTheme();
  const canvasRef = usePreviewCanvas(
    useCallback(
      (ctx, { width }) => {
        const n = 5;
        const cell = width / n;
        const isLight = theme === 'light';
        const gridColor = isLight ? '#c8c8d8' : '#2a2a3a';
        const borderColor = isLight ? '#5060a0' : '#9898b8';
        const arrowColor = isLight ? '#5050b0' : '#8888dd';
        const circleFill = isLight ? '#f0f0fc' : '#1a1d27';
        const textColor = isLight ? '#2a2a40' : '#d0d0d5';

        if (isLight) {
          ctx.fillStyle = '#f5f5f0';
          ctx.fillRect(0, 0, width, width);
        }

        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        for (let i = 1; i < n; i += 1) {
          ctx.moveTo(i * cell, 0);
          ctx.lineTo(i * cell, n * cell);
          ctx.moveTo(0, i * cell);
          ctx.lineTo(n * cell, i * cell);
        }
        ctx.stroke();

        const lw = 1.5;
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = lw;
        ctx.strokeRect(lw / 2, lw / 2, n * cell - lw, n * cell - lw);

        const centerX = cell + cell / 2;
        const centerY = cell + cell / 2;

        ctx.beginPath();
        ctx.arc(centerX, centerY, cell * 0.35, 0, Math.PI * 2);
        ctx.strokeStyle = arrowColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = circleFill;
        ctx.fill();
        ctx.strokeStyle = arrowColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(3 * cell + cell / 2, centerY);
        ctx.stroke();

        const arrowX = 3 * cell + cell / 2;
        const arrowY = centerY;

        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(arrowX - 6, arrowY - 4);
        ctx.lineTo(arrowX - 6, arrowY + 4);
        ctx.closePath();
        ctx.fillStyle = arrowColor;
        ctx.fill();
        ctx.fillStyle = textColor;
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('9', centerX, centerY);
        ctx.font = '9px sans-serif';
        [
          [1, 2, 4],
          [1, 3, 5],
        ].forEach(([row, col, value]) => {
          ctx.fillText(String(value), col * cell + cell / 2, row * cell + cell / 2);
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
