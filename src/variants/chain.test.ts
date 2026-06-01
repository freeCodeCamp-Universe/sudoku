import { describe, expect, it } from 'vitest';
import { buildModel } from '@/engine/buildModel';
import { validate } from '@/engine/validate';
import type { Chain as ChainType } from '@/engine/constraints/chain';
import { CHAINS, chainVariant } from './chain';

describe('chainVariant', () => {
  it('should have the correct id and constraint ids', () => {
    expect(chainVariant.id).toBe('chain');
    expect(chainVariant.constraintIds).toContain('uniqueness');
    expect(chainVariant.constraintIds).toContain('chain');
  });

  it('should export 12 fixed chains matching the original definitions', () => {
    expect(CHAINS).toHaveLength(12);
    expect(CHAINS[0].cells).toHaveLength(3);
    expect(CHAINS[0].cells[0]).toBe('r0c1');
    expect(CHAINS[0].cells[1]).toBe('r1c1');
    expect(CHAINS[0].cells[2]).toBe('r1c2');
  });

  it('should derive structure returning all 12 chains', () => {
    const model = buildModel(chainVariant);
    const structure = chainVariant.deriveStructure?.(new Map(), model) as { chains: ChainType[] };

    expect(structure.chains).toHaveLength(12);
  });

  it('should validate a known good solution with no chain conflicts', () => {
    const solution = [
      [4, 1, 5, 9, 8, 7, 3, 2, 6],
      [9, 2, 3, 4, 5, 6, 7, 1, 8],
      [6, 7, 8, 3, 2, 1, 5, 4, 9],
      [1, 9, 6, 5, 4, 3, 2, 8, 7],
      [3, 4, 2, 7, 9, 8, 1, 6, 5],
      [8, 5, 7, 6, 1, 2, 4, 9, 3],
      [7, 3, 1, 8, 6, 4, 9, 5, 2],
      [5, 6, 4, 2, 7, 9, 8, 3, 1],
      [2, 8, 9, 1, 3, 5, 6, 7, 4],
    ];
    const model = buildModel(chainVariant);
    const structure = chainVariant.deriveStructure?.(new Map(), model);
    const modelWithStructure = { ...model, structure };
    const values = new Map<string, number>();

    solution.forEach((row, rowIndex) => {
      row.forEach((value, colIndex) => {
        values.set(`r${rowIndex}c${colIndex}`, value);
      });
    });

    expect(validate(values, modelWithStructure)).toEqual([]);
  });

  it('should detect a chain violation with a duplicate value', () => {
    const model = buildModel(chainVariant);
    const structure = chainVariant.deriveStructure?.(new Map(), model) as { chains: ChainType[] };
    const modelWithStructure = { ...model, structure };
    const brokenValues = new Map<string, number>([
      ['r0c1', 5],
      ['r1c1', 5],
      ['r1c2', 6],
    ]);

    expect(validate(brokenValues, modelWithStructure).some((conflict) => conflict.constraintId === 'chain')).toBe(true);
  });
});
