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
    expect(tokens['--overlay-cage-stroke']).toMatchObject({ dark: '#9898b8', light: '#5555aa' });
    expect(tokens['--overlay-argyle-stroke']).toMatchObject({ dark: '#9898b8', light: '#8080a8' });
    // Light matches --board-frame so jigsaw/sujiken inner region lines read
    // as one system with the outer border.
    expect(tokens['--overlay-jigsaw-stroke']).toMatchObject({
      dark: '#9898b8',
      light: '#8080a8',
      darkHc: '#ffffff',
      lightHc: '#0a0a23',
    });
    expect(tokens['--overlay-arrow-stroke']).toMatchObject({ dark: '#9898b8', light: '#9898b8' });
  });

  it('should pin the special-cell and window fills', () => {
    const tokens = readThemeTokens();
    expect(tokens['--overlay-window-fill']).toMatchObject({ dark: '#3b3b4f', light: '#e8e8fa' });
    expect(tokens['--overlay-special-fill']).toMatchObject({ dark: '#3a1a6a', light: '#dcc8f4' });
  });

  it('should pin the theme-invariant kropki and consecutive colors', () => {
    const tokens = readThemeTokens();
    expect(tokens['--overlay-kropki-light']).toMatchObject({ dark: '#f8f8ff', light: '#f8f8ff' });
    expect(tokens['--overlay-kropki-dark']).toMatchObject({ dark: '#4050a0', light: '#4050a0' });
    expect(tokens['--overlay-kropki-ring']).toMatchObject({ dark: '#5060a0', light: '#5060a0' });
    expect(tokens['--overlay-consecutive-fill']).toMatchObject({
      dark: '#d0d0e8',
      light: '#d0d0e8',
    });
    expect(tokens['--overlay-consecutive-stroke']).toMatchObject({
      dark: '#1b1b32',
      light: '#1b1b32',
    });
  });

  it('should not leave bare color hex in any overlay module CSS', () => {
    for (const css of overlayModuleCss()) {
      expect(css).not.toMatch(/#[0-9a-fA-F]{3,6}/);
    }
  });
});
