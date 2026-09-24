import type { ReactNode } from 'react';
import { DPad } from '@/game/DPad';
import type { Direction } from '@/board/boardTypes';
import { InputModeTabs } from '@/board/InputModeTabs';
import { Tabs, type Tab } from '@/components/Tabs';
import styles from './GameControls.module.css';

interface PortraitControlsProps {
  activeControlTab: string;
  onSelectControlTab: (id: string) => void;
  numberPad: ReactNode;
  controlsPanel: ReactNode;
  settingToggles: ReactNode;
  navTabs: Tab[];
  navTab: 'move' | 'map';
  onSelectNavTab: (id: 'move' | 'map') => void;
  onMoveSelection: (direction: Direction) => void;
  minimap: ReactNode;
  zoomControls: ReactNode;
  /*
   * The landscape-mobile right column is only ~320-420px wide, but the
   * >= 600px media block keys off viewport width and matches every landscape
   * phone. This flag re-scopes those wide-viewport rules to the column.
   */
  landscape?: boolean;
  /** Moves the navigation column (D-pad / minimap) to the inline-start side. */
  navOnLeft?: boolean;
}

export function PortraitControls({
  activeControlTab,
  onSelectControlTab,
  numberPad,
  controlsPanel,
  settingToggles,
  navTabs,
  navTab,
  onSelectNavTab,
  onMoveSelection,
  minimap,
  zoomControls,
  landscape = false,
  navOnLeft = false,
}: PortraitControlsProps) {
  const classNames = [
    styles.controlsRow,
    landscape && styles.controlsRowLandscape,
    navOnLeft && styles.controlsRowNavOnLeft,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames}>
      <div className={styles.controlsMain}>
        <InputModeTabs
          activeId={activeControlTab}
          onSelect={onSelectControlTab}
          ariaLabel="Input mode and controls"
          numberPad={numberPad}
          inputPanelFooter={
            settingToggles ? <div className={styles.inputPanelToggle}>{settingToggles}</div> : null
          }
          extraTabs={[
            {
              tab: { id: 'controls', label: 'Controls', panelId: 'unused' },
              panel: controlsPanel,
            },
          ]}
          compact={landscape}
        />
      </div>
      <div className={styles.mapGroup}>
        <Tabs
          tabs={navTabs}
          activeId={navTab}
          onSelect={(id) => onSelectNavTab(id as 'move' | 'map')}
          ariaLabel="Board navigation"
          compact={landscape}
        />
        <div className={styles.navPanels}>
          <div
            role="tabpanel"
            id="nav-panel-move"
            aria-labelledby="move-tab"
            className={`${styles.panel} ${styles.navPanel}`}
            data-active={navTab === 'move'}
          >
            <DPad onMove={onMoveSelection} />
          </div>
          <div
            role="tabpanel"
            id="nav-panel-map"
            aria-labelledby="map-tab"
            className={`${styles.panel} ${styles.navPanel}`}
            data-active={navTab === 'map'}
          >
            {minimap}
          </div>
        </div>
        <div className={styles.zoomRow}>{zoomControls}</div>
      </div>
    </div>
  );
}
