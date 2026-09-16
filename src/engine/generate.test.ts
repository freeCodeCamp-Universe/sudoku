import { describe, expect, it } from 'vitest';
import { uniqueness } from './constraints/uniqueness';
import { generate, generateSolution, cluesFor, multiplierForMode } from './generate';
import { gridCells, standardHouses } from './grid';
import { solve } from './solve';
import type { VariantModel } from './types';
import { buildModel } from './buildModel';
import { getVariant } from '@/variants/registry';

const model: VariantModel = {
  cells: gridCells(9),
  houses: standardHouses(9, { rows: 3, cols: 3 }),
  constraints: [uniqueness],
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
};

function seeded(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

describe('generateSolution', () => {
  it('should produce a fully filled, conflict-free grid', () => {
    const solution = generateSolution(model, seeded(1));
    expect(solution.size).toBe(81);
    expect(uniqueness.conflicts(solution, model)).toEqual([]);
  });
});

describe('generateSolution propagation fast path', () => {
  it('should fill an irregular (jigsaw) grid quickly and conflict-free', () => {
    const jigsawModel = buildModel(getVariant('jigsaw'));
    const maxGenerationMs = 1_000;

    for (let run = 0; run < 5; run += 1) {
      const start = Date.now();
      const solution = generateSolution(jigsawModel, seeded(200 + run));
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(maxGenerationMs);
      expect(solution.size).toBe(jigsawModel.cells.length);
      for (const constraint of jigsawModel.constraints) {
        expect(constraint.conflicts(solution, jigsawModel)).toEqual([]);
      }
    }
  });

  it('should be deterministic per seed and vary across seeds', () => {
    const jigsawModel = buildModel(getVariant('jigsaw'));
    const first = generateSolution(jigsawModel, seeded(7));
    const sameSeed = generateSolution(jigsawModel, seeded(7));
    const otherSeed = generateSolution(jigsawModel, seeded(8));

    expect([...first.entries()]).toEqual([...sameSeed.entries()]);
    expect([...first.entries()]).not.toEqual([...otherSeed.entries()]);
  });
});

describe('generate', () => {
  it('should produce givens with exactly one solution', () => {
    const { givens } = generate(model, 'intermediate', seeded(2));
    expect(solve(model, givens, { max: 2 })).toHaveLength(1);
  });

  it('should leave roughly the clue count for the difficulty', () => {
    const { givens } = generate(model, 'beginner', seeded(3));
    expect(givens.size).toBeGreaterThanOrEqual(cluesFor('beginner', 81));
  });

  it('should use variant-provided givens when generateGivens is defined', () => {
    const customModel: VariantModel = {
      ...model,
      generateGivens(solution) {
        return new Map([...solution.entries()].slice(0, 2));
      },
    };

    const { givens } = generate(customModel, 'intermediate', seeded(4));
    expect(givens.size).toBe(2);
  });

  it('should default to the medium multiplier, matching multiplier-less generation exactly', () => {
    const { givens: withoutMultiplier } = generate(model, 'advanced', seeded(5));
    const { givens: withMediumMultiplier } = generate(
      model,
      'advanced',
      seeded(5),
      multiplierForMode('medium')
    );

    expect(withMediumMultiplier.size).toBe(withoutMultiplier.size);
  });

  it('should leave more clues for easy than medium, and fewer for expert than medium', () => {
    const { givens: easy } = generate(model, 'advanced', seeded(6), multiplierForMode('easy'));
    const { givens: mediumGivens } = generate(
      model,
      'advanced',
      seeded(6),
      multiplierForMode('medium')
    );
    const { givens: expert } = generate(model, 'advanced', seeded(6), multiplierForMode('expert'));

    expect(easy.size).toBeGreaterThan(mediumGivens.size);
    expect(expert.size).toBeLessThan(mediumGivens.size);
  });

  it('should pass the multiplier through to a variant-provided generateGivens', () => {
    const receivedMultipliers: (number | undefined)[] = [];
    const customModel: VariantModel = {
      ...model,
      generateGivens(solution, _model, _difficulty, _rng, modeMultiplier) {
        receivedMultipliers.push(modeMultiplier);
        return new Map([...solution.entries()].slice(0, 2));
      },
    };

    generate(customModel, 'intermediate', seeded(7), multiplierForMode('expert'));
    expect(receivedMultipliers).toEqual([0.8]);
  });

  it('should never let minimumClues be undercut by the multiplier', () => {
    const flooredModel: VariantModel = { ...model, minimumClues: 70 };
    const { givens } = generate(flooredModel, 'advanced', seeded(8), multiplierForMode('expert'));

    expect(givens.size).toBeGreaterThanOrEqual(70);
  });
});

describe('generate perf guard', () => {
  it('should keep samurai advanced generation bounded and still unique', () => {
    const model = buildModel(getVariant('samurai'));
    const maxGenerationMs = 3_000;
    const runs = 3;

    for (let run = 0; run < runs; run += 1) {
      const start = Date.now();
      const { givens } = generate(model, 'advanced', seeded(100 + run));
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(maxGenerationMs);
      expect(solve(model, givens, { max: 2 })).toHaveLength(1);
    }
  }, 180_000);

  // Expert mode multiplies each variant's already-sparse advanced clue count
  // by 0.8. On these large multigrid variants that pushed generation into a
  // heavy tail of multi-second uniqueness searches (measured directly, not
  // assumed), which is why each now carries a minimumClues floor — this guard
  // keeps that floor honest against regressions.
  describe.each([
    ['samurai', 105],
    ['kazaguruma', 90],
    ['sohei', 80],
    ['cross', 80],
  ])('%s expert mode', (variantId, minimumClues) => {
    it(`should keep ${variantId} expert-mode generation bounded and still unique`, () => {
      const model = buildModel(getVariant(variantId));
      const maxGenerationMs = 3_000;
      const runs = 5;

      for (let run = 0; run < runs; run += 1) {
        const start = Date.now();
        const { givens } = generate(
          model,
          'advanced',
          seeded(1000 + run),
          multiplierForMode('expert')
        );
        const elapsed = Date.now() - start;

        expect(elapsed).toBeLessThan(maxGenerationMs);
        expect(givens.size).toBeGreaterThanOrEqual(minimumClues);
        expect(solve(model, givens, { max: 2 })).toHaveLength(1);
      }
    }, 180_000);
  });

  // Super16 (256 cells, uniqueness-only) already has a heavy-tailed generation
  // time at today's shipped default density (~96 clues) -- measured up to
  // several seconds on an unlucky seed even before Mode existed. Its custom
  // generateGivens (base 96, see super16.ts) makes Expert usually land
  // sparser than Medium without requiring a lower bound to be reachable, so
  // this guard uses a looser bound than the other variants above: it exists
  // to catch a genuine regression (e.g. an order-of-magnitude slowdown), not
  // to assert the pre-existing tail has been eliminated.
  it('should keep super16 expert-mode generation within a generous bound and still unique', () => {
    const model = buildModel(getVariant('super'));
    const maxGenerationMs = 15_000;
    const runs = 5;

    for (let run = 0; run < runs; run += 1) {
      const start = Date.now();
      const { givens } = generate(
        model,
        'advanced',
        seeded(2000 + run),
        multiplierForMode('expert')
      );
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(maxGenerationMs);
      expect(solve(model, givens, { max: 2 })).toHaveLength(1);
    }
  }, 180_000);
});
