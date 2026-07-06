# Working doc: contrast tooling, even/odd exploration, high-contrast palette

Branch: `feat/high-contrast-palette`. Follow-up to the PR #66 discussion: the owner accepted
the standard palette's contrast shortfalls and asked for an opt-in high-contrast palette
instead of a palette rework.

## Summary

1. Added WCAG contrast tooling: `src/game/testing/contrast.ts` (math),
   `contrastSpecs.ts` (declared color pairs + CI gate), `scripts/contrastReport.ts`
   (`pnpm contrast:report`). Ratios are never rounded up: 4.4999:1 fails 4.5:1.
2. Re-explored even/odd colors under the current palette: **provably infeasible** (below).
3. Added a high-contrast palette as a global setting (modifier on both themes), swapped the
   color-sudoku chips per palette, and removed the per-variant colorblind toggle.

## Even/odd exploration result (why the current palette stays)

Constraints: every text role >= 4.5:1 on both parities, and even-vs-odd >= 3:1
(WCAG 1.4.11 — parity shading is the sole cue). Only relative luminance matters for
contrast, so sweeping all 256x256 gray pairs is fully general.

- Dark theme, all current text roles: 0 feasible pairs; best parity 2.057:1.
- Dark theme, value+given text only: 0 feasible pairs; best parity 2.688:1.
- Light theme (with or without the already-failing hint text): 0 feasible pairs; best 1.497:1.

