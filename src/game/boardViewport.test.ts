import { describe, expect, it } from 'vitest';
import {
  clampScale,
  clampTranslate,
  ensureVisibleTranslate,
  fitScale,
  indicatorRect,
  isOversized,
  minimapPointToTranslate,
  zoomAbout,
  COMFORTABLE_CELL_SIZE,
  MAX_SCALE,
} from './boardViewport';

const board = { w: 840, h: 840 }; // 21 × 40
const viewport = { w: 360, h: 360 };

describe('boardViewport', () => {
  describe('isOversized', () => {
    it('should be true when the board is wider than the viewport', () => {
      expect(isOversized(board, viewport)).toBe(true);
    });

    it('should be false when the board fits the viewport', () => {
      expect(isOversized({ w: 300, h: 300 }, viewport)).toBe(false);
    });
  });

  describe('fitScale', () => {
    it('should scale so the whole board fits the smaller axis', () => {
      expect(fitScale(board, viewport)).toBeCloseTo(360 / 840);
    });
  });

  describe('clampScale', () => {
    it('should not allow zooming out past the fit scale', () => {
      expect(clampScale(0.1, board, viewport)).toBeCloseTo(fitScale(board, viewport));
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

    it('should center the board on an axis where the scaled board is smaller', () => {
      const clamped = clampTranslate(
        { scale: fitScale(board, viewport), translateX: 999, translateY: 999 },
        board,
        viewport
      );
      // At fit scale the board exactly fills the smaller axis and centers on the other.
      expect(clamped.translateX).toBeCloseTo(0, 0);
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
