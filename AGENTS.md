# AGENTS.md

This file provides guidance to AI coding agents (Claude Code, Copilot, etc.) when working with code in this repository.

## Commands

Package manager is **pnpm**.

| Task                           | Command                                              |
| ------------------------------ | ---------------------------------------------------- |
| Install                        | `pnpm install`                                       |
| Dev server                     | `pnpm dev`                                           |
| Production build               | `pnpm build` (runs `tsc --noEmit` then `vite build`) |
| Preview built output           | `pnpm preview`                                       |
| Tests (single run, no watch)   | `pnpm test` (alias for `vitest run`)                 |
| Typecheck                      | `pnpm typecheck`                                     |
| Lint (eslint + prettier check) | `pnpm lint`                                          |
| Autofix lint + format          | `pnpm lint:fix`                                      |
| Run one test file              | `pnpm exec vitest run path/to/file.test.ts`          |
| Run tests by name              | `pnpm exec vitest run -t "<partial name>"`           |
| Regenerate color docs          | `pnpm docs:colors`                                   |
| Report color contrast          | `pnpm contrast:report`                               |
| Solve chip color ladders       | `pnpm contrast:ladder`                               |

## Verify before finishing — do not skip

Run all three and confirm they pass before claiming work is done:

```bash
pnpm build && pnpm test && pnpm lint
```

