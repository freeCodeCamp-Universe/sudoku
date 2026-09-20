import { useId } from 'react';
import styles from './Toggle.module.css';

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: () => void;
  id?: string;
  description?: string;
}

export function Toggle({ label, checked, onChange, id, description }: ToggleProps) {
  const generatedId = useId();
  const labelId = id ?? `toggle-${generatedId}`;
  const descriptionId = `${labelId}-description`;

  return (
    <div className={styles.container}>
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
            aria-describedby={description ? descriptionId : undefined}
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
      {description ? (
        <p id={descriptionId} className={styles.description}>
          {description}
        </p>
      ) : null}
    </div>
  );
}
