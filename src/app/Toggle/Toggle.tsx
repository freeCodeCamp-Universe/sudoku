import { useId } from 'react';
import styles from './Toggle.module.css';

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: () => void;
  id?: string;
}

export function Toggle({ label, checked, onChange, id }: ToggleProps) {
  const generatedId = useId();
  const labelId = id ?? `toggle-${generatedId}`;

  return (
    <div className={styles.row}>
      <span id={labelId} className={styles.label}>
        {label}
      </span>
      <span className={styles.toggleControl}>
        <input
          id={`${labelId}-input`}
          type="checkbox"
          role="switch"
          className={styles.toggleInput}
          checked={checked}
          aria-labelledby={labelId}
          onChange={onChange}
        />
        <span
          aria-hidden="true"
          className={`${styles.toggleBtn} ${checked ? styles.on : styles.off}`}
        >
          {checked ? 'On' : 'Off'}
        </span>
      </span>
    </div>
  );
}
