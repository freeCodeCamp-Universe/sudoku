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
import { ToastStack, type ToastItem } from '@/components/ToastStack';
import { Markdown } from '@/learn/Markdown/Markdown';
import { renderInline } from '@/learn/Markdown/RenderInline';
import { TabGroup } from '@/learn/TabGroup/TabGroup';
import { PrimaryAction } from '@/learn/PrimaryAction/PrimaryAction';
import { ResetButton } from '@/learn/ResetButton/ResetButton';
import { getFocusableElements } from '@/learn/utils/focusTrap';
import styles from '@/learn/LessonWorkspace/LessonWorkspace.module.css';

export type TabId = 'instructions' | 'terminal';

export interface InteractivePanelProps {
  lesson: ClientInteractiveLessonDefinition;
  onUpdate: (snapshot: LessonSnapshot) => void;
  onReset: () => void;
  /** Show a requirement's hint in a toast, or clear the toast with `null`. */
  onHint: (hint: string | null) => void;
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
  const { complete, onUpdate, reset } = useLesson(lesson);

  const prose = isProseLesson(lesson);
  const [tabAnnouncement, setTabAnnouncement] = useState('');
  const [shortcutNote, setShortcutNote] = useState('');
  const [resetKey, setResetKey] = useState(0);
  const pendingInteractiveFocus = useRef(false);
  const pendingInstructionsFocus = useRef(false);
  const interactiveRef = useRef<HTMLDivElement>(null);
  const instructionsRef = useRef<HTMLElement>(null);
  const isFirstTabRender = useRef(true);
  const [workArea, setWorkArea] = useState<HTMLDivElement | null>(null);
  const [hintToast, setHintToast] = useState<ToastItem | null>(null);
  const hintToastId = useRef(0);

  // Land on the panel's first control (the board's active cell), falling back
  // to the workspace itself for a panel with nothing to focus.
  const focusInteractivePanel = useCallback(() => {
    const [firstControl] = workArea ? getFocusableElements(workArea) : [];
    (firstControl ?? interactiveRef.current)?.focus();
  }, [workArea]);

  const showHint = useCallback((hint: string | null) => {
    setHintToast((current) => {
      if (hint === null) {
        return null;
      }
      if (current?.message === hint) {
        return current;
      }
      hintToastId.current += 1;
      return { id: hintToastId.current, message: hint, content: renderInline(hint) };
    });
  }, []);

  const dismissHint = useCallback((id: number) => {
    setHintToast((current) => (current?.id === id ? null : current));
  }, []);

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
          focusInteractivePanel();
        }
      });
    });
    return () => {
      cancelled = true;
    };
  }, [prose, focusInstructionsOnLoad, focusInteractivePanel]);

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
      focusInteractivePanel();
      return;
    }
    pendingInteractiveFocus.current = true;
    onSelectTab('terminal');
  }, [tab, onSelectTab, focusInteractivePanel]);

  useEffect(() => {
    if (tab === 'terminal' && pendingInteractiveFocus.current) {
      pendingInteractiveFocus.current = false;
      focusInteractivePanel();
    }
  }, [tab, focusInteractivePanel]);

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
    setHintToast(null);
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
          <Markdown html={instructionsHtml} />
        </section>
        <div
          ref={interactiveRef}
          className={styles['interactive-workspace']}
          tabIndex={-1}
          role="application"
          aria-label="interactive lesson workspace"
        >
          <div ref={setWorkArea} className={styles['work-area']}>
            <InteractivePanel
              key={resetKey}
              lesson={interactiveLesson}
              onUpdate={onUpdate}
              onReset={handleReset}
              onHint={showHint}
            />
          </div>
          <div className={styles.controls}>
            <ResetButton onReset={handleReset} />
            <PrimaryAction complete={complete} isCapstone={isLastLesson} onAdvance={advance} />
          </div>
        </div>
        {workArea ? (
          <ToastStack
            toasts={hintToast ? [hintToast] : []}
            onDismiss={dismissHint}
            placement="bottom"
            container={workArea}
          />
        ) : null}

        <div className="sr-only" role="status" aria-live="polite">
          {tabAnnouncement}
        </div>
      </main>
      {shortcutRegion}
    </>
  );
}
