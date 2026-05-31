import { useEffect, useRef } from 'react';
import { useTheme } from '@/app/ThemeProvider';
import styles from './Preview.module.css';

export function ArrowPreview() {
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

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const n = 5;
    const cell = canvas.width / (n + 1);
    const offset = cell / 2;
    const isLight = theme === 'light';
    const gridColor = isLight ? '#c8c8d8' : '#333';
    const arrowColor = isLight ? '#5050b0' : '#8888dd';
    const circleFill = isLight ? '#f0f0fc' : '#1a1d27';
    const numberColor = isLight ? '#1a1a2e' : '#ddd';
    const digitColor = isLight ? '#4a4a5a' : '#888';

    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.7;

    for (let row = 0; row < n; row += 1) {
      for (let col = 0; col < n; col += 1) {
        ctx.strokeRect(offset + col * cell, offset + row * cell, cell, cell);
      }
    }

    const centerX = offset + cell + cell / 2;
    const centerY = offset + cell + cell / 2;

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
    ctx.lineTo(offset + 3 * cell + cell / 2, centerY);
    ctx.stroke();

    const arrowX = offset + 3 * cell + cell / 2;
    const arrowY = centerY;

    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(arrowX - 6, arrowY - 4);
    ctx.lineTo(arrowX - 6, arrowY + 4);
    ctx.closePath();
    ctx.fillStyle = arrowColor;
    ctx.fill();
    ctx.fillStyle = numberColor;
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('9', centerX, centerY);
    ctx.fillStyle = digitColor;
    ctx.font = '9px sans-serif';
    [[1, 2, 4], [1, 3, 5]].forEach(([row, col, value]) => {
      ctx.fillText(String(value), offset + col * cell + cell / 2, offset + row * cell + cell / 2);
    });
  }, [theme]);

  return <canvas ref={canvasRef} className={styles.canvas} width={117} height={117} />;
}
