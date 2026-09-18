import type { OrderingModule } from '@/learn/curriculum/orderingTypes';

/**
 * Defines module structure and lesson sequence. This is the single source of
 * truth for lesson order, module grouping, and WIP status.
 *
 * Lesson files live in src/curriculum/lessons/ with flat numeric names:
 *   Module 1 → 101.md, 102.md, 103.md, …
 *   Module 2 → 201.md, 202.md, 203.md, …
 *
 * The number prefix is a human convenience for grouping; ordering.ts controls
 * the actual sequence.
 */
export const curriculum: readonly OrderingModule[] = [
  {
    module: 1,
    slug: 'getting-started',
    title: 'Getting Started',
    lessons: ['101.md', '102.md', '103.md'],
  },
];
