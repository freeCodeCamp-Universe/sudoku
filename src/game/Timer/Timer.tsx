import styles from './Timer.module.css';

interface TimerProps {
  elapsedSeconds: number;
  running: boolean;
  visible: boolean;
  done?: boolean;
}

export function Timer({ elapsedSeconds, running, visible, done = false }: TimerProps) {
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const display = `${minutes}:${String(seconds).padStart(2, '0')}`;

  return (
    <div
      className={[
        styles.timer,
        running ? styles.running : '',
        done ? styles.done : '',
        !visible ? styles.hidden : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-hidden={!visible || undefined}
      aria-hidden={!visible}
    >
      {display}
    </div>
  );
}
