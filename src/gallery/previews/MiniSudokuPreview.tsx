import styles from './Preview.module.css';

const NUMBERS = [
  [1, '', 3, ''],
  [3, '', 1, 2],
  ['', 2, '', 3],
  [2, 3, '', 1],
];

function getDividerClassName(row: number, col: number): string {
  const thickCol = col === 1;
  const thickRow = row === 1;

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

export function MiniSudokuPreview() {
  return (
    <div className={`${styles.sg} ${styles.g4}`}>
      {NUMBERS.flatMap((row, rowIndex) =>
        row.map((value, colIndex) => {
          const className = [getDividerClassName(rowIndex, colIndex), value !== '' ? styles['cell-filled'] : '']
            .filter(Boolean)
            .join(' ');

          return <span key={`${rowIndex}-${colIndex}`} className={className}>{value}</span>;
        })
      )}
    </div>
  );
}
