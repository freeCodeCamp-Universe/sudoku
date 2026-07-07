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
cannot reach 3:1 against _each other_ — the optimum is an equal-ratio luminance ladder.
Design rules, encoded in the high-contrast chip sets:

1. **Every chip one geometric luminance rung apart** — under color-vision deficiency hue
   collapses, so lightness carries the distinction. Gated per palette by
   `CHIP_LADDER_MIN` (dark 1.15:1, light 1.2:1) in `contrastSpecs.test.ts`.
2. **Hue families stay truthful** to `colorNames` in `src/variants/color.ts` (screen
   readers announce "Red", "Blue", ...), and **ladder neighbors are hue-distant** (dark:
   purple, blue, red, teal, orange, pink, green, silver, yellow; light: purple, red,
   blue, pink, teal, green, orange, yellow, silver) so adjacent rungs never rely on
   lightness alone. The light order interleaves warm hues between purple, blue, and
   teal — on the dark rungs those cool hues are near-indistinguishable as neighbors.
3. **Solve each rung at maximum saturation** for its hue (scale toward black, or blend
   toward white only when unavoidable) — white-blending is what turns red into salmon.
   Cap the dark ladder at pure yellow's own luminance (~0.82) so the top rung stays fully
   saturated. Darkening preserves the anchor's channel proportions, so the light ladder
   solves from its own **max-chroma anchors** (`LIGHT_ANCHORS` in `chipLadderReport.ts`) —
   any white or gray in an anchor survives as mud in the dark rungs (a desaturated UI blue
   darkens to navy-gray).
4. Silver is the one neutral; it sits on the highest light rung and the second-highest
   dark rung as a gray.
5. **Label polarity is per chip**, not per palette: chips 3 and 9 occupy the two
   brightest rungs in both HC ladders and render `--numpad-chip-label-bright`. In light
   HC that label is dark, which frees the ladder's cap from the white label (L <= 0.183)
   up to the 3:1-vs-white base bound (L <= 0.295) — per-step separation improves from
   ~1.16:1 to ~1.22:1 and the upper rungs get light enough for hue to read.

Use `pnpm contrast:ladder` to re-solve candidate sets when bounds or hues change.

The light ladder's **floor is raised off near-black** (lMin 0.02): below that, no hue is
perceptible and the two darkest rungs read as identical blobs regardless of anchor. The
floor trades a little step spacing (worst step ~1.21 vs the 1.2 gate) for readable hue on
the purple and red rungs; it cannot rise further without breaking the gate or pushing the
rung-7 white label under 4.5:1.

**Known trade-off**: the chip-vs-base gate uses the resting (white) cell — on tinted
state backgrounds (peer/same-value highlights) the brightest chips dip below 3:1.

## Number-pad chip labels

`--numpad-chip-label` per palette, with `--numpad-chip-label-bright` on chips 3 and 9
(see rule 5 above): standard dark keeps the translucent white (accepted shortfall — 8/9
chips fail regardless of label polarity, and rgba cannot be measured by the gate);
standard light is solid `#000000` (all 9 pass, gated); HC dark is `#000000` everywhere
(bright chips); HC light is `#ffffff` with a `#000000` bright-chip label, both gated.

## Primary action button

`--btn-primary-bg` / `--btn-primary-text` (New Game, modal confirm). Standard palettes
keep the brand yellow surface with near-black text (~10:1, gated); its 1.6:1 surface
against the light page background is an accepted advisory — the label identifies the
control. HC dark keeps the brand yellow surface — it already clears both gates at
~11:1, so it does not follow `--accent-yellow`'s brightening (which serves that
token's _text_ role). HC light targets AAA for the label, and gold + dark text is
infeasible there: 7:1 over the near-black text needs surface luminance >= 0.33, while
3:1 against the page caps it at 0.27. So the label flips to white on a deep gold
surface, `#6b5300` (label 7.34:1, vs page 6.71:1) — dark enough for AAA, warm enough
that the gold identity survives instead of collapsing to brown. The pale yellow label
cannot reach 7:1 without darkening the surface back to near-brown. Never
restyle these buttons with `--accent-yellow` directly: the HC palettes repurpose that
token as a _text_ color, which is how the original dark-on-dark bug happened.

