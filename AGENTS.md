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

## Architecture

Three layers, each depending only on the ones above it: **engine** (pure puzzle logic, no React) → **variants** (declarative specs) → **game / gallery / app** (React UI). Directory roles:

- `src/engine/` — grid model, constraint solver/generator, and shared types.
- `src/variants/` — one declarative spec per puzzle type, plus the registry that collects them.
- `src/game/` — the playable board UI and its layout / overlay / annotator strategies.
- `src/gallery/` — the home grid of puzzles and their canvas previews.
- `src/app/` — shell: routing, page layout, header, theme.
- `scripts/` — generator scripts run via `pnpm <script-name>` (e.g. `pnpm docs:colors`); not typechecked by `tsc --noEmit`.
- `docs/` — reference files. `colors.md` is generated (do not hand-edit); `color-contrast.md` is the hand-maintained color/contrast design doc; `breakpoints.md` lists the allowed media query breakpoints.

### The data-driven variant pipeline (worth understanding up front)

A puzzle type is a plain data object, not a class hierarchy. A `Variant` declares everything as **IDs and layout descriptors** — a `layout` kind (e.g. `grid`, `multigrid`), `symbols`, `constraintIds`, optional `overlayIds` / `annotatorIds`, and optional hooks (`buildHouses`, `deriveStructure`, `renderSymbol`, `generateGivens`, …). These are resolved through registries at runtime:

1. Variants are collected in the **variant registry**, keyed by `variant.id`; the `/:variantId` route and the gallery both read it.
2. `buildModel(variant)` turns a `Variant` into a `VariantModel` — it builds cells/houses for the layout and resolves `constraintIds` against the **constraint registry**.
3. `generate(model, difficulty, rng)` produces `{ givens, solution }`; `solve` is the backtracking solver used for uniqueness checks. Constraints implement `conflicts()` and optionally `permits()`.
4. The UI resolves the visual side from IDs too: a **layout registry** maps the `layout` kind → a layout strategy (cell geometry + canvas size), and **overlay / annotator registries** map the variant's IDs → React overlays and canvas annotators.

So **adding a puzzle type** is usually: add a spec under `src/variants/` and register it, then register any new constraint, overlay, annotator, or layout strategy in its registry. No bespoke UI wiring.

### Game runtime

The game area builds the model and generates the puzzle once per variant (memoized), exposes board state through a context backed by a reducer, and renders the board to a canvas via the resolved layout strategy and overlays. A grid hook derives per-cell view state and owns keyboard navigation (roving `tabindex`, arrow-key movement); a persistence hook stores settings and progress.

## Conventions

- **File naming:** name files after what they export (`Button.tsx`, `Button.module.css`, `Button.test.tsx`). `index.ts(x)` is reserved for barrel files that only re-export from siblings — never put a component, hook, or other logic in an `index` file.
- **Exports:** named exports only, no default exports.
- **Styling:** CSS Modules only (`*.module.css`); no inline styles, no `!important`. Use logical properties (`padding-inline`, `inset-block-start`, `text-align: start`, …) so RTL works; take colors from the theme's CSS custom properties; mobile-first `min-width` queries only, using only the breakpoints in `docs/breakpoints.md`.
- **Generated docs:** `docs/colors.md` is generated from `src/app/theme.css` and `src/game/testing/colorSpecs.ts`. Run `pnpm docs:colors` after any change to color tokens or `colorSpecs.ts` — the drift test in `src/game/testing/colorDocs.test.ts` fails CI if the committed file is stale.
- **Color contrast gate:** before changing any color, read `docs/color-contrast.md` — it records the palette architecture, the gate policy, the accepted even/odd infeasibility proof, and the chip luminance-ladder rules.
- **Imports:** use the `@/` alias for `src` (configured in `tsconfig.json` and `vite.config.ts`).
- **Tests:** Vitest + `@testing-library/react` + `jest-dom` in `jsdom`. Use `should`-style names and mirror the file under test (never `index.test.tsx`). The Vitest setup file polyfills `HTMLDialogElement` for jsdom.
- **Querying in tests:** query the way a user (or assistive tech) finds things, in Testing Library's priority order. Prefer `getByRole(role, { name })` — it asserts the accessible role and name at once. Fall back to other accessible queries (`getByLabelText` for form fields, then `getByText`) when no suitable role exists. Use `getByTestId` only as a last resort, and never reach into the DOM (`container.querySelector`, `firstElementChild`, …) — the testing-library lint rules forbid it. Assert focus with `toHaveFocus()` rather than inspecting `document.activeElement`.
- **Interactions in tests:** drive interactions with `userEvent` (`const user = userEvent.setup()` then `await user.click(...)` / `user.tab()` / `user.type(...)`), not `fireEvent`. `userEvent` dispatches the full event sequence a real user triggers (pointer, focus, key events), so it catches behavior `fireEvent`'s single synthetic event misses. Reach for `fireEvent` only for the rare low-level event `userEvent` can't express.
