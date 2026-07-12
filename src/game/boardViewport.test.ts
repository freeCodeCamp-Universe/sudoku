import { describe, expect, it } from 'vitest';
import {
  boardFrameEdge,
  clampScale,
  clampTranslate,
  ensureVisibleTranslate,
  fitScale,
  fitWholeScale,
  framedBoardSize,
  indicatorRect,
  isOversized,
  centerOnPoint,
  minimapPointToTranslate,
  zoomAbout,
  COMFORTABLE_CELL_SIZE,
  MAX_SCALE,
} from './boardViewport';

const board = { w: 840, h: 840 }; // 21 × 40
const viewport = { w: 360, h: 360 };

describe('boardViewport', () => {
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

  describe('isOversized', () => {
    it('should be true when the board is wider than the viewport', () => {
      expect(isOversized(board, viewport)).toBe(true);
    });

    it('should be false when the board fits the viewport', () => {
      expect(isOversized({ w: 300, h: 300 }, viewport)).toBe(false);
    });

    it('should tolerate subpixel measurement shortfall in a board-sized viewport', () => {
      // A shrink-to-fit frame is nominally equal to the board; fractional
      // zoom can report it a hair smaller. That must not count as oversized.
      expect(isOversized({ w: 486, h: 486 }, { w: 485.6, h: 486 })).toBe(false);
    });

    it('should be true when the board exceeds the viewport past the tolerance', () => {
      expect(isOversized({ w: 486, h: 486 }, { w: 485, h: 486 })).toBe(true);
    });
  });

  describe('fitScale', () => {
    it('should scale so the whole board fits the smaller axis', () => {
      expect(fitScale(board, viewport)).toBeCloseTo(360 / 840);
    });
  });

  describe('fitWholeScale', () => {
    it('should be the fit scale for an oversized board', () => {
      expect(fitWholeScale(board, viewport)).toBeCloseTo(fitScale(board, viewport));
    });

    it('should be natural size for a board that already fits', () => {
      expect(fitWholeScale({ w: 300, h: 300 }, viewport)).toBe(1);
    });
  });

  describe('clampScale', () => {
    it('should not allow zooming out past the fit scale', () => {
      expect(clampScale(0.1, board, viewport)).toBeCloseTo(fitScale(board, viewport));
    });

    it('should not allow zooming out below natural size on a board that fits', () => {
      expect(clampScale(0.5, { w: 300, h: 300 }, viewport)).toBe(1);
    });

    it('should cap zoom at MAX_SCALE', () => {
      expect(clampScale(99, board, viewport)).toBe(MAX_SCALE);
    });
  });

  describe('clampTranslate', () => {
    it('should keep the board edge from crossing into the viewport when oversized', () => {
      const clamped = clampTranslate({ scale: 1, translateX: 100, translateY: 0 }, board, viewport);
      // tx is clamped to [vw - bw, 0] = [-480, 0]; 100 → 0.
      expect(clamped.translateX).toBe(0);
    });

    it('should pin the board at the viewport edge when it exactly fills it', () => {
      const clamped = clampTranslate(
        { scale: fitScale(board, viewport), translateX: 999, translateY: 999 },
        board,
        viewport
      );
      // At fit scale the square board exactly fills both axes; the only legal
      // position is flush at the origin.
      expect(clamped.translateX).toBeCloseTo(0, 0);
    });

    it('should allow any fully-visible position when the scaled board is smaller', () => {
      const small = { w: 300, h: 300 };
      // 60px of slack: positions within [0, 60] are legal, outside clamps in.
      const inside = clampTranslate({ scale: 1, translateX: 40, translateY: -10 }, small, viewport);
      expect(inside.translateX).toBe(40);
      expect(inside.translateY).toBe(0);
      const past = clampTranslate({ scale: 1, translateX: 99, translateY: 99 }, small, viewport);
      expect(past.translateX).toBe(60);
      expect(past.translateY).toBe(60);
    });
  });

  describe('zoomAbout', () => {
    it('should keep the focus point stationary on screen', () => {
      const focus = { x: 180, y: 180 }; // viewport center, screen space
      const before = { scale: 1, translateX: -240, translateY: -240 };
      const boardPointBefore = (focus.x - before.translateX) / before.scale;
      const after = zoomAbout(before, 2, focus, board, viewport);
      const boardPointAfter = (focus.x - after.translateX) / after.scale;
      expect(boardPointAfter).toBeCloseTo(boardPointBefore, 5);
    });
  });

  describe('minimapPointToTranslate', () => {
    it('should center the viewport on the tapped board point', () => {
      const minimap = { w: 150, h: 150 };
      const t = minimapPointToTranslate({ x: 75, y: 75 }, minimap, board, viewport, 1);
      // Tapping minimap center → board center (420,420) under viewport center (180,180).
      expect(t.translateX).toBeCloseTo(180 - 420);
      expect(t.translateY).toBeCloseTo(180 - 420);
    });
  });

  describe('indicatorRect', () => {
    it('should map the visible slice into minimap coordinates', () => {
      const minimap = { w: 150, h: 150 };
      const rect = indicatorRect(
        { scale: 1, translateX: 0, translateY: 0 },
        board,
        viewport,
        minimap
      );
      // Visible board region is 360×360 at origin; minimap scale is 150/840.
      expect(rect.x).toBeCloseTo(0);
      expect(rect.w).toBeCloseTo((360 / 840) * 150);
    });

    it('should clamp the indicator to the minimap when the board fits the viewport', () => {
      const minimap = { w: 150, h: 150 };
      const rect = indicatorRect(
        { scale: 1, translateX: 0, translateY: 0 },
        { w: 300, h: 300 },
        viewport,
        minimap
      );
      // The viewport sees past the board, so the indicator covers the whole map.
      expect(rect).toEqual({ x: 0, y: 0, w: 150, h: 150 });
    });
  });

  describe('centerOnPoint', () => {
    it('should put the board point under the viewport center', () => {
      const t = centerOnPoint({ x: 420, y: 420 }, 1, board, viewport);
      // Board center (420,420) under viewport center (180,180).
      expect(t.translateX).toBeCloseTo(180 - 420);
      expect(t.translateY).toBeCloseTo(180 - 420);
    });

    it('should account for the scale', () => {
      const t = centerOnPoint({ x: 420, y: 420 }, 2, board, viewport);
      expect(t.translateX).toBeCloseTo(180 - 420 * 2);
      expect(t.translateY).toBeCloseTo(180 - 420 * 2);
    });

    it('should clamp at the board edge instead of exposing empty space', () => {
      const t = centerOnPoint({ x: 20, y: 20 }, 1, board, viewport);
      // A corner point cannot be centered; the camera stops at the bound.
      expect(t.translateX).toBe(0);
      expect(t.translateY).toBe(0);
    });

    it('should pull the point toward center while a smaller board stays in frame', () => {
      const small = { w: 300, h: 300 };
      const t = centerOnPoint({ x: 30, y: 150 }, 1, small, viewport);
      // x: centering an edge point wants translate 150, but only 60px of
      // slack exists — the board shifts as far as full visibility allows.
      expect(t.translateX).toBe(60);
      // y: the midpoint centers exactly (180 - 150 = 30, within [0, 60]).
      expect(t.translateY).toBe(30);
    });

    it('should stay continuous as zooming carries the board past the viewport size', () => {
      const small = { w: 300, h: 300 };
      const point = { x: 100, y: 100 };
      // Scales straddling scaled-board == viewport (360/300 = 1.2): a zoom
      // step across the boundary must not jump the camera.
      const below = centerOnPoint(point, 1.199, small, viewport);
      const above = centerOnPoint(point, 1.201, small, viewport);
      expect(Math.abs(above.translateX - below.translateX)).toBeLessThan(1);
      expect(Math.abs(above.translateY - below.translateY)).toBeLessThan(1);
    });
  });

  describe('ensureVisibleTranslate', () => {
    it('should pan a cell that is off the right edge into view', () => {
      const cell = { x: 800, y: 0, w: 40, h: 40 }; // far-right cell, board space
      const t = { scale: 1, translateX: 0, translateY: 0 }; // showing left edge only
      const next = ensureVisibleTranslate(cell, t, board, viewport);
      const cellRightOnScreen = next.translateX + (cell.x + cell.w) * t.scale;
      expect(cellRightOnScreen).toBeLessThanOrEqual(viewport.w + 0.001);
    });

    it('should leave a cell already in view unchanged', () => {
      const cell = { x: 0, y: 0, w: 40, h: 40 };
      const t = { scale: 1, translateX: 0, translateY: 0 };
      const next = ensureVisibleTranslate(cell, t, board, viewport);
      expect(next.translateX).toBe(0);
      expect(next.translateY).toBe(0);
    });
  });

  it('should expose comfortable-size and max-scale constants', () => {
    expect(COMFORTABLE_CELL_SIZE).toBe(40);
    expect(MAX_SCALE).toBe(2);
  });
});
