---
title: Extract a shared board layer from src/game
date: 2026-09-23
project: sudoku
status: Part A ready for implementation, Part B pending decisions
---

# Extract a shared board layer from `src/game`

## Summary

`src/learn/` will render interactive sudoku boards in lessons. The boards are predefined in lesson config rather than randomly generated, and the lessons reuse the board UI and the number pad. `src/learn/` must not import from `src/game/`.

Today, everything needed to render a board lives in `src/game/`. The dependency direction is also already wrong, because `src/engine/` and `src/variants/` import types from `@/game/gameTypes`.

This doc creates a new top-level layer, `src/board/`, that sits between `variants` and the UI features:

```
engine  ->  variants  ->  board  ->  game / learn / gallery
```

It has two parts:

- **Part A (ready):** moves that make sense regardless of what the learn page ends up needing. They are mechanical and change no behavior, except A4, which fixes a first-paint bug in learn. The existing tests cover them.
- **Part B (pending):** changes that depend on the lesson design. Each one lists what would change and the decision it's waiting on.

### Why `src/board/` and not `src/app/`

`src/app/` is the shell: routing, page layout, header, theme. A board kit is a feature library. Putting it in `app/` would make the shell depend on `variants/`.

## Current state (key facts)

- `src/game/gameTypes.ts` holds two kinds of types:
  - Types the engine and variants depend on: `Cage`, `Arrow`, `EdgeClues`, `GutterCell`, `GutterSlots`.
  - Board UI types: `Rect`, `Size`, `Direction`, `LayoutStrategy`, `CellState`, `GridInteraction`, `MarkerEdge`, `BoardViewportState`, `BoardProps`, `AnnotatorContext`, `CellAnnotator`, `OverlayComponent`.
  - `GameEvent` is exported but has no importers (dead code).
- Reverse imports into `game` from lower layers (non-test files):
  - `src/engine/types.ts:115`: `deriveGutters?: (structure: unknown) => import('@/game/gameTypes').GutterSlots | undefined;`
  - `src/engine/constraints/arrowSum.ts` (`Arrow`), `cageSum.ts` (`Cage`), `skyscraperVisibility.ts` (`EdgeClues`)
  - `src/variants/arrow.ts` (`Arrow`), `killer.ts` (`Cage`), `sandwich.ts` (`GutterSlots`), `skyscraper.ts` (`EdgeClues`, `GutterSlots`)
  - The colocated tests of those files import the same types.
- `src/game/GamePage.tsx` (1,217 lines) builds every board prop inline in `GameInner` (lines 207-357) and handles numpad input in `handleNumberEntry` (lines 607-645). None of this can be reused without an extraction (see Part B).
- `Board` (`src/game/Board/Board.tsx`) requires `grid: GridInteraction`, which only `useSudokuGrid` produces. Any consumer of `Board` therefore needs `useSudokuGrid` too.
- The set of files moved in Part A is closed: none of them import a file that stays in `src/game/`. The one exception is test-only: `src/game/Cell/cellColors.test.ts` and `src/game/overlays/overlayColors.test.ts` import `@/game/testing/themeTokens`.
- ESLint (`eslint.config.js`) has no import-boundary rule today.
- Two hooks are duplicated between `src/game`/`src/hooks` and `src/learn/hooks`:
  - `useMediaQuery`: `src/game/useMediaQuery.ts` (used by `GamePage.tsx`) reads the media query synchronously on first render. `src/learn/hooks/useMediaQuery.ts` (used by `LessonPage.tsx`, `ResetButton.tsx`) returns `false` on the first render and only syncs after mount, so desktop users see the mobile layout for one frame.
  - `useSeoMeta`: `src/hooks/useSeoMeta.ts` (used by `Gallery.tsx`, `GamePage.tsx`) vs `src/learn/hooks/useSeoMeta.ts` (used by `LearnPage.tsx`, `LessonPage.tsx`). They behave differently (see B6).

## Checklist

### Part A: ready for implementation

