import styles from './ModeSwitcher.module.css';

interface ModeSwitcherProps {
  candidateMode: boolean;
  onToggle: () => void;
}

export function ModeSwitcher({ candidateMode, onToggle }: ModeSwitcherProps) {
  return (
    <div role="group" aria-label="Input mode" className={styles.modeSwitcher}>
      <button
        type="button"
        className={styles.modeBtn}
        aria-pressed={!candidateMode}
        onClick={() => {
          if (candidateMode) {
            onToggle();
          }
        }}
      >
        Normal
      </button>
      <button
        type="button"
        className={styles.modeBtn}
        aria-pressed={candidateMode}
        onClick={() => {
          if (!candidateMode) {
            onToggle();
          }
        }}
      >
        Candidate
      </button>
    </div>
  );
}
