import { useMemo } from 'react';
import styles from './Preview.module.css';
import { hashVariantId, seeded } from './seeded';

const COLOR_CLASSES = [
  'cell-color-r',
  'cell-color-g',
  'cell-color-b',
  'cell-color-y',
  'cell-color-t',
  'cell-color-p',
  'cell-color-o',
  'cell-color-m',
  'cell-color-s',
] as const;

function getDividerClassName(row: number, col: number): string {
  const thickCol = col === 2 || col === 5;
  const thickRow = row === 2 || row === 5;

  if (thickCol && thickRow) {
    return styles.rtr;
  }

  if (thickCol) {
    return styles.rt;
  }

  if (thickRow) {
    return styles.rb;
  }

  return '';
}

export function ColorPreview({ variantId }: { variantId: string }) {
  const filledCells = useMemo(() => {
    const random = seeded(hashVariantId(variantId));

    return Array.from({ length: 81 }, (_, index) => {
      const row = Math.floor(index / 9);
      const col = index % 9;

      return random() < 0.45 ? COLOR_CLASSES[(row + col * 3 + Math.floor(row / 3)) % 9] : '';
    });
  }, [variantId]);

  return (
    <div className={`${styles.sg} ${styles.g9}`}>
      {Array.from({ length: 81 }, (_, index) => {
        const className = [getDividerClassName(Math.floor(index / 9), index % 9), filledCells[index] ? styles[filledCells[index]] : '']
          .filter(Boolean)
          .join(' ');

        return <span key={index} className={className} />;
      })}
    </div>
  );
}
