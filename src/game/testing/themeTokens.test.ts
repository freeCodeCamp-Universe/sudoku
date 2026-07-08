import { describe, expect, it } from 'vitest';
import { readThemeTokens } from './themeTokens';

describe('readThemeTokens', () => {
  it('should read a dark value from :root', () => {
    expect(readThemeTokens()['--accent-blue'].dark).toBe('#99c9ff');
  });

  it('should read a light override when present', () => {
    expect(readThemeTokens()['--accent-red'].light).toBe('#850000');
  });

  it('should fall back to the :root value when there is no light override', () => {
    expect(readThemeTokens()['--focus-ring'].light).toBe('#198eee');
  });

  it('should read a light override for --accent-blue', () => {
    expect(readThemeTokens()['--accent-blue'].light).toBe('#1565c0');
  });
});
