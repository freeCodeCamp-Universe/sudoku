import { useId } from 'react';
import styles from '@/learn/base/Switch/Switch.module.css';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  labelPosition?: 'start' | 'end';
  className?: string;
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  labelPosition = 'end',
  className,
}: SwitchProps) {
  const descriptionId = useId();
  const classNames = [styles.switch, className].filter(Boolean).join(' ');
  const labelText = <span className={styles.label}>{label}</span>;

  return (
    <div className={styles.row}>
      <label className={classNames}>
        {labelPosition === 'start' ? labelText : null}
        <input
          className={styles.input}
          type="checkbox"
          role="switch"
          checked={checked}
          onChange={(event) => onChange(event.currentTarget.checked)}
          aria-describedby={description ? descriptionId : undefined}
        />
        <span className={styles.track} aria-hidden="true">
          <span className={styles.thumb} />
        </span>
        {labelPosition === 'end' ? labelText : null}
      </label>
      {description && (
        <p id={descriptionId} className={styles.description}>
          {description}
        </p>
      )}
    </div>
  );
}
