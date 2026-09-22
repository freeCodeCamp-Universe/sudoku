import { useCallback, useEffect, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  isProseLesson,
  type ClientLessonDefinition,
  type ClientInteractiveLessonDefinition,
} from '@/curriculum/types';
import { useCurriculumTree } from '@/curriculum/useCurriculumTree';
import { useCourseShortcuts } from '@/learn/hooks/useCourseShortcuts';
import { useLesson } from '@/learn/hooks/useLesson';
import type { LessonSnapshot } from '@/learn/hooks/useLesson';
import { useInitialFocusPreference } from '@/learn/hooks/useInitialFocusPreference';
import { useShortcutsPreference } from '@/learn/hooks/useShortcutsPreference';
import { useProgress } from '@/learn/hooks/useProgress';
import { useCourseChrome } from '@/learn/stores/courseChromeStore';
import { CheckCircleIcon } from '@/components/icons';
import { Markdown } from '@/learn/Markdown/Markdown';
import { renderInline } from '@/learn/Markdown/RenderInline';
import { TabGroup } from '@/learn/TabGroup/TabGroup';
import { Checklist } from '@/learn/Checklist/Checklist';
import { PrimaryAction } from '@/learn/PrimaryAction/PrimaryAction';
import { ResetButton } from '@/learn/ResetButton/ResetButton';
import styles from '@/learn/LessonWorkspace/LessonWorkspace.module.css';

export type TabId = 'instructions' | 'terminal';

export interface InteractivePanelProps {
  lesson: ClientInteractiveLessonDefinition;
  onUpdate: (snapshot: LessonSnapshot) => void;
  onReset: () => void;
}

export interface LessonWorkspaceProps {
  lesson: ClientLessonDefinition;
  nextLessonId?: string;
  isLastLesson: boolean;
  instructionsHtml: string;
  segmentHtmls?: string[];
  tab: TabId;
  onSelectTab: (tab: TabId) => void;
  InteractivePanel: ComponentType<InteractivePanelProps>;
}

