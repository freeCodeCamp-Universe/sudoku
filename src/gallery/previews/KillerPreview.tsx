import { useCallback } from 'react';
import { useTheme } from '@/app/ThemeProvider';
import styles from './Preview.module.css';
import { PREVIEW_CANVAS_SIZE, usePreviewCanvas } from './usePreviewCanvas';
import { previewBaseFill } from './previewColors';

const CELLS = 9;
const BOX = 3;

type Cage = {
  cells: number[];
  bgDark: string;
  bgLight: string;
  dashDark: string;
  dashLight: string;
  clueCell: number;
  clue: string;
};

const CAGES: Cage[] = [
  {
    cells: [0, 1, 9, 10],
    bgDark: '#1a1a30',
    bgLight: '#d8d8f8',
    dashDark: '#9870d0',
    dashLight: '#9870d0',
    clueCell: 0,
    clue: '15',
  },
  {
    cells: [2, 3, 4],
    bgDark: '#0d2a18',
    bgLight: '#b8e8cc',
    dashDark: '#acd157',
    dashLight: '#48a860',
    clueCell: 2,
    clue: '12',
  },
  {
    cells: [11, 12, 20, 21],
    bgDark: '#251a1a',
    bgLight: '#f8ddd8',
    dashDark: '#c07050',
    dashLight: '#c06040',
    clueCell: 11,
    clue: '8',
  },
  {
    cells: [18, 19, 27],
    bgDark: '#252018',
    bgLight: '#e8f0c0',
    dashDark: '#90b040',
    dashLight: '#70a020',
    clueCell: 18,
    clue: '11',
  },
];

const CAGE_MAP = new Map<number, number>();
for (let ci = 0; ci < CAGES.length; ci += 1) {
  for (const idx of CAGES[ci].cells) CAGE_MAP.set(idx, ci);
}

export function KillerPreview() {
  const { theme } = useTheme();
  const canvasRef = usePreviewCanvas(
    useCallback(
      (ctx, { width }) => {
        const cell = width / CELLS;
        const isLight = theme === 'light';
        const cellLine = isLight ? '#c8c8d8' : '#2a2a3a';
        const boxLine = isLight ? '#8080a8' : '#3b3b4f';
        const borderColor = isLight ? '#5060a0' : '#9898b8';

        ctx.fillStyle = previewBaseFill(isLight);
        ctx.fillRect(0, 0, width, width);

        for (const cage of CAGES) {
          ctx.fillStyle = isLight ? cage.bgLight : cage.bgDark;
          for (const idx of cage.cells) {
            const r = Math.floor(idx / CELLS);
            const c = idx % CELLS;
            ctx.fillRect(c * cell, r * cell, cell, cell);
          }
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

        ctx.setLineDash([2.5, 2]);
        ctx.lineWidth = 0.8;
        for (const cage of CAGES) {
          ctx.strokeStyle = isLight ? cage.dashLight : cage.dashDark;
          const cageSet = new Set(cage.cells);
          ctx.beginPath();
          for (const idx of cage.cells) {
            const r = Math.floor(idx / CELLS);
            const c = idx % CELLS;
            const inset = 0.5;
            const x = c * cell + inset;
            const y = r * cell + inset;
            const w = cell - inset * 2;
            const h = cell - inset * 2;
            if (!cageSet.has((r - 1) * CELLS + c)) {
              ctx.moveTo(x, y);
              ctx.lineTo(x + w, y);
            }
            if (!cageSet.has((r + 1) * CELLS + c)) {
              ctx.moveTo(x, y + h);
              ctx.lineTo(x + w, y + h);
            }
            if (!cageSet.has(r * CELLS + (c - 1))) {
              ctx.moveTo(x, y);
              ctx.lineTo(x, y + h);
            }
            if (!cageSet.has(r * CELLS + (c + 1))) {
              ctx.moveTo(x + w, y);
              ctx.lineTo(x + w, y + h);
            }
          }
          ctx.stroke();
        }
        ctx.setLineDash([]);

        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.font = `600 ${Math.round(cell * 0.38)}px sans-serif`;
        for (const cage of CAGES) {
          ctx.fillStyle = isLight ? '#2a2a40' : '#d0d0d5';
          const r = Math.floor(cage.clueCell / CELLS);
          const c = cage.clueCell % CELLS;
          ctx.fillText(cage.clue, c * cell + 1.5, r * cell + 1.5);
        }
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