Binding math (dark): feasibility needs text luminance >= 0.625; `--accent-blue` (#99c9ff)
is 0.558, `--accent-green` 0.551, `--accent-yellow` 0.558. Light theme: `--cell-text-light`
(#2c5f8a, L 0.106) caps the darker parity at L >= 0.65, forcing the lighter parity past
white. Fixing even/odd in place therefore requires changing the shared text colors — the
palette rework the owner rejected. Accepted failures are listed in `ACCEPTED_FAILURES` in
`contrastSpecs.ts` (16 pairs + 4 light-theme chips).

## Architecture decisions

- **High contrast is a modifier, not a theme**: `.high-contrast` and `.light.high-contrast`
  token blocks in `theme.css`, class applied to `document.documentElement` by
  `ThemeProvider` alongside `.light`. Four palettes total.
- **Cascade guard**: `.high-contrast` is declared after `.light`, so a token overridden only
  in `.high-contrast` would leak dark HC values into light HC. `readThemeTokens()` throws
  unless `.light.high-contrast` overrides every token `.high-contrast` sets.
- **Setting lives in ThemeProvider context** (`sudoku-high-contrast` in localStorage), not
  `usePersistence`, because it is global like the theme. The Header settings dropdown renders
  the switch from context on every variant.
- **Legacy migration**: `sudoku-colorblind === 'true'` seeds high contrast on first load,
  then the legacy key is removed. An explicit stored `sudoku-high-contrast` wins.
- **Colorblind toggle removed entirely** (per owner direction: colors only, no numeric chip
  labels). HC chip colors keep each index in its named hue family (`colorNames` in
  `src/variants/color.ts` feeds a11y announcements) and stagger luminance so any two chips
  differ in lightness — the CVD aid.
- **Error background tokenized** as `--cell-error-bg` (was bare hex in `Cell.module.css`)
  so HC can override it.
- **Gate policy**: standard-palette pairs are gated only where they pass today (regression
  lock); every HC pair is gated at AA with no exceptions. The advisory test asserts accepted
  failures still fail, so an accidental fix must be promoted to gated.

## Mistakes / lessons

- PR #66's spec file referenced tokens that don't exist on main (`--cell-shaded-bg` etc.);
  tooling was ported, specs rewritten against the live token set.
- `readThemeTokens()` consumers pin whole token objects (`toEqual`); adding the two HC
  fields broke three test files — pins on HC-irrelevant tokens now use `toMatchObject`.

## Remaining TODOs / potential issues

- Manual visual QA of the HC palettes in the browser (board states, color sudoku, gallery
  previews after navigating back) — contrast is verified mathematically, aesthetics are not.
- HC light chips cluster in the L 0.1–0.28 band (white-base 3:1 cap), so their lightness
  ladder is compressed; revisit if CVD users report confusion.
- Gallery previews draw with hard-coded hexes and ignore HC (they re-read computed CSS only
  for token-driven colors); previews are decorative, accepted for now.
- `docs/colors.md` now has Dark HC / Light HC columns (regenerate via `pnpm docs:colors`).

## Follow-up round (post visual QA)

- **Softer HC dark parity**: pure-black odd cells replaced with deep navy `#0f0f2c`
  (even `#60607a`, peers `#646480` / `#0b0b24`); HC dark text roles brightened slightly
  (`--accent-blue #d8ecff`, `--accent-green #ddf2a3`, `--accent-yellow #ffe38a`,
  `--candidate-text #e6e6f5`) to keep every gate green. Margins are thin by design
  (parity 3.07:1, worst text 4.52:1) — the CI gate holds them.
- **Even/odd legend fixed**: swatches were hard-coding standard-palette hexes so they
  didn't track the high-contrast palette; now `var(--cell-even-bg)` / `var(--cell-odd-bg)`.
  Swatches enlarged to 18px with a `--text-muted` border (gated at 3:1 vs `--bg-primary`
  in all four palettes — the border is what keeps the odd swatch visible on the page bg).

- **Number-pad chip labels tokenized** as `--numpad-chip-label`: standard dark keeps the
  translucent white (accepted shortfall, 8/9 chips fail — rgba is unmeasurable by the gate
  and the owner accepted it); standard light upgraded to solid `#000000` (all 9 pass,
  gated); HC dark uses `#0a0a23` on the bright chips; HC light uses `#ffffff` because its
  chips are dark by necessity (3:1 cap vs white cells) — a dark label cannot work there.
  Two chips tweaked to clear the label: HC dark purple `#7a5fd0` → `#8e75da`, HC light
  silver `#8c8c8c` → `#727272` (both still >= 3:1 vs base). Text-shadow disabled outside
  standard dark.

- **HC chips respaced on an equal-ratio luminance ladder** (chip-vs-chip distinctness, not
  just vs-background): each hue family solved to a geometric luminance rung between the
  hard bounds (>= 3:1 vs base, numpad label >= 4.5:1). Worst adjacent pair went from
  1.00:1 (blue vs teal) to 1.19:1 dark / 1.16:1 light — the theoretical max is ~1.20 / 1.18
  with nine chips in those bounds, so 3:1 between chips is impossible; the ladder is the
  optimum. HC dark numpad label switched to `#000000` so the darkest rung (purple, L 0.18)
  clears 4.5:1. Gated by the `CHIP_LADDER_MIN` (1.15:1) test in `contrastSpecs.test.ts`.
  Trade-off: HC light purple/blue rungs are nearly black — forced by the white-label
  ceiling (all chips L <= 0.183); lightness carries the distinction there.

- **HC dark chips reworked (v5)** after visual QA flagged pastel convergence (salmon red,
  pale pink/yellow/silver cluster, then a too-dark mid-gray): rungs reassigned so
  luminance-neighbors are hue-distant (ladder order purple, blue, red, teal, orange, pink,
  green, silver, yellow), each rung solved at max saturation for its hue, and the ladder
  capped at pure yellow's own luminance so the top rung is fully saturated `#ffee00`
  rather than a white-blend. Silver sits on the second-highest rung as a light gray
  (`#d9d9d9`) between vivid green and pure yellow; red is a true red (`#ff4d4d`). Same
  gates, worst adjacent pair 1.171:1 (>= CHIP_LADDER_MIN 1.15).

## References

- PR #66 (`fix/color-usage`) — prior attempt, source of the contrast math.
- `pnpm contrast:report` — full ratio table across all four palettes.
