import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'outline';
type ButtonAccent = 'blue' | 'yellow';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  accent?: ButtonAccent;
}

export function Button({
  variant = 'outline',
  accent = 'blue',
  type = 'button',
  className,
  ...props
}: ButtonProps) {
  const classes = [styles.btn, variant === 'primary' ? styles.primary : styles.outline];

  if (variant === 'outline' && accent === 'yellow') {
    classes.push(styles.accentYellow);
  }

  if (className) {
    classes.push(className);
  }

  return <button type={type} className={classes.join(' ')} {...props} />;
}
