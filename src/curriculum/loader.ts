import { curriculum as defaultOrdering } from '@/curriculum/ordering';

const SHOW_UPCOMING_LESSONS = import.meta.env.SHOW_UPCOMING_LESSONS === 'true';

import { assertSanitizedHtml } from '@/curriculum/sanitize';
import { hasTabBlocks, parseInstructionSegments } from '@/curriculum/tabBlocks';
import type {
  InteractiveLessonDefinition,
  ChecklistRequirement,
  LessonConfig,
  LessonDefinition,
  LessonType,
  ModuleDefinition,
  ProseLessonDefinition,
} from '@/curriculum/types';
import type { OrderingModule } from '@/curriculum/orderingTypes';

export type { LessonEntry, OrderingModule } from '@/curriculum/orderingTypes';

export interface CurriculumContent {
  lessons: LessonDefinition[];
  modules: ModuleDefinition[];
}

export type MarkdownModuleMap = Record<string, string>;

const KNOWN_SECTIONS = new Set(['instructions', 'files', 'config', 'author-notes']);

type RawMarkdownModule = string | { default: string };

const markdownModules = normalizeMarkdownModules(
  import.meta.glob('./lessons/*.md', { query: '?raw', import: 'default', eager: true }) as Record<
    string,
    RawMarkdownModule
  >
);

let lessonsByIdCache: Map<string, LessonDefinition> | undefined;

export function loadCurriculum(): CurriculumContent {
  return filterVisibleCurriculum(
    loadFullCurriculum(),
    import.meta.env.DEV && SHOW_UPCOMING_LESSONS
  );
}

export function loadFullCurriculum(): CurriculumContent {
  return buildCurriculum(defaultOrdering, markdownModules);
}

export function filterVisibleCurriculum(
  content: CurriculumContent,
  showUpcoming: boolean
): CurriculumContent {
  if (showUpcoming) return content;
  const modules = content.modules.filter((m) => !m.wip);
  const visibleIds = new Set(modules.flatMap((m) => m.lessonIds));
  const lessons = content.lessons.filter((l) => visibleIds.has(l.id));
  return { lessons, modules };
}

export function getLessonById(id: string): LessonDefinition | undefined {
  if (!lessonsByIdCache) {
    lessonsByIdCache = new Map(loadFullCurriculum().lessons.map((l) => [l.id, l]));
  }
  return lessonsByIdCache.get(id);
}

export function buildCurriculum(
  ordering: readonly OrderingModule[],
  markdownByPath: MarkdownModuleMap
): CurriculumContent {
  const lessonIndexByFile = new Map<string, number>();
  let globalIndex = 1;

  const lessons: LessonDefinition[] = [];
  const modules: ModuleDefinition[] = [];

  for (const orderModule of ordering) {
    const moduleWip = orderModule.wip === true;
    const lessonIds: string[] = [];

    for (const entry of orderModule.lessons) {
      const file = typeof entry === 'string' ? entry : entry.file;
      const entryWip = typeof entry === 'string' ? false : entry.wip === true;
      const path = `./lessons/${file}`;
      const raw = markdownByPath[path];

      if (!raw) {
        throw new Error(`Lesson file not found in markdownByPath: ${path}`);
      }

      const lessonIndex = lessonIndexByFile.get(file) ?? globalIndex++;
      lessonIndexByFile.set(file, lessonIndex);

      const lesson = parseLesson(raw, orderModule.module, lessonIndex, moduleWip || entryWip);
      lessons.push(lesson);
      lessonIds.push(lesson.id);
    }

    modules.push({
      module: orderModule.module,
      slug: orderModule.slug,
      title: orderModule.title,
      lessonIds,
      wip: moduleWip,
    });
  }

  return { lessons, modules };
}

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

function normalizeMarkdownModules(raw: Record<string, RawMarkdownModule>): MarkdownModuleMap {
  return Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [
      key,
      typeof value === 'string' ? value : value.default,
    ])
  );
}