## Grid lines and UI borders in high contrast

Cell borders and box boundaries are graphical objects required to understand the puzzle,
so WCAG 1.4.11 wants 3:1 against every cell fill they delimit. The standard palettes sit
well below that (dark `--cell-border` is 1.95:1 on the board background, light is 1.41:1
on white cells) — an accepted shortfall alongside the even/odd shading. The
high-contrast palettes override `--cell-border` and `--box-boundary` (`#cccce0` dark,
`#262638` light), gated at 3:1 against the full cell-background set including the error
fill. This is feasible because the dark grid never shows white cells (`--cell-bg-light`
only applies under `.light`), so the dark border can rise until it clears the
mid-luminance even (`#60607a`) and error (`#9c5f5f`) fills; the light border drops to
near-black, which clears its even (`#8f8fa8`) and error (`#cc7070`) fills from below.

`--board-frame` (the 3px outline around the whole board and the samurai edge strips,
Board.module.css) was previously hardcoded; it is now a token in all four palettes and
in high contrast it takes the `--cell-border` value, so the frame and the interior grid
lines read as one system. It is gated at 3:1 against the page background in every
palette.

`--border` (toolbar buttons, cards, dialogs) gets the same treatment (`#9898b0` dark —
the existing overlay-stroke gray — and `#55556d` light), gated at 3:1 against
`--bg-primary`, `--bg-secondary`, and `--bg-surface`. `--focus-ring` already clears
3:1 in every palette and keeps its standard value.

## Selection ring

`--cell-selected-border` outlines the selected cell on whatever fill that cell
carries, so in high contrast it gates like the grid lines: 3:1 against the full
cell-background set including the error fill. The standard blue (`#4a90d9`) clears
3:1 vs base in every palette (gated) but sits near 1:1 on the mid-gray region
fills, so the HC palettes override it: `#a8d4ff` dark (a brighter blue; the error
fill is the binding pair at 3.21:1) and `#08306b` light (navy — the error fill's
luminance 0.256 caps the ring at L ≈ 0.052, which forces it well past the standard
blue toward black).

## Board clue text

`--board-clue-text` colors outer board clues (the skyscraper gutter numbers) on the
page background. It exists because `--accent-blue` cannot serve this role: the
high-contrast palettes repurpose that token as a near-white/near-black body-text
color, which erased the blue identity separating outer clues from cell values (and
in the light palettes the accent blue sat too close to the blue cell text). The
token stays a saturated blue in all four palettes — `#99c9ff` in both darks,
`#0d47a1` in both lights — gated at 4.5:1 against `--bg-primary`.

## Muted text in high contrast

The high-contrast palettes override `--text-muted` (`#d0d0d5` dark, `#2a2a40`
light): dim text defeats the mode's purpose, so every muted label — including the
resting secondary controls (mode switcher, Erase, Reveal Cell, Clear All) —
brightens one step short of `--text-subtle`, keeping pressed/active states (which
use `--text-bright`) distinguishable. The pair against the button background
(`--bg-secondary`) is gated at 4.5:1 in both HC palettes and standard dark.

## Greater-than inequality markers

`--overlay-inequality-fill` colors the triangles between cells (InequalityOverlay) and
the legend triangle under the board. A dedicated token because `--accent-yellow` cannot
serve this role: the HC palettes repurpose it as a text color (near-black in light HC),
which erased the markers — the same failure mode as the primary-button bug above. The
markers are graphical objects, so the HC values are gated at 3:1 against the resting
cell background and the page background (`#ffe38a` dark, `#a97b00` light — the lightest
gold that clears both light backgrounds while still reading yellow). Like the chip gate,
state fills are excluded: nothing clears the light-HC error fill from below without
collapsing to near-black. Standard dark keeps the brand `#f1be32` (9.7:1, gated);
standard light deepens it to `#c79100` for visibility but stays under 3:1 by design
(accepted advisory — the standard palette is the low-contrast mode).

