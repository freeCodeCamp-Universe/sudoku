import { useMemo, useState } from 'react';
import { useTheme } from '@/app/ThemeProvider';
import type { Variant } from '@/engine/types';
import { VariantCard } from '@/gallery/VariantCard';
import { variantRegistry } from '@/variants/registry';
import styles from './Gallery.module.css';

type SortMode = 'popularity' | 'alpha' | 'difficulty';

const ALL_VARIANTS = Object.values(variantRegistry);
const DIFFICULTY_ORDER: Record<Variant['difficulty'], number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

function filterVariants(variants: Variant[], query: string): Variant[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return variants;
  }

  return variants.filter(
    (variant) =>
      variant.name.toLowerCase().includes(normalizedQuery) ||
      variant.description.toLowerCase().includes(normalizedQuery) ||
      variant.difficulty.toLowerCase().includes(normalizedQuery) ||
      variant.tags?.some((tag) => tag.toLowerCase().includes(normalizedQuery))
  );
}

function sortVariants(variants: Variant[], sortMode: SortMode): Variant[] {
  const sortedVariants = [...variants];

  if (sortMode === 'alpha') {
    sortedVariants.sort((left, right) => left.name.localeCompare(right.name));
  } else if (sortMode === 'popularity') {
    sortedVariants.sort((left, right) => {
      const popularityDiff = left.popularity - right.popularity;

      if (popularityDiff !== 0) {
        return popularityDiff;
      }

      return left.name.localeCompare(right.name);
    });
  } else if (sortMode === 'difficulty') {
    sortedVariants.sort((left, right) => {
      const difficultyDiff =
        DIFFICULTY_ORDER[left.difficulty] - DIFFICULTY_ORDER[right.difficulty];

      if (difficultyDiff !== 0) {
        return difficultyDiff;
      }

      const leftRank = left.difficultyRank ?? left.popularity ?? 99;
      const rightRank = right.difficultyRank ?? right.popularity ?? 99;
      return leftRank - rightRank;
    });
  }

  return sortedVariants;
}

export function Gallery() {
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>(
    () => (localStorage.getItem('sudoku-sort') as SortMode | null) ?? 'popularity'
  );
  const { theme, toggleTheme } = useTheme();
  const visibleVariants = useMemo(
    () => sortVariants(filterVariants(ALL_VARIANTS, query), sortMode),
    [query, sortMode]
  );

  return (
    <main id="main-content" tabIndex={-1} className={styles.main}>
      <header className={styles.header}>
        <div className={styles.headerTopBar}>
          <button
            type="button"
            className={styles.themeBtn}
            aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
            onClick={toggleTheme}
          >
            {theme === 'light' ? '☽' : '☼'}
          </button>
        </div>
        <h1 className={styles.heading}>SUDOKU</h1>
        <p className={styles.subheading}>32 sudoku variants for every skill level</p>
      </header>

      <div className={styles.controls}>
        <div className={styles.searchWrap}>
          <input
            type="search"
            className={styles.search}
            placeholder="Search puzzles..."
            autoComplete="off"
            spellCheck={false}
            aria-label="Search puzzles"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className={styles.sortWrap}>
          <label className={styles.sortLabel} htmlFor="sort-select">
            Sort by
          </label>
          <select
            id="sort-select"
            className={styles.sortSelect}
            aria-label="Sort puzzles by"
            value={sortMode}
            onChange={(event) => {
              const mode = event.target.value as SortMode;
              localStorage.setItem('sudoku-sort', mode);
              setSortMode(mode);
            }}
          >
            <option value="popularity">Popularity</option>
            <option value="alpha">A-Z</option>
            <option value="difficulty">Difficulty</option>
          </select>
        </div>
      </div>

      {visibleVariants.length === 0 ? (
        <p className={styles.noResults}>No puzzles match your search.</p>
      ) : (
        <div className={styles.grid}>
          {visibleVariants.map((variant) => (
            <VariantCard key={variant.id} variant={variant} />
          ))}
        </div>
      )}
    </main>
  );
}
