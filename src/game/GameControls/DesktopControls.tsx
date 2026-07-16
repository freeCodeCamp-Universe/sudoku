import type { ReactNode } from 'react';
import { Toolbar } from '@/game/Toolbar';
import { Tabs, type Tab } from '@/game/Tabs';
import styles from './GameControls.module.css';

interface DesktopControlsProps {
  controlTabs: Tab[];
  activeControlTab: string;
  onSelectControlTab: (id: string) => void;
  inputTabLabelledBy: string;
  numberPad: ReactNode;
  onClearAll: () => void;
  onReveal: () => void;
  colorLabelToggle: ReactNode;
}

export function DesktopControls({
  controlTabs,
  activeControlTab,
  onSelectControlTab,
  inputTabLabelledBy,
  numberPad,
  onClearAll,
  onReveal,
  colorLabelToggle,
}: DesktopControlsProps) {
  return (
    <>
      <Tabs
        tabs={controlTabs}
        activeId={activeControlTab}
        onSelect={onSelectControlTab}
        ariaLabel="Input mode"
      />
      <div
        role="tabpanel"
        id="control-panel-input"
        aria-labelledby={inputTabLabelledBy}
        className={styles.panel}
      >
        {numberPad}
      </div>
      <div className={styles.actionStack}>
        <Toolbar onClearAll={onClearAll} onReveal={onReveal} />
        {colorLabelToggle ? <div className={styles.settingRow}>{colorLabelToggle}</div> : null}
      </div>
    </>
  );
}
