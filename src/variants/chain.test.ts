import { describe, expect, it } from 'vitest';
import { buildModel } from '@/engine/buildModel';
import { validate } from '@/engine/validate';
import type { Chain as ChainType } from '@/engine/constraints/chain';
import { chainVariant } from './chain';

describe('chainVariant', () => {
  it('should have the correct id and constraint ids', () => {
    expect(chainVariant.id).toBe('chain');
    expect(chainVariant.constraintIds).toContain('uniqueness');
    expect(chainVariant.constraintIds).toContain('chain');
  });

  it('should detect a chain violation with a duplicate value', () => {
    const model = buildModel(chainVariant);
    // Provide a minimal chain structure with one 3-cell chain
    const testChain: ChainType = { cells: ['r0c0', 'r0c1', 'r0c2'] };
    const modelWithStructure = { ...model, structure: { chains: [testChain] } };
    const brokenValues = new Map<string, number>([
      ['r0c0', 5],
      ['r0c1', 5],
      ['r0c2', 6],
    ]);

    expect(validate(brokenValues, modelWithStructure).some((c) => c.constraintId === 'chain')).toBe(
      true
    );
  });

  it('should accept a valid consecutive chain', () => {
    const model = buildModel(chainVariant);
    const testChain: ChainType = { cells: ['r0c0', 'r1c0', 'r2c0'] };
    const modelWithStructure = { ...model, structure: { chains: [testChain] } };
    const values = new Map<string, number>([
      ['r0c0', 3],
      ['r1c0', 4],
      ['r2c0', 5],
    ]);

    expect(
      validate(values, modelWithStructure).filter((c) => c.constraintId === 'chain')
    ).toHaveLength(0);
  });
});