export function LessonWorkspace({
  lesson,
  nextLessonId,
  isLastLesson,
  instructionsHtml,
  segmentHtmls,
  tab,
  onSelectTab,
  InteractivePanel,
}: LessonWorkspaceProps) {
  const navigate = useNavigate();
  const chrome = useCourseChrome();
  const tree = useCurriculumTree();
  const { shortcutsEnabled } = useShortcutsPreference();
  const { focusInstructionsOnLoad } = useInitialFocusPreference();
  const { completed, markComplete } = useProgress();
  const { checklist, complete, feedback, onUpdate, reportIncomplete, reset } = useLesson(lesson);

  const prose = isProseLesson(lesson);
  const [tabAnnouncement, setTabAnnouncement] = useState('');
  const [shortcutNote, setShortcutNote] = useState('');
  const [resetKey, setResetKey] = useState(0);
  const pendingInteractiveFocus = useRef(false);
  const pendingInstructionsFocus = useRef(false);
  const interactiveRef = useRef<HTMLDivElement>(null);
  const instructionsRef = useRef<HTMLElement>(null);
  const isFirstTabRender = useRef(true);

  // Focus the interactive panel or instructions on mount for interactive lessons.
  useEffect(() => {
    if (prose) return;
    let cancelled = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (cancelled) return;
        if (focusInstructionsOnLoad) {
          instructionsRef.current?.focus();
        } else {
          interactiveRef.current?.focus();
        }
      });
    });
    return () => {
      cancelled = true;
    };
  }, [prose, focusInstructionsOnLoad]);

  const isCompleted = completed.includes(lesson.id);

  const advance = useCallback(() => {
    markComplete(lesson.id);
    navigate(isLastLesson || !nextLessonId ? '/' : `/learn/${nextLessonId}`);
  }, [markComplete, lesson.id, isLastLesson, nextLessonId, navigate]);

  useEffect(() => {
    if (isFirstTabRender.current) {
      isFirstTabRender.current = false;
      return;
    }
    setTabAnnouncement(tab === 'terminal' ? 'terminal' : 'instructions');
  }, [tab]);

  const focusInteractive = useCallback(() => {
    if (tab === 'terminal') {
      interactiveRef.current?.focus();
      return;
    }
    pendingInteractiveFocus.current = true;
    onSelectTab('terminal');
  }, [tab, onSelectTab]);

  useEffect(() => {
    if (tab === 'terminal' && pendingInteractiveFocus.current) {
      pendingInteractiveFocus.current = false;
      interactiveRef.current?.focus();
    }
  }, [tab]);

  const focusInstructions = useCallback(() => {
    if (tab === 'instructions') {
      instructionsRef.current?.focus();
      return;
    }
    pendingInstructionsFocus.current = true;
    onSelectTab('instructions');
  }, [tab, onSelectTab]);

  useEffect(() => {
    if (tab === 'instructions' && pendingInstructionsFocus.current) {
      pendingInstructionsFocus.current = false;
      instructionsRef.current?.focus();
    }
  }, [tab]);

  const announceShortcut = useCallback((message: string) => {
    setShortcutNote((prev) => (prev === message ? `${message}\u200b` : message));
  }, []);

  useCourseShortcuts({
    currentLessonId: lesson.id,
    reachableLessonIds: tree?.orderedLessonIds ?? [],
    onNavigate: (lessonId) => {
      navigate(`/learn/${lessonId}`);
    },
    onFocusInteractivePanel: prose ? () => {} : focusInteractive,
    onFocusInstructions: prose ? () => {} : focusInstructions,
    onOpenDrawer: chrome.openDrawer,
    announce: announceShortcut,
    enabled:
      shortcutsEnabled && !chrome.drawerOpen && !chrome.shortcutsOpen && !chrome.settingsOpen,
  });

  const handleReset = useCallback(() => {
    reset();
    setResetKey((k) => k + 1);
  }, [reset]);

  const shortcutRegion = (
    <div className="sr-only" role="status" aria-live="polite">
      {shortcutNote}
    </div>
  );

  const heading = (
    <h1 id="lesson-heading" className={styles.heading}>
      {isCompleted && (
        <>
          <CheckCircleIcon className={styles['heading-status']} />
          <span className="sr-only">completed</span>
        </>
      )}
      <span>{renderInline(lesson.title)}</span>
    </h1>
  );

  if (prose) {
    const segments = lesson.instructionSegments;
    return (
      <>
        <main
          id="main-content"
          tabIndex={-1}
          className={`${styles['prose-page']} ${lesson.type === 'review' ? styles['review-page'] : ''}`}
          aria-labelledby="lesson-heading"
        >
          <div className={lesson.type === 'review' ? styles['review-content'] : ''}>
            {heading}
            {segments && segmentHtmls ? (
              segments.map((segment, index) =>
                segment.kind === 'markdown' ? (
                  <Markdown key={index} html={segmentHtmls[index]} />
                ) : (
                  <TabGroup key={index} tabs={segment.tabs} />
                )
              )
            ) : (
              <Markdown html={instructionsHtml} />
            )}
            <div className={styles.controls}>
              <div className={styles['review-next']} role="group" aria-label="Review navigation">
                <PrimaryAction complete={complete} isCapstone={isLastLesson} onAdvance={advance} />
              </div>
            </div>
          </div>
        </main>
        {shortcutRegion}
      </>
    );
  }

  const interactiveLesson = lesson as ClientInteractiveLessonDefinition;

  return (
    <>
      <main id="main-content" tabIndex={-1} className={styles.page} data-tab={tab}>
        <section
          ref={instructionsRef}
          tabIndex={0}
          className={styles.instructions}
          aria-labelledby="lesson-heading"
        >
          {heading}
          <div className={styles['instruction-body']}>
            <Markdown html={instructionsHtml} />
            <Checklist items={checklist} muteAnnouncement={feedback !== null} />
          </div>
          <div className="sr-only" role="status" aria-live="polite">
            {feedback}
          </div>
        </section>
        <div
          ref={interactiveRef}
          className={styles.terminal}
          tabIndex={-1}
          role="application"
          aria-label="interactive lesson workspace"
        >
          <InteractivePanel
            key={resetKey}
            lesson={interactiveLesson}
            onUpdate={onUpdate}
            onReset={handleReset}
          />
          <div className={styles.controls}>
            <ResetButton onReset={handleReset} />
            <PrimaryAction
              complete={complete}
              isCapstone={isLastLesson}
              onAdvance={advance}
              onBlocked={reportIncomplete}
            />
          </div>
        </div>

        <div className="sr-only" role="status" aria-live="polite">
          {tabAnnouncement}
        </div>
      </main>
      {shortcutRegion}
    </>
  );
}
