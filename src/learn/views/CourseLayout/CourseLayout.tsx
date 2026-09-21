import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { HeaderControls } from '@/learn/features/HeaderControls/HeaderControls';
import { CourseOverlays } from '@/learn/features/CourseOverlays/CourseOverlays';
import styles from '@/components/Header/Header.module.css';

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
      <Header
        leading={<Link to="/">{currentLessonId ? 'Sudoku' : 'Home'}</Link>}
        leadingClassName={styles['home-link']}
      >
        <HeaderControls
          showDrawer={Boolean(currentLessonId)}
          showShortcuts={Boolean(currentLessonId)}
          showSettings={Boolean(currentLessonId)}
          showThemeToggle={!currentLessonId}
        />
      </Header>
      {children}
      <CourseOverlays currentLessonId={currentLessonId} />
    </>
  );
}
