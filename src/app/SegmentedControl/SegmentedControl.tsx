import { useRef, type KeyboardEvent } from 'react';
import styles from './SegmentedControl.module.css';

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: readonly SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}

/**
 * A single-choice control for a handful of mutually exclusive options with no
 * associated content panel (unlike Tabs, which owns a tabpanel per tab) --
 * exposed as a WAI-ARIA radiogroup. Arrow/Home/End keys move focus and select
 * in the same step (roving tabindex), matching a native radio group.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: SegmentedControlProps<T>) {
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Re-selecting the already-active option is a no-op, matching a native
  // radio group (clicking an already-checked radio does not re-fire change).
  function selectOption(newValue: T) {
    if (newValue !== value) {
      onChange(newValue);
    }
  }

  function focusOption(index: number) {
    const wrapped = (index + options.length) % options.length;
    selectOption(options[wrapped].value);
    btnRefs.current[wrapped]?.focus();
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        focusOption(index + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        focusOption(index - 1);
        break;
      case 'Home':
        e.preventDefault();
        focusOption(0);
        break;
      case 'End':
        e.preventDefault();
        focusOption(options.length - 1);
        break;
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={[styles.group, className].filter(Boolean).join(' ')}
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            ref={(el) => {
              btnRefs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            className={styles.option}
            onKeyDown={(e) => onKeyDown(e, index)}
            onClick={() => selectOption(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
