import type { ReactNode } from 'react';
import { Link, useMatch } from 'react-router-dom';import { Banner } from '@/learn/base/Banner/Banner';
import { HeaderControls } from '@/learn/features/HeaderControls/HeaderControls';
import { CourseOverlays } from '@/learn/features/CourseOverlays/CourseOverlays';
import { useMediaQuery } from '@/learn/hooks/useMediaQuery';
import styles from '@/learn/views/CourseLayout/CourseLayout.module.css';

interface Props {
  children: ReactNode;
}

export function CourseLayout({ children }: Props) {
  const lessonMatch = useMatch('/learn/:lessonId');
  const isLesson = Boolean(lessonMatch);
  const params = lessonMatch?.params;
  const currentLessonId = isLesson ? params.lessonId : undefined;
  const isTouch = useMediaQuery('(hover: none)');

  return (
    <>
      <a href="#main" className="sr-only">
        Skip to main content
      </a>
      <header className={styles.header}>
        <Link to="/" className={styles['home-link']}>
          {{ PROJECT_NAME }}
        </Link>
        <HeaderControls showDrawer={Boolean(currentLessonId)} showShortcuts={Boolean(currentLessonId)} />
      </header>
      {isTouch && !currentLessonId && <Banner dismissible={false}>{{ MOBILE_BANNER_MESSAGE }}</Banner>}
      {children}
      <CourseOverlays currentLessonId={currentLessonId} />
    </>
  );
}
