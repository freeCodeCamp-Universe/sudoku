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
- **High-contrast palettes**: every pair is gated at AA, with one documented
  class of advisories — the lighter overlap-tint _rung-vs-base_ pairs, which
  cannot clear 3:1 against the cell base while the digit text keeps 4.5:1 (see
  "Overlap tint" below; the darkest rung is gated). Every text-legibility pair
  is gated in all four palettes with no exceptions.
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
   blue, pink, teal, orange, green, yellow, silver) so adjacent rungs never rely on
   lightness alone. The light order interleaves warm hues between purple, blue, and
   teal — on the dark rungs those cool hues are near-indistinguishable as neighbors.
   Orange sits between teal and green so those hue neighbors stay two rungs apart,
   which also frees the green anchor to be pure green rather than yellow-shifted.
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
(see rule 5 above): standard dark is solid `#000000` (all 9 pass, gated — the worst chip
is purple `--color-7` at 4.52:1; a white label would fail 8 of 9); standard light is solid
`#000000` (all 9 pass, gated); HC dark is `#000000` everywhere (bright chips); HC light is
`#ffffff` with a `#000000` bright-chip label, both gated.

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
high-contrast palettes override `--cell-border` and `--box-boundary`, gated at 3:1
against the full cell-background set including the error fill. This is feasible because
the dark grid never shows white cells (`--cell-bg-light` only applies under `.light`),
so the dark border rises only as far as the mid-luminance even (`#60607a`), region
(`#5f5f81`), and error (`#8a5252`) fills force it; the light border drops to
near-black, which clears its even (`#8f8fa8`) and error (`#cc7070`) fills from below.

Cell and box lines do **not** share one color in high contrast, unlike the standard
palettes. When every line is bright, a 1px cell border already pops against the dark
board, so the 3px-vs-1px thickness cue alone no longer separates boxes from cells the
way it does with dim standard lines. The fix is a luminance step between the two line
roles, and each palette only has headroom in one direction. Light: the box boundary
deepens to the page ink `#0a0a23` while the cell border lifts to `#3c3c50`, the 3:1
ceiling (3.13:1 vs the error fill), a 1.81:1 step.

Dark buys its step by sliding the whole fill ladder down. The dark-HC base
(`--bg-secondary`) darkens to the odd-fill value `#0f0f2c`, which lowers the 3:1 floor
under the region fills (`#65658a` → `#5f5f81`), the error fill (`#9c5f5f` → `#8a5252`),
and the peer-even fill (`#646480` → `#5e5e78`); the even fill `#60607a` is pinned by
its 3:1 pairing with the odd fill and stays. With the fills down, the cell border dims
from `#cccce0` to `#b5b5c9` — the 3:1 floor vs the even fill (3.02:1) — and the box
boundary stays `#ffffff`, widening the box-vs-cell step from 1.58:1 to 2.02:1. That is
the compliant maximum: a 3:1 step would need fills 3:1 below the border and a base 3:1
below the fills, which bottoms out below black — the same infeasibility shape as the
even/odd proof. Because ~2:1 is not enough for the box structure to read on its own,
high contrast also widens the structural lines: `--box-boundary-width` (layers.css)
grows from 3px to 5px for box boundaries, jigsaw region borders, samurai edges, and
the board frame, so the width ratio carries the structure that color cannot. The light palettes keep the standard `--bg-secondary`; `.light.high-contrast`
re-declares it only to satisfy the override-parity rule.

`--board-frame` (the 3px outline around the whole board and the samurai edge strips,
Board.module.css) was previously hardcoded; it is now a token in all four palettes and
in high contrast it takes the `--box-boundary` value, so the frame and the box lines
read as one system. It is gated at 3:1 against the page background in every palette.

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

## Overlap tint

`--board-overlap-2-bg` … `--board-overlap-5-bg` tint the cells where multigrid
subgrids overlap (Board `data-overlap`), one rung per overlap count (2..5). The
tint paints on the plain multigrid cell base, which is the same background each
theme renders behind a resting cell: `--bg-secondary` in the dark palettes, and
`--cell-bg-light` (white) in the light palettes (`Cell.module.css` overrides the
cell base to white under `.light`). The digit renders on top. This is a
board-only ladder; the gallery's decorative `--cell-overlap-*` set is separate
and untouched.

