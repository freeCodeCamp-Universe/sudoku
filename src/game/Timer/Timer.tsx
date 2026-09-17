import { useId } from 'react';
import { PauseIcon } from './PauseIcon';
import { PlayIcon } from './PlayIcon';
import styles from './Timer.module.css';

interface TimerProps {
  elapsedSeconds: number;
  running: boolean;
  visible: boolean;
  done?: boolean;
  /*
   * Landscape-mobile pages pass this to shrink the block-end margin: the
   * >= 600px margin keys off viewport width, so it matches landscape phones
   * where vertical space is the scarce dimension.
   */
  compact?: boolean;
  paused?: boolean;
  // Renders the pause/resume button when provided; callers omit it while
  // there is nothing to pause (timer disabled, not started, or solved).
  onTogglePause?: () => void;
}

export function Timer({
  elapsedSeconds,
  running,
  visible,
  done = false,
  compact = false,
  paused = false,
  onTogglePause,
}: TimerProps) {
  const timerDescriptionId = useId();
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const display = `${minutes}:${String(seconds).padStart(2, '0')}`;
  const pauseLabel = paused ? 'Resume game' : 'Pause game';

  return (
    <div
      className={[
        styles.timer,
        running ? styles.running : '',
        done ? styles.done : '',
        compact ? styles.compact : '',
        !visible ? styles.hidden : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-hidden={!visible || undefined}
      aria-hidden={!visible}
    >
      {onTogglePause ? (
        <button
          type="button"
          className={styles.timerButton}
          aria-label={pauseLabel}
          aria-describedby={timerDescriptionId}
          onClick={onTogglePause}
        >
          <span aria-hidden="true">{display}</span>
          {paused ? (
            <PlayIcon className={styles.timerButtonIcon} />
          ) : (
            <PauseIcon className={styles.timerButtonIcon} />
          )}
        </button>
      ) : (
        display
      )}
      {onTogglePause ? (
        <span id={timerDescriptionId} className={styles.srOnly} role="timer" aria-live="off">
          Elapsed time {display}
        </span>
      ) : null}
    </div>
  );
}
