/**
 * Add a curriculum lesson.
 *
 * One-liner:
 *   pnpm add-lesson --module=1 --title="New lesson"
 *   pnpm add-lesson --module=1 --title="New lesson" --before=103.md
 *
 * With no arguments, the script asks for the same values interactively.
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import process from 'node:process';
import { join, resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const orderingPath = join(projectRoot, 'src', 'learn', 'curriculum', 'ordering.ts');
const lessonsDir = join(projectRoot, 'src', 'learn', 'curriculum', 'lessons');

type LessonType = 'learn' | 'practice';

function fail(message: string): never {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function flags(): Partial<Record<'module' | 'title' | 'type' | 'before' | 'after', string>> {
  const result: Partial<Record<'module' | 'title' | 'type' | 'before' | 'after', string>> = {};
  for (const arg of process.argv.slice(2)) {
    const match = /^--(module|title|type|before|after)=(.*)$/.exec(arg);
    if (match) result[match[1] as keyof typeof result] = match[2];
  }
  return result;
}

function escapeSingleQuotes(value: string): string {
  return value.replaceAll("'", "\\'");
}

function nextLessonNumber(moduleNumber: number): number {
  const prefix = moduleNumber * 100;
  const existing = readdirSync(lessonsDir)
    .map((file) => Number(file.replace('.md', '')))
    .filter((number) => number >= prefix && number < prefix + 100)
    .filter(Number.isInteger)
    .sort((a, b) => a - b);
  for (let number = prefix + 1; number < prefix + 100; number++) {
    if (!existing.includes(number)) return number;
  }
  fail(`Module ${moduleNumber} has no available lesson slots`);
}

function moduleBlock(ordering: string, moduleNumber: number): string {
  const pattern = new RegExp(
    ` {2}\\\\{\\\\n(?:(?! {2}\\\\{\\\\n)[\\\\s\\\\S])*?module:\\\\s*${moduleNumber},[\\\\s\\\\S]*?\\\\n {2}\\\\},`
  );
  const match = pattern.exec(ordering);
  if (!match) fail(`Module ${moduleNumber} not found in ordering.ts`);
  return match[0];
}

function lessonFile(entry: string): string {
  const object = /\{\s*file:\s*'([^']+)'/.exec(entry);
  return object?.[1] ?? entry.match(/'([^']+)'/)?.[1] ?? entry.trim();
}

function insertIntoOrdering(
  ordering: string,
  moduleNumber: number,
  file: string,
  before?: string,
  after?: string
): string {
  const block = moduleBlock(ordering, moduleNumber);
  const lessonsMatch = /( {4}lessons: \[[\s\S]*?\n {4}\])/.exec(block);
  if (!lessonsMatch) fail(`lessons array not found in module ${moduleNumber}`);

  const lessonsBlock = lessonsMatch[1];
  const entries = [...lessonsBlock.matchAll(/^\s{6}(.*?)(?=,?$)/gm)]
    .map((match) => match[1].trim())
    .filter(Boolean);
  const target = before ?? after;
  const targetIndex = target ? entries.findIndex((entry) => lessonFile(entry) === target) : -1;
  if (target && targetIndex === -1) fail(`Lesson ${target} not found in module ${moduleNumber}`);

  const insertionIndex = before
    ? targetIndex
    : after
      ? targetIndex + 1
      : Math.max(entries.length - 1, 0);
  const lines = lessonsBlock.split('\n');
  const entryLine = `      { file: '${file}', wip: true },`;
  const lineIndex = insertionIndex + 1;
  lines.splice(lineIndex, 0, entryLine);
  const updatedBlock = lines.join('\n');
  return ordering.replace(lessonsBlock, updatedBlock);
}

const prompt = createInterface({ input: process.stdin, output: process.stdout });

async function main() {
  const provided = flags();
  const interactive = process.argv.length === 2;
  const moduleValue = interactive
    ? await prompt.question('Module number: ')
    : (provided.module ?? '');
  const title = interactive ? await prompt.question('Lesson title: ') : (provided.title ?? '');
  const typeValue = interactive
    ? await prompt.question('Type (learn/practice) [learn]: ')
    : (provided.type ?? 'learn');
  const placementMode = interactive
    ? (
        await prompt.question('Placement (before, after, or before-review) [before-review]: ')
      ).trim() || 'before-review'
    : '';
  const placementTarget =
    interactive && placementMode !== 'before-review'
      ? (await prompt.question(`Lesson filename to insert ${placementMode}: `)).trim()
      : '';

  if (!/^\d+$/.test(moduleValue.trim()) || !title.trim()) {
    fail(
      'Usage: pnpm add-lesson --module=<N> --title="<title>" [--type=<learn|practice>] [--before=<file>|--after=<file>]'
    );
  }
  const type = typeValue.trim() || 'learn';
  if (!['learn', 'practice'].includes(type)) fail('--type must be learn or practice');
  if (provided.before && provided.after) fail('Use only one of --before or --after');
  if (!existsSync(lessonsDir)) fail(`Lessons directory not found: ${lessonsDir}`);

  const moduleNumber = Number(moduleValue);
  const file = `${nextLessonNumber(moduleNumber)}.md`;
  const id = randomBytes(12).toString('hex');
  writeFileSync(
    join(lessonsDir, file),
    `---\nid: ${id}\ntitle: '${escapeSingleQuotes(title.trim())}'\ntype: ${type as LessonType}\nlayoutType: article\n---\n\n# --instructions--\n\nInstructions go here.\n`
  );

  if (
    interactive &&
    placementMode !== 'before-review' &&
    placementMode !== 'before' &&
    placementMode !== 'after'
  ) {
    fail('Placement must be before, after, or before-review');
  }
  const before =
    interactive && placementMode === 'before'
      ? placementTarget
      : interactive && placementMode === 'before-review'
        ? undefined
        : provided.before;
  const after = interactive && placementMode === 'after' ? placementTarget : provided.after;
  const ordering = readFileSync(orderingPath, 'utf8');
  writeFileSync(orderingPath, insertIntoOrdering(ordering, moduleNumber, file, before, after));
  console.log(`Added ${file} to module ${moduleNumber}`);
}

main().finally(() => prompt.close());
