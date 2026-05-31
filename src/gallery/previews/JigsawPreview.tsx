import { useMemo } from 'react';
import styles from './Preview.module.css';
import { hashVariantId, seeded } from './seeded';

const REGIONS = [
  0, 0, 0, 1, 1, 2, 2, 2, 2,
  0, 0, 1, 1, 2, 2, 3, 3, 2,
  0, 0, 1, 4, 4, 3, 3, 3, 3,
  0, 4, 4, 4, 5, 5, 3, 6, 6,
  4, 4, 7, 5, 5, 5, 6, 6, 6,
  7, 7, 7, 5, 8, 5, 6, 6, 6,
  7, 7, 8, 8, 8, 5, 5, 6, 6,
  7, 8, 8, 8, 8, 8, 5, 6, 6,
  7, 7, 8, 8, 8, 8, 8, 8, 6,
];

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

export function JigsawPreview({ variantId }: { variantId: string }) {
  const givenDigits = useMemo(() => {
    const random = seeded(hashVariantId(variantId));

    return Array.from({ length: 81 }, () => (random() < 0.18 ? Math.ceil(random() * 9) : ''));
  }, [variantId]);

  return (
    <div className={`${styles.sg} ${styles.g9}`}>
      {Array.from({ length: 81 }, (_, index) => {
        const className = [
          getDividerClassName(Math.floor(index / 9), index % 9),
          styles[`jigsaw-region-${REGIONS[index]}`],
          givenDigits[index] ? styles.jigsawDigit : '',
        ]
          .filter(Boolean)
          .join(' ');

        return <span key={index} className={className}>{givenDigits[index]}</span>;
      })}
    </div>
  );
}