function parseFrontmatter(source: string): { body: string; meta: Record<string, string> } {
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(source);
  if (!match) return { body: source, meta: {} };

  const meta: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const kv = /^(\w+):\s*(.+)$/.exec(line);
    if (kv) {
      meta[kv[1]] = kv[2].replace(/^['"]|['"]$/g, '').trim();
    }
  }
  return { body: source.slice(match[0].length), meta };
}

function parseSections(body: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const sectionRe = /^# --(\w[\w-]*)--$/gm;
  let lastKey: string | null = null;
  let lastEnd = 0;

  for (const match of body.matchAll(sectionRe)) {
    if (lastKey !== null) {
      sections[lastKey] = body.slice(lastEnd, match.index).trim();
    }
    lastKey = match[1];
    lastEnd = match.index + match[0].length + 1;
  }

  if (lastKey !== null) {
    sections[lastKey] = body.slice(lastEnd).trim();
  }

  for (const key of Object.keys(sections)) {
    if (!KNOWN_SECTIONS.has(key)) {
      throw new Error(`Unknown lesson section: # --${key}--`);
    }
  }

  return sections;
}

function parseFiles(filesSection: string): Record<string, string> {
  const files: Record<string, string> = {};
  const fileRe = /^## (.+)$/gm;
  let lastName: string | null = null;
  let lastEnd = 0;

  for (const match of filesSection.matchAll(fileRe)) {
    if (lastName !== null) {
      const block = filesSection.slice(lastEnd, match.index).trim();
      files[lastName] = extractFencedContent(block);
    }
    lastName = match[1].trim();
    lastEnd = match.index + match[0].length + 1;
  }

  if (lastName !== null) {
    const block = filesSection.slice(lastEnd).trim();
    files[lastName] = extractFencedContent(block);
  }

  return files;
}

function extractFencedContent(block: string): string {
  const match = /^```[^\n]*\n([\s\S]*?)```$/m.exec(block);
  return match ? match[1] : block;
}

function parseConfig(configSection: string): LessonConfig {
  const jsonMatch = /```json\n([\s\S]*?)```/.exec(configSection);
  if (!jsonMatch) {
    throw new Error('# --config-- section must contain a JSON code block');
  }
  const raw = JSON.parse(jsonMatch[1]) as {
    checklist?: Array<{ label: string; hint?: string; test?: Record<string, unknown> }>;
  };

  const checklist: ChecklistRequirement[] = (raw.checklist ?? []).map((item) => ({
    label: item.label,
    ...(item.hint ? { hint: item.hint } : {}),
    test: item.test ?? {},
  }));

  return { checklist };
}

function parseLesson(
  source: string,
  module: number,
  lesson: number,
  wip: boolean
): LessonDefinition {
  const { body, meta } = parseFrontmatter(source);

  const id = meta.id;
  const title = meta.title;
  const type = (meta.type ?? 'learn') as LessonType;
  const layoutType = meta.layoutType as 'article' | 'interactive' | undefined;

  if (!id || !title) {
    throw new Error(`Lesson is missing required frontmatter fields: id=${id}, title=${title}`);
  }

  const sections = parseSections(body);
  const instructions = sections['instructions'] ?? '';
  assertSanitizedHtml(instructions, id);

  const hasConfig = Boolean(sections['config']);
  const hasFiles = Boolean(sections['files']);

  if (hasConfig || (layoutType === 'interactive' && hasFiles)) {
    const files = hasFiles ? parseFiles(sections['files']) : {};
    const config = hasConfig ? parseConfig(sections['config']) : { checklist: [] };

    const def: InteractiveLessonDefinition = {
      id,
      module,
      lesson,
      type,
      title,
      instructions,
      files,
      config,
      wip: wip || undefined,
      layoutType: 'interactive',
    };

    if (hasTabBlocks(instructions)) {
      (def as unknown as Record<string, unknown>).instructionSegments = parseInstructionSegments(
        instructions,
        id
      );
    }

    return def;
  }

  const def: ProseLessonDefinition = {
    id,
    module,
    lesson,
    type,
    title,
    instructions,
    wip: wip || undefined,
    layoutType: 'article',
  };

  if (hasTabBlocks(instructions)) {
    def.instructionSegments = parseInstructionSegments(instructions, id);
  }

  return def;
}