- [x] A0. Move `StarIcon` from `src/gallery/StarIcon/` into `src/components/icons.tsx` so `src/components/Header/Header.tsx` no longer imports from `@/gallery`
- [x] A1. Move engine-facing types from `gameTypes.ts` into `src/engine/types.ts`; delete `GameEvent`
- [x] A2. Move board files into `src/board/`
- [ ] A3. Add ESLint import-boundary rules
- [ ] A4. Merge the two `useMediaQuery` hooks into `src/hooks/useMediaQuery.ts`
- [ ] A5. Update `AGENTS.md` and `docs/architecture.md` paths

### Part B: pending decision

- [ ] B1. Extract `useBoardView` (board prop derivation) from `GamePage`
- [ ] B2. Extract `useBoardInput` (numpad entry and announcements) from `GamePage`
- [ ] B3. Export the reducer from `GameProvider` as a pure `boardReducer`
- [ ] B4. Add `puzzleFromConfig` for predefined boards; make `solution` optional
- [ ] B5. Decide where responsive sizing and pan/zoom live
- [ ] B6. Merge the two `useSeoMeta` hooks
- [ ] B7. Move `Tabs` to `src/components/`
- [ ] B8. Replace the `variant.id` branches in `Board.tsx` with variant-declared cell tags
- [ ] B9. Move the board test helpers out of `src/game/testing/`

---

## Part A: ready for implementation

Do each step as its own commit. Before each commit, run:

```bash
pnpm build && pnpm test && pnpm lint
```

`pnpm build` typechecks test files too, so a missed import in a test fails the build.

### A1. Move engine-facing types into `src/engine/types.ts`

**Change:**

1. Cut these five declarations out of `src/game/gameTypes.ts` and paste them into `src/engine/types.ts`, exported, unchanged:
   ```ts
   export interface GutterCell {
     id: string;
     row?: number;
     col?: number;
     label: string;
     description?: string;
   }
   export interface GutterSlots {
     top?: GutterCell[];
     bottom?: GutterCell[];
     start?: GutterCell[];
     end?: GutterCell[];
   }
   export interface Cage {
     cells: CellId[];
     sum: number;
   }
   export interface Arrow {
     bulb: CellId;
     path: CellId[];
   }
   export interface EdgeClues {
     top: number[];
     bottom: number[];
     start: number[];
     end: number[];
   }
   ```
2. In `src/engine/types.ts:115`, replace the inline import:
   - Before: `deriveGutters?: (structure: unknown) => import('@/game/gameTypes').GutterSlots | undefined;`
   - After: `deriveGutters?: (structure: unknown) => GutterSlots | undefined;`
3. Delete `GameEvent` from `gameTypes.ts`. It has no importers.
4. Update every importer of those five types to import from `@/engine/types`. Do not leave a re-export in `gameTypes.ts`. Importers:
   - `src/engine/constraints/arrowSum.ts`, `cageSum.ts`, `skyscraperVisibility.ts` and their `.test.ts` files
   - `src/variants/arrow.ts`, `killer.ts`, `sandwich.ts`, `skyscraper.ts` and their `.test.ts` files
   - Files in `src/game/` that import `GutterSlots`/`GutterCell`/`Cage`/`Arrow`/`EdgeClues` from `gameTypes` (for example `Board/Board.tsx`, `boardViewport.ts`, the cage and arrow overlays and annotators). Find them with `pnpm typecheck` after step 1.

**Done when:** `grep -rn "@/game" src/engine src/variants --include='*.ts' | grep -v '\.test\.'` returns nothing.

### A2. Move board files into `src/board/`

Use `git mv` so history follows the files. Colocated tests, CSS modules and `index.ts` barrels move with their directories.

