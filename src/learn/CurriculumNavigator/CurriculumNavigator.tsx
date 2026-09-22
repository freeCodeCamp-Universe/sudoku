import { useMemo, useState } from 'react';
import { filterCurriculum } from '@/learn/curriculum/filterCurriculum';
import {
  CurriculumTree,
  type CurriculumTreeLessonState,
  type CurriculumTreeModule,
} from '@/learn/CurriculumTree/CurriculumTree';
import { CurriculumSearch } from '@/learn/CurriculumSearch/CurriculumSearch';
import styles from '@/learn/CurriculumNavigator/CurriculumNavigator.module.css';

interface Props {
  modules: CurriculumTreeModule[];
  variant: 'home' | 'drawer';
  query?: string;
  onQueryChange?: (query: string) => void;
  showSearch?: boolean;
  lessonState?: (id: string) => CurriculumTreeLessonState;
  onLessonClick?: () => void;
  /** Ref attached to the current lesson's link, for scroll-into-view / focus management. */
  currentLessonRef?: React.RefObject<HTMLAnchorElement | null>;
}

export function CurriculumNavigator({
  modules,
  variant,
  query: controlledQuery,
  onQueryChange,
  showSearch = true,
  lessonState,
  onLessonClick,
  currentLessonRef,
}: Props) {
  const [localQuery, setLocalQuery] = useState('');
  const query = controlledQuery ?? localQuery;
  const handleQueryChange = onQueryChange ?? setLocalQuery;
  const filteredModules = useMemo(() => filterCurriculum(modules, query), [modules, query]);
  const resultCount = filteredModules.reduce((count, module) => count + module.lessons.length, 0);
  const normalizedQuery = query.trim();
  const resultMessage = normalizedQuery
    ? resultCount > 0
      ? `Showing ${resultCount} matching ${resultCount === 1 ? 'lesson' : 'lessons'} for "${normalizedQuery}".`
      : `No lessons found for "${normalizedQuery}".`
    : '';

  return (
    <div className={`${styles.navigator} ${styles[variant]}`}>
      <div className={styles[`${variant}-search-status`]}>
        {showSearch ? (
          <div className={styles['search-wrapper']}>
            <CurriculumSearch query={query} onQueryChange={handleQueryChange} />
          </div>
        ) : null}
        <p
          className={`${styles.status} ${normalizedQuery ? styles['status-filled'] : styles['status-empty']}`}
          role="status"
          aria-live="polite"
        >
          {resultMessage}
        </p>
      </div>
      {filteredModules.length > 0 ? (
        <CurriculumTree
          modules={filteredModules}
          variant={variant}
          lessonState={lessonState}
          onLessonClick={onLessonClick}
          currentLessonRef={currentLessonRef}
        />
      ) : null}
    </div>
  );
}
