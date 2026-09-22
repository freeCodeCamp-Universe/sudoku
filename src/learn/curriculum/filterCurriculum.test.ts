import { describe, expect, it } from 'vitest';
import { filterCurriculum } from '@/learn/curriculum/filterCurriculum';
import type { CurriculumTreeModule } from '@/learn/CurriculumTree/CurriculumTree';

const modules: CurriculumTreeModule[] = [
  {
    number: 1,
    slug: 'modes',
    title: 'Modes',
    lessons: [
      { id: 'insert-mode', title: 'Enter insert mode' },
      { id: 'save-quit', title: 'Save and quit' },
    ],
  },
  {
    number: 2,
    slug: 'navigation',
    title: 'Navigation',
    lessons: [{ id: 'word-motions', title: 'Word motions' }],
  },
  {
    number: 6,
    slug: 'advanced',
    title: 'Advanced',
    lessons: Array.from({ length: 12 }, (_, i) => ({
      id: `advanced-${i + 1}`,
      title: `Advanced lesson ${i + 1}`,
    })),
  },
];

describe('filterCurriculum', () => {
  it('should match lesson titles and IDs case-insensitively', () => {
    expect(filterCurriculum(modules, 'INSERT')).toEqual([
      { ...modules[0], lessons: [modules[0].lessons[0]] },
    ]);
    expect(filterCurriculum(modules, 'word-motions')).toEqual([
      { ...modules[1], lessons: [modules[1].lessons[0]] },
    ]);
  });

  it('should keep all modules and lessons for an empty query', () => {
    expect(filterCurriculum(modules, '  ')).toBe(modules);
  });

  it('should remove modules without matching lessons', () => {
    expect(filterCurriculum(modules, 'missing')).toEqual([]);
  });

  describe('position shorthand (e.g. "#101", "#611")', () => {
    it('should match a specific lesson by module and 1-based position', () => {
      expect(filterCurriculum(modules, '#101')).toEqual([
        { ...modules[0], lessons: [modules[0].lessons[0]] },
      ]);
      expect(filterCurriculum(modules, '#102')).toEqual([
        { ...modules[0], lessons: [modules[0].lessons[1]] },
      ]);
    });

    it('should handle lesson numbers >= 10 (last two digits)', () => {
      expect(filterCurriculum(modules, '#611')).toEqual([
        { ...modules[2], lessons: [modules[2].lessons[10]] },
      ]);
      expect(filterCurriculum(modules, '#612')).toEqual([
        { ...modules[2], lessons: [modules[2].lessons[11]] },
      ]);
    });

    it('should return empty when the lesson index is out of bounds', () => {
      expect(filterCurriculum(modules, '#103')).toEqual([]);
    });

    it('should return empty when the module number does not exist', () => {
      expect(filterCurriculum(modules, '#301')).toEqual([]);
    });

    it('should not activate without the "#" prefix', () => {
      // bare digits fall through to normal text search
      expect(filterCurriculum(modules, '101')).toEqual([]);
    });

    it('should not activate when the digit part is shorter than 3 digits', () => {
      expect(filterCurriculum(modules, '#55')).toEqual([]);
    });

    it('should not activate when the lesson part is "00"', () => {
      // lessonNumber 0 is invalid — fall through to text search
      expect(filterCurriculum(modules, '#100')).toEqual([]);
    });

    it('should use module.number when present, not array index', () => {
      // modules[2] has number:6, so "#601" should find its first lesson
      expect(filterCurriculum(modules, '#601')).toEqual([
        { ...modules[2], lessons: [modules[2].lessons[0]] },
      ]);
    });

    it('should fall back to index+1 when module.number is absent', () => {
      const noNumberModules: CurriculumTreeModule[] = [
        {
          slug: 'a',
          title: 'A',
          lessons: [{ id: 'a1', title: 'A lesson 1' }],
        },
      ];
      // Without number, module is treated as #1 (index 0 + 1)
      expect(filterCurriculum(noNumberModules, '#101')).toEqual([
        { ...noNumberModules[0], lessons: [noNumberModules[0].lessons[0]] },
      ]);
    });
  });
});
