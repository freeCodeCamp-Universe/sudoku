import { useEffect, useRef } from 'react';
import { useTheme } from '@/app/ThemeProvider';
import styles from './Preview.module.css';

export function SkyscraperPreview() {
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

    const isLight = theme === 'light';
    const offset = 18;
    const cell = (canvas.width - offset * 2) / 6;
    const gridColor = isLight ? '#c8c8d8' : '#444';
    const clueColor = isLight ? '#3060c0' : '#99c9ff';
    const fillColor = isLight ? '#c8d4f0' : '#2a3050';

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.7;

    for (let row = 0; row < 6; row += 1) {
      for (let col = 0; col < 6; col += 1) {
        ctx.strokeRect(offset + col * cell, offset + row * cell, cell, cell);
      }
    }

    ctx.fillStyle = clueColor;
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    [2, 3, 1, 4, 2, 3].forEach((value, index) => ctx.fillText(String(value), offset + index * cell + cell / 2, offset / 2));
    [3, 2, 4, 1, 3, 2].forEach((value, index) => ctx.fillText(String(value), offset + index * cell + cell / 2, offset + 6 * cell + offset / 2));
    [2, 4, 1, 3, 2, 3].forEach((value, index) => ctx.fillText(String(value), offset / 2, offset + index * cell + cell / 2));
    [3, 1, 4, 2, 3, 2].forEach((value, index) => ctx.fillText(String(value), offset + 6 * cell + offset / 2, offset + index * cell + cell / 2));
    ctx.fillStyle = fillColor;
    [[0, 0], [1, 3], [2, 5], [3, 2], [4, 1], [5, 4]].forEach(([row, col]) => {
      ctx.fillRect(offset + col * cell + 1, offset + row * cell + 1, cell - 2, cell - 2);
    });
  }, [theme]);

  return <canvas ref={canvasRef} className={styles.canvas} width={117} height={117} />;
}
