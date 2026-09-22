/**
 * Add a curriculum module.
 *
 * One-liner:
 *   pnpm add-module --number=2 --slug=techniques --title="Techniques"
 *   pnpm add-module --number=2 --slug=techniques --title="Techniques" --before=3
 *
 * With no arguments, the script asks for the same values interactively.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import process from 'node:process';
import { join, resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const orderingPath = join(projectRoot, 'src', 'curriculum', 'ordering.ts');
const lessonsDir = join(projectRoot, 'src', 'curriculum', 'lessons');

type Options = {
  number: number;
  slug: string;
  title: string;
  before?: number;
  after?: number;
};

function fail(message: string): never {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function parseFlags(): Partial<Record<keyof Options, string>> {
  const flags: Partial<Record<keyof Options, string>> = {};
  for (const arg of process.argv.slice(2)) {
    const match = /^--(number|slug|title|before|after)=(.*)$/.exec(arg);
    if (match) flags[match[1] as keyof Options] = match[2];
  }
  return flags;
}

async function ask(question: string, fallback = ''): Promise<string> {
  const answer = await prompt.question(`${question}${fallback ? ` [${fallback}]` : ''}: `);
  return answer.trim() || fallback;
}

function moduleEntry(
  number: number,
  slug: string,
  title: string,
  intro: string,
  review: string
): string {
  return `  {
    module: ${number},
    slug: '${escapeSingleQuotes(slug)}',
    title: '${escapeSingleQuotes(title)}',
    lessons: [
      '${intro}',
      '${review}',
    ],
    wip: true,
  },`;
}

function escapeSingleQuotes(value: string): string {
  return value.replaceAll("'", "\\'");
}

function moduleBlocks(ordering: string): Array<{ number: number; start: number; end: number }> {
  const blocks: Array<{ number: number; start: number; end: number }> = [];
  const modulePattern = / {2}\{\n(?:(?! {2}\{\n)[\s\S])*?module:\s*(\d+),[\s\S]*?\n {2}\},/g;
  for (const match of ordering.matchAll(modulePattern)) {
    blocks.push({
      number: Number(match[1]),
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  return blocks;
}

function insertModule(ordering: string, entry: string, before?: number, after?: number): string {
  const blocks = moduleBlocks(ordering);
  const target = before ?? after;
  if (target !== undefined) {
    const block = blocks.find((candidate) => candidate.number === target);
    if (!block) fail(`Module ${target} not found in ordering.ts`);
    const index = before !== undefined ? block.start : block.end;
    return (
      ordering.slice(0, index) +
      (before !== undefined ? `${entry}\n` : `\n${entry}`) +
      ordering.slice(index)
    );
  }

  const closingIndex = ordering.lastIndexOf('];');
  if (closingIndex === -1) fail('Could not find the end of curriculum in ordering.ts');
  return ordering.slice(0, closingIndex) + `${entry}\n` + ordering.slice(closingIndex);
}

function parseNumber(value: string | undefined, name: string): number | undefined {
  if (value === undefined || value === '') return undefined;
  if (!/^\d+$/.test(value)) fail(`--${name} must be a positive integer`);
  return Number(value);
}

const prompt = createInterface({ input: process.stdin, output: process.stdout });

async function main() {
  const flags = parseFlags();
  const interactive = process.argv.length === 2;
  const numberValue = interactive ? await ask('Module number') : flags.number;
  const slug = interactive ? await ask('Module slug') : flags.slug;
  const title = interactive ? await ask('Module title') : flags.title;
  const placementMode = interactive
    ? await ask('Placement (before, after, or append)', 'append')
    : undefined;
  const placementTarget =
    interactive && placementMode !== 'append'
      ? await ask(`Module number to insert ${placementMode}`)
      : undefined;

  const number = parseNumber(numberValue, 'number');
  if (number === undefined || !slug || !title) {
    fail(
      'Usage: pnpm add-module --number=<N> --slug=<slug> --title="<title>" [--before=<N>|--after=<N>]'
    );
  }
  if (!/^[a-z0-9-]+$/.test(slug))
    fail('--slug must contain only lowercase letters, numbers, and hyphens');
  if (flags.before && flags.after) fail('Use only one of --before or --after');

  if (
    interactive &&
    placementMode !== 'append' &&
    placementMode !== 'before' &&
    placementMode !== 'after'
  ) {
    fail('Placement must be before, after, or append');
  }
  const before =
    interactive && placementMode === 'before'
      ? parseNumber(placementTarget, 'before')
      : parseNumber(flags.before, 'before');
  const after =
    interactive && placementMode === 'after'
      ? parseNumber(placementTarget, 'after')
      : parseNumber(flags.after, 'after');
  mkdirSync(lessonsDir, { recursive: true });

  const prefix = number * 100;
  const intro = `${prefix + 1}.md`;
  const review = `${prefix + 2}.md`;
  if (existsSync(join(lessonsDir, intro)) || existsSync(join(lessonsDir, review))) {
    fail(`Lesson files for module ${number} already exist`);
  }

  const id = () => randomBytes(12).toString('hex');
  writeFileSync(
    join(lessonsDir, intro),
    `---\nid: ${id()}\ntitle: '${escapeSingleQuotes(title)}'\ntype: intro\nlayoutType: article\n---\n\n# --instructions--\n\nModule intro instructions go here.\n`
  );
  writeFileSync(
    join(lessonsDir, review),
    `---\nid: ${id()}\ntitle: '${escapeSingleQuotes(title)} Review'\ntype: review\nlayoutType: article\n---\n\n# --instructions--\n\nModule review content goes here.\n`
  );

  const ordering = readFileSync(orderingPath, 'utf8');
  writeFileSync(
    orderingPath,
    insertModule(ordering, moduleEntry(number, slug, title, intro, review), before, after)
  );
  console.log(`Added module ${number} (${slug}) with ${intro} and ${review}`);
}

main().finally(() => prompt.close());
