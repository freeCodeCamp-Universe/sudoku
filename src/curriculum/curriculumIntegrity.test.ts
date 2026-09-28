import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildCurriculum, loadFullCurriculum } from '@/curriculum/loader';
import { buildModel } from '@/engine/buildModel';
import { solve } from '@/engine/solve';
import { variantRegistry } from '@/variants/registry';

const { lessons, modules } = loadFullCurriculum();

describe('curriculum integrity', () => {
  it('should load at least one lesson', () => {
    expect(lessons.length).toBeGreaterThan(0);
  });

  it('should have unique lesson IDs', () => {
    const ids = lessons.map((l) => l.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('should have required frontmatter on every lesson', () => {
    const broken = lessons.filter((l) => !l.id || !l.title || !l.type);
    expect(broken.map((l) => l.id)).toEqual([]);
  });

  it('should reference only lessons that exist', () => {
    const lessonIds = new Set(lessons.map((l) => l.id));
    const broken = modules.flatMap((m) =>
      m.lessonIds.filter((id) => !lessonIds.has(id)).map((id) => `module ${m.module}: ${id}`)
    );
    expect(broken).toEqual([]);
  });

  it('should start every checklist hint with "You can" or "You should"', () => {
    const broken = lessons.flatMap((lesson) => {
      if (!lesson.config) return [];
      return lesson.config.checklist.flatMap((req) => {
        const { hint } = req;
        return hint && !/^You (?:can|should)\b/.test(hint)
          ? [`${lesson.id} item "${req.label}" has hint "${hint}"`]
          : [];
      });
    });
    expect(broken.join('\n')).toBe('');
  });

  it('should give every lesson board a unique solution matching its configured solution', () => {
    const boards = lessons.flatMap((lesson) =>
      lesson.config?.board ? [{ lessonId: lesson.id, board: lesson.config.board }] : []
    );

    for (const { lessonId, board } of boards) {
      const variant = variantRegistry[board.variant];
      if (!variant) throw new Error(`${lessonId} uses an unknown board variant`);
      const model = buildModel(variant);
      const modelWithStructure =
        board.structure === undefined ? model : { ...model, structure: board.structure };
      const solutions = solve(modelWithStructure, new Map(Object.entries(board.givens)), {
        max: 2,
      });
      expect(solutions, `${lessonId} should have exactly one solution`).toHaveLength(1);
      expect(solutions[0], `${lessonId} solution should match its config`).toEqual(
        new Map(Object.entries(board.solution))
      );
    }
  });

  it('should keep lesson-board variant documentation in sync with the registry', () => {
    const docs = readFileSync(resolve(process.cwd(), 'docs/lesson-authoring.md'), 'utf8');
    const supportedSections = [
      'Supported, digits only',
      'Supported, clues from the solution',
      'Supported with `structure`',
      'Not supported yet',
    ].map((heading) => {
      const start = docs.indexOf(`##### ${heading}`);
      expect(start).toBeGreaterThanOrEqual(0);
      const bodyStart = docs.indexOf('\n', start) + 1;
      const nextHeading = docs.slice(bodyStart).search(/^#{1,6} /m);
      return docs.slice(bodyStart, nextHeading === -1 ? undefined : bodyStart + nextHeading);
    });
    const documented = supportedSections.map((section) => {
      const variantList = /^Variants: (.+)$/m.exec(section)?.[1] ?? '';
      return [...variantList.matchAll(/`([a-z0-9-]+)`/g)].map((match) => match[1]);
    });
    const allIds = documented.flat();
    const registryIds = Object.keys(variantRegistry);

    expect(new Set(allIds).size).toBe(allIds.length);
    expect([...allIds].sort()).toEqual([...registryIds].sort());

    const notSupportedIds = new Set(documented[3]);
    for (const variantId of registryIds) {
      const board = { variant: variantId, givens: {}, solution: {} };
      const config = ['```json', JSON.stringify({ board }), '```'].join('\n');
      let rejection = '';
      try {
        buildCurriculum([{ module: 1, slug: 'test', title: 'Test', lessons: ['lesson.md'] }], {
          './lessons/lesson.md': `---\nid: 64a2f3b1c7d8e9f0a1b2c3d4\ntitle: Test\n---\n\n# --config--\n\n${config}`,
        });
      } catch (error) {
        rejection = error instanceof Error ? error.message : String(error);
      }
      expect(notSupportedIds.has(variantId)).toBe(rejection.includes('needs a structure field'));
    }
  });
});
