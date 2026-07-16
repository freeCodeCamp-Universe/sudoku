import type { ReactNode } from 'react';
import { DPad } from '@/game/DPad';
import type { Direction } from '@/game/gameTypes';
import { Tabs, type Tab } from '@/game/Tabs';
import type { LandscapeTabId } from './landscapeTabState';
import styles from './GameControls.module.css';

interface LandscapeControlsProps {
  activeTab: LandscapeTabId;
  onSelectTab: (id: LandscapeTabId) => void;
  inputTabLabelledBy: string;
  variantLegend: ReactNode;
  numberPad: ReactNode;
  colorLabelToggle: ReactNode;
  controlsPanel: ReactNode;
  minimap: ReactNode;
  zoomControls: ReactNode;
  onMoveSelection: (direction: Direction) => void;
}

const tabs: Tab[] = [
  { id: 'normal', label: 'Normal', panelId: 'control-panel-input' },
  { id: 'candidate', label: 'Candidate', panelId: 'control-panel-input' },
  { id: 'controls', label: 'Controls', panelId: 'control-panel-controls' },
  { id: 'move', label: 'Move', panelId: 'nav-panel-move' },
  { id: 'map', label: 'Map', panelId: 'nav-panel-map' },
];

export function LandscapeControls({
  activeTab,
  onSelectTab,
  inputTabLabelledBy,
  variantLegend,
  numberPad,
  colorLabelToggle,
  controlsPanel,
  minimap,
  zoomControls,
  onMoveSelection,
}: LandscapeControlsProps) {
  const inputActive = activeTab === 'normal' || activeTab === 'candidate';

  return (
    <div className={styles.landscapeControls}>
      <Tabs
        tabs={tabs}
        activeId={activeTab}
        onSelect={(id) => onSelectTab(id as LandscapeTabId)}
        ariaLabel="Game controls"
      />
      <div className={styles.landscapePanels}>
        <div
          role="tabpanel"
          id="control-panel-input"
          aria-labelledby={inputTabLabelledBy}
          className={styles.landscapePanel}
          data-active={inputActive}
        >
          {numberPad}
          {colorLabelToggle ? (
            <div className={styles.landscapeInputToggle}>{colorLabelToggle}</div>
          ) : null}
        </div>
        <div
          role="tabpanel"
          id="control-panel-controls"
          aria-labelledby="controls-tab"
          className={styles.landscapePanel}
          data-active={activeTab === 'controls'}
        >
          {controlsPanel}
        </div>
        <div
          role="tabpanel"
          id="nav-panel-move"
          aria-labelledby="move-tab"
          className={styles.landscapePanel}
          data-active={activeTab === 'move'}
        >
          <DPad onMove={onMoveSelection} />
        </div>
        <div
          role="tabpanel"
          id="nav-panel-map"
          aria-labelledby="map-tab"
          className={`${styles.landscapePanel} ${styles.landscapeMapPanel}`}
          data-active={activeTab === 'map'}
        >
          {minimap}
          <div className={styles.landscapeZoomRow}>{zoomControls}</div>
        </div>
      </div>
      {variantLegend ? <div className={styles.landscapeLegendSlot}>{variantLegend}</div> : null}
    </div>
  );
}