| From                                          | To                                                              |
| --------------------------------------------- | --------------------------------------------------------------- |
| `src/game/gameTypes.ts`                       | `src/board/boardTypes.ts` (after A1 only board UI types remain) |
| `src/game/Board/`                             | `src/board/Board/`                                              |
| `src/game/Cell/`                              | `src/board/Cell/`                                               |
| `src/game/LiveRegion/`                        | `src/board/LiveRegion/`                                         |
| `src/game/NumberPad/`                         | `src/board/NumberPad/`                                          |
| `src/game/layouts/` (includes `cellSizes.ts`) | `src/board/layouts/`                                            |
| `src/game/overlays/`                          | `src/board/overlays/`                                           |
| `src/game/annotators/`                        | `src/board/annotators/`                                         |
| `src/game/useSudokuGrid.ts` + `.test.ts`      | `src/board/useSudokuGrid.ts`                                    |
| `src/game/assemblePuzzle.ts` + `.test.ts`     | `src/board/assemblePuzzle.ts`                                   |
| `src/game/markerGaps.ts` + `.test.ts`         | `src/board/markerGaps.ts`                                       |
| `src/game/overlapCounts.ts` + `.test.ts`      | `src/board/overlapCounts.ts`                                    |
| `src/game/usedSymbols.ts` + `.test.ts`        | `src/board/usedSymbols.ts`                                      |
| `src/game/overusedSymbols.ts` + `.test.ts`    | `src/board/overusedSymbols.ts`                                  |

**Stays in `src/game/`:** `GamePage`, `GameProvider`, `GameContext`, `buildPuzzle`, `boardViewport.ts`, `useBoardViewport`, `useBoardGestures`, `useResponsiveCellSize`, `useElementSize`, `Minimap`, `BoardZoomControls`, `ZoomControls`, `DPad`, `GameControls`, `Timer`, `Toolbar`, `ToastStack`, `Tabs`, the dialogs, persistence hooks, and `testing/`.

**Import rewrite** (bulk mechanical; announce it before running a scripted rewrite):

| Old specifier                                                          | New specifier                          |
| ---------------------------------------------------------------------- | -------------------------------------- |
| `@/game/gameTypes`                                                     | `@/board/boardTypes`                   |
| `@/game/Board`, `@/game/Board/Board`                                   | `@/board/Board`, `@/board/Board/Board` |
| `@/game/Cell`                                                          | `@/board/Cell`                         |
| `@/game/LiveRegion`                                                    | `@/board/LiveRegion`                   |
| `@/game/NumberPad`                                                     | `@/board/NumberPad`                    |
| `@/game/layouts/*`                                                     | `@/board/layouts/*`                    |
| `@/game/overlays/*`                                                    | `@/board/overlays/*`                   |
| `@/game/annotators/*`                                                  | `@/board/annotators/*`                 |
| `@/game/useSudokuGrid`                                                 | `@/board/useSudokuGrid`                |
| `@/game/assemblePuzzle`                                                | `@/board/assemblePuzzle`               |
| `@/game/markerGaps`, `overlapCounts`, `usedSymbols`, `overusedSymbols` | `@/board/<same>`                       |

Relative imports in files that stay in `src/game/` also break. Rewrite them to `@/board/...`:

- `src/game/GamePage.tsx`: `./assemblePuzzle`, `./annotators/registry`, `./annotators/jigsaw`, `./Board`, `./overusedSymbols`, `./usedSymbols`, `./overlapCounts`, `./layouts/registry`, `./NumberPad`, `./overlays/registry`, `./useSudokuGrid`
- `src/game/useResponsiveCellSize.ts`: `./layouts/cellSizes`, `./layouts/registry`
- `src/game/boardViewport.ts`: `./layouts/cellSizes`

**Gotchas:**

- Three tests read files by hardcoded filesystem path, and TypeScript won't catch them:
  - `src/game/Cell/cellColors.test.ts:6`: `'src/game/Cell/Cell.module.css'` becomes `'src/board/Cell/Cell.module.css'`
  - `src/game/overlays/overlayColors.test.ts:6`: `'src/game/overlays'` becomes `'src/board/overlays'`
  - `src/game/layouts/cellSizes.test.ts:43`: `'src/game/Board/Board.module.css'` becomes `'src/board/Board/Board.module.css'`
- `vi.mock` paths: no current `vi.mock` call targets a moved module (checked on 2026-09-23). Re-check with `grep -rn "vi.mock('@/game" src` before committing.
- Tests in `src/variants/` (`butterfly.render.test.tsx`, `samurai.render.test.tsx`, `sujiken.render.test.tsx`) import `Board` and `layouts`. Update those imports too.
- `src/game/testing/` helpers (`makeFixture.ts`, `renderVariantBoard.tsx`, `renderPlay.tsx`) stay put and import from `@/board/...`. Moving them is B9.

