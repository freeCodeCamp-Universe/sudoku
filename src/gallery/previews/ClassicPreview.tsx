import styles from './Preview.module.css';

const GIVENS = new Set([1, 3, 7, 11, 15, 20, 22, 25, 29, 33, 38, 43, 47, 51, 56, 59, 61, 65, 69, 74, 78]);
const DIGITS = [5, 3, 0, 6, 0, 0, 0, 9, 8, 0, 7, 0, 1, 9, 5, 0, 0, 0, 0, 0, 0, 9, 8, 0, 6, 0, 0, 8, 0, 0, 0, 6, 0, 0, 0, 3, 4, 0, 0, 8, 0, 3, 0, 0, 1, 7, 0, 0, 0, 2, 0, 0, 0, 6, 0, 6, 0, 0, 0, 0, 2, 8, 0, 0, 0, 0, 4, 1, 9, 0, 0, 5, 0, 0, 0, 0, 8, 0, 0, 7, 9];

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

export function ClassicPreview() {
  return (
    <div className={`${styles.sg} ${styles.g9}`}>
      {Array.from({ length: 81 }, (_, index) => {
        const className = [
          getDividerClassName(Math.floor(index / 9), index % 9),
          GIVENS.has(index) && DIGITS[index] ? styles.jigsawDigit : '',
        ]
          .filter(Boolean)
          .join(' ');

        return <span key={index} className={className}>{DIGITS[index] || ''}</span>;
      })}
    </div>
  );
}
