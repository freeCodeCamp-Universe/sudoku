import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { THEME_STORAGE_KEY } from '@/hooks/use-theme';
import { ANIMATIONS_STORAGE_KEY, REDUCED_MOTION_ATTRIBUTE } from '@/learn/hooks/useAnimationsPreference';

const layoutSource = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');

describe('index.html pre-paint theme script', () => {
  it('should stamp the theme with a blocking inline script', () => {
    expect(layoutSource).toContain('<script>');
    expect(layoutSource).toContain('documentElement.dataset.theme');
  });

  it('should read the same storage key the theme hook exports', () => {
    expect(layoutSource).toContain(THEME_STORAGE_KEY);
  });

  it('should stamp reduced motion from the animations preference', () => {
    expect(layoutSource).toContain(ANIMATIONS_STORAGE_KEY);
    expect(layoutSource).toContain("document.documentElement.setAttribute('data-reduced-motion', '')");
    expect(layoutSource).toContain(REDUCED_MOTION_ATTRIBUTE);
  });

  it('should check system theme preference with prefers-color-scheme', () => {
    expect(layoutSource).toContain('prefers-color-scheme: light');
  });
});
