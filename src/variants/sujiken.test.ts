import { describe, expect, it } from 'vitest';
import { buildModel } from '@/engine/buildModel';
import { generate } from '@/engine/generate';
import { solve } from '@/engine/solve';
import { getVariant } from './registry';
import { sujiken } from './sujiken';

function seeded(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

describe('sujiken variant - model structure', () => {
  const model = buildModel(sujiken);

  it('should have 45 cells', () => {
    expect(model.cells).toHaveLength(45);
  });

  it('should have 19 houses', () => {
    expect(model.houses).toHaveLength(19);
  });

  it('should include a diagonal house containing all 9 diagonal cells', () => {
    const diagonal = model.houses.find((house) => house.id === 'tri-diagonal');

    expect(diagonal).toBeDefined();
    expect(diagonal?.cells).toHaveLength(9);
    expect(diagonal?.cells).toContain('r0c0');
    expect(diagonal?.cells).toContain('r8c8');
  });

  it('should have row-0 with 1 cell and row-8 with 9 cells', () => {
    const row0 = model.houses.find((house) => house.id === 'tri-row-0');
    const row8 = model.houses.find((house) => house.id === 'tri-row-8');

    expect(row0?.cells).toHaveLength(1);
    expect(row8?.cells).toHaveLength(9);
  });

  it('should have col-0 with 9 cells and col-8 with 1 cell', () => {
    const col0 = model.houses.find((house) => house.id === 'tri-col-0');
    const col8 = model.houses.find((house) => house.id === 'tri-col-8');

    expect(col0?.cells).toHaveLength(9);
    expect(col8?.cells).toHaveLength(1);
  });
});

describe('sujiken variant - generate + solve', () => {
  it('should generate a uniquely solvable puzzle from the registry', () => {
    const model = buildModel(getVariant('sujiken'));
    const { givens } = generate(model, 'intermediate', seeded(30));

    expect(solve(model, givens, { max: 2 })).toHaveLength(1);
  });
});
