import styles from './Preview.module.css';

const DIAGONAL_CELLS = new Set<number>();
const GIVENS = new Set([2, 6, 12, 19, 21, 40, 59, 61, 68, 74, 78]);
const GIVEN_DIGITS = [3, 7, 5, 4, 2, 9, 8, 6, 1];

for (let index = 0; index < 9; index += 1) {
  DIAGONAL_CELLS.add(index * 9 + index);
  DIAGONAL_CELLS.add(index * 9 + (8 - index));
}

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

export function SudokuXPreview() {
  return (
    <div className={`${styles.sg} ${styles.g9}`}>
      {Array.from({ length: 81 }, (_, index) => {
        const className = [getDividerClassName(Math.floor(index / 9), index % 9), DIAGONAL_CELLS.has(index) ? styles['cell-shaded'] : '']
          .filter(Boolean)
          .join(' ');

        return <span key={index} className={className}>{GIVENS.has(index) ? GIVEN_DIGITS[index % 9] || '' : ''}</span>;
      })}
    </div>
  );
}
