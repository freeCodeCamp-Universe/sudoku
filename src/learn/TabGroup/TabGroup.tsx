import { useId, useState } from 'react';
import styles from '@/learn/TabGroup/TabGroup.module.css';

export interface Tab {
  name: string;
  language: string;
  content: string;
}

export interface TabGroupProps {
  tabs: Tab[];
}

export function TabGroup({ tabs }: TabGroupProps) {
  const groupId = useId();
  const [activeIndex, setActiveIndex] = useState(0);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    let next: number | null = null;

    if (event.key === 'ArrowRight') {
      next = (activeIndex + 1) % tabs.length;
    } else if (event.key === 'ArrowLeft') {
      next = (activeIndex - 1 + tabs.length) % tabs.length;
    } else if (event.key === 'Home') {
      next = 0;
    } else if (event.key === 'End') {
      next = tabs.length - 1;
    }

    if (next !== null) {
      event.preventDefault();
      setActiveIndex(next);
      const button = event.currentTarget
        .closest(`[role="tablist"]`)
        ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next];
      button?.focus();
    }
  };

  return (
    <div className={styles['tab-group']}>
      <div role="tablist" aria-label="File tabs" className={styles.tablist}>
        {tabs.map((tab, index) => {
          const tabId = `${groupId}-tab-${index}`;
          const panelId = `${groupId}-panel-${index}`;
          const isActive = index === activeIndex;

          return (
            <button
              key={tabId}
              id={tabId}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={panelId}
              tabIndex={isActive ? 0 : -1}
              className={styles.tab}
              onClick={() => setActiveIndex(index)}
              onKeyDown={handleKeyDown}
            >
              {tab.name}
            </button>
          );
        })}
      </div>
      {tabs.map((tab, index) => {
        const tabId = `${groupId}-tab-${index}`;
        const panelId = `${groupId}-panel-${index}`;
        const isActive = index === activeIndex;

        return (
          <div
            key={panelId}
            id={panelId}
            role="tabpanel"
            aria-labelledby={tabId}
            hidden={!isActive}
            className={styles.panel}
          >
            <pre>
              <code>{tab.content}</code>
            </pre>
          </div>
        );
      })}
    </div>
  );
}
