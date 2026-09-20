import { describe, expect, it } from 'vitest';
import { readThemeColor } from './readThemeColor';

describe('readThemeColor', () => {
  it('should return the inline custom property value when set', () => {
    document.documentElement.style.setProperty('--probe-color', '#123456');
    expect(readThemeColor('--probe-color')).toBe('#123456');
  });

  it('should return an empty string for an undefined property', () => {
    expect(readThemeColor('--not-defined')).toBe('');
  });
});
