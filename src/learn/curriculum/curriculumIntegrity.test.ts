import { describe, expect, it } from 'vitest';
import { loadFullCurriculum } from '@/learn/curriculum/loader';

const { lessons, modules } = loadFullCurriculum();

describe('curriculum integrity', () => {
  it('should load at least one lesson', () => {
    expect(lessons.length).toBeGreaterThan(0);
  });

  it('should have unique lesson IDs', () => {
    const ids = lessons.map((l) => l.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('should have required frontmatter on every lesson', () => {
    const broken = lessons.filter((l) => !l.id || !l.title || !l.type);
    expect(broken.map((l) => l.id)).toEqual([]);
  });

  it('should reference only lessons that exist', () => {
    const lessonIds = new Set(lessons.map((l) => l.id));
    const broken = modules.flatMap((m) => m.lessonIds.filter((id) => !lessonIds.has(id)).map((id) => `module ${m.module}: ${id}`));
    expect(broken).toEqual([]);
  });

  it('should start every checklist hint with "You can" or "You should"', () => {
    const broken = lessons.flatMap((lesson) => {
      if (!lesson.config) return [];
      return lesson.config.checklist.flatMap((req) => {
        const { hint } = req;
        return hint && !/^You (?:can|should)\b/.test(hint) ? [`${lesson.id} item "${req.label}" has hint "${hint}"`] : [];
      });
    });
    expect(broken.join('\n')).toBe('');
  });
});
