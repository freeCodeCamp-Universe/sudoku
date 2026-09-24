import { useId, type ReactNode } from 'react';
import { Tabs, type Tab } from '@/components/Tabs';
import styles from './InputModeTabs.module.css';

interface InputModeTabsProps {
  activeId: string;
  onSelect: (id: string) => void;
  numberPad: ReactNode;
  extraTabs?: { tab: Tab; panel: ReactNode }[];
  inputPanelFooter?: ReactNode;
  ariaLabel?: string;
  compact?: boolean;
}

export function InputModeTabs({
  activeId,
  onSelect,
  numberPad,
  extraTabs = [],
  inputPanelFooter,
  ariaLabel = 'Input mode',
  compact = false,
}: InputModeTabsProps) {
  const id = useId();
  const tabs: Tab[] = [
    { id: 'normal', label: 'Normal', panelId: `${id}-panel-input` },
    { id: 'candidate', label: 'Candidate', panelId: `${id}-panel-input` },
    ...extraTabs.map(({ tab }) => ({
      ...tab,
      panelId: `${id}-panel-${tab.id}`,
    })),
  ];

  return (
    <div className={styles.inputModeTabs}>
      <Tabs
        tabs={tabs}
        activeId={activeId}
        onSelect={onSelect}
        ariaLabel={ariaLabel}
        idPrefix={id}
        compact={compact}
      />
      <div className={styles.panels}>
        <div
          role="tabpanel"
          id={`${id}-panel-input`}
          aria-labelledby={`${id}-${activeId === 'candidate' ? 'candidate' : 'normal'}-tab`}
          className={styles.panel}
          data-active={activeId === 'normal' || activeId === 'candidate'}
        >
          {numberPad}
          {inputPanelFooter}
        </div>
        {extraTabs.map(({ tab, panel }) => (
          <div
            key={tab.id}
            role="tabpanel"
            id={`${id}-panel-${tab.id}`}
            aria-labelledby={`${id}-${tab.id}-tab`}
            className={styles.panel}
            data-active={activeId === tab.id}
          >
            {panel}
          </div>
        ))}
      </div>
    </div>
  );
}
