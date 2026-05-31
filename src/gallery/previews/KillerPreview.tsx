import styles from './Preview.module.css';

const CAGE_1 = new Set([0, 1, 9, 10]);
const CAGE_2 = new Set([2, 3, 4]);
const CAGE_3 = new Set([11, 12, 20, 21]);
const CAGE_4 = new Set([18, 19, 27]);

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

function getCageClassName(index: number): string {
  if (CAGE_1.has(index)) {
    return styles['cell-cage1'];
  }

  if (CAGE_2.has(index)) {
    return styles['cell-cage2'];
  }

  if (CAGE_3.has(index)) {
    return styles['cell-cage3'];
  }

  if (CAGE_4.has(index)) {
    return styles['cell-cage4'];
  }

  return '';
}

function getClue(index: number): string {
  switch (index) {
    case 0:
      return '15';
    case 2:
      return '12';
    case 11:
      return '8';
    case 18:
      return '11';
    default:
      return '';
  }
}

export function KillerPreview() {
  return (
    <div className={`${styles.sg} ${styles.g9}`}>
      {Array.from({ length: 81 }, (_, index) => {
        const clue = getClue(index);
        const className = [getDividerClassName(Math.floor(index / 9), index % 9), getCageClassName(index), clue ? styles.cageClue : '']
          .filter(Boolean)
          .join(' ');

        return <span key={index} className={className}>{clue}</span>;
      })}
    </div>
  );
}
