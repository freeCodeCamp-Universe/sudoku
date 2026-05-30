import { describe, expect, it } from 'vitest';
import { buildModel } from '@/engine/buildModel';
import { generate } from '@/engine/generate';
import { solve } from '@/engine/solve';
import { validate } from '@/engine/validate';
import { color, COLOR_PALETTE } from './color';

function seeded(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

describe('color variant', () => {
  it('should have 9x9 grid layout', () => {
    expect(color.layout).toEqual({ kind: 'grid', size: 9, box: { rows: 3, cols: 3 } });
  });

  it('should use symbols 1..9', () => {
    expect(color.symbols).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('should have symbolKind color', () => {
    expect(color.symbolKind).toBe('color');
  });

  it('should export COLOR_PALETTE with 9 entries', () => {
    expect(COLOR_PALETTE).toHaveLength(9);
  });

  it('should map renderSymbol(1) to red and renderSymbol(9) to silver', () => {
    expect(color.renderSymbol?.(1)).toBe('#e03535');
    expect(color.renderSymbol?.(9)).toBe('#9898b0');
  });

  it('should include colorNames with 9 entries', () => {
    expect(color.colorNames).toHaveLength(9);
  });

  it('should generate a uniquely solvable puzzle', () => {
    const model = buildModel(color);
    const { givens } = generate(model, 'intermediate', seeded(40));

    expect(solve(model, givens, { max: 2 })).toHaveLength(1);
  });

  it('should produce no conflicts on the solution', () => {
    const model = buildModel(color);
    const { solution } = generate(model, 'intermediate', seeded(41));

    expect(validate(solution, model)).toEqual([]);
  });
});
