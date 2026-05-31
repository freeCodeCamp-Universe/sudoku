import styles from './Preview.module.css';

const D1 = new Set([-3, 0, 3]);
const D2 = new Set([5, 8, 11]);

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

export function ArgylePreview() {
  return (
    <div className={`${styles.sg} ${styles.g9}`}>
      {Array.from({ length: 81 }, (_, index) => {
        const row = Math.floor(index / 9);
        const col = index % 9;
        const onD1 = D1.has(row - col);
        const onD2 = D2.has(row + col);
        const argyleClassName = onD1 && onD2
          ? styles['cell-argyle-x']
          : onD1
            ? styles['cell-argyle1']
            : onD2
              ? styles['cell-argyle2']
              : '';
        const className = [getDividerClassName(row, col), argyleClassName].filter(Boolean).join(' ');

        return <span key={index} className={className} />;
      })}
    </div>
  );
}
