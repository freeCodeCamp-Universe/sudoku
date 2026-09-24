import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { buildModel } from '@/engine/buildModel';
import { getVariant } from '@/variants/registry';
import { useBoardView } from './useBoardView';

describe('useBoardView', () => {
  it('should derive the board view for a grid variant', () => {
    const variant = getVariant('classic');
    const baseModel = buildModel(variant);
    const { result } = renderHook(() =>
      useBoardView({
        variant,
        baseModel,
        solution: new Map(),
        cellSize: 40,
        seedBase: 1,
      })
    );

    expect(result.current.model.cells).toHaveLength(81);
    expect(result.current.rects.size).toBe(81);
    expect(result.current.size).toEqual({ w: 360, h: 360 });
    expect(result.current.gutters).toBeUndefined();
  });

  it('should derive overlap counts for a multigrid variant', () => {
    const variant = getVariant('samurai');
    const baseModel = buildModel(variant);
    const { result } = renderHook(() =>
      useBoardView({
        variant,
        baseModel,
        solution: new Map(),
        cellSize: 20,
        seedBase: 1,
      })
    );

    expect(result.current.rects.size).toBeGreaterThan(0);
    expect(result.current.overlapMap?.size).toBeGreaterThan(0);
  });

  it('should use the structure-aware jigsaw annotator', () => {
    const variant = getVariant('jigsaw');
    const baseModel = buildModel(variant);
    const { result } = renderHook(() =>
      useBoardView({
        variant,
        baseModel,
        solution: new Map(),
        cellSize: 40,
        seedBase: 1,
      })
    );

    expect(result.current.annotators).toHaveLength(1);
    expect(result.current.annotators[0].id).toBe('jigsaw');
    expect(
      result.current.annotators[0].describe('r0c0', {
        values: new Map(),
        model: result.current.model,
        cellState: () => ({
          candidates: [],
          given: false,
          focused: false,
          selected: false,
          conflict: false,
        }),
      })
    ).toBe('region 0');
  });
});
