import { describe, expect, it } from 'vitest';
import { CHAIN_TOKENS } from './contrastSpecs';
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
  it('should define every chain-line token ChainOverlay can reference', () => {
    const tokens = readThemeTokens();
    for (const token of CHAIN_TOKENS) {
      expect(tokens[token]).toBeDefined();
    }
  });
});
