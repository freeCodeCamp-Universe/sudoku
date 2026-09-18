import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { CurriculumTree } from '@/learn/curriculum/useCurriculumTree';
import type { LessonData } from '@/learn/hooks/useLessonData';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockUseCurriculumTree = vi.fn<() => CurriculumTree | null>();

vi.mock('@/curriculum/useCurriculumTree', () => ({
  useCurriculumTree: (...args: unknown[]) => mockUseCurriculumTree(...(args as [])),
}));

function makeLessonData(id: string): LessonData {
  return {
    lesson: { id, module: 1, lesson: 1, title: `Lesson ${id}`, type: 'learn' as const },
    isLastLesson: false,
    instructionsHtml: '<p>hi</p>',
    headings: [],
  } as LessonData;
}

function makeTree(lessons: { id: string; dataFile: string }[]): CurriculumTree {
  return {
    modules: [{ slug: 'mod-1', title: 'Module 1', lessons: lessons.map((l) => ({ id: l.id, title: `Lesson ${l.id}`, dataFile: l.dataFile })) }],
    orderedLessonIds: lessons.map((l) => l.id),
  };
}

// Each test group uses a unique ID prefix to avoid module-level cache collisions.
let idCounter = 0;
function uid(): string {
  idCounter += 1;
  return `lesson-${idCounter}`;
}

// ---------------------------------------------------------------------------
// Fetch stub
// ---------------------------------------------------------------------------

let fetchResponses: Map<string, { data?: LessonData; error?: boolean }>;
let fetchCalls: string[];

function stubFetch() {
  fetchCalls = [];
  fetchResponses = new Map();

  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      fetchCalls.push(url);
      const match = [...fetchResponses.entries()].find(([key]) => url.includes(key));
      if (match && !match[1].error) {
        return Promise.resolve({ json: () => Promise.resolve(match[1].data) });
      }
      return Promise.reject(new Error('fetch failed'));
    })
  );
}

function registerFetch(dataFile: string, data: LessonData) {
  fetchResponses.set(dataFile, { data });
}

