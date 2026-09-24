import { curriculum as defaultOrdering } from '@/curriculum/ordering';

const SHOW_UPCOMING_LESSONS = import.meta.env.SHOW_UPCOMING_LESSONS === 'true';

import { parseJsonWithComments } from '@/curriculum/jsonWithComments';
import { cellIdToLessonCellId, lessonCellIdToCellId } from '@/curriculum/lessonCellId';
import { assertImageAltText, assertSanitizedHtml } from '@/curriculum/sanitize';
import { hasTabBlocks, parseInstructionSegments } from '@/curriculum/tabBlocks';
import { buildModel } from '@/engine/buildModel';
import { validate } from '@/engine/validate';
import { variantRegistry } from '@/variants/registry';
import type {
  InteractiveLessonDefinition,
  ChecklistRequirement,
  LessonBoardConfig,
  LessonConfig,
  LessonDefinition,
  LessonType,
  ModuleDefinition,
  ProseLessonDefinition,
} from '@/curriculum/types';
import type { BoardHighlights } from '@/board/boardTypes';
import type { CellId, SymbolValue, Values, Variant } from '@/engine/types';
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

function parseConfig(configSection: string, lessonId: string): LessonConfig {
  const jsonMatch = /```json\n([\s\S]*?)```/.exec(configSection);
  if (!jsonMatch) {
    throw new Error(`Lesson ${lessonId} # --config-- section must contain a json code block`);
  }
  const raw = parseJsonWithComments(jsonMatch[1]);
  if (!isRecord(raw)) {
    throw new Error(`Lesson ${lessonId} config must be a JSON object`);
  }

  const checklist = parseChecklist(raw.checklist, lessonId);
  const parsedBoard =
    raw.board === undefined ? undefined : parseBoardConfig(raw.board, checklist, lessonId);

  return {
    checklist: parsedBoard?.checklist ?? checklist,
    ...(parsedBoard ? { board: parsedBoard.config } : {}),
  };
}

function parseChecklist(value: unknown, lessonId: string): ChecklistRequirement[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    throw new Error(`Lesson ${lessonId} config.checklist must be an array`);
  }

  return value.map((item, index) => {
    if (!isRecord(item) || typeof item.label !== 'string' || !item.label.trim()) {
      throw new Error(
        `Lesson ${lessonId} config.checklist[${index}].label must be a non-empty string`
      );
    }
    if (item.hint !== undefined && typeof item.hint !== 'string') {
      throw new Error(`Lesson ${lessonId} config.checklist[${index}].hint must be a string`);
    }
    if (item.test !== undefined && !isRecord(item.test)) {
      throw new Error(`Lesson ${lessonId} config.checklist[${index}].test must be an object`);
    }

    return {
      label: item.label,
      ...(item.hint ? { hint: item.hint } : {}),
      test: (item.test as Record<string, unknown> | undefined) ?? {},
    };
  });
}

function parseBoardConfig(
  value: unknown,
  checklist: ChecklistRequirement[],
  lessonId: string
): { config: LessonBoardConfig; checklist: ChecklistRequirement[] } {
  const field = `Lesson ${lessonId} config.board`;
  if (!isRecord(value)) {
    throw new Error(`${field} must be an object`);
  }
  if (typeof value.variant !== 'string' || !value.variant) {
    throw new Error(`${field}.variant must be a registered variant id`);
  }

  const variant = variantRegistry[value.variant];
  if (!variant) {
    throw new Error(`${field}.variant is unknown: ${value.variant}`);
  }
  if (variant.deriveStructure || variant.deriveGutters || value.structure !== undefined) {
    throw new Error(
      `${field}.variant: variant ${variant.id} needs a structure field, which lesson boards don't support yet`
    );
  }

  const unknownKeys = Object.keys(value).filter(
    (key) => !['variant', 'givens', 'solution', 'cellSelection', 'highlights'].includes(key)
  );
  if (unknownKeys.length > 0) {
    throw new Error(`${field}.${unknownKeys[0]} is not supported`);
  }

  const model = buildModel(variant);
  const cellIds = new Set(model.cells.map((cell) => cell.id));
  const givens = parseValueMap(
    value.givens,
    'givens',
    model.cells.map((cell) => cell.id),
    variant,
    field
  );
  const solution = parseValueMap(
    value.solution,
    'solution',
    model.cells.map((cell) => cell.id),
    variant,
    field
  );

  for (const cellId of cellIds) {
    if (!Object.prototype.hasOwnProperty.call(solution, cellId)) {
      throw new Error(`${field}.solution is missing cell ${cellIdToLessonCellId(cellId)}`);
    }
  }
  for (const [cellId, given] of Object.entries(givens)) {
    if (solution[cellId] !== given) {
      throw new Error(`${field}.givens.${cellIdToLessonCellId(cellId)} does not match solution`);
    }
  }

  const solutionValues: Values = new Map(Object.entries(solution));
  const conflicts = validate(solutionValues, model);
  if (conflicts.length > 0) {
    throw new Error(`${field}.solution has conflicts for variant ${variant.id}`);
  }

  const cellSelection = value.cellSelection ?? 'single';
  if (cellSelection !== 'single' && cellSelection !== 'multiple') {
    throw new Error(`${field}.cellSelection must be "single" or "multiple"`);
  }
  const highlights = parseHighlights(value.highlights, field);
  const parsedChecklist = parseBoardChecklist(checklist, cellIds, variant, field);

  return {
    config: {
      variant: variant.id,
      givens,
      solution,
      cellSelection,
      highlights,
    },
    checklist: parsedChecklist,
  };
}

