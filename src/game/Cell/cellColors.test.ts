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
    // Two-tone selection ring: brand blue plus a dark inner edge, same in both
    // themes. The blue carries dark backgrounds, the edge the light/grey ones.
    expect(tokens['--cell-selected-border']).toEqual({ dark: '#4a90d9', light: '#4a90d9' });
    expect(tokens['--cell-selected-edge']).toEqual({ dark: '#0a0a23', light: '#0a0a23' });
  });

  it('should pin the opaque highlight fills', () => {
    const tokens = readThemeTokens();
    // Opaque single fills (no alpha byte) so peer / same-value look identical on
    // every cell type instead of compositing differently over each structural tint.
    expect(tokens['--cell-peer-overlay']).toEqual({ dark: '#2e3850', light: '#c7d4f5' });
    expect(tokens['--cell-same-value-overlay']).toEqual({ dark: '#533a73', light: '#ddd0f0' });
  });

  it('should wire shaded cells to the shared shaded token', () => {
    expect(CELL_CSS).toMatch(/\[data-shaded\]\s*\{\s*background-color:\s*var\(--cell-shaded-bg\)/);
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
