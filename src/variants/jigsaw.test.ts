import { describe, expect, it } from 'vitest';
import { buildModel } from '@/engine/buildModel';
import { generate, generateSolution } from '@/engine/generate';
import { solve } from '@/engine/solve';
import { validate } from '@/engine/validate';
import { jigsaw, makeJigsawVariant, makePlayableJigsawVariant, PRESET_LAYOUTS } from './jigsaw';

function seeded(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

describe('jigsaw buildModel (preset A)', () => {
  it('should produce 27 houses (9 rows + 9 cols + 9 regions)', () => {
    const model = buildModel(jigsaw);

    expect(model.houses).toHaveLength(27);
  });

  it('should not include any box- prefixed houses', () => {
    const model = buildModel(jigsaw);

    expect(model.houses.filter((house) => house.id.startsWith('box-'))).toHaveLength(0);
  });

  it('should include 9 region- prefixed houses each with 9 cells', () => {
    const model = buildModel(jigsaw);
    const regionHouses = model.houses.filter((house) => house.id.startsWith('region-'));

    expect(regionHouses).toHaveLength(9);
    expect(regionHouses.every((house) => house.cells.length === 9)).toBe(true);
  });
});

describe('jigsaw validate', () => {
  it('should detect a conflict when two cells in the same region share a value', () => {
    const model = buildModel(makeJigsawVariant(PRESET_LAYOUTS[0]));
    const values = new Map([
      ['r0c0', 2],
      ['r1c0', 2],
    ]);

    const conflicts = validate(values, model);

    expect(conflicts.some((conflict) => conflict.cells.includes('r0c0') && conflict.cells.includes('r1c0'))).toBe(true);
  });
});

describe('jigsaw generate + solve (preset A)', () => {
  it('should produce a uniquely solvable puzzle', () => {
    const model = buildModel(makeJigsawVariant(PRESET_LAYOUTS[0]));
    const { givens } = generate(model, 'intermediate', seeded(50));

    expect(solve(model, givens, { max: 2 })).toHaveLength(1);
  });
});

describe('jigsaw region variety', () => {
  it('should define pairwise-distinct presets so rotating layouts changes regions', () => {
    for (let a = 0; a < PRESET_LAYOUTS.length; a += 1) {
      for (let b = a + 1; b < PRESET_LAYOUTS.length; b += 1) {
        expect(JSON.stringify(PRESET_LAYOUTS[a])).not.toBe(JSON.stringify(PRESET_LAYOUTS[b]));
      }
    }
  });

  it('should rotate to a different layout for each consecutive round', () => {
    const pick = (start: number, genKey: number) =>
      PRESET_LAYOUTS[(start + genKey) % PRESET_LAYOUTS.length];

    for (let start = 0; start < PRESET_LAYOUTS.length; start += 1) {
      for (let genKey = 0; genKey < PRESET_LAYOUTS.length; genKey += 1) {
        expect(pick(start, genKey)).not.toBe(pick(start, genKey + 1));
      }
    }
  });
});

describe('makePlayableJigsawVariant', () => {
  it('should derive the structure from the regions it was built with', () => {
    const variant = makePlayableJigsawVariant(PRESET_LAYOUTS[1]);
    const model = buildModel(variant);

    expect(variant.deriveStructure?.({} as never, model)).toEqual({ regions: PRESET_LAYOUTS[1] });
  });

  it('should blank cells to a fixed given count without a uniqueness search', () => {
    const variant = makePlayableJigsawVariant(PRESET_LAYOUTS[2]);
    const model = buildModel(variant);
    const solution = generateSolution(model);

    const givens = variant.generateGivens?.(solution, model, variant.difficulty, seeded(9));

    expect(givens?.size).toBe(31);
    for (const [id, value] of givens ?? []) {
      expect(value).toBe(solution.get(id));
    }
  });
});

describe('jigsaw generate perf', () => {
  it('should generate the playable variant quickly across every preset', () => {
    for (let p = 0; p < PRESET_LAYOUTS.length; p += 1) {
      const model = buildModel(makePlayableJigsawVariant(PRESET_LAYOUTS[p]));

      for (let i = 0; i < 20; i += 1) {
        const start = Date.now();
        const { givens } = generate(model, 'intermediate', seeded(p * 100 + i));

        expect(Date.now() - start).toBeLessThan(500);
        expect(givens.size).toBe(31);
      }
    }
  });
});

describe('jigsaw all presets', () => {
  it('should build irregular region houses for preset B', () => {
    const model = buildModel(makeJigsawVariant(PRESET_LAYOUTS[1]));
    const regionHouses = model.houses.filter((house) => house.id.startsWith('region-'));
    const conflicts = validate(new Map([
      ['r0c1', 4],
      ['r1c0', 4],
    ]), model);

    expect(regionHouses).toHaveLength(9);
    expect(regionHouses.every((house) => house.cells.length === 9)).toBe(true);
    expect(conflicts.some((conflict) => conflict.cells.includes('r0c1') && conflict.cells.includes('r1c0'))).toBe(true);
  });

  it('should build irregular region houses for preset C', () => {
    const model = buildModel(makeJigsawVariant(PRESET_LAYOUTS[2]));
    const regionHouses = model.houses.filter((house) => house.id.startsWith('region-'));
    const conflicts = validate(new Map([
      ['r0c3', 7],
      ['r1c2', 7],
    ]), model);

    expect(regionHouses).toHaveLength(9);
    expect(regionHouses.every((house) => house.cells.length === 9)).toBe(true);
    expect(conflicts.some((conflict) => conflict.cells.includes('r0c3') && conflict.cells.includes('r1c2'))).toBe(true);
  });
});
