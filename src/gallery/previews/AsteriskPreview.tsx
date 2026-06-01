import styles from './Preview.module.css';

const ASTERISK_NUMBERS = new Map<string, number>([
  ['1,4', 7],
  ['2,2', 3],
  ['2,6', 9],
  ['4,1', 5],
  ['4,4', 1],
  ['4,7', 6],
  ['6,2', 8],
  ['6,6', 4],
  ['7,4', 2],
]);

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

export function AsteriskPreview() {
  return (
    <div className={`${styles.sg} ${styles.g9}`}>
      {Array.from({ length: 81 }, (_, index) => {
        const row = Math.floor(index / 9);
        const col = index % 9;
        const value = ASTERISK_NUMBERS.get(`${row},${col}`);
        const className = [getDividerClassName(row, col), value !== undefined ? styles['cell-asterisk'] : '', value !== undefined ? styles.asteriskDigit : '']
          .filter(Boolean)
          .join(' ');

        return <span key={index} className={className}>{value ?? ''}</span>;
      })}
    </div>
  );
}