**Done when:** `src/game/` contains none of the files in the table, and all three verify commands pass.

### A3. Add ESLint import-boundary rules

Add `no-restricted-imports` blocks to `eslint.config.js` for non-test source files, so the layering can't regress:

```js
{
  files: ['src/engine/**/*.{ts,tsx}', 'src/variants/**/*.{ts,tsx}'],
  ignores: ['**/*.test.{ts,tsx}'],
  rules: {
    'no-restricted-imports': ['error', { patterns: [
      { group: ['@/board', '@/board/*', '@/game', '@/game/*', '@/learn', '@/learn/*'],
        message: 'engine and variants must not depend on UI layers.' },
    ] }],
  },
},
{
  files: ['src/board/**/*.{ts,tsx}'],
  ignores: ['**/*.test.{ts,tsx}'],
  rules: {
    'no-restricted-imports': ['error', { patterns: [
      { group: ['@/game', '@/game/*', '@/learn', '@/learn/*'],
        message: 'board is shared; it must not depend on game or learn.' },
    ] }],
  },
},
{
  files: ['src/learn/**/*.{ts,tsx}'],
  rules: {
    'no-restricted-imports': ['error', { patterns: [
      { group: ['@/game', '@/game/*'],
        message: 'learn must not import from game; move shared code to src/board.' },
    ] }],
  },
},
```

Place these blocks after the main `src/**/*.{ts,tsx}` block. Tests are excluded for engine, variants and board because their render tests legitimately use `Board` and `src/game/testing/`. Learn tests are not excluded.

**Done when:** `pnpm lint` passes. Also sanity-check by temporarily adding `import '@/game/GamePage';` to a learn file, confirming lint fails, then reverting.

### A4. Merge the two `useMediaQuery` hooks into `src/hooks/useMediaQuery.ts`

1. `git mv src/game/useMediaQuery.ts src/hooks/useMediaQuery.ts`. Keep the game implementation, which reads `matchMedia` synchronously on first render.
2. Delete `src/learn/hooks/useMediaQuery.ts`.
3. Point every importer at `@/hooks/useMediaQuery`: `src/game/GamePage.tsx`, `src/learn/LessonPage/LessonPage.tsx`, `src/learn/ResetButton/ResetButton.tsx`.
4. Fix the stale snippet in `src/learn/SidePanel/uSAGE.md:35` (`@/hooks/use-media-query`) to `@/hooks/useMediaQuery`.
5. Add `src/hooks/useMediaQuery.test.ts`. There is no test for either hook today. Cover:
   - should return the current match on the first render
   - should update when the media query starts or stops matching
   - should return false when `matchMedia` is unavailable
   - should remove its listener on unmount

**Behavior change:** learn components now get the real match on first render instead of `false`. This removes the one-frame mobile flash on desktop. Run the `LessonPage` and `ResetButton` tests. If one fails, it was probably relying on the `false` first render. Fix the test's `matchMedia` stub rather than keeping the old behavior.

### A5. Update docs

- `AGENTS.md`
  - Directory roles: add `src/board/` ("shared board rendering: Board, Cell, NumberPad, layout/overlay/annotator registries, grid interaction hook"). Narrow `src/game/` to "game session UI: page, controls, timer, persistence, pan/zoom".
  - Change the layering sentence to engine → variants → board → game / gallery / learn / app.
  - "Cell sizing": `src/game/layouts/cellSizes.ts` becomes `src/board/layouts/cellSizes.ts`. `useResponsiveCellSize` stays in `src/game/`.
- `docs/architecture.md`: update the paths at lines 21, 114-116, 134, 158, 160 and 303-305 (the layout/overlay/annotator registries, `assemblePuzzle`, `Board`, `useSudokuGrid`). Add a `src/board/` row to the directory table.

---

## Part B: pending decision

Each item says what would change and what it's waiting on. None of them should start until the learn page's board requirements are known.

### B1. Extract `useBoardView` from `GamePage`

