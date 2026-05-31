import { useMemo } from 'react';
import styles from './Preview.module.css';
import { hashVariantId, seeded } from './seeded';

function getDividerClassName(row: number, col: number): string {
  const thickCol = col === 3 || col === 7 || col === 11;
  const thickRow = row === 3 || row === 7 || row === 11;

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

export function SuperPreview({ variantId }: { variantId: string }) {
  const filledCells = useMemo(() => {
    const random = seeded(hashVariantId(variantId));

    return Array.from({ length: 256 }, () => random() < 0.38);
  }, [variantId]);

  return (
    <div className={`${styles.sg} ${styles.g16}`}>
      {Array.from({ length: 256 }, (_, index) => {
        const className = [getDividerClassName(Math.floor(index / 16), index % 16), filledCells[index] ? styles['cell-filled'] : '']
          .filter(Boolean)
          .join(' ');

        return <span key={index} className={className} />;
      })}
    </div>
  );
}
