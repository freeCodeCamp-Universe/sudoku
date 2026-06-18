# Sudoku Board Color Documentation and Testing

Date: 2026-06-19

## Goal

Document every color the sudoku boards use and add per-variant tests that catch
regressions in those color values. The target failure to catch: a cell or marker
shows the wrong color in a given scenario, for example the conflict color drifting
from `#ffadad`, the killer cage stroke changing, or the even-odd parity shades
landing on the wrong cells.

## Constraints that shape the design

- Tests run in Vitest + jsdom. **jsdom does not evaluate stylesheets**, so a painted
  color (whether from a `.module.css` selector, a CSS custom property, or a canvas
  `fillStyle`) is not observable in a test. The painted pixel cannot be asserted.
- A real-browser approach (Vitest browser mode or Playwright) and visual regression
  (screenshot diffing) are out of scope: they launch Chromium, the 32-variant matrix
  makes them slow, and visual regression answers "did the rendering change" rather
  than "is this color correct."

Because the painted result is not observable in jsdom, the color **values** must live
where JavaScript can read them. The app is CSS-first, so the single source of truth is
`theme.css`, and tests read values by parsing it. Every consumer reads from that one
source.

## The single-source principle

`theme.css` is the one place every board color is defined. There are two consumer
mechanisms, both reading from it, neither holding its own copy of a value:

- **DOM (the playable board, the keypad):** CSS Modules reference the tokens with
  `var(--…)`. Color is applied by selectors keyed on `data-*` attributes.
- **Canvas (the gallery previews):** a canvas cannot use a CSS class, but in the
  browser it can read the same custom properties with
  `getComputedStyle(document.documentElement).getPropertyValue('--token')`. A small
  `readThemeColor(name)` runtime helper does this, so the previews read from
  `theme.css` too instead of hardcoding hex.

No color value is duplicated into a TypeScript constant. The one place this is hardest,
the color-variant palette and the canvas previews, is addressed below rather than
exempted.

## Two kinds of colored structure (this drives the test design)

Whether a per-variant color test needs a generated puzzle depends on how the colored
cells are determined:

- **Positional structure** is decided by cell coordinates. `Board` computes it from the
  variant id alone (`src/game/Board/Board.tsx:249-260`): sudoku-x diagonals, windoku
  windows, asterisk / center-dot / girandola cells, argyle lines, box boundaries. A
  test for these needs only `buildModel(variant)` + layout; no solution.
- **Value-derived structure** is decided by the solved values, via
  `deriveStructure(solution, model)`: even-odd parity
  (`src/variants/evenOdd.ts:45` returns a `parityMap`), killer cages, arrows, kropki and
  consecutive marks, greater-than relations, sandwich/skyscraper clues, chains. Which
  cells are colored changes with the solution, so a test asserting a specific cell must
  run against a **stable, deterministic board**.

The deterministic board is the fixture. It is therefore foundational to this effort,
not deferred: most variants carry value-derived color, so without a fixed-seed fixture
their color tests cannot target specific cells.

## Architecture

### 1. Fixture and render harness (foundational)

Under `src/game/testing/`:

- `makeFixture(variant, seed)` returns a deterministic
  `{ model, rects, size, solution, givens, structure, parityMap }` built from a fixed
  seed using the existing `seeded()` LCG, `generate(model, difficulty, rng)`, and the
  variant's `deriveStructure`. Same seed yields the same board.
- `renderVariantBoard(variant, options)` wires the mock `grid` object and renders
  `<Board>`. `options` supplies per-cell `value`, `parityMap`, `structure`, overlays,
  and interaction state (selected, conflict) so both positional and value-derived
  scenarios can be expressed.

### 2. Token reader and canvas bridge

- `readThemeTokens()` parses `theme.css` into
  `{ '--cell-diagonal-bg': { dark, light }, … }`, applying the `.light`-else-`:root`
  fallback. This is how tests source expected values without a browser.
- `readThemeColor(name)` is the runtime helper the canvas previews use:
  `getComputedStyle(document.documentElement).getPropertyValue(name).trim()`. In jsdom
  it returns an empty string (the known limitation); its correctness is covered by the
  source token test plus a manual visual check, the same trade-off as the rest.

### 3. Tokens in theme.css; consumers reference them

Promote every hardcoded hex in `Cell.module.css` and the overlay CSS modules into named
custom properties in `theme.css` (`:root` for dark, `.light` for overrides), and have
the selectors reference them via `var(--…)`. Tokens stay semantically named even when
two share a value today, so they can diverge later.

### 4. Color-variant palette becomes CSS-driven (full option B)