- **What:** Move `GamePage.tsx` lines 207-357 into `src/board/useBoardView.ts`. That code covers `assemblePuzzle`, layout resolution, `rects`/`size`, `overlapMap`, `gutters`, `overlays`, `annotators` (including the jigsaw special case), `renderSymbol`, `describeSymbol`, `markerGaps`, `displaySymbols`, and the `parityMap` cast at line 933. Sketch: `useBoardView({ variant, baseModel, solution, cellSize, seedBase }) => { model, structure, rects, size, gutters, overlays, annotators, renderSymbol, describeSymbol, markerGaps, displaySymbols, parityMap, overlapMap }`.
- **Waiting on:** whether lesson boards need a solution at all (B4), whether `displaySymbols` shuffling (seeded by `seedBase`) applies to lessons, and whether lessons render letter variants.

### B2. Extract `useBoardInput` from `GamePage`

- **What:** Move `handleNumberEntry` (lines 607-645) and the `onEnterValue`/`onToggleCandidate` wrappers (lines 331-349) into `src/board/useBoardInput.ts`. These pair each dispatch with a screen reader announcement. The `completed` and `isPaused` guards become an `inputLocked: boolean` option.
- **Waiting on:** whether lesson input goes through the game reducer (B3) or a `LessonEngine.feed` (`src/curriculum/lessonEngine.ts`), and whether lessons use candidate mode.

### B3. Export the reducer as a pure `boardReducer`

- **What:** Lift `createReducer(initialGivens, solution)` out of `src/game/GameProvider.tsx` into `src/board/boardReducer.ts` as a pure exported function. Split out the game-only actions (`tick`, `newGame`) and the `elapsedSeconds`/`timerStarted` fields, so the board core holds only values, candidates, history and revealed cells. `GameProvider` then composes it. `LessonEngine<S>.feed(state, input)` in `src/curriculum/lessonEngine.ts` is shaped to wrap a pure reducer like this.
- **Waiting on:** whether the lesson engine owns board state, and whether lessons need undo or reveal.

### B4. `puzzleFromConfig` and an optional solution

- **What:** Add `puzzleFromConfig(variantId, givens, solution?)`. It would be a sibling of `buildPuzzle` (`src/game/buildPuzzle.ts`) that calls `buildModel` and skips `generate`. Make `solution` optional in the reducer's `isSolved`, in `useSudokuGrid` (`solution = new Map()` default already exists), and in the used/overused symbol helpers.
- **Waiting on:** the lesson board config format (string grid, list of givens, whether it includes a solution) and whether technique lessons use partial boards with no unique solution. If `solve` is used to derive a missing solution, decide how a non-unique config is reported.

### B5. Responsive sizing and pan/zoom

- **What:** `useResponsiveCellSize` (`src/game/useResponsiveCellSize.ts`) sizes the board against the whole viewport using `VIEWPORT_BUCKET_FLOORS`. A lesson board sits next to the instructions panel, so it probably needs to size against its container instead. Pan/zoom (`boardViewport.ts`, `useBoardViewport`, `useBoardGestures`, `Minimap`, `BoardZoomControls`) only matters for oversized boards. `boardViewport.ts` also contains general frame sizing (`boardFrameEdge`, `framedBoardSize`, `gutteredBoardSize`, `gutterOrigin`), which could split into `src/board/` without the pan/zoom math.
- **Waiting on:** lesson board sizes (9×9 only, or 16×16/multigrid too) and the lesson layout.

### B6. Merge the two `useSeoMeta` hooks

- **What:** Keep one `src/hooks/useSeoMeta.ts`. The two differ:
  - `src/hooks/useSeoMeta.ts` falls back to `seoConfig.siteDescription`, always sets `og:image`, `og:image:width/height`, `article:publisher`, `twitter:card`, `twitter:site`, `twitter:image` and `referrer`, and only sets the canonical link when `path` is given.
  - `src/learn/hooks/useSeoMeta.ts` removes description, `og:site_name`, canonical and URL tags when they're missing, and never sets the image or twitter card tags.
- **Waiting on:** which behavior is correct for learn pages (for example, whether lesson pages should share the site `og:image`). Merging changes the tags learn pages emit. `LearnPage.test.tsx` and `LessonPage.test.tsx` mock `@/learn/hooks/useSeoMeta`, so their mock paths change too.

