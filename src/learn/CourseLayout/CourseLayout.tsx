import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { HeaderControls } from '@/learn/HeaderControls/HeaderControls';
import { CourseOverlays } from '@/learn/CourseOverlays/CourseOverlays';
import { HomeIcon } from '@/components/icons';
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
        leading={
          <Link to="/" className={styles.backBtn}>
            <HomeIcon width="20" height="20" />
            <span className={styles.backBtnText}>Home</span>
          </Link>
        }
        center={
          currentLessonId ? (
            <Link to="/learn" className={`${styles.backBtn} ${styles.learnNavLink}`}>
              Learn
            </Link>
          ) : null
        }
      >
        <HeaderControls
          showDrawer={Boolean(currentLessonId)}
          showShortcuts={Boolean(currentLessonId)}
          showSettings={Boolean(currentLessonId)}
          showThemeToggle
          themeToggleDesktopOnly={Boolean(currentLessonId)}
        />
      </Header>
      {children}
      <CourseOverlays currentLessonId={currentLessonId} />
    </>
  );
}
