import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readThemeTokens } from '@/game/testing/themeTokens';

const CELL_CSS = readFileSync(resolve(process.cwd(), 'src/game/Cell/Cell.module.css'), 'utf8');

describe('cell color tokens', () => {
  it('should pin the structural shades', () => {
    const tokens = readThemeTokens();
    expect(tokens['--cell-shaded-bg']).toEqual({ dark: '#9090a8', light: '#9090a8' });
    expect(tokens['--cell-shaded-text']).toEqual({ dark: '#0a0a23', light: '#0a0a23' });
    expect(tokens['--cell-shaded-selected-border']).toEqual({ dark: '#14225e', light: '#14225e' });
    expect(tokens['--cell-selected-border']).toEqual({ dark: '#4a90d9', light: '#4a90d9' });
  });

  it('should pin the translucent highlight overlays', () => {
    const tokens = readThemeTokens();
    // 8-digit RRGGBBAA so they composite over the structural color; the alpha
    // byte must be < ff or the highlight would be opaque and hide region shading.
    expect(tokens['--cell-peer-overlay']).toEqual({ dark: '#8ea8ff29', light: '#3a4aa01a' });
    expect(tokens['--cell-same-value-overlay']).toEqual({ dark: '#1fb5a852', light: '#1fa89c57' });
  });

  it('should wire shaded cells and the overlay-backed regions to their tokens', () => {
    expect(CELL_CSS).toMatch(/\[data-shaded\]\s*\{\s*background-color:\s*var\(--cell-shaded-bg\)/);
    expect(CELL_CSS).toMatch(/\[data-window\]\s*\{\s*background-color:\s*var\(--cell-window-bg\)/);
    expect(CELL_CSS).toMatch(
      /data-center-dot\]\s*\{\s*background-color:\s*var\(--cell-special-bg\)/
    );
  });

  it('should force near-black ink on shaded cells (not the default light text)', () => {
    expect(CELL_CSS).toMatch(
      /\[data-shaded\][^{]*\.value,[\s\S]*?color:\s*var\(--cell-shaded-text\)/
    );
  });

  it('should not leave bare hex in the shaded marker rule', () => {
    expect(CELL_CSS).not.toMatch(/\[data-shaded\]\s*\{\s*background(-color)?:\s*#/);
  });

  it('should layer peer and same-value as translucent overlays, not opaque fills', () => {
    expect(CELL_CSS).toMatch(
      /\[data-peer\]\s*\{\s*background-image:\s*linear-gradient\(var\(--cell-peer-overlay\)/
    );
    expect(CELL_CSS).toMatch(
      /\[data-same-value\]\s*\{\s*background-image:\s*linear-gradient\(var\(--cell-same-value-overlay\)/
    );
  });

  it('should let the error fill clear the highlight overlay', () => {
    expect(CELL_CSS).toMatch(
      /\[data-error\][\s\S]*?\{[\s\S]*?background-color:\s*var\(--cell-error-bg\)[\s\S]*?background-image:\s*none/
    );
  });

  it('should not rely on !important anywhere in the cell styles', () => {
    expect(CELL_CSS).not.toMatch(/!important/);
  });
});
