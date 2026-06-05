import styles from './Preview.module.css';

const CELL = 13;
const SIZE = 9;
const TOTAL = CELL * SIZE;

const D1_OFFSETS = new Set([-4, -1, 1, 4]); // col - row
const D2_SUMS    = new Set([4, 7, 9, 12]);   // row + col

function getDividerClassName(row: number, col: number): string {
  const thickCol = col === 2 || col === 5;
  const thickRow = row === 2 || row === 5;
  if (thickCol && thickRow) return styles.rtr;
  if (thickCol) return styles.rt;
  if (thickRow) return styles.rb;
  return '';
}

export function ArgylePreview() {
  const lines: React.ReactNode[] = [];

  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const x = col * CELL;
      const y = row * CELL;
      const onD1 = D1_OFFSETS.has(col - row);
      const onD2 = D2_SUMS.has(row + col);

      if (onD1) {
        lines.push(
          <line key={`d1-${row}-${col}`} x1={x} y1={y} x2={x + CELL} y2={y + CELL} />
        );
      }
      if (onD2) {
        lines.push(
          <line key={`d2-${row}-${col}`} x1={x + CELL} y1={y} x2={x} y2={y + CELL} />
        );
      }
    }
  }

  return (
    <div className={styles.argyleWrapper}>
      <div className={`${styles.sg} ${styles.g9}`}>
        {Array.from({ length: 81 }, (_, index) => {
          const row = Math.floor(index / 9);
          const col = index % 9;
          return <span key={index} className={getDividerClassName(row, col)} />;
        })}
      </div>
      <svg
        className={styles.argyleSvg}
        viewBox={`0 0 ${TOTAL} ${TOTAL}`}
        aria-hidden="true"
      >
        {lines}
      </svg>
    </div>
  );
}
