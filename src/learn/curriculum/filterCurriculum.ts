import type { CurriculumTreeModule } from '@/learn/features/CurriculumTree/CurriculumTree';

/**
 * Parses a "#"-prefixed shorthand like "#101" or "#611" into module/lesson coordinates.
 * Format: # + module number + 2-digit 1-indexed lesson number (e.g. #101 = module 1, lesson 1).
 * The "#" prefix distinguishes this from a normal text search.
 */
function parsePositionShorthand(query: string): { moduleNumber: number; lessonNumber: number } | null {
  if (!/^#\d{3,}$/.test(query)) {
    return null;
  }
  const digits = query.slice(1);
  const moduleNumber = parseInt(digits.slice(0, -2), 10);
  const lessonNumber = parseInt(digits.slice(-2), 10);
  if (moduleNumber < 1 || lessonNumber < 1) {
    return null;
  }
  return { moduleNumber, lessonNumber };
}

export function filterCurriculum(modules: CurriculumTreeModule[], query: string): CurriculumTreeModule[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return modules;
  }

  const position = parsePositionShorthand(normalizedQuery);
  if (position) {
    return modules
      .map((module, index) => {
        const moduleNum = module.number ?? index + 1;
        if (moduleNum !== position.moduleNumber) {
          return { ...module, lessons: [] };
        }
        const lesson = module.lessons[position.lessonNumber - 1];
        return { ...module, lessons: lesson ? [lesson] : [] };
      })
      .filter((module) => module.lessons.length > 0);
  }

  return modules
    .map((module) => ({
      ...module,
      lessons: module.lessons.filter((lesson) => lesson.id.toLowerCase().includes(normalizedQuery) || lesson.title.toLowerCase().includes(normalizedQuery)),
    }))
    .filter((module) => module.lessons.length > 0);
}
