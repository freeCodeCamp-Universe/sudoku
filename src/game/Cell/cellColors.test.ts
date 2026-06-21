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
    expect(tokens['--cell-same-value-bg']).toEqual({ dark: '#1a4f4f', light: '#cdeaea' });
    expect(tokens['--cell-selected-border']).toEqual({ dark: '#4a90d9', light: '#4a90d9' });
  });

  it('should wire shaded cells and the overlay-backed regions to their tokens', () => {
    expect(CELL_CSS).toMatch(/\[data-shaded\]\s*\{\s*background:\s*var\(--cell-shaded-bg\)/);
    expect(CELL_CSS).toMatch(/\[data-window\]\s*\{\s*background:\s*var\(--cell-window-bg\)/);
    expect(CELL_CSS).toMatch(/data-center-dot\]\s*\{\s*background:\s*var\(--cell-special-bg\)/);
  });

  it('should force near-black ink on shaded cells (not the default light text)', () => {
    expect(CELL_CSS).toMatch(
      /\[data-shaded\][^{]*\.value,[\s\S]*?color:\s*var\(--cell-shaded-text\)/
    );
  });

  it('should not leave bare hex in the shaded marker rule', () => {
    expect(CELL_CSS).not.toMatch(/\[data-shaded\]\s*\{\s*background:\s*#/);
  });
});
