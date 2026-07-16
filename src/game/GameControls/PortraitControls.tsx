import type { ReactNode } from 'react';
import { DPad } from '@/game/DPad';
import type { Direction } from '@/game/gameTypes';
import { Tabs, type Tab } from '@/game/Tabs';
import styles from './GameControls.module.css';

interface PortraitControlsProps {
  controlTabs: Tab[];
  activeControlTab: string;
  onSelectControlTab: (id: string) => void;
  inputTabLabelledBy: string;
  controlsOpen: boolean;
  numberPad: ReactNode;
  controlsPanel: ReactNode;
  colorLabelToggle: ReactNode;
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
}

export function PortraitControls({
  controlTabs,
  activeControlTab,
  onSelectControlTab,
  inputTabLabelledBy,
  controlsOpen,
  numberPad,
  controlsPanel,
  colorLabelToggle,
  navTabs,
  navTab,
  onSelectNavTab,
  onMoveSelection,
  minimap,
  zoomControls,
  landscape = false,
}: PortraitControlsProps) {
  return (
    <div
      className={
        landscape ? `${styles.controlsRow} ${styles.controlsRowLandscape}` : styles.controlsRow
      }
    >
      <div className={styles.controlsMain}>
        <Tabs
          tabs={controlTabs}
          activeId={activeControlTab}
          onSelect={onSelectControlTab}
          ariaLabel="Input mode and controls"
          compact={landscape}
        />
        <div className={styles.inputPanels}>
          <div
            role="tabpanel"
            id="control-panel-input"
            aria-labelledby={inputTabLabelledBy}
            className={styles.panel}
            data-active={!controlsOpen}
          >
            {numberPad}
            {colorLabelToggle ? (
              <div className={styles.inputPanelToggle}>{colorLabelToggle}</div>
            ) : null}
          </div>
          <div
            role="tabpanel"
            id="control-panel-controls"
            aria-labelledby="controls-tab"
            className={styles.panel}
            data-active={controlsOpen}
          >
            {controlsPanel}
          </div>
        </div>
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
