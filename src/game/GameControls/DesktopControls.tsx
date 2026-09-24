import type { ReactNode } from 'react';
import { InputModeTabs } from '@/board/InputModeTabs';
import { Toolbar } from '@/game/Toolbar';
import styles from './GameControls.module.css';

interface DesktopControlsProps {
  activeControlTab: string;
  onSelectControlTab: (id: string) => void;
  numberPad: ReactNode;
  onClearAll: () => void;
  onReveal: () => void;
  settingToggles: ReactNode;
  modeControl?: ReactNode;
}

export function DesktopControls({
  activeControlTab,
  onSelectControlTab,
  numberPad,
  onClearAll,
  onReveal,
  settingToggles,
  modeControl,
}: DesktopControlsProps) {
  return (
    <>
      {modeControl}
      <InputModeTabs
        activeId={activeControlTab}
        onSelect={onSelectControlTab}
        numberPad={numberPad}
      />
      <div className={styles.actionStack}>
        <Toolbar onClearAll={onClearAll} onReveal={onReveal} />
        {settingToggles ? <div className={styles.settingRow}>{settingToggles}</div> : null}
      </div>
    </>
  );
}
