import { describe, expect, it } from 'vitest';
import { boardFrameEdge, framedBoardSize, gutteredBoardSize, gutterOrigin } from './boardFrame';

describe('boardFrame', () => {
  describe('boardFrameEdge', () => {
    it('should be one frame border for grid layouts', () => {
      expect(boardFrameEdge('grid', false)).toBe(3);
    });

    it('should widen with high contrast', () => {
      expect(boardFrameEdge('grid', true)).toBe(5);
    });

    it('should be zero for layouts that draw their edges inside the canvas', () => {
      expect(boardFrameEdge('multigrid', false)).toBe(0);
      expect(boardFrameEdge('triangular', false)).toBe(0);
    });
  });

  describe('framedBoardSize', () => {
    it('should add the frame edge on each side of the canvas', () => {
      expect(framedBoardSize({ w: 640, h: 640 }, 3)).toEqual({ w: 646, h: 646 });
    });

    it('should leave the canvas untouched with no frame edge', () => {
      expect(framedBoardSize({ w: 640, h: 640 }, 0)).toEqual({ w: 640, h: 640 });
    });
  });

  describe('gutteredBoardSize', () => {
    const framed = { w: 474, h: 474 };
    const clue = { id: 'c', label: '1' };

    it('should leave the framed size untouched without gutters', () => {
      expect(gutteredBoardSize(framed, undefined)).toEqual(framed);
    });

    it('should add a gutter on every side for four-sided clues', () => {
      const four = { top: [clue], bottom: [clue], start: [clue], end: [clue] };
      expect(gutteredBoardSize(framed, four)).toEqual({ w: 554, h: 554 });
    });

    it('should add both inline gutters but only the clue-bearing block tracks', () => {
      const twoSided = { end: [clue], bottom: [clue] };
      expect(gutteredBoardSize(framed, twoSided)).toEqual({ w: 554, h: 514 });
    });
  });

  describe('gutterOrigin', () => {
    const clue = { id: 'c', label: '1' };

    it('should be zero without gutters', () => {
      expect(gutterOrigin(undefined)).toEqual({ x: 0, y: 0 });
    });

    it('should offset both axes when a top track exists', () => {
      expect(gutterOrigin({ top: [clue], start: [clue] })).toEqual({ x: 40, y: 40 });
    });

    it('should offset only the inline axis without a top track', () => {
      expect(gutterOrigin({ end: [clue], bottom: [clue] })).toEqual({ x: 40, y: 0 });
    });
  });
});
