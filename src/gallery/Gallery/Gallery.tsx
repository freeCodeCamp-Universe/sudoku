import { useMemo, useState } from 'react';
import { ThemeToggleButton } from '@/app/ThemeToggleButton';
import type { Variant } from '@/engine/types';
import { StarIcon } from '@/gallery/StarIcon';
import { useFavorites } from '@/gallery/useFavorites';
import { VariantCard } from '@/gallery/VariantCard';
import { variantRegistry } from '@/variants/registry';
import styles from './Gallery.module.css';

type SortMode = 'popularity' | 'alpha' | 'difficulty';

const ALL_VARIANTS = Object.values(variantRegistry);
const SORT_LABELS: Record<SortMode, string> = {
  popularity: 'Popularity',
  alpha: 'A-Z',
  difficulty: 'Difficulty',
};

function resultAnnouncement(count: number): string {
  if (count === 0) {
    return 'No puzzles found.';
  }

  return `${count} ${count === 1 ? 'puzzle' : 'puzzles'} found.`;
}
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
      const difficultyDiff = DIFFICULTY_ORDER[left.difficulty] - DIFFICULTY_ORDER[right.difficulty];

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
  const [announcement, setAnnouncement] = useState('');
  const { favorites, toggleFavorite } = useFavorites();
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(
    () => localStorage.getItem('sudoku-favorites-filter') === 'true'
  );

  const matchCount = (nextQuery: string, favoritesOnly: boolean) => {
    const matches = filterVariants(ALL_VARIANTS, nextQuery);
    return favoritesOnly
      ? matches.filter((variant) => favorites.has(variant.id)).length
      : matches.length;
  };

  const visibleVariants = useMemo(() => {
    const matches = filterVariants(ALL_VARIANTS, query);
    const list = showFavoritesOnly
      ? matches.filter((variant) => favorites.has(variant.id))
      : matches;
    return sortVariants(list, sortMode);
  }, [query, sortMode, showFavoritesOnly, favorites]);

  return (
    <main id="main-content" tabIndex={-1} className={styles.main}>
      <header className={styles.header}>
        <div className={styles.headerTopBar}>
          <ThemeToggleButton />
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
            onChange={(event) => {
              const nextQuery = event.target.value;
              setQuery(nextQuery);
              setAnnouncement(resultAnnouncement(matchCount(nextQuery, showFavoritesOnly)));
            }}
          />
        </div>

        <div className={styles.filterRow}>
          <button
            type="button"
            className={styles.favoritesFilter}
            aria-pressed={showFavoritesOnly}
            onClick={() => {
              const next = !showFavoritesOnly;
              localStorage.setItem('sudoku-favorites-filter', String(next));
              setShowFavoritesOnly(next);
              setAnnouncement(
                `${next ? 'Showing favorites only.' : 'Showing all puzzles.'} ${resultAnnouncement(
                  matchCount(query, next)
                )}`
              );
            }}
          >
            <StarIcon className={styles.favoritesFilterStar} filled={showFavoritesOnly} />
            Favorites only
          </button>

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
                setAnnouncement(`Sorted by ${SORT_LABELS[mode]}.`);
              }}
            >
              <option value="popularity">Popularity</option>
              <option value="alpha">A-Z</option>
              <option value="difficulty">Difficulty</option>
            </select>
          </div>
        </div>
      </div>

      {visibleVariants.length === 0 ? (
        <p className={styles.noResults}>
          {showFavoritesOnly && favorites.size === 0
            ? 'No favorite puzzles yet. Tap the star on a card to save it.'
            : 'No puzzles match your search.'}
        </p>
      ) : (
        <div className={styles.grid}>
          {visibleVariants.map((variant) => (
            <VariantCard
              key={variant.id}
              variant={variant}
              isFavorite={favorites.has(variant.id)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}

      <div role="status" aria-live="polite" aria-atomic="true" className={styles.srOnly}>
        {announcement}
      </div>
    </main>
  );
}
