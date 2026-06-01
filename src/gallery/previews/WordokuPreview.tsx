import styles from './Preview.module.css';

const GIVEN_ENTRIES: Array<[number, number, string]> = [
  [0, 2, 'S'],
  [0, 5, 'U'],
  [0, 8, 'D'],
  [1, 1, 'O'],
  [1, 4, 'K'],
  [2, 3, 'U'],
  [2, 7, 'S'],
  [3, 0, 'D'],
  [3, 8, 'K'],
  [4, 4, 'O'],
  [5, 0, 'U'],
  [5, 8, 'D'],
  [6, 1, 'K'],
  [6, 5, 'O'],
  [7, 4, 'S'],
  [7, 7, 'U'],
  [8, 0, 'D'],
  [8, 3, 'K'],
  [8, 6, 'S'],
];

const GIVENS = new Map(GIVEN_ENTRIES.map(([row, col, value]) => [row * 9 + col, value]));

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

export function WordokuPreview() {
  return (
    <div className={`${styles.sg} ${styles.g9}`}>
      {Array.from({ length: 81 }, (_, index) => {
        const value = GIVENS.get(index) ?? '';
        const className = [getDividerClassName(Math.floor(index / 9), index % 9), value ? styles['cell-filled'] : '']
          .filter(Boolean)
          .join(' ');

        return <span key={index} className={className}>{value}</span>;
      })}
    </div>
  );
}