Note that `pnpm build` runs `tsc --noEmit` over the whole `src` tree, **including `*.test.ts(x)` files**, so a type error in a test (e.g. a prop change you didn't propagate to its colocated test) fails the build, not just the test run.

## Reference docs

Read the relevant doc before changing that area:

- [`docs/architecture.md`](docs/architecture.md): layers, registries, data flow, game runtime, the learn layer, and the build.
- [`docs/lesson-authoring.md`](docs/lesson-authoring.md): read before creating or editing anything in `src/curriculum/lessons/`. Covers lesson files, frontmatter, sections, allowed HTML, required image `alt` text, the `json` config block (comments allowed), and checklist rules.

## Architecture

Four layers, each depending only on the ones above it: **engine** (pure puzzle logic, no React) → **variants** (declarative specs) → **board** (shared board rendering) → **game / gallery / learn / app** (React UI). Directory roles:

- `src/engine/` — grid model, constraint solver/generator, and shared types.
- `src/variants/` — one declarative spec per puzzle type, plus the registry that collects them.
- `src/board/` — shared board state, input, and rendering: reducer, playable-board hooks, Board, Cell, NumberPad, layout/overlay/annotator registries, and grid interaction.
- `src/game/` — game session UI: page, controls, timer, persistence, and pan/zoom.
- `src/gallery/` — the home grid of puzzles and their canvas previews.
- `src/learn/` — lesson views and course UI.
- `src/curriculum/` — lesson Markdown, ordering, and the loader that parses and validates lessons.
- `src/app/` — shell: routing, page layout, header, theme.
- `scripts/` — generator scripts run via `pnpm <script-name>` (e.g. `pnpm docs:colors`); not typechecked by `tsc --noEmit`.
- `docs/` — reference files. `colors.md` is generated (do not hand-edit); `color-contrast.md` is the hand-maintained color/contrast design doc; `breakpoints.md` lists the allowed media query breakpoints; `architecture.md` and `lesson-authoring.md` are described under [Reference docs](#reference-docs).

### The data-driven variant pipeline (worth understanding up front)

A puzzle type is a plain data object, not a class hierarchy. A `Variant` declares everything as **IDs and layout descriptors** — a `layout` kind (e.g. `grid`, `multigrid`), `symbols`, `constraintIds`, optional `overlayIds` / `annotatorIds`, and optional hooks (`cellTags`, `buildHouses`, `deriveStructure`, `renderSymbol`, `generateGivens`, …). These are resolved through registries at runtime:

1. Variants are collected in the **variant registry**, keyed by `variant.id`; the `/:variantId` route and the gallery both read it.
2. `buildModel(variant)` turns a `Variant` into a `VariantModel` — it builds cells/houses for the layout and resolves `constraintIds` against the **constraint registry**.
3. `generate(model, difficulty, rng)` produces `{ givens, solution }`; `solve` is the backtracking solver used for uniqueness checks. Constraints implement `conflicts()` and optionally `permits()`.
4. The UI resolves the visual side from IDs too: a **layout registry** maps the `layout` kind → a layout strategy (cell geometry + canvas size), and **overlay / annotator registries** map the variant's IDs → React overlays and canvas annotators.

Variants can also declare per-cell decorations with `cellTags(cellId)`. The shared board renderer turns those tags into cell data attributes, keeping variant-specific cell membership out of `src/board/`.

So **adding a puzzle type** is usually: add a spec under `src/variants/` and register it, then register any new constraint, overlay, annotator, or layout strategy in its registry. No bespoke UI wiring.

### Game runtime

The game area builds the model and generates the puzzle once per variant
(memoized), exposes game state through `GameContext`, and uses the shared
`usePlayableBoard` pipeline for board interaction and rendering. A persistence
hook stores settings and progress.

The board pan/zoom viewport (minimap, zoom controls, `boardFrameOversized` clip) is **mobile-only**: at desktop widths (≥ 1024px) boards always render at natural size and a short window scrolls. `GamePage` gates `panZoomActive` on `!isDesktop` — keep it that way. The clip's wrapper is percentage-width with absolutely positioned content, so it has no intrinsic width; if it ever mounts inside the desktop layout's shrink-to-fit board column, the column silently collapses to 0px and the board disappears.

### Cell sizing

Cell sizing has exactly two owners, and every pixel number lives in `src/board/layouts/cellSizes.ts`:

- **Base size** (what a variant's cells measure with no viewport pressure) is owned by the layout strategy via `LayoutStrategy.baseCellSize(variant)`, defined once per layout kind.
- **Responsive policy** (how the base shrinks on small viewports) is owned by `src/game/useResponsiveCellSize.ts`: for non-oversized boards it picks the largest step in `CELL_SIZE_STEPS` (capped at the layout's base) whose canvas plus board frame fits the current viewport bucket's floor (`VIEWPORT_BUCKET_FLOORS`, 320px baseline per WCAG reflow); oversized boards (16×16, multigrids) instead pan at a comfortable size below the desktop cutoff. The frame width depends on the high-contrast setting — the TS constants mirror `--box-boundary-width` in `src/app/layers.css`, and a drift test in `cellSizes.test.ts` keeps them in sync.
- **Container sizing** for boards outside the game viewport is provided by `cellSizeForWidth(availableWidth, variant, highContrast)` in `src/board/layouts/`: it picks the largest supported step, capped at the layout's base, whose framed and guttered canvas fits the available width. If no step fits, it falls back to the smallest supported step capped at the base.

Never write a cell-size or sizing-breakpoint literal in a layout strategy or the hook — add or reuse a named constant in `cellSizes.ts`. New layout strategies must implement `baseCellSize` from those constants and honor the optional `cellSizeOverride` in `cellRects` / `canvasSize`.

## Conventions

- **File naming:** name files after what they export (`Button.tsx`, `Button.module.css`, `Button.test.tsx`). `index.ts(x)` is reserved for barrel files that only re-export from siblings — never put a component, hook, or other logic in an `index` file.
- **Exports:** named exports only, no default exports.
- **Styling:** CSS Modules only (`*.module.css`); no inline styles, no `!important`. Use logical properties (`padding-inline`, `inset-block-start`, `text-align: start`, …) so RTL works; take colors from the theme's CSS custom properties; mobile-first `min-width` queries only, using only the breakpoints in `docs/breakpoints.md`.
- **Generated docs:** `docs/colors.md` is generated from `src/app/theme.css` and `src/app/colorSpecs.ts`. Run `pnpm docs:colors` after any change to color tokens or `colorSpecs.ts` — the drift test in `src/app/colorDocs.test.ts` fails CI if the committed file is stale.
- **Color contrast gate:** before changing any color, read `docs/color-contrast.md` — it records the palette architecture, the gate policy, the accepted even/odd infeasibility proof, and the chip luminance-ladder rules.
- **Imports:** use the `@/` alias for `src` (configured in `tsconfig.json` and `vite.config.ts`).
- **Tests:** Vitest + `@testing-library/react` + `jest-dom` in `jsdom`. Use `should`-style names and mirror the file under test (never `index.test.tsx`). The Vitest setup file polyfills `HTMLDialogElement` for jsdom.
- **Test placement:** Do not create testing folders. Put each test and test-support helper next to the unit it covers.
- **Querying in tests:** query the way a user (or assistive tech) finds things, in Testing Library's priority order. Prefer `getByRole(role, { name })` — it asserts the accessible role and name at once. Fall back to other accessible queries (`getByLabelText` for form fields, then `getByText`) when no suitable role exists. Use `getByTestId` only as a last resort, and never reach into the DOM (`container.querySelector`, `firstElementChild`, …) — the testing-library lint rules forbid it. Assert focus with `toHaveFocus()` rather than inspecting `document.activeElement`.
- **Interactions in tests:** drive interactions with `userEvent` (`const user = userEvent.setup()` then `await user.click(...)` / `user.tab()` / `user.type(...)`), not `fireEvent`. `userEvent` dispatches the full event sequence a real user triggers (pointer, focus, key events), so it catches behavior `fireEvent`'s single synthetic event misses. Reach for `fireEvent` only for the rare low-level event `userEvent` can't express.
