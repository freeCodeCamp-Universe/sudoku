export type LessonEntry = string | { file: string; wip: true };

export interface OrderingModule {
  module: number;
  slug: string;
  title: string;
  lessons: LessonEntry[];
  wip?: boolean;
}
