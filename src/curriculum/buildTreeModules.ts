import type { CurriculumTreeModule } from '@/learn/CurriculumTree/CurriculumTree';
import type { LessonDefinition, ModuleDefinition } from '@/curriculum/types';

export function buildTreeModules(
  modules: ModuleDefinition[],
  lessons: LessonDefinition[],
  dataFileById: ReadonlyMap<string, string> = new Map()
): CurriculumTreeModule[] {
  const titleById = new Map(lessons.map((lesson) => [lesson.id, lesson.title]));
  return modules.map((module, index) => ({
    number: index + 1,
    slug: module.slug,
    title: module.title,
    lessons: module.lessonIds.map((id) => ({
      id,
      title: titleById.get(id) ?? id,
      dataFile: dataFileById.get(id),
    })),
  }));
}
