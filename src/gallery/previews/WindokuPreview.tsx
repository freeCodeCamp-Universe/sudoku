import styles from './Preview.module.css';

const WINDOW_CELLS = new Set<number>();

for (const [windowRow, windowCol] of [[1, 1], [1, 5], [5, 1], [5, 5]]) {
  for (let rowOffset = 0; rowOffset < 3; rowOffset += 1) {
    for (let colOffset = 0; colOffset < 3; colOffset += 1) {
      WINDOW_CELLS.add((windowRow + rowOffset) * 9 + (windowCol + colOffset));
    }
  }
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

export function WindokuPreview() {
  return (
    <div className={`${styles.sg} ${styles.g9}`}>
      {Array.from({ length: 81 }, (_, index) => {
        const className = [getDividerClassName(Math.floor(index / 9), index % 9), WINDOW_CELLS.has(index) ? styles['cell-window'] : '']
          .filter(Boolean)
          .join(' ');

        return <span key={index} className={className} />;
      })}
    </div>
  );
}
