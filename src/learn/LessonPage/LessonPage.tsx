import { useCallback, useEffect, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import { isProseLesson, type ClientLessonDefinition } from '@/curriculum/types';
import type { Heading } from '@/learn/utils/extractHeadings';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useSeoMeta } from '@/learn/hooks/useSeoMeta';
import { seoConfig } from '@/utils/seo.config';
import { LessonToolbar } from '@/learn/LessonToolbar/LessonToolbar';
import { Outline } from '@/learn/Outline/Outline';
import { PlaceholderPanel } from '@/learn/PlaceholderPanel/PlaceholderPanel';
import type { InteractivePanelProps } from '@/learn/LessonWorkspace/LessonWorkspace';
import { LessonWorkspace, type TabId } from '@/learn/LessonWorkspace/LessonWorkspace';
import styles from '@/learn/LessonPage/LessonPage.module.css';

export interface LessonPageProps {
  lesson: ClientLessonDefinition;
  nextLessonId?: string;
  isLastLesson: boolean;
  instructionsHtml: string;
  segmentHtmls?: string[];
  headings: Heading[];
  InteractivePanel?: ComponentType<InteractivePanelProps>;
}

export function LessonPage({
  lesson,
  nextLessonId,
  isLastLesson,
  instructionsHtml,
  segmentHtmls,
  headings,
  InteractivePanel,
}: LessonPageProps) {
  const prose = isProseLesson(lesson);
  const [tab, setTab] = useState<TabId>('instructions');
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const pageTitle = `${lesson.title} | ${seoConfig.siteTitle}`;

  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  useSeoMeta({
    title: pageTitle,
    description: seoConfig.siteDescription,
    path: `/learn/${lesson.id}`,
  });

  const [outlineOpen, setOutlineOpen] = useState(false);
  const outlineButtonRef = useRef<HTMLButtonElement | null>(null);

  const selectTab = useCallback((next: TabId) => {
    setTab(next);
  }, []);

  const toggleOutline = useCallback(() => {
    setOutlineOpen((prev) => !prev);
  }, []);

  const closeOutline = useCallback(() => {
    setOutlineOpen(false);
  }, []);

  const showToolbar = !prose || headings.length > 0;
  const interactivePanel = InteractivePanel ?? PlaceholderPanel;

  return (
    <div className={styles.wrapper} data-lesson-page={prose ? 'prose' : 'interactive'}>
      {showToolbar && (
        <LessonToolbar
          lesson={lesson}
          tab={tab}
          onSelectTab={selectTab}
          outlineOpen={outlineOpen}
          onOutlineToggle={toggleOutline}
          outlineButtonRef={outlineButtonRef}
        />
      )}
      {prose ? (
        <div className={styles['prose-area']}>
          <Outline
            id="lesson-outline"
            headings={headings}
            mode={isDesktop ? 'sidebar' : 'drawer'}
            open={outlineOpen}
            onClose={closeOutline}
            triggerElement={outlineButtonRef.current}
          />
          <LessonWorkspace
            lesson={lesson}
            nextLessonId={nextLessonId}
            isLastLesson={isLastLesson}
            instructionsHtml={instructionsHtml}
            segmentHtmls={segmentHtmls}
            tab={tab}
            onSelectTab={selectTab}
            InteractivePanel={interactivePanel}
          />
        </div>
      ) : (
        <LessonWorkspace
          lesson={lesson}
          nextLessonId={nextLessonId}
          isLastLesson={isLastLesson}
          instructionsHtml={instructionsHtml}
          segmentHtmls={segmentHtmls}
          tab={tab}
          onSelectTab={selectTab}
          InteractivePanel={interactivePanel}
        />
      )}
    </div>
  );
}
