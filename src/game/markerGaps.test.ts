import { describe, expect, it } from 'vitest';
import { buildMarkerGaps } from './markerGaps';

describe('buildMarkerGaps', () => {
  it('should return an empty map when structure is undefined', () => {
    expect(buildMarkerGaps(undefined).size).toBe(0);
  });

  it('should return an empty map when there are no relations', () => {
    expect(buildMarkerGaps({ relations: [] }).size).toBe(0);
  });

  it('should face two cells in the same row across their inline edges', () => {
    const gaps = buildMarkerGaps({ relations: [{ greater: 'r0c0', lesser: 'r0c1' }] });

    expect(gaps.get('r0c0')).toEqual(['inline-end']);
    expect(gaps.get('r0c1')).toEqual(['inline-start']);
  });

  it('should assign edges by adjacency, not by which side is greater', () => {
    // greater is the right-hand cell here, but the left cell still owns the
    // inline-end edge because only column order decides which side faces which.
    const gaps = buildMarkerGaps({ relations: [{ greater: 'r0c1', lesser: 'r0c0' }] });

    expect(gaps.get('r0c0')).toEqual(['inline-end']);
    expect(gaps.get('r0c1')).toEqual(['inline-start']);
  });

  it('should face two cells in the same column across their block edges', () => {
    const gaps = buildMarkerGaps({ relations: [{ greater: 'r0c0', lesser: 'r1c0' }] });

    expect(gaps.get('r0c0')).toEqual(['block-end']);
    expect(gaps.get('r1c0')).toEqual(['block-start']);
  });

  it('should assign the column edge by adjacency regardless of greater side', () => {
    const gaps = buildMarkerGaps({ relations: [{ greater: 'r1c0', lesser: 'r0c0' }] });

    expect(gaps.get('r0c0')).toEqual(['block-end']);
    expect(gaps.get('r1c0')).toEqual(['block-start']);
  });

  it('should accumulate every edge a cell participates in', () => {
    const gaps = buildMarkerGaps({
      relations: [
        { greater: 'r1c1', lesser: 'r1c0' },
        { greater: 'r1c1', lesser: 'r1c2' },
        { greater: 'r1c1', lesser: 'r0c1' },
        { greater: 'r1c1', lesser: 'r2c1' },
      ],
    });

    expect(gaps.get('r1c1')).toEqual(
      expect.arrayContaining(['inline-start', 'inline-end', 'block-start', 'block-end'])
    );
    expect(gaps.get('r1c1')).toHaveLength(4);
  });

  it('should ignore relations between non-adjacent cells', () => {
    expect(buildMarkerGaps({ relations: [{ greater: 'r0c0', lesser: 'r2c3' }] }).size).toBe(0);
  });

  it('should skip relations referencing unparseable cell ids', () => {
    expect(buildMarkerGaps({ relations: [{ greater: 'bogus', lesser: 'r0c0' }] }).size).toBe(0);
  });
});
