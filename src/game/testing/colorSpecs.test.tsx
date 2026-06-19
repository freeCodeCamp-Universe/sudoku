import { describe, expect, it } from 'vitest';
import { CHAIN_COLORS } from '@/variants/chain';
import { readThemeTokens } from './themeTokens';
import { renderVariantBoard } from './renderVariantBoard';
import { makeFixture } from './makeFixture';
import { colorSpecs } from './colorSpecs';

describe('per-variant color specs', () => {
  it.each(colorSpecs)('should mark $cell on $variantImport with $marker', (spec) => {
    const fixture = spec.kind === 'value-derived' ? makeFixture(spec.variant) : undefined;
    const { getCell } = renderVariantBoard(spec.variant, fixture ? { fixture } : {});
    expect(getCell(spec.cell)).toHaveAttribute(spec.marker, 'true');
  });

  it.each(colorSpecs)('should define $token for $variantImport', (spec) => {
    expect(readThemeTokens()[spec.token]).toBeDefined();
  });
});

describe('chain palette', () => {
  it('should pin the JS-owned chain color palette', () => {
    expect(CHAIN_COLORS).toEqual([
      '#99c9ff',
      '#acd157',
      '#f1be32',
      '#ff9966',
      '#cc88ff',
      '#55ddbb',
      '#ff88aa',
      '#88ddff',
      '#ffcc55',
      '#dd88cc',
      '#88ccaa',
      '#ffaa66',
    ]);
  });
});