The chip color is currently an inline style written from `renderSymbol`, which forces
the nine palette colors to be a JS constant (`COLOR_PALETTE`) and is also consumed by
the keypad (`NumberPad.tsx:49`). Move the nine colors into `theme.css` as
`--color-1..9`, and have both the cell chip and the keypad swatch apply them via a
`data-color={value}` attribute plus CSS, removing the inline style and the JS constant.
The letter-only sort at `GamePage.tsx:393-394` does not run for color, so it is
unaffected; `GamePage` already defaults `renderSymbol` to `String(value)` when a variant
omits it, so `color.renderSymbol` can be removed.

### 5. Remove the dead overlap board code

`Cell.module.css` styles `[data-overlap='two'..'five']` and `Cell.tsx` carries an
`overlap` prop, but `Board` never passes `overlap`, and two tests
(`butterfly.render.test.tsx:94`, `Board.test.tsx:195`) assert the board never shades
overlap. That code is dead. Remove the `overlap` prop and the `[data-overlap]` rules
(including the compound `[data-peer][data-overlap]` and `[data-same-value][data-overlap]`
selectors) and delete the two now-meaningless absence tests. The overlap _tokens_ stay
in `theme.css` because their real consumer is the gallery previews (next section).

### 6. Unify the gallery preview canvas colors

The overlap depth shading the user actually sees is drawn on canvas in
`src/gallery/previews/*Preview.tsx`, and it is inconsistent: `FlowerPreview` uses
`#222248`/`#272751`/… while `SamuraiPreview`, `Gattai3Preview`, `SoheiPreview`,
`TwodokuPreview`, `TripledokuPreview`, and `KazagurumaPreview` use `#1f1f3a` for the same
2-grid overlap, and `CrossPreview`/`ButterflyPreview` use `#252538`. Replace each
preview's hardcoded `isLight` hex table with `readThemeColor('--cell-overlap-N-bg')`,
resolving every preview to the one set of tokens. This removes the duplication and the
drift.

### 7. Per-variant color spec and wiring tests

A declarative table is the per-variant matrix:

```ts
{ variant, cell, marker, token, kind: 'positional' | 'value-derived' }
```

A parameterized test renders each variant through the harness (positional rows with a
trivial board, value-derived rows with a `makeFixture` board so the cell is stable),
asserts the cell carries the marker, and derives the expected color from
`readThemeTokens()[token]`. Adding a variant is one row, and the table doubles as
documentation of what is colored and when.

### 8. Value-pin and integrity tests

- **Value-pin** (small, explicit): the deliberate regression guards, e.g.
  `--cell-conflict-bg` dark stays `#ffadad`, `--color-1` stays `#e03535`.
- **Integrity**: each marker selector in the component CSS references the expected var,
  so the chain `scenario -> marker -> var -> value` holds without a browser.

### 9. Documentation

`docs/colors.md`, generated from the parsed `theme.css` tokens and the spec table: a
token table (dark/light) and a per-variant "what is colored, when" table. A test asserts
the committed file matches the generated output, so it cannot drift.

## What a test observes, end to end

| Layer                     | Observes                                                                                       | Catches                                 |
| ------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------- |
| Wiring test (per variant) | marker attribute on the right cell (positional or fixture-stable), value read from `theme.css` | wrong cell colored, broken token wiring |
| Value-pin test            | a specific token hex                                                                           | a color value changing                  |
| Integrity test            | marker selector references the expected var                                                    | CSS wiring drift                        |
| Doc test                  | `docs/colors.md` matches generated output                                                      | documentation drift                     |

Accepted limitation: these prove "the right cell gets the right marker, that marker maps
to the right var, and that var holds the right value," not the painted pixel. The canvas
previews are verified at the source-token level plus a manual visual check, since jsdom
cannot paint a canvas. CSS cascade precedence between co-occurring states is a small
fixed global concern, covered by a handful of targeted cases rather than the matrix.

## Known special case to handle during coverage

`chain.deriveStructure` returns chains carrying a `color: string` (see `Chain` in the
constraint types). That is a value-derived color generated in JS. During the spec-table
work, decide whether the chain palette moves into `theme.css` tokens (consistent) or is
pinned as a JS value with a test; record the decision in `docs/colors.md`.

## Sequencing

1. Fixture + render harness; positional-marker safety net.
2. Token reader + canvas bridge helper.
3. Remove dead overlap board code.
4. Migrate cell colors into `theme.css` tokens; value-pin + integrity.
5. Migrate overlay colors into `theme.css` tokens; value-pin + integrity.
6. Full option B: color palette into `theme.css` via `data-color`.
7. Unify gallery previews to read tokens via `readThemeColor`.
8. Per-variant color spec table and wiring tests (positional, then value-derived).
9. Generate `docs/colors.md` and its drift test.

## Out of scope

- The gameplay / validation test suite. It is specced separately
  (`2026-06-19-gameplay-validation-testing-design.md`) and builds on the `makeFixture`
  helper this effort delivers. The fixture is built here because the color tests need
  it; the gameplay suite is the next effort.
- Vitest browser-mode or Playwright assertions, and visual regression.
