import { useEffect, useState } from 'react';
import type { HelpRule, HelpSection } from '@/engine/types';
import { Dialog } from '@/game/Dialog';
import { Tabs } from '@/game/Tabs';
import type { Tab } from '@/game/Tabs';
import styles from './HelpDialog.module.css';

const HELP_TABS: Tab[] = [
  { id: 'rules', label: 'Rules', panelId: 'help-panel-rules' },
  { id: 'gameplay', label: 'Gameplay', panelId: 'help-panel-gameplay' },
];

const BASIC_RULES: HelpRule[] = [
  {
    term: 'The board',
    text: 'A 9×9 board divided into nine 3×3 boxes. Fill every cell with a symbol from 1 to 9.',
  },
  {
    term: 'Rows and columns',
    text: 'Every row and every column must contain each symbol exactly once.',
  },
  {
    term: 'Boxes',
    text: 'Each of the nine 3×3 boxes must also hold every symbol exactly once.',
  },
];

const GAMEPLAY_ITEMS: HelpRule[] = [
  {
    term: 'Given symbols',
    text: 'Some cells are pre-filled and cannot be changed. Use them as your starting clues.',
  },
  {
    term: 'Entering symbols',
    text: 'Click a cell to select it, then press a symbol key or tap the numpad.',
  },
  { term: 'Erasing', text: 'Press Backspace or tap the Erase button to clear a cell.' },
  {
    term: 'Candidate mode',
    text: 'Candidates are small symbols you pencil into a cell to track which values are possible there.',
  },
];

interface HelpDialogProps {
  open: boolean;
  onClose: () => void;
  basicRules?: HelpRule[];
  help?: HelpSection[];
}

export function HelpDialog({ open, onClose, basicRules, help }: HelpDialogProps) {
  const [activeTab, setActiveTab] = useState('rules');

  useEffect(() => {
    if (open) setActiveTab('rules');
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} title="How to Play">
      <Tabs
        tabs={HELP_TABS}
        activeId={activeTab}
        onSelect={setActiveTab}
        ariaLabel="Help sections"
      />

      <div
        role="tabpanel"
        id="help-panel-rules"
        aria-labelledby="rules-tab"
        tabIndex={0}
        hidden={activeTab !== 'rules'}
      >
        <div className={styles.sectionGroup}>
          {help && help.length > 0 && (
            <h3 className={`${styles.badge} ${styles.basic}`}>Basic Rules</h3>
          )}
          <ul className={styles.rules}>
            {(basicRules ?? BASIC_RULES).map((rule) => (
              <li key={rule.term}>
                <strong>{rule.term}:</strong> {rule.text}
              </li>
            ))}
          </ul>
        </div>
        {help?.map((section) => (
          <div key={`${section.tone}-${section.label}`} className={styles.sectionGroup}>
            <h3 className={`${styles.badge} ${styles[section.tone]}`}>{section.label}</h3>
            <ul className={styles.rules}>
              {section.rules.map((rule) => (
                <li key={`${rule.term}-${rule.text}`}>
                  {rule.term ? (
                    <>
                      <strong>{rule.term}:</strong> {rule.text}
                    </>
                  ) : (
                    rule.text
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div
        role="tabpanel"
        id="help-panel-gameplay"
        aria-labelledby="gameplay-tab"
        tabIndex={0}
        hidden={activeTab !== 'gameplay'}
      >
        <ul className={styles.rules}>
          {GAMEPLAY_ITEMS.map((item) => (
            <li key={item.term}>
              <strong>{item.term}:</strong> {item.text}
            </li>
          ))}
        </ul>
      </div>

      <button type="button" className={styles.closeBtn} onClick={onClose}>
        Got it
      </button>
    </Dialog>
  );
}
