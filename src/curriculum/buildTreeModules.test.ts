import { describe, expect, it } from 'vitest';
import { buildTreeModules } from '@/curriculum/buildTreeModules';
import type { LessonDefinition, ModuleDefinition } from '@/curriculum/types';

const lessons: LessonDefinition[] = [
  {
    id: 'lesson-1',
    module: 1,
    lesson: 1,
    type: 'learn',
    title: 'First lesson',
    instructions: 'Instructions',
  },
];

const modules: ModuleDefinition[] = [
  {
    module: 1,
    slug: 'module-1',
    title: 'Module 1',
    lessonIds: ['lesson-1'],
    wip: false,
  },
];

describe('buildTreeModules', () => {
  it('should include generated lesson data filenames', () => {
    const result = buildTreeModules(
      modules,
      lessons,
      new Map([['lesson-1', 'lesson-1.abc123.json']])
    );

    expect(result[0].lessons[0]).toEqual({
      id: 'lesson-1',
      title: 'First lesson',
      dataFile: 'lesson-1.abc123.json',
    });
  });
});
