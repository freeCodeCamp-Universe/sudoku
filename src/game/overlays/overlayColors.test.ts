import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readThemeTokens } from '@/game/testing/themeTokens';

const OVERLAY_DIR = resolve(process.cwd(), 'src/game/overlays');

function overlayModuleCss(): string[] {
  return readdirSync(OVERLAY_DIR, { recursive: true })
    .filter((name): name is string => typeof name === 'string' && name.endsWith('.module.css'))
    .map((name) => readFileSync(resolve(OVERLAY_DIR, name), 'utf8'));
}

describe('overlay color tokens', () => {
  it('should pin the line-stroke tokens', () => {
    const tokens = readThemeTokens();
    expect(tokens['--overlay-cage-stroke']).toEqual({ dark: '#9898b8', light: '#5555aa' });
    expect(tokens['--overlay-argyle-stroke']).toEqual({ dark: '#9898b8', light: '#8080a8' });
    expect(tokens['--overlay-jigsaw-stroke']).toEqual({ dark: '#9898b8', light: '#6060a0' });
    expect(tokens['--overlay-arrow-stroke']).toEqual({ dark: '#9898b8', light: '#767698' });
  });

  it('should pin the special-cell and window fills', () => {
    const tokens = readThemeTokens();
    expect(tokens['--overlay-window-fill']).toEqual({ dark: '#3b3b4f', light: '#e8e8fa' });
    expect(tokens['--overlay-special-fill']).toEqual({ dark: '#3a1a6a', light: '#dcc8f4' });
  });

  it('should pin the theme-invariant kropki and consecutive colors', () => {
    const tokens = readThemeTokens();
    expect(tokens['--overlay-kropki-light']).toEqual({ dark: '#f8f8ff', light: '#f8f8ff' });
    expect(tokens['--overlay-kropki-dark']).toEqual({ dark: '#4050a0', light: '#4050a0' });
    expect(tokens['--overlay-kropki-ring']).toEqual({ dark: '#5060a0', light: '#5060a0' });
    expect(tokens['--overlay-consecutive-fill']).toEqual({ dark: '#d0d0e8', light: '#d0d0e8' });
    expect(tokens['--overlay-consecutive-stroke']).toEqual({ dark: '#1b1b32', light: '#1b1b32' });
  });

  it('should not leave bare color hex in any overlay module CSS', () => {
    for (const css of overlayModuleCss()) {
      expect(css).not.toMatch(/#[0-9a-fA-F]{3,6}/);
    }
  });
});
