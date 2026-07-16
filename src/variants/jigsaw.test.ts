import { describe, expect, it } from 'vitest';
import { buildModel } from '@/engine/buildModel';
import { generate, generateSolution } from '@/engine/generate';
import { range } from '@/engine/grid';
import { solve } from '@/engine/solve';
import { validate } from '@/engine/validate';
import {
  generateJigsawRegions,
  jigsaw,
  makeJigsawVariant,
  makePlayableJigsawVariant,
  PRESET_LAYOUTS,
} from './jigsaw';

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

    expect(
      conflicts.some(
        (conflict) => conflict.cells.includes('r0c0') && conflict.cells.includes('r1c0')
      )
    ).toBe(true);
  });
});

describe('jigsaw generate + solve (preset A)', () => {
  it('should produce a uniquely solvable puzzle', () => {
    const model = buildModel(makeJigsawVariant(PRESET_LAYOUTS[0]));
    const { givens } = generate(model, 'intermediate', seeded(50));

    expect(solve(model, givens, { max: 2 })).toHaveLength(1);
  });
});

describe('generateJigsawRegions', () => {
  function regionCells(regions: number[][], region: number): [number, number][] {
    const cells: [number, number][] = [];
    regions.forEach((rowValues, row) =>
      rowValues.forEach((value, col) => {
        if (value === region) cells.push([row, col]);
      })
    );
    return cells;
  }

  function isConnected(cells: [number, number][]): boolean {
    const keys = new Set(cells.map(([row, col]) => `${row},${col}`));
    const seen = new Set([`${cells[0][0]},${cells[0][1]}`]);
    const queue = [cells[0]];
    while (queue.length > 0) {
      const [row, col] = queue.pop()!;
      for (const [nextRow, nextCol] of [
        [row - 1, col],
        [row + 1, col],
        [row, col - 1],
        [row, col + 1],
      ]) {
        const key = `${nextRow},${nextCol}`;
        if (keys.has(key) && !seen.has(key)) {
          seen.add(key);
          queue.push([nextRow, nextCol]);
        }
      }
    }
    return seen.size === cells.length;
  }

  it('should produce nine connected regions of nine cells each', () => {
    const regions = generateJigsawRegions(seeded(42));

    for (let region = 0; region < 9; region += 1) {
      const cells = regionCells(regions, region);
      expect(cells).toHaveLength(9);
      expect(isConnected(cells)).toBe(true);
    }
  });

  it('should be deterministic for the same seed', () => {
    expect(generateJigsawRegions(seeded(7))).toEqual(generateJigsawRegions(seeded(7)));
  });

  it('should produce different layouts for different seeds', () => {
    const layouts = new Set(
      range(6).map((seed) => JSON.stringify(generateJigsawRegions(seeded(seed + 1))))
    );

    expect(layouts.size).toBeGreaterThan(1);
  });

  it('should produce irregular regions, not the standard boxes it scrambles from', () => {
    const regions = generateJigsawRegions(seeded(11));
    const standardBoxes = range(9).map((row) =>
      range(9).map((col) => Math.floor(row / 3) * 3 + Math.floor(col / 3))
    );

    expect(regions).not.toEqual(standardBoxes);
  });

  it('should generate a playable puzzle quickly on generated regions', () => {
    for (let seed = 1; seed <= 5; seed += 1) {
      const regions = generateJigsawRegions(seeded(seed * 31));
      const model = buildModel(makePlayableJigsawVariant(regions));
      const start = Date.now();
      const { givens } = generate(model, 'intermediate', seeded(seed));

      expect(Date.now() - start).toBeLessThan(1000);
      expect(givens.size).toBe(31);
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
    const conflicts = validate(
      new Map([
        ['r0c1', 4],
        ['r1c0', 4],
      ]),
      model
    );

    expect(regionHouses).toHaveLength(9);
    expect(regionHouses.every((house) => house.cells.length === 9)).toBe(true);
    expect(
      conflicts.some(
        (conflict) => conflict.cells.includes('r0c1') && conflict.cells.includes('r1c0')
      )
    ).toBe(true);
  });

  it('should build irregular region houses for preset C', () => {
    const model = buildModel(makeJigsawVariant(PRESET_LAYOUTS[2]));
    const regionHouses = model.houses.filter((house) => house.id.startsWith('region-'));
    const conflicts = validate(
      new Map([
        ['r0c2', 7],
        ['r1c3', 7],
      ]),
      model
    );

    expect(regionHouses).toHaveLength(9);
    expect(regionHouses.every((house) => house.cells.length === 9)).toBe(true);
    expect(
      conflicts.some(
        (conflict) => conflict.cells.includes('r0c2') && conflict.cells.includes('r1c3')
      )
    ).toBe(true);
  });
});
