import { useState } from 'react';
import styles from './Toolbar.module.css';

interface ToolbarProps {
  candidateMode: boolean;
  checkEnabled: boolean;
  timerEnabled: boolean;
  hasProgress?: boolean;
  onUndo: () => void;
  onErase: () => void;
  onToggleCandidateMode: () => void;
  onToggleCheck: () => void;
  onToggleTimer: () => void;
  onReveal: () => void;
  onNewGame: () => void;
}

export function Toolbar({
  candidateMode,
  checkEnabled,
  timerEnabled,
  hasProgress = false,
  onUndo,
  onErase,
  onToggleCandidateMode,
  onToggleCheck,
  onToggleTimer,
  onReveal,
  onNewGame,
}: ToolbarProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleNewGame() {
    if (hasProgress) {
      setConfirmOpen(true);
      return;
    }

    onNewGame();
  }

  function handleConfirmNewGame() {
    setConfirmOpen(false);
    onNewGame();
  }

  return (
    <>
      <div className={styles.modeSwitcher}>
        <button
          type="button"
          className={`${styles.modeBtn}${!candidateMode ? ` ${styles.active}` : ''}`}
          onClick={() => {
            if (candidateMode) {
              onToggleCandidateMode();
            }
          }}
        >
          Normal
        </button>
        <button
          type="button"
          className={`${styles.modeBtn}${candidateMode ? ` ${styles.active}` : ''}`}
          data-active={candidateMode || undefined}
          onClick={() => {
            if (!candidateMode) {
              onToggleCandidateMode();
            }
          }}
        >
          Candidate
        </button>
      </div>

      <div className={styles.checkToggle}>
        <span>Check answers</span>
        <button
          type="button"
          className={`${styles.toggleBtn} ${checkEnabled ? styles.on : styles.off}`}
          onClick={onToggleCheck}
        >
          {checkEnabled ? 'On' : 'Off'}
        </button>
        <span className={styles.timerLabel}>Timer</span>
        <button
          type="button"
          className={`${styles.toggleBtn} ${timerEnabled ? styles.on : styles.off}`}
          onClick={onToggleTimer}
        >
          {timerEnabled ? 'On' : 'Off'}
        </button>
      </div>

      <div className={styles.buttonRow}>
        <button type="button" className={styles.toolBtn} onClick={onUndo} aria-label="Undo">
          Undo
        </button>
        <button type="button" className={styles.toolBtn} onClick={onErase} aria-label="Erase">
          Erase
        </button>
        <button type="button" className={styles.revealBtn} onClick={onReveal}>
          Reveal Cell
        </button>
      </div>

      <button type="button" className={styles.newBtn} onClick={handleNewGame}>
        New Game
      </button>

      {confirmOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Start a new game?"
          className={styles.confirmOverlay}
        >
          <div className={styles.modal}>
            <div className={styles.modalTitle}>Start a new game?</div>
            <div className={styles.modalSub}>Your current progress will be lost.</div>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={`${styles.modalBtn} ${styles.primary}`}
                onClick={handleConfirmNewGame}
              >
                Start New Game
              </button>
              <button
                type="button"
                className={`${styles.modalBtn} ${styles.secondary}`}
                onClick={() => setConfirmOpen(false)}
              >
                Keep Playing
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
