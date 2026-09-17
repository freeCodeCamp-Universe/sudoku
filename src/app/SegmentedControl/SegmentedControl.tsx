import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
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
 * exposed as a WAI-ARIA radiogroup using the "selection does not follow
 * focus" variant: Arrow/Home/End keys move a roving tabindex without
 * selecting, and Space/Enter (native button activation) or a click commits.
 * Selecting immediately on every arrow press (the other APG variant, and
 * native `<input type="radio">` behavior) would trigger this control's
 * side effect -- starting a new puzzle -- before the user has settled on an
 * option, which is a real problem for keyboard users only (a click is
 * already a deliberate commit).
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: SegmentedControlProps<T>) {
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = options.findIndex((option) => option.value === value);
  // Falls back to the first option when value matches nothing, so the group
  // is never entirely unreachable by Tab.
  const [focusedIndex, setFocusedIndex] = useState(Math.max(selectedIndex, 0));

  // Keeps the roving tabindex on the current selection when value changes
  // from outside this component (e.g. a resumed puzzle's saved mode).
  useEffect(() => {
    if (selectedIndex >= 0) setFocusedIndex(selectedIndex);
  }, [selectedIndex]);

  function moveFocus(index: number) {
    const wrapped = (index + options.length) % options.length;
    setFocusedIndex(wrapped);
    btnRefs.current[wrapped]?.focus();
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        moveFocus(index + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        moveFocus(index - 1);
        break;
      case 'Home':
        e.preventDefault();
        moveFocus(0);
        break;
      case 'End':
        e.preventDefault();
        moveFocus(options.length - 1);
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
            tabIndex={index === focusedIndex ? 0 : -1}
            className={styles.option}
            onKeyDown={(e) => onKeyDown(e, index)}
            onClick={() => {
              setFocusedIndex(index);
              if (option.value !== value) onChange(option.value);
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
