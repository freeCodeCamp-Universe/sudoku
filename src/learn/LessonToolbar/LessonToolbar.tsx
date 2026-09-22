import type { RefObject } from 'react';
import { isProseLesson, type ClientLessonDefinition } from '@/learn/curriculum/types';
import type { TabId } from '@/learn/LessonWorkspace/LessonWorkspace';
import { Button } from '@/components/Button';
import styles from '@/learn/LessonToolbar/LessonToolbar.module.css';

export interface LessonToolbarProps {
  lesson: ClientLessonDefinition;
  tab: TabId;
  onSelectTab: (tab: TabId) => void;
  outlineOpen: boolean;
  onOutlineToggle: () => void;
  outlineButtonRef: RefObject<HTMLButtonElement | null>;
}

export function LessonToolbar({
  lesson,
  tab,
  onSelectTab,
  outlineOpen,
  onOutlineToggle,
  outlineButtonRef,
}: LessonToolbarProps) {
  const prose = isProseLesson(lesson);
  const toolbarClassName = [
    styles.toolbar,
    prose ? styles['toolbar-outline'] : '',
    !prose ? styles['toolbar-interactive'] : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={toolbarClassName}>
      {prose ? (
        <Button
          variant="primary"
          ref={outlineButtonRef}
          aria-expanded={outlineOpen}
          aria-controls="lesson-outline"
          onClick={onOutlineToggle}
          className={styles['outline-button']}
        >
          Outline
        </Button>
      ) : (
        <div className={styles.tabgroup}>
          <button
            type="button"
            aria-pressed={tab === 'instructions'}
            className={`${styles.tab} ${tab === 'instructions' ? styles['tab-active'] : ''}`}
            onClick={() => onSelectTab('instructions')}
          >
            Instructions
          </button>
          <button
            type="button"
            aria-pressed={tab === 'terminal'}
            className={`${styles.tab} ${tab === 'terminal' ? styles['tab-active'] : ''}`}
            onClick={() => onSelectTab('terminal')}
          >
            Terminal
          </button>
        </div>
      )}
    </div>
  );
}
