import { useEffect, useRef } from 'react';
import { useTheme } from '@/app/ThemeProvider';
import styles from './Preview.module.css';

export function ConsecutivePreview() {
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
    const n = 5;
    const cell = canvas.width / (n + 1);
    const offset = cell / 2;
    const gridColor = isLight ? '#333' : '#333';
    const markerColor = isLight ? '#c9b23a' : '#c9b23a';
    const digitColor = isLight ? '#ccc' : '#ccc';

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.7;

    for (let row = 0; row < n; row += 1) {
      for (let col = 0; col < n; col += 1) {
        ctx.strokeRect(offset + col * cell, offset + row * cell, cell, cell);
      }
    }

    ctx.fillStyle = markerColor;
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const markers: Array<[number, number, 'h' | 'v']> = [
      [0, 0, 'h'],
      [1, 2, 'v'],
      [2, 1, 'h'],
      [3, 3, 'v'],
      [1, 0, 'v'],
    ];

    markers.forEach(([row, col, direction]) => {
      if (direction === 'h') {
        ctx.fillText('▪', offset + col * cell + cell, offset + row * cell + cell / 2);
      } else {
        ctx.fillText('▪', offset + col * cell + cell / 2, offset + row * cell + cell);
      }
    });
    ctx.fillStyle = digitColor;
    ctx.font = 'bold 10px sans-serif';
    const digits: Array<[number, number, number]> = [
      [0, 0, 3],
      [0, 2, 4],
      [1, 1, 5],
      [2, 3, 2],
      [3, 0, 6],
      [4, 4, 1],
    ];

    digits.forEach(([row, col, value]) => {
      ctx.fillText(String(value), offset + col * cell + cell / 2, offset + row * cell + cell / 2);
    });
  }, [theme]);

  return <canvas ref={canvasRef} className={styles.canvas} width={117} height={117} />;
}
