import { useCurriculumTree } from '@/curriculum/useCurriculumTree';
import { LoadingState } from '@/learn/LoadingState/LoadingState';
import { useSeoMeta } from '@/hooks/useSeoMeta';
import { seoConfig } from '@/utils/seo.config';
import { CurriculumOverview } from '@/learn/CurriculumOverview/CurriculumOverview';
import styles from '@/learn/LearnPage/LearnPage.module.css';

export function LearnPage() {
  const tree = useCurriculumTree();

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
        <h1 className={styles.title}>Learn Sudoku</h1>
        <CurriculumOverview />
      </main>
    </>
  );
}
