import { useRef, type KeyboardEvent } from 'react';
import styles from './Tabs.module.css';

export interface Tab {
  id: string;
  label: string;
  panelId: string;
}

interface TabsProps {
  tabs: Tab[];
  activeId: string;
  onSelect: (id: string) => void;
  ariaLabel: string;
  className?: string;
  /*
   * Landscape-mobile layouts pass this to keep the base (320px-column) tab
   * font size: the >= 600px size bump keys off viewport width, so it matches
   * landscape phones whose control column is far narrower than the viewport.
   */
  compact?: boolean;
}

/**
 * A WAI-ARIA tablist with automatic activation: arrow/Home/End keys move focus
 * between tabs (roving tabindex) and select the newly focused tab in the same
 * step, so navigating the tablist never costs an extra Enter/Space keypress. A
 * click also selects.
 */
export function Tabs({
  tabs,
  activeId,
  onSelect,
  ariaLabel,
  className,
  compact = false,
}: TabsProps) {
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function focusTab(index: number) {
    const wrapped = (index + tabs.length) % tabs.length;
    onSelect(tabs[wrapped].id);
    btnRefs.current[wrapped]?.focus();
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        focusTab(index + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        focusTab(index - 1);
        break;
      case 'Home':
        e.preventDefault();
        focusTab(0);
        break;
      case 'End':
        e.preventDefault();
        focusTab(tabs.length - 1);
        break;
    }
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={[styles.tablist, compact ? styles.tablistCompact : null, className]
        .filter(Boolean)
        .join(' ')}
    >
      {tabs.map((tab, index) => {
        const selected = tab.id === activeId;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              btnRefs.current[index] = el;
            }}
            type="button"
            role="tab"
            id={`${tab.id}-tab`}
            aria-selected={selected}
            aria-controls={tab.panelId}
            tabIndex={selected ? 0 : -1}
            className={styles.tab}
            onKeyDown={(e) => onKeyDown(e, index)}
            onClick={() => onSelect(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
