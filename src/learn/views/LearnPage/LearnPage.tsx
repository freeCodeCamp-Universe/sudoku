import { useEffect } from 'react';
import { useCurriculumTree } from '@/learn/curriculum/useCurriculumTree';
import { LoadingState } from '@/learn/base/LoadingState/LoadingState';
import { FccLogoIcon } from '@/learn/icons';
import { useSeoMeta } from '@/learn/hooks/useSeoMeta';
import { seoConfig } from '@/utils/seo.config';
import { CurriculumOverview } from '@/learn/views/CurriculumOverview/CurriculumOverview';
import styles from '@/learn/views/LearnPage/LearnPage.module.css';

export function LearnPage() {
  const tree = useCurriculumTree();

  useEffect(() => {
    document.title = seoConfig.siteTitle;
  }, []);

  useSeoMeta({
    title: seoConfig.siteTitle,
    description: seoConfig.siteDescription,
    path: '/learn',
  });

  if (!tree) {
    return <LoadingState label="Loading course" />;
  }

  return (
    <>
      <main id="main-content" className={styles.page} tabIndex={-1}>
        <h1 className={styles.title}>Learn Vim for Terminal Text Editing</h1>
        <CurriculumOverview />
      </main>
      <footer className={styles.footer}>
        <p className={styles['footer-text']}>
          <FccLogoIcon className={styles['footer-logo']} />
          <span>
            Developed by the{' '}
            <a href="https://www.freecodecamp.org" target="_blank" rel="noopener noreferrer">
              freeCodeCamp
            </a>{' '}
            team
          </span>
        </p>
      </footer>
    </>
  );
}
