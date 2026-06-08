import styles from './Preview.module.css';

const CENTER_DOT_DIGITS = new Map<string, number>([
  ['1,1', 6], ['1,4', 2], ['1,7', 9],
  ['4,1', 3], ['4,4', 7], ['4,7', 1],
  ['7,1', 5], ['7,4', 4], ['7,7', 8],
]);

function getDividerClassName(row: number, col: number): string {
  const thickCol = col === 2 || col === 5;
  const thickRow = row === 2 || row === 5;

  if (thickCol && thickRow) return styles.rtr;
  if (thickCol) return styles.rt;
  if (thickRow) return styles.rb;
  return '';
}

export function CenterDotPreview() {
  return (
    <div className={`${styles.sg} ${styles.g9}`}>
      {Array.from({ length: 81 }, (_, index) => {
        const row = Math.floor(index / 9);
        const col = index % 9;
        const value = CENTER_DOT_DIGITS.get(`${row},${col}`);
        const className = [
          getDividerClassName(row, col),
          value !== undefined ? styles['cell-center-dot'] : '',
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
