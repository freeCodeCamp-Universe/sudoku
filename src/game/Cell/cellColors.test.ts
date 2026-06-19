import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readThemeTokens } from '@/game/testing/themeTokens';

const CELL_CSS = readFileSync(resolve(process.cwd(), 'src/game/Cell/Cell.module.css'), 'utf8');

describe('cell color tokens', () => {
  it('should pin the structural shades', () => {
    const tokens = readThemeTokens();
    expect(tokens['--cell-diagonal-bg']).toEqual({ dark: '#3b3b4f', light: '#e8e8fa' });
    expect(tokens['--cell-same-value-bg']).toEqual({ dark: '#1a4f4f', light: '#cdeaea' });
    expect(tokens['--cell-selected-border']).toEqual({ dark: '#4a90d9', light: '#4a90d9' });
  });

  it('should wire each structural marker to its token', () => {
    expect(CELL_CSS).toMatch(/\[data-diagonal\]\s*\{\s*background:\s*var\(--cell-diagonal-bg\)/);
    expect(CELL_CSS).toMatch(/\[data-window\]\s*\{\s*background:\s*var\(--cell-window-bg\)/);
    expect(CELL_CSS).toMatch(/\[data-even\]\s*\{\s*background:\s*var\(--cell-even-bg\)/);
    expect(CELL_CSS).toMatch(/\[data-odd\]\s*\{\s*background:\s*var\(--cell-odd-bg\)/);
  });

  it('should not leave bare hex in the structural marker rules', () => {
    expect(CELL_CSS).not.toMatch(/\[data-diagonal\]\s*\{\s*background:\s*#/);
  });
});
