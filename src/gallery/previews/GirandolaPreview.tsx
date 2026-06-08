import styles from './Preview.module.css';

const GIRANDOLA_DIGITS = new Map<string, number>([
  ['0,0', 3], ['0,8', 7],
  ['1,4', 5],
  ['4,1', 9], ['4,4', 1], ['4,7', 6],
  ['7,4', 8],
  ['8,0', 4], ['8,8', 2],
]);

function getDividerClassName(row: number, col: number): string {
  const thickCol = col === 2 || col === 5;
  const thickRow = row === 2 || row === 5;

  if (thickCol && thickRow) return styles.rtr;
  if (thickCol) return styles.rt;
  if (thickRow) return styles.rb;
  return '';
}

export function GirandolaPreview() {
  return (
    <div className={`${styles.sg} ${styles.g9}`}>
      {Array.from({ length: 81 }, (_, index) => {
        const row = Math.floor(index / 9);
        const col = index % 9;
        const value = GIRANDOLA_DIGITS.get(`${row},${col}`);
        const className = [
          getDividerClassName(row, col),
          value !== undefined ? styles['cell-girandola'] : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <span key={index} className={className}>
            {value ?? ''}
          </span>
        );
      })}
    </div>
  );
}