### B7. Move `Tabs` to `src/components/`

- **What:** `src/game/Tabs/` is used by `GameControls` and `HelpDialog`. Learn has its own `src/learn/TabGroup/`.
- **Waiting on:** whether the lesson board UI needs the game's Normal/Candidate tabs. If not, leave `Tabs` in game.

### B8. Variant-declared cell tags in `Board.tsx`

- **What:** `src/board/Board/Board.tsx` (after A2) imports constants from six variant files (`sudoku-x`, `windoku`, `asterisk`, `centerDot`, `girandola`, `argyle`) and branches on `variant.id` for each cell. A `cellTags?(cellId) => string[]` hook on `Variant` would move that knowledge into the variant specs.
- **Waiting on:** nothing blocks this for learn; it's cleanup. Do it only if lessons add new decorated variants, or as a separate refactor.

### B9. Colocate the board test helpers

- **What:** `src/game/testing/makeFixture.ts`, `renderVariantBoard.tsx` and `renderPlay.tsx` mostly exercise board code. They could move to `src/board/` next to the units they support. The color and contrast tooling in `src/game/testing/` (`contrast.ts`, `contrastSpecs.ts`, `colorSpecs.ts`, `colorDocs.ts`, `colorLadder.ts`, `themeTokens.ts`) is shared by `scripts/`, `src/gallery/` and `docs/color-contrast.md`, and is unrelated to game.
- **Waiting on:** the deferred test-helper cleanup. Moving the color tooling also means updating `scripts/chipLadderReport.ts`, `scripts/contrastReport.ts`, `scripts/generateColorDocs.ts`, `docs/color-contrast.md`, the `AGENTS.md` generated-docs note, and the path string in `src/game/testing/colorDocs.ts:21`. Regenerate `docs/colors.md` afterward.

---

## Architecture decisions and rationale

- **New `src/board/` layer instead of `src/app/`.** `app/` is the shell. A board kit depends on `variants/`, and the shell shouldn't.
- **Engine-facing types go into `engine/types.ts`, not `board/`.** Constraints (`cageSum`, `arrowSum`, `skyscraperVisibility`) and variant specs need them, and those layers sit below `board`.
- **Move whole directories without re-export shims.** Shims hide the new boundary and leave dead code. The move is mechanical, and `pnpm build` typechecks every importer, tests included.
- **`useSudokuGrid` moves in Part A.** `Board` can't render without the `GridInteraction` it produces, so any shared `Board` requires it.
- **`useResponsiveCellSize` and pan/zoom stay in game for now.** Their policy is tied to the game page's full-viewport layout. Moving them before the lesson layout exists would mean guessing at their API.
- **Lint rules make the boundary enforceable.** Without them, the next quick fix can reintroduce an `@/game` import from learn or engine.

## Mistakes and lessons learned

- Types defined in the UI layer ended up imported by the engine (`engine/types.ts:115` uses an inline `import('@/game/gameTypes')`). Put a type in the lowest layer that uses it.
- The two `useMediaQuery` copies had drifted: the learn copy renders `false` first, which causes a layout flash on desktop. Duplicates drift, so shared hooks belong in `src/hooks/`.
- Some tests reference source paths as strings (`process.cwd()` + `'src/game/...'`). TypeScript won't catch them during a move, so grep for them.

## Potential issues

- **Merge conflicts.** A2 touches many files. Land it when no other branch is editing `src/game/` heavily, and keep it a pure move with no edits mixed in.
- **Git rename detection.** Keep content changes out of the `git mv` commit, apart from import paths, so `git log --follow` keeps working.
- **`react-refresh/only-export-components` warnings** may reappear on moved files. They're existing warnings, not errors.
- **File naming.** `boardTypes.ts` inside `src/board/` follows the file-naming rule (named after what it exports). Don't create `src/board/index.ts` unless it only re-exports.

## Links

- `AGENTS.md`: layering, cell sizing ownership, conventions
- `docs/architecture.md`: registry and runtime overview (needs updating in A5)
- `src/curriculum/lessonEngine.ts`: `LessonEngine<S>` interface that B3 targets
- `docs/breakpoints.md`: relevant to B5 if lesson boards size against their container
