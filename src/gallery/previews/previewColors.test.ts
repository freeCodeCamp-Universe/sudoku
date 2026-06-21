import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readThemeTokens } from '@/game/testing/themeTokens';

const PREVIEWS_DIR = resolve(process.cwd(), 'src/gallery/previews');
const previewFiles = readdirSync(PREVIEWS_DIR).filter((name) => name.endsWith('Preview.tsx'));
const readPreview = (name: string) => readFileSync(resolve(PREVIEWS_DIR, name), 'utf8');

describe('preview colors', () => {
  it('should define one consistent overlap scale for all previews', () => {
    const tokens = readThemeTokens();
    expect(tokens['--cell-overlap-2-bg']).toEqual({ dark: '#222248', light: '#eeeef8' });
    expect(tokens['--cell-overlap-5-bg']).toEqual({ dark: '#313163', light: '#dfdff2' });
  });

  it('should pin the board tokens the preview fills mirror', () => {
    const tokens = readThemeTokens();
    // previewBaseFill: plain cell background per theme.
    expect(tokens['--cell-bg-light']).toEqual({ dark: '#ffffff', light: '#ffffff' });
    expect(tokens['--bg-secondary']).toEqual({ dark: '#1b1b32', light: '#ebebe6' });
    // previewShadedFill: theme-invariant shaded tint (even / diagonal /
    // girandola / windoku windows).
    expect(tokens['--cell-shaded-bg']).toEqual({ dark: '#9090a8', light: '#9090a8' });
    // previewRegionFill: asterisk / center-dot region.
    expect(tokens['--cell-special-bg']).toEqual({ dark: '#3b3b4f', light: '#e8e8fa' });
  });

  it('should not paint the stale page-background hex as a cell fill in any preview', () => {
    // #f5f5f0 is the page background, not a cell color; the board's light cell is
    // #ffffff (--cell-bg-light). Previews must read previewBaseFill instead.
    for (const name of previewFiles) {
      expect(readPreview(name), `${name} should not hardcode #f5f5f0`).not.toMatch(/#f5f5f0/i);
    }
  });

  it('should derive shaded-region previews from the shared shaded token', () => {
    for (const name of ['SudokuXPreview.tsx', 'GirandolaPreview.tsx', 'EvenOddPreview.tsx']) {
      expect(readPreview(name), `${name} should call previewShadedFill`).toMatch(
        /previewShadedFill\(\)/
      );
    }
  });

  it('should ink digits on shaded cells with the shaded-text color, like the board', () => {
    // The #9090a8 shaded tint cannot hold contrast with the default light digit
    // color in dark theme, so digits on shaded cells must use previewShadedText.
    for (const name of ['SudokuXPreview.tsx', 'GirandolaPreview.tsx', 'EvenOddPreview.tsx']) {
      expect(readPreview(name), `${name} should call previewShadedText`).toMatch(
        /previewShadedText\(\)/
      );
    }
  });
});
