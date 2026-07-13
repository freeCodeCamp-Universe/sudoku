import type { Direction } from '@/game/gameTypes';
import styles from './DPad.module.css';

interface DPadProps {
  onMove: (direction: Direction) => void;
}

const BUTTONS: { direction: Direction; label: string; glyph: string; className: string }[] = [
  { direction: 'up', label: 'Move up', glyph: '↑', className: styles.up },
  { direction: 'left', label: 'Move left', glyph: '←', className: styles.left },
  { direction: 'right', label: 'Move right', glyph: '→', className: styles.right },
  { direction: 'down', label: 'Move down', glyph: '↓', className: styles.down },
];

export function DPad({ onMove }: DPadProps) {
  return (
    <div className={styles.dpad} role="group" aria-label="Move selected cell">
      {BUTTONS.map(({ direction, label, glyph, className }) => (
        <button
          key={direction}
          type="button"
          className={`${styles.key} ${className}`}
          aria-label={label}
          onClick={() => onMove(direction)}
        >
          <span aria-hidden="true">{glyph}</span>
        </button>
      ))}
    </div>
  );
}
