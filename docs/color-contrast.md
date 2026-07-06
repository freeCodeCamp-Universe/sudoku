# Color contrast design

Hand-maintained reference for how board colors are chosen and gated. The token values
themselves live in `src/app/theme.css` and are tabulated in the generated
[`colors.md`](./colors.md).

## Tooling

| What                           | Where                                                         |
| ------------------------------ | ------------------------------------------------------------- |
| WCAG contrast math             | `src/game/testing/contrast.ts`                                |
| Declared color pairs + CI gate | `src/game/testing/contrastSpecs.ts` / `contrastSpecs.test.ts` |
| Ratio report                   | `pnpm contrast:report`                                        |
| Chip luminance-ladder solver   | `src/game/testing/colorLadder.ts`, `pnpm contrast:ladder`     |

Ratios are **never rounded up**: 4.4999:1 fails a 4.5:1 threshold. Only relative
luminance determines a contrast ratio, so any search over background shades can sweep
grays and remain fully general.

## The four palettes and the gate policy

Themes compose as classes on `<html>`: `:root` (dark), `.light`, `.high-contrast`,
`.light.high-contrast`. High contrast is an orthogonal user setting (persisted as
`sudoku-high-contrast`, toggled from the game-page settings dropdown via the theme
context; the retired `sudoku-colorblind` key migrates once).

- **Standard palettes**: pairs that pass today are gated against regression. Known
  shortfalls the owner accepted live in `ACCEPTED_FAILURES` in `contrastSpecs.ts` and are
  reported but not gated. A companion test asserts each accepted failure still fails, so
  an accidental fix must be promoted to gated.
- **High-contrast palettes**: every pair is gated at AA. No exceptions.
- **Cascade guard**: `.high-contrast` is declared after `.light`, so a token overridden
  only in `.high-contrast` would leak its dark value into light high-contrast.
  `readThemeTokens()` throws unless `.light.high-contrast` overrides every token
  `.high-contrast` sets.

## Why the standard even/odd shading stays non-compliant

Parity shading is the sole cue distinguishing even from odd cells, so WCAG 1.4.11 wants
3:1 between the two backgrounds while every text role keeps 4.5:1 on both. A sweep of all
256 x 256 gray pairs (fully general, see above) found **zero** feasible combinations under
the current text colors: best parity separation is 2.69:1 (dark, essential text only) and
1.50:1 (light). Feasibility in dark requires text luminance >= 0.625 (`--accent-blue` is
0.558); in light, `--cell-text-light` (L 0.106) forces the lighter parity past white.
Fixing it in place therefore means changing the shared text colors — a full palette
rework that was rejected in the PR #66 discussion. The high-contrast palette carries the
compliant combination instead (its parity backgrounds and slightly brighter text roles
were solved together).

## Color-sudoku chips: the luminance ladder

Chips are the rendered symbol, so each needs 3:1 against the resting cell background, and
the number-pad label needs 4.5:1 on every chip. Boxed in by those two bounds, nine chips
cannot reach 3:1 against _each other_ — the optimum is an equal-ratio luminance ladder,
about 1.17–1.19:1 per step. Design rules, encoded in the high-contrast chip sets:

1. **Every chip one geometric luminance rung apart** — under color-vision deficiency hue
   collapses, so lightness carries the distinction. Gated by `CHIP_LADDER_MIN` (1.15:1)
   in `contrastSpecs.test.ts`.
2. **Hue families stay truthful** to `colorNames` in `src/variants/color.ts` (screen
   readers announce "Red", "Blue", ...), and **ladder neighbors are hue-distant** (order:
   purple, blue, red, teal, orange, pink, green, silver, yellow) so adjacent rungs never
   rely on lightness alone.
3. **Solve each rung at maximum saturation** for its hue (scale toward black, or blend
   toward white only when unavoidable) — white-blending is what turns red into salmon.
   Cap the dark ladder at pure yellow's own luminance (~0.82) so the top rung stays fully
   saturated.
4. Silver is the one neutral; it sits on the second-highest dark rung as a light gray.

Use `pnpm contrast:ladder` to re-solve candidate sets when bounds or hues change.

**Known trade-off**: the high-contrast _light_ chips are capped at L <= 0.183 (white
number-pad label at 4.5:1), so their dark rungs (purple, blue) are nearly black; the
ladder, not the hue, separates them.

## Number-pad chip labels

`--numpad-chip-label` per palette: standard dark keeps the translucent white
(accepted shortfall — 8/9 chips fail regardless of label polarity, and rgba cannot be
measured by the gate); standard light is solid `#000000` (all 9 pass, gated); HC dark is
`#000000` (bright chips); HC light is `#ffffff` (dark chips — a dark label mathematically
cannot reach 4.5:1 under the chip luminance cap).

## Changing colors

1. Edit tokens in `theme.css` (respect the cascade guard above).
2. `pnpm contrast:report` — no `FAIL (gated)` lines may remain; use `pnpm contrast:ladder`
   when touching high-contrast chips.
3. New colors: add pairs to `contrastPairs` so they land in the report and the gate.
4. `pnpm docs:colors` to regenerate `colors.md`, then `pnpm build && pnpm test && pnpm lint`.
