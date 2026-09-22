import { execFile as execFileCallback } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';

const execFile = promisify(execFileCallback);
const projectRoot = resolve(import.meta.dirname, '..');
const curriculumRoot = resolve(projectRoot, 'src/learn/curriculum');
const lessonBuilder = resolve(projectRoot, 'scripts/build-lesson-data.ts');
const prebuildRegister = resolve(projectRoot, 'scripts/prebuild-register.ts');
const markdownRenderer = resolve(projectRoot, 'src/learn/Markdown/renderMarkdown.ts');

async function buildCurriculumData(): Promise<void> {
  try {
    await execFile(
      process.execPath,
      ['--import', 'tsx/esm', '--import', prebuildRegister, lessonBuilder],
      { cwd: projectRoot, env: process.env }
    );
  } catch (error) {
    const details = error as { stderr?: string; stdout?: string; message?: string };
    const output = [details.stderr, details.stdout].filter(Boolean).join('\n').trim();
    throw new Error(output || details.message || 'Curriculum data generation failed');
  }
}

function isCurriculumSource(file: string): boolean {
  return file.startsWith(`${curriculumRoot}/`) || file === markdownRenderer;
}

export function curriculumDataPlugin(): Plugin {
  let regeneration: Promise<void> = Promise.resolve();

  const regenerate = (): Promise<void> => {
    regeneration = regeneration.then(buildCurriculumData, buildCurriculumData);
    return regeneration;
  };

  return {
    name: 'curriculum-data',
    apply: 'serve',
    async buildStart() {
      await regenerate();
    },
    async handleHotUpdate({ file, server }) {
      if (!isCurriculumSource(file)) {
        return;
      }

      await regenerate();
      server.ws.send({ type: 'full-reload' });
      return [];
    },
  };
}
