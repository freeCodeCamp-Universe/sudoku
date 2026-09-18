import type { InstructionSegment, TabGroupSegment } from '@/learn/curriculum/tabBlocks';

/**
 * A lesson's pedagogical category. Drives curriculum grouping and UI wording only;
 * does not determine how validation works.
 */
export type LessonType = 'intro' | 'learn' | 'practice' | 'review';

/**
 * Layout mode for a lesson. Set explicitly in frontmatter.
 * 'article' → centered prose column.
 * 'interactive' → split panel with checklist + interactive panel.
 */
export type LayoutType = 'article' | 'interactive';

interface LessonIdentity {
  id: string;
  module: number;
  lesson: number;
  type: LessonType;
  title: string;
  layoutType?: LayoutType;
  wip?: boolean;
}

export interface ChecklistRequirement {
  label: string;
  hint?: string;
  /** Engine-specific test definition — opaque to the curriculum layer. */
  test: Record<string, unknown>;
}

export interface LessonConfig {
  checklist: ChecklistRequirement[];
}

export interface ProseLessonDefinition extends LessonIdentity {
  instructions: string;
  instructionSegments?: InstructionSegment[];
  config?: never;
  files?: never;
}

export interface InteractiveLessonDefinition extends LessonIdentity {
  instructions: string;
  files: Record<string, string>;
  config: LessonConfig;
}

export type LessonDefinition = InteractiveLessonDefinition | ProseLessonDefinition;

export function isProseLesson(
  lesson: LessonDefinition | ClientLessonDefinition
): lesson is ProseLessonDefinition | ClientProseLessonDefinition {
  return lesson.config === undefined;
}

export function isInteractiveLesson(
  lesson: LessonDefinition | ClientLessonDefinition
): lesson is InteractiveLessonDefinition | ClientInteractiveLessonDefinition {
  return lesson.config !== undefined;
}

export interface ClientMarkdownSegment {
  kind: 'markdown';
}

export type ClientInstructionSegment = ClientMarkdownSegment | TabGroupSegment;

export interface ClientProseLessonDefinition extends LessonIdentity {
  instructionSegments?: ClientInstructionSegment[];
  config?: never;
  files?: never;
}

export interface ClientInteractiveLessonDefinition extends LessonIdentity {
  files: Record<string, string>;
  config: LessonConfig;
}

export type ClientLessonDefinition =
  | ClientInteractiveLessonDefinition
  | ClientProseLessonDefinition;

export function toClientLesson(lesson: LessonDefinition): ClientLessonDefinition {
  if (isProseLesson(lesson)) {
    const { instructions, instructionSegments, ...rest } = lesson;
    void instructions;
    const clientSegments = instructionSegments?.map(
      (seg): ClientInstructionSegment => (seg.kind === 'markdown' ? { kind: 'markdown' } : seg)
    );
    return { ...rest, instructionSegments: clientSegments };
  }
  const { instructions, ...rest } = lesson;
  void instructions;
  return rest;
}

export interface ModuleDefinition {
  module: number;
  slug: string;
  title: string;
  lessonIds: string[];
  wip: boolean;
}