`--overlay-cage-sum` (killer cage sums, CageOverlay) follows the same pattern but is
small bold _text_, so its HC gate is 4.5:1 against the resting base: `#ffe38a` dark,
`#8a6a00` light (one gold rung deeper than the 3:1 marker gold, 5.07:1 on white).
Standard palettes mirror the marker values (`#f1be32` dark gated, `#c79100` light
accepted advisory).

## Variant region fills

`--cell-diagonal-bg` (Sudoku X), `--cell-window-bg` / `--overlay-window-fill`
(windoku), and `--cell-special-bg` / `--overlay-special-fill` (asterisk,
center dot, girandola) shade the extra constraint region — the sole cue that a
cell belongs to it, so WCAG 1.4.11 wants 3:1 against the plain cell base. The
standard palettes keep their subtle tints (accepted shortfall, as with even/odd);
the high-contrast palettes override all five, gated at 3:1 vs base in all four
region-fill pairs plus every text role at 4.5:1 (the cell tokens sit in
`CELL_BGS`, which also extends the border and dot gates to them).

The dark-HC window is narrow: the fill must clear 3:1 **above** the plain base
(`--bg-secondary`, luminance ≈ 0.012) while the light text roles keep 4.5:1 on
it from above — feasible only between fill luminance ≈ 0.137 and ≈ 0.143 under
`--accent-blue` (#d8ecff). That is why `.high-contrast` also brightens
`--accent-yellow` (#ffe38a → #ffeaa8) and `--candidate-text` (#e6e6f5 →
#f0f0fa): at #65658a the old hint gold and candidate gray sat under 4.5:1. Both
tokens only ever render on dark fills, so brightening is strictly safe. Light
HC reuses the solved even-cell gray (#8f8fa8); the special fill keeps its
purple identity at the same luminance rung (#6d6398 dark, #a087c4 light).

The fills are also pinned from the text side: with the fill at exactly 3:1 vs
base, text-on-fill tops out at (text-vs-base ÷ 3) — 5.18:1 in light HC, 5.60:1
in dark HC — so AAA (7:1) on region fills is infeasible and the shipped values
sit within a few percent of that optimum. Accepted, undeclared shortfalls in
the highlight states (verified infeasible under the same arithmetic, so they
are documented here rather than gated):

- **Error fill vs region fill** (~1.1:1 both HC palettes): an error fill cannot
  clear 3:1 against the mid-gray region fills while `--accent-red` keeps 4.5:1
  on it. Hue plus the red digit carries the state.
- **Region cue under peer highlight**: peer cells swap to
  `--cell-peer-structural-bg`, which sits near the plain peer fill (1.06:1 dark
  HC, 1.20:1 light HC). In light HC the triple constraint (peer 3:1 vs white,
  region-peer 3:1 vs peer, dark text 4.5:1 on both) is infeasible; the region
  cue returns the moment the selection moves.
- **Same-value teal vs base** (1.27:1 light HC): any teal that clears 3:1 vs
  white lands on the region fills' luminance rung, leaving a hue-only
  difference against them.

## Given / revealed cell dots

`--given-dot` / `--revealed-dot` mark clue and revealed cells (Cell.module.css). The
standard values are translucent rgba (accepted shortfall, unmeasurable by the gate); the
HC palettes use solid values gated at 3:1 against every cell background a dot can sit on,
including the error background.

## Changing colors

1. Edit tokens in `theme.css` (respect the cascade guard above).
2. `pnpm contrast:report` — no `FAIL (gated)` lines may remain; use `pnpm contrast:ladder`
   when touching high-contrast chips.
3. New colors: add pairs to `contrastPairs` so they land in the report and the gate.
4. `pnpm docs:colors` to regenerate `colors.md`, then `pnpm build && pnpm test && pnpm lint`.
