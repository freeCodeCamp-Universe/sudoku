import { describe, expect, it } from 'vitest';
import { neighborDescription } from './neighbor';

describe('neighborDescription', () => {
  it('should return "the cell to the right" for dRow 0, dCol 1', () => {
    expect(neighborDescription('r0c0', 'r0c1')).toBe('the cell to the right');
  });

  it('should return "the cell to the left" for dRow 0, dCol -1', () => {
    expect(neighborDescription('r0c1', 'r0c0')).toBe('the cell to the left');
  });

  it('should return "the cell above" for dRow -1, dCol 0', () => {
    expect(neighborDescription('r1c1', 'r0c1')).toBe('the cell above');
  });

  it('should return "the cell below" for dRow 1, dCol 0', () => {
    expect(neighborDescription('r1c1', 'r2c1')).toBe('the cell below');
  });

  it('should return "a neighboring cell" for anything else', () => {
    expect(neighborDescription('r0c0', 'r5c5')).toBe('a neighboring cell');
  });

  it('should return "a neighboring cell" for parse failure', () => {
    expect(neighborDescription('invalid', 'r0c0' as any)).toBe('a neighboring cell');
    expect(neighborDescription('r0c0', 'invalid' as any)).toBe('a neighboring cell');
  });
});