function parseValueMap(
  value: unknown,
  name: 'givens' | 'solution',
  boardCellIds: CellId[],
  variant: Variant,
  field: string
): Record<CellId, SymbolValue> {
  if (!isRecord(value)) {
    throw new Error(`${field}.${name} must be an object keyed by 1-based cell ids`);
  }
  const boardCellIdsSet = new Set(boardCellIds);
  const parsed: Record<CellId, SymbolValue> = {};

  for (const [lessonCellId, symbol] of Object.entries(value)) {
    let cellId: CellId;
    try {
      cellId = lessonCellIdToCellId(lessonCellId);
    } catch {
      throw new Error(`${field}.${name}.${lessonCellId} is not a valid 1-based cell id`);
    }
    if (!boardCellIdsSet.has(cellId)) {
      throw new Error(`${field}.${name}.${lessonCellId} is not on the ${variant.id} board`);
    }
    if (typeof symbol !== 'number' || !variant.symbols.includes(symbol)) {
      throw new Error(`${field}.${name}.${lessonCellId} must be one of the ${variant.id} symbols`);
    }
    parsed[cellId] = symbol;
  }

  return parsed;
}

function parseHighlights(value: unknown, field: string): BoardHighlights {
  if (value === undefined) return {};
  if (!isRecord(value)) {
    throw new Error(`${field}.highlights must be an object`);
  }

  const highlights: BoardHighlights = {};
  for (const [key, enabled] of Object.entries(value)) {
    if (key !== 'peers' && key !== 'sameValue' && key !== 'conflicts') {
      throw new Error(`${field}.highlights.${key} is not supported`);
    }
    if (typeof enabled !== 'boolean') {
      throw new Error(`${field}.highlights.${key} must be a boolean`);
    }
    highlights[key] = enabled;
  }
  return highlights;
}

function parseBoardChecklist(
  checklist: ChecklistRequirement[],
  cellIds: Set<CellId>,
  variant: Variant,
  field: string
): ChecklistRequirement[] {
  return checklist.map((requirement, index) => {
    const { test } = requirement;
    const testField = `${field.replace('config.board', 'config')}.checklist[${index}].test`;
    const kinds = Object.keys(test);
    if (kinds.length !== 1) {
      throw new Error(`${testField} must contain exactly one board test kind`);
    }
    const [kind] = kinds;
    const cells = test[kind];

    if (kind === 'solved') {
      if (cells !== true) throw new Error(`${testField}.solved must be true`);
      return { ...requirement, test: { solved: true } };
    }
    if (kind === 'selected') {
      if (!Array.isArray(cells)) {
        throw new Error(`${testField}.selected must be an array of cell ids`);
      }
      const selected = new Set<CellId>();
      const parsedSelected: CellId[] = [];
      for (const lessonCellId of cells) {
        const cellId = parseTestCellId(lessonCellId, testField, cellIds, kind);
        if (selected.has(cellId)) {
          throw new Error(`${testField}.selected contains duplicate cell ${lessonCellId}`);
        }
        selected.add(cellId);
        parsedSelected.push(cellId);
      }
      return { ...requirement, test: { selected: parsedSelected } };
    }
    if (kind === 'values' || kind === 'candidates') {
      if (!isRecord(cells)) {
        throw new Error(`${testField}.${kind} must be an object keyed by cell ids`);
      }
      const parsedCells: Record<CellId, SymbolValue | SymbolValue[]> = {};
      for (const [lessonCellId, expected] of Object.entries(cells)) {
        const cellId = parseTestCellId(lessonCellId, testField, cellIds, kind);
        let expectedValues: unknown[];
        if (kind === 'candidates') {
          if (!Array.isArray(expected)) {
            throw new Error(`${testField}.candidates.${lessonCellId} must be an array of symbols`);
          }
          expectedValues = expected;
        } else {
          expectedValues = [expected];
        }
        const parsedValues = expectedValues.map((symbol): SymbolValue => {
          if (typeof symbol !== 'number' || !variant.symbols.includes(symbol)) {
            throw new Error(`${testField}.${kind}.${lessonCellId} must use ${variant.id} symbols`);
          }
          return symbol;
        });
        if (kind === 'candidates' && new Set(parsedValues).size !== parsedValues.length) {
          throw new Error(`${testField}.candidates.${lessonCellId} must not contain duplicates`);
        }
        parsedCells[cellId] = kind === 'candidates' ? parsedValues : parsedValues[0];
      }
      return { ...requirement, test: { [kind]: parsedCells } };
    }
    throw new Error(`${testField} has unsupported board test kind "${kind}"`);
  });
}

function parseTestCellId(
  value: unknown,
  field: string,
  cellIds: Set<CellId>,
  kind: string
): CellId {
  if (typeof value !== 'string') {
    throw new Error(`${field}.${kind} must use string cell ids`);
  }
  let cellId: CellId;
  try {
    cellId = lessonCellIdToCellId(value);
  } catch {
    throw new Error(`${field}.${kind} contains invalid cell id "${value}"`);
  }
  if (!cellIds.has(cellId)) {
    throw new Error(`${field}.${kind} cell "${value}" is not on the board`);
  }
  return cellId;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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
  assertImageAltText(instructions, id);
  assertSanitizedHtml(instructions, id);

  const hasConfig = Boolean(sections['config']);
  const hasFiles = Boolean(sections['files']);

  if (hasConfig || (layoutType === 'interactive' && hasFiles)) {
    const files = hasFiles ? parseFiles(sections['files']) : {};
    const config = hasConfig ? parseConfig(sections['config'], id) : { checklist: [] };

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
