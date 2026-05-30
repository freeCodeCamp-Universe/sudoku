import { describe, expect, it } from 'vitest';
import { buildModel } from '@/engine/buildModel';
import { generate } from '@/engine/generate';
import { solve } from '@/engine/solve';
import { validate } from '@/engine/validate';
import { jigsaw, makeJigsawVariant, PRESET_LAYOUTS } from './jigsaw';

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
