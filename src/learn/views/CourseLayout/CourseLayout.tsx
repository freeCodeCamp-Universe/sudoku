import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { HeaderControls } from '@/learn/features/HeaderControls/HeaderControls';
import { CourseOverlays } from '@/learn/features/CourseOverlays/CourseOverlays';
import styles from '@/learn/views/CourseLayout/CourseLayout.module.css';

interface Props {
  children: ReactNode;
}

export function CourseLayout({ children }: Props) {
  const { lessonId: currentLessonId } = useParams<{ lessonId?: string }>();

  return (
    <>
      <a href="#main-content" className="sr-only">
        Skip to main content
      </a>
      <header className={styles.header}>
        <Link to="/" className={styles['home-link']}>
          {currentLessonId ? 'Sudoku' : 'Home'}
        </Link>
        <HeaderControls
          showDrawer={Boolean(currentLessonId)}
          showShortcuts={Boolean(currentLessonId)}
          showSettings={Boolean(currentLessonId)}
          showThemeToggle={!currentLessonId}
        />
      </header>
      {children}
      <CourseOverlays currentLessonId={currentLessonId} />
    </>
  );
}