Two bounds apply, and they pull against each other:

- **Text legibility (gated, all four palettes, no exceptions)**: every cell text
  role (value, given, correct, hint, candidate) keeps 4.5:1 on every rung. This
  is the binding constraint, and it caps how far each rung can travel from the
  base.
- **Rung vs base (WCAG 1.4.11, 3:1)**: gated where a legible rung also clears
  3:1, advisory where it cannot. Only the darkest high-contrast rung reaches it
  (dark HC 3.27:1, light HC 3.19:1); the other fourteen rung-vs-base pairs are
  accepted advisories.

The count is also announced by the overlap screen-reader annotator, so the tint
is a reinforcing cue rather than the sole carrier, on the same footing as the
standard region-fill and even/odd shortfalls.

**Why only the darkest rung reaches 3:1.** The legibility cap and the 3:1 floor
leave a narrow luminance window, wide enough for at most one rung per palette,
and only in high contrast. In the dark palettes the text is light, so a rung
bright enough for 3:1 above the base must still stay under the dimmest light
text role's 4.5:1 cap; standard dark has no feasible rung at all (base
`#1b1b32`, candidate `#aaaacc` caps rungs near luminance 0.05, below the 3:1
floor), while dark HC fits one. In the light palettes the base is white, so a
rung dark enough for 3:1 (luminance ≤ 0.30) must keep the darkest text at 4.5:1:
standard light's brightest text (`#7b5e2c`, luminance ≈ 0.115) needs the rung
above luminance 0.69, far too light for 3:1, whereas light HC's near-black text
(`--cell-text-light` `#0a2540`) only needs luminance ≥ 0.265, so its darkest
rung fits the window. The remaining rungs stay advisory, and rung separation
plus the SR annotator carry the count.

## Chain lines

`--overlay-chain-1` … `--overlay-chain-12` color the chain-sudoku polylines
(ChainOverlay). The overlay sits at z-index 1 — above the cell backgrounds but
below the cells' value/candidate spans (z-index 2, Cell.module.css) — so the
line passes behind the digits. The selected cell forms a stacking context, so
it is lifted to z-index 2 and the line breaks under it rather than painting
over its digit.

The standard palettes keep the original pastels at 0.3 opacity (a blend the
gate cannot measure, accepted like the given dots). In high contrast the lines
render solid and are gated on two sides: 3:1 against the resting base
(WCAG 1.4.11) and 4.5:1 under every text role a chain cell can render. That
double bound pins all twelve lines to a single luminance rung — the same
arithmetic as the region fills (dark HC: L ≈ 0.137–0.142 between the base
floor and the `--accent-blue` cap; light HC: L ≈ 0.258–0.300 between the
`--accent-yellow` floor and the white-base cap) — so no luminance ladder fits
and hue alone separates chains. That is accepted: each chain is spatially
contiguous, so connectivity, not color, carries the grouping; hue keeps each
index in its standard palette's hue family (theme toggles preserve chain
identity) and hue-adjacent colors sit index-distant. State fills (error,
highlights) are excluded from the line gate, like the chip and inequality
gates. The gallery's ChainPreview keeps its own decorative pastel set.

## Minimap

`--minimap-cell` / `--minimap-filled` / `--minimap-view` color the pan/zoom board
overview (Minimap.module.css): the empty-cell texture, the filled-cell marks, and the
view indicator. Dedicated tokens because the map used to borrow `--border`,
`--text-muted`, and `--accent-blue`, whose high-contrast values converge on text-role
grays/near-whites (dark) or near-blacks (light) and erased the map's internal
separation — the same failure mode as the primary button and inequality markers.
Filled cells and the view indicator are graphical objects, so the HC palettes gate
filled-vs-cell, view-vs-cell, and view-vs-filled at 3:1. Dark HC keeps the dark map
ordering (dark texture `#2a2a40`, mid-gray fill `#78788c`, HC accent-blue view
`#d8ecff`); light HC inverts it (light texture `#c8c8d8`, page-ink fill `#0a0a23`,
saturated blue view `#1565c0`) — the view color must sit between the other two, and
each palette only has a 3:1-wide window for it in one direction. The empty texture
stays near the map background by design (extent is decorative; the border carries the
component edge). Standard palettes keep the original subtle values (three advisory
shortfalls in `ACCEPTED_FAILURES`).

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
