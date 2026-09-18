/**
 * Prebuild script: generates static lesson JSON files and the curriculum tree.
 *
 * Run: node --import tsx/esm --import ./scripts/prebuild-register.ts scripts/build-lesson-data.ts
 *
 * Output:
 *   public/data/lessons/{id}.{hash}.json   one file per lesson, content-hashed
 *   public/data/curriculum-tree.json       module/lesson index with dataFile refs
 */

import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { loadEnv } from 'vite';

const env = loadEnv('development', resolve(import.meta.dirname, '..'), ['VITE_', 'SHOW_']);
if (process.env.NODE_ENV === 'production') {
  env.SHOW_UPCOMING_LESSONS = 'false';
}
Object.assign(process.env, env);

import { renderMarkdown } from '@/learn/features/Markdown/renderMarkdown';
import { buildCurriculum, filterVisibleCurriculum } from '@/learn/curriculum/loader';
import { buildTreeModules } from '@/learn/curriculum/buildTreeModules';
import { isProseLesson, toClientLesson } from '@/learn/curriculum/types';
import type { MarkdownSegment } from '@/learn/curriculum/tabBlocks';
import type { Heading } from '@/learn/utils/extractHeadings';
import { extractHeadings } from '@/learn/utils/extractHeadings';

const projectRoot = resolve(import.meta.dirname, '..');
const curriculumRoot = join(projectRoot, 'src', 'learn', 'curriculum');
const lessonsDir = join(curriculumRoot, 'lessons');

function buildMarkdownMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const file of readdirSync(lessonsDir)) {
    if (!file.endsWith('.md')) continue;
    map[`./lessons/${file}`] = readFileSync(join(lessonsDir, file), 'utf-8');
  }
  return map;
}

const SHOW_UPCOMING = process.env.SHOW_UPCOMING_LESSONS === 'true';
const ordering = (await import(`${projectRoot}/src/learn/curriculum/ordering.ts`)).curriculum;
const rawContent = buildCurriculum(ordering, buildMarkdownMap());
const content = filterVisibleCurriculum(
  rawContent,
  process.env.NODE_ENV !== 'production' && SHOW_UPCOMING
);

const outputDir = join(projectRoot, 'public', 'data', 'lessons');
mkdirSync(outputDir, { recursive: true });
// Clear previously generated lesson files.
for (const file of readdirSync(outputDir)) {
  if (file.endsWith('.json')) {
    rmSync(join(outputDir, file));
  }
}

interface LessonPayload {
  lesson: ReturnType<typeof toClientLesson>;
  nextLessonId?: string;
  isLastLesson: boolean;
  instructionsHtml: string;
  segmentHtmls?: string[];
  headings: Heading[];
}

const orderedIds = content.modules.flatMap((m) => m.lessonIds);

for (const lesson of content.lessons) {
  const client = toClientLesson(lesson);
  const idx = orderedIds.indexOf(lesson.id);
  const nextLessonId = orderedIds[idx + 1];
  const isLastLesson = idx === orderedIds.length - 1;
  const instructionsHtml = renderMarkdown(lesson.instructions);
  let segmentHtmls: string[] | undefined;

  if (lesson.instructionSegments) {
    segmentHtmls = lesson.instructionSegments.map((seg: MarkdownSegment | { kind: string }) => {
      return seg.kind === 'markdown' ? renderMarkdown((seg as MarkdownSegment).content) : '';
    });
  }

  const headings: Heading[] = isProseLesson(lesson) ? extractHeadings(lesson.instructions) : [];

  const payload: LessonPayload = {
    lesson: client,
    nextLessonId,
    isLastLesson,
    instructionsHtml,
    segmentHtmls,
    headings,
  };

  const json = JSON.stringify(payload);
  const hash = createHash('sha256').update(json).digest('hex').slice(0, 8);
  const dataFile = `${lesson.id}.${hash}.json`;
  writeFileSync(join(outputDir, dataFile), json);
}

// Write curriculum tree (adds dataFile to each lesson entry).
const treeModules = buildTreeModules(content.modules, content.lessons);
const tree = { modules: treeModules, orderedLessonIds: orderedIds };
writeFileSync(
  join(projectRoot, 'public', 'data', 'curriculum-tree.json'),
  JSON.stringify(tree, null, 2)
);

console.log(`Built ${content.lessons.length} lessons into public/data/`);
