import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Banner } from '@/learn/base/Banner/Banner';
import { HeaderControls } from '@/learn/features/HeaderControls/HeaderControls';
import { CourseOverlays } from '@/learn/features/CourseOverlays/CourseOverlays';
import { useMediaQuery } from '@/learn/hooks/useMediaQuery';
import styles from '@/learn/views/CourseLayout/CourseLayout.module.css';

interface Props {
  children: ReactNode;
}

export function CourseLayout({ children }: Props) {
  const { lessonId: currentLessonId } = useParams<{ lessonId?: string }>();
  const isTouch = useMediaQuery('(hover: none)');

  return (
    <>
      <a href="#main-content" className="sr-only">
        Skip to main content
      </a>
      <header className={styles.header}>
        <Link to="/" className={styles['home-link']}>
          Sudoku
        </Link>
        <HeaderControls
          showDrawer={Boolean(currentLessonId)}
          showShortcuts={Boolean(currentLessonId)}
        />
      </header>
      {isTouch && !currentLessonId && (
        <Banner dismissible={false}>This course is best experienced on a larger screen.</Banner>
      )}
      {children}
      <CourseOverlays currentLessonId={currentLessonId} />
    </>
  );
}
