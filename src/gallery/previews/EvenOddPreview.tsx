import { useMemo } from 'react';
import styles from './Preview.module.css';
import { hashVariantId, seeded } from './seeded';

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

export function EvenOddPreview({ variantId }: { variantId: string }) {
  const digits = useMemo(() => {
    const random = seeded(hashVariantId(variantId));

    return Array.from({ length: 81 }, (_, index) => {
      if (random() >= 0.15) {
        return '';
      }

      const row = Math.floor(index / 9);
      const col = index % 9;
      const pool = (row + col) % 2 === 0 ? [2, 4, 6, 8] : [1, 3, 5, 7, 9];

      return pool[Math.floor(random() * 4)] ?? '';
    });
  }, [variantId]);

  return (
    <div className={`${styles.sg} ${styles.g9}`}>
      {Array.from({ length: 81 }, (_, index) => {
        const row = Math.floor(index / 9);
        const col = index % 9;
        const isEven = (row + col) % 2 === 0;
        const className = [getDividerClassName(row, col), isEven ? styles['cell-even'] : styles['cell-odd']]
          .filter(Boolean)
          .join(' ');

        return <span key={index} className={className}>{digits[index]}</span>;
      })}
    </div>
  );
}
