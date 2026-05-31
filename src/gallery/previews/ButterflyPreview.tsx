import { useEffect, useRef } from 'react';
import { useTheme } from '@/app/ThemeProvider';
import styles from './Preview.module.css';

export function ButterflyPreview() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    const { width } = canvas;
    const cells = 12;
    const cell = width / cells;
    const isLight = theme === 'light';
    const fillOverlap4 = isLight ? '#d8d8ec' : '#252538';
    const fillOverlap2 = isLight ? '#e8e8f8' : '#1f1f3a';
    const fillSingle = isLight ? '#f5f5f0' : '#1b1b32';
    const cellLine = isLight ? '#c8c8d8' : '#2a2a3a';
    const boxLine = isLight ? '#a0a0c0' : '#3b3b4f';
    const borderColor = isLight ? '#5060a0' : '#9898b8';

    ctx.clearRect(0, 0, width, width);

    for (let row = 0; row < cells; row += 1) {
      for (let col = 0; col < cells; col += 1) {
        const overlapCount =
          (row < 9 && col < 9 ? 1 : 0) +
          (row < 9 && col >= 3 ? 1 : 0) +
          (row >= 3 && col < 9 ? 1 : 0) +
          (row >= 3 && col >= 3 ? 1 : 0);
        ctx.fillStyle = overlapCount === 4 ? fillOverlap4 : overlapCount === 2 ? fillOverlap2 : fillSingle;
        ctx.fillRect(col * cell, row * cell, cell, cell);
      }
    }

    ctx.strokeStyle = cellLine;
    ctx.lineWidth = 0.4;

    for (let index = 0; index <= cells; index += 1) {
      ctx.beginPath();
      ctx.moveTo(index * cell, 0);
      ctx.lineTo(index * cell, width);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, index * cell);
      ctx.lineTo(width, index * cell);
      ctx.stroke();
    }

    ctx.strokeStyle = boxLine;
    ctx.lineWidth = 1.2;
    [2, 5, 8].forEach((index) => {
      ctx.beginPath();
      ctx.moveTo(0, (index + 1) * cell);
      ctx.lineTo(width, (index + 1) * cell);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo((index + 1) * cell, 0);
      ctx.lineTo((index + 1) * cell, width);
      ctx.stroke();
    });

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1.5;
    [[0, 0], [0, 3], [3, 0], [3, 3]].forEach(([startRow, startCol]) => {
      ctx.strokeRect(startCol * cell + 0.75, startRow * cell + 0.75, 9 * cell - 1.5, 9 * cell - 1.5);
    });
  }, [theme]);

  return <canvas ref={canvasRef} className={styles.canvas} width={117} height={117} />;
}