function registerFetchError(dataFile: string) {
  fetchResponses.set(dataFile, { error: true });
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

// Module-level cache in useLessonData persists across tests. We use unique IDs
// per test to avoid collisions, and resetModules + re-import for the few tests
// that need a truly clean cache.

let useLessonData: typeof import('./useLessonData').useLessonData;
let prefetchLesson: typeof import('./useLessonData').prefetchLesson;

beforeEach(async () => {
  vi.resetModules();
  stubFetch();
  const mod = await import('./useLessonData');
  useLessonData = mod.useLessonData;
  prefetchLesson = mod.prefetchLesson;
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useLessonData', () => {
  it('should return loading state while tree is null', () => {
    mockUseCurriculumTree.mockReturnValue(null);
    const id = uid();
    const { result } = renderHook(() => useLessonData(id));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe(false);
  });

  it('should fetch and return lesson data once tree is available', async () => {
    const id = uid();
    const dataFile = `${id}.abc123.json`;
    const tree = makeTree([{ id, dataFile }]);
    const data = makeLessonData(id);
    registerFetch(dataFile, data);
    mockUseCurriculumTree.mockReturnValue(tree);

    const { result } = renderHook(() => useLessonData(id));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(data);
    expect(result.current.error).toBe(false);
    expect(fetchCalls).toHaveLength(1);
    expect(fetchCalls[0]).toContain(dataFile);
  });

  it('should set error when lesson ID is not in the tree', async () => {
    const id = uid();
    const tree = makeTree([]);
    mockUseCurriculumTree.mockReturnValue(tree);

    const { result } = renderHook(() => useLessonData(id));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(true);
    expect(result.current.data).toBeNull();
  });

  it('should set error when fetch fails', async () => {
    const id = uid();
    const dataFile = `${id}.abc.json`;
    const tree = makeTree([{ id, dataFile }]);
    registerFetchError(dataFile);
    mockUseCurriculumTree.mockReturnValue(tree);

    const { result } = renderHook(() => useLessonData(id));

    await waitFor(() => {
      expect(result.current.error).toBe(true);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
  });

  it('should serve from cache on the second render with the same lesson ID', async () => {
    const id = uid();
    const dataFile = `${id}.abc.json`;
    const tree = makeTree([{ id, dataFile }]);
    const data = makeLessonData(id);
    registerFetch(dataFile, data);
    mockUseCurriculumTree.mockReturnValue(tree);

    // First render: fetches.
    const { result, unmount } = renderHook(() => useLessonData(id));
    await waitFor(() => expect(result.current.data).toEqual(data));
    expect(fetchCalls).toHaveLength(1);
    unmount();

    // Second render: cache hit, no new fetch.
    const { result: result2 } = renderHook(() => useLessonData(id));
    expect(result2.current.data).toEqual(data);
    expect(result2.current.loading).toBe(false);
    expect(fetchCalls).toHaveLength(1);
  });

  it('should prefetch the next lesson after the current one loads', async () => {
    const id1 = uid();
    const id2 = uid();
    const df1 = `${id1}.abc.json`;
    const df2 = `${id2}.def.json`;
    const tree = makeTree([
      { id: id1, dataFile: df1 },
      { id: id2, dataFile: df2 },
    ]);
    registerFetch(df1, makeLessonData(id1));
    registerFetch(df2, makeLessonData(id2));
    mockUseCurriculumTree.mockReturnValue(tree);

    const { result } = renderHook(() => useLessonData(id1));
    await waitFor(() => expect(result.current.data).not.toBeNull());

    // The prefetch of the next lesson should have been triggered.
    await waitFor(() => {
      expect(fetchCalls).toHaveLength(2);
    });
    expect(fetchCalls[0]).toContain(df1);
    expect(fetchCalls[1]).toContain(df2);
  });

  it('should prefetch the next lesson even on a cache hit (sequential chain)', async () => {
    const id1 = uid();
    const id2 = uid();
    const id3 = uid();
    const df1 = `${id1}.abc.json`;
    const df2 = `${id2}.def.json`;
    const df3 = `${id3}.ghi.json`;
    const tree = makeTree([
      { id: id1, dataFile: df1 },
      { id: id2, dataFile: df2 },
      { id: id3, dataFile: df3 },
    ]);
    registerFetch(df1, makeLessonData(id1));
    registerFetch(df2, makeLessonData(id2));
    registerFetch(df3, makeLessonData(id3));
    mockUseCurriculumTree.mockReturnValue(tree);

    // Render lesson 1, which fetches lesson 1 and prefetches lesson 2.
    const { result, rerender } = renderHook(({ id }) => useLessonData(id), {
      initialProps: { id: id1 },
    });
    await waitFor(() => expect(result.current.data?.lesson.id).toBe(id1));
    await waitFor(() => expect(fetchCalls).toHaveLength(2));

    // Navigate to lesson 2. It's already cached from the prefetch.
    // The fix ensures lesson 3 is prefetched from this cache-hit path.
    rerender({ id: id2 });
    await waitFor(() => expect(result.current.data?.lesson.id).toBe(id2));
    expect(result.current.loading).toBe(false);

    // Lesson 3 should be prefetched even though lesson 2 was a cache hit.
    await waitFor(() => {
      expect(fetchCalls).toHaveLength(3);
    });
    expect(fetchCalls[2]).toContain(df3);
  });

  it('should not prefetch when the current lesson is the last one', async () => {
    const id = uid();
    const df = `${id}.abc.json`;
    const tree = makeTree([{ id, dataFile: df }]);
    registerFetch(df, makeLessonData(id));
    mockUseCurriculumTree.mockReturnValue(tree);

    const { result } = renderHook(() => useLessonData(id));
    await waitFor(() => expect(result.current.data).not.toBeNull());

    // Only one fetch (the current lesson), no prefetch.
    expect(fetchCalls).toHaveLength(1);
  });

  it('should fetch when lessonId changes to an uncached lesson', async () => {
    const id1 = uid();
    const id2 = uid();
    const df1 = `${id1}.abc.json`;
    const df2 = `${id2}.def.json`;
    // Non-sequential: tree only has id2, so id1's prefetch won't cover id2
    // in the ordering sense if they aren't adjacent. But simpler: just use
    // a tree where they are NOT adjacent (put a gap).
    const idGap = uid();
    const dfGap = `${idGap}.gap.json`;
    const tree = makeTree([
      { id: id1, dataFile: df1 },
      { id: idGap, dataFile: dfGap },
      { id: id2, dataFile: df2 },
    ]);
    registerFetch(df1, makeLessonData(id1));
    registerFetch(dfGap, makeLessonData(idGap));
    registerFetch(df2, makeLessonData(id2));
    mockUseCurriculumTree.mockReturnValue(tree);

    const { result, rerender } = renderHook(({ id }) => useLessonData(id), {
      initialProps: { id: id1 },
    });
    await waitFor(() => expect(result.current.data?.lesson.id).toBe(id1));

    // Jump to id2 (skipping idGap), which won't be cached.
    rerender({ id: id2 });
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.data?.lesson.id).toBe(id2);
    });
    expect(result.current.loading).toBe(false);
  });
});

describe('prefetchLesson', () => {
  it('should fetch the lesson and cache it for later use', async () => {
    const id = uid();
    const df = `${id}.abc.json`;
    const tree = makeTree([{ id, dataFile: df }]);
    const data = makeLessonData(id);
    registerFetch(df, data);
    mockUseCurriculumTree.mockReturnValue(tree);

    prefetchLesson(id, tree);

    // Wait for fetch to complete.
    await waitFor(() => expect(fetchCalls).toHaveLength(1));
    expect(fetchCalls[0]).toContain(df);

    // Now use the hook; it should serve from cache with no additional fetch.
    const { result } = renderHook(() => useLessonData(id));
    expect(result.current.data).toEqual(data);
    expect(result.current.loading).toBe(false);
    expect(fetchCalls).toHaveLength(1);
  });

  it('should no-op when the lesson is already cached', async () => {
    const id = uid();
    const df = `${id}.abc.json`;
    const tree = makeTree([{ id, dataFile: df }]);
    registerFetch(df, makeLessonData(id));
    mockUseCurriculumTree.mockReturnValue(tree);

    prefetchLesson(id, tree);
    await waitFor(() => expect(fetchCalls).toHaveLength(1));

    // Second call should not trigger another fetch.
    prefetchLesson(id, tree);
    expect(fetchCalls).toHaveLength(1);
  });

  it('should no-op when the lesson ID is not in the tree', () => {
    const tree = makeTree([]);
    prefetchLesson('nonexistent', tree);
    expect(fetchCalls).toHaveLength(0);
  });
});
