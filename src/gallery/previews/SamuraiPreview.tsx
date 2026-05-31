import { useEffect, useRef } from 'react';
import { useTheme } from '@/app/ThemeProvider';
import styles from './Preview.module.css';

export function SamuraiPreview() {
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

    const { width, height } = canvas;
    const isLight = theme === 'light';

    ctx.clearRect(0, 0, width, height);

    const size = 44;
    const gridFill = isLight ? '#f5f5f0' : '#1b1b32';
    const borderColor = isLight ? '#3060c0' : '#99c9ff';
    const innerColor = isLight ? '#c8c8d8' : '#333';
    const centers: Array<[number, number]> = [
      [size / 2, size / 2],
      [width - size / 2, size / 2],
      [width / 2, height / 2],
      [size / 2, height - size / 2],
      [width - size / 2, height - size / 2],
    ];

    centers.forEach(([centerX, centerY]) => {
      const x = centerX - size / 2;
      const y = centerY - size / 2;

      ctx.fillStyle = gridFill;
      ctx.fillRect(x, y, size, size);
      ctx.strokeStyle = innerColor;
      ctx.lineWidth = 0.5;

      for (let index = 1; index < 3; index += 1) {
        ctx.beginPath();
        ctx.moveTo(x + (index * size) / 3, y);
        ctx.lineTo(x + (index * size) / 3, y + size);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y + (index * size) / 3);
        ctx.lineTo(x + size, y + (index * size) / 3);
        ctx.stroke();
      }

      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, size, size);
    });
  }, [theme]);

  return <canvas ref={canvasRef} className={styles.canvas} width={117} height={117} />;
}
