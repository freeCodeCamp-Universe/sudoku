import { describe, expect, it } from 'vitest';
import { readThemeTokens } from '@/game/testing/themeTokens';

describe('preview overlap tokens', () => {
  it('should define one consistent overlap scale for all previews', () => {
    const tokens = readThemeTokens();
    expect(tokens['--cell-overlap-2-bg']).toMatchObject({ dark: '#222248', light: '#eeeef8' });
    expect(tokens['--cell-overlap-5-bg']).toMatchObject({ dark: '#313163', light: '#dfdff2' });
  });
});
