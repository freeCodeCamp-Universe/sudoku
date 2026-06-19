import { readThemeTokens } from './themeTokens';
import { colorSpecs } from './colorSpecs';

export function buildColorDocs(): string {
  const tokens = readThemeTokens();
  const tokenRows = Object.entries(tokens)
    .map(([name, value]) => `| \`${name}\` | ${value.dark} | ${value.light} |`)
    .join('\n');
  const specRows = colorSpecs
    .map(
      (spec) => `| ${spec.variantImport} | \`${spec.marker}\` | \`${spec.token}\` | ${spec.kind} |`
    )
    .join('\n');

  return [
    '# Board Colors',
    '',
    '_Generated from `src/app/theme.css` and `src/game/testing/colorSpecs.ts`. Run `pnpm docs:colors` to regenerate._',
    '',
    '## Tokens',
    '',
    '| Token | Dark | Light |',
    '| --- | --- | --- |',
    tokenRows,
    '',
    '## Per-variant color markers',
    '',
    '| Variant | Marker | Token | Kind |',
    '| --- | --- | --- | --- |',
    specRows,
    '',
  ].join('\n');
}
