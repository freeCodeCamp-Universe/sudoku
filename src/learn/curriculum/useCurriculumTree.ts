import { useEffect, useState } from 'react';
import type { CurriculumTreeModule } from '@/learn/features/CurriculumTree/CurriculumTree';

export interface CurriculumTree {
  modules: CurriculumTreeModule[];
  orderedLessonIds: string[];
}

let cache: CurriculumTree | null = null;
let pending: Promise<CurriculumTree> | null = null;

function load(): Promise<CurriculumTree> {
  if (!pending) {
    pending = fetch('/data/curriculum-tree.json')
      .then((r) => r.json() as Promise<CurriculumTree>)
      .then((data) => {
        cache = data;
        return data;
      })
      .catch(() => {
        // Fetch failed (offline, test environment, etc.). Return an empty tree
        // so components degrade gracefully.
        const empty: CurriculumTree = { modules: [], orderedLessonIds: [] };
        cache = empty;
        return empty;
      });
  }
  return pending;
}

// Start the fetch eagerly so it runs in parallel with React mounting.
// A <link rel="preload"> in the layout head means the browser may already
// have the response in its HTTP cache by the time this fires.
if (typeof window !== 'undefined') {
  load();
}

/**
 * Returns the curriculum tree (modules + ordered lesson IDs) fetched once from
 * a static JSON endpoint and cached for the lifetime of the JS bundle.
 *
 * Returns `null` on the very first render if the JSON has not arrived yet.
 * With the Client Router keeping JS alive across navigations, every subsequent
 * page sees the cached value synchronously.
 */
export function useCurriculumTree(): CurriculumTree | null {
  const [tree, setTree] = useState(cache);

  useEffect(() => {
    if (!tree) {
      load().then(setTree);
    }
  }, [tree]);

  return tree;
}
