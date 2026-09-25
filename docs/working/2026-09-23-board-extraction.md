---
title: Extract a shared board layer from src/game
date: 2026-09-23
updated: 2026-09-25
project: sudoku
status: A0-A22 done; Part B pending decisions
---

# Extract a shared board layer from `src/game`

## Summary

`src/learn/` will render interactive sudoku boards in lessons. The boards are predefined in lesson config rather than randomly generated, and the lessons reuse the board UI and the number pad. `src/learn/` must not import from `src/game/`.

Before this work, everything needed to render a board lived in `src/game/`. The dependency direction was also wrong, because `src/engine/` and `src/variants/` imported types from `@/game/gameTypes`.

This doc creates a new top-level layer, `src/board/`, that sits between `variants` and the UI features:

```
engine  ->  variants  ->  board  ->  game / learn / gallery
```

It has two parts:

- **Part A (ready):** work that needs no further decisions.
  - A0-A5 (done) moved the board files into `src/board/` and fixed the layering.
  - A6-A10 extract shared board state, input and prop derivation from `GamePage` so the game and lessons use the same code. The game must behave exactly as before after each of them.
  - A17 separates focus from selection and adds multi-cell selection; it must precede A11.
  - A11-A12 compose the shared playable-board hook and add container-based sizing.
  - A13 is optional cleanup.
  - A14 updates the reference docs for A6-A12 and A17, so it follows A12 and A17.
  - A15 merges the duplicate `useSeoMeta` hooks, and A16 builds a puzzle from predefined givens. A18-A21 add the lesson config, the lesson panel, their docs, and the board authoring skill. A22 removes `src/game/testing/` and colocates its files.
- **Part B (pending):** pinned structure (cages, regions, clues) for variants like killer and jigsaw, which waits on the board authoring pass.

### Lesson board requirements (confirmed 2026-09-25)

- The interactive panel (the right side of `src/learn/LessonPage/LessonPage.tsx`, rendered through `InteractivePanel` in `src/learn/LessonWorkspace/LessonWorkspace.tsx`) shows the board and the number pad side by side.
- The panel has no Reveal Cell, Clear All, or New Game buttons.
- Lessons use candidate mode, so the Normal/Candidate input-mode tabs appear in lessons.
- Some lessons ask the learner to select specific cells (for example, to practice rows, columns, and rc notation). The lesson config tells the board which cells to select, and the lesson engine grades the selection.
- Highlights (peers, same value, conflicts) can be turned on or off per lesson. The game keeps its current defaults and its user toggles.
- The board config lives in each lesson's `# --config--` JSON block. Its final shape isn't decided yet.

### Shared code, not a lesson-specific board

Lessons do not get their own board. The game and lessons share one set of board logic and components from `src/board/`:

- The existing `Board` and `NumberPad`.
- A new `InputModeTabs` component (A10).
- A new `usePlayableBoard` hook (A11) that composes the state, the prop derivation, and the input handling.

Each page owns only its layout and its extras. `GamePage` adds the timer, the game toolbar, pan/zoom, and the mobile Controls/Move/Map tabs. The lesson panel lays the board and number pad side by side and connects a `LessonEngine`.

The layout stays out of the shared code. `GamePage` has three layouts (desktop, portrait, landscape mobile) with a legend, a minimap, and a D-pad, and the lesson panel has a different one. A shared component that owned the layout would need a flag for every difference.

### Why `src/board/` and not `src/app/`

`src/app/` is the shell: routing, page layout, header, theme. A board kit is a feature library. Putting it in `app/` would make the shell depend on `variants/`.

## Current state (key facts)

Facts as of 2026-09-23, before A0-A5:

- `src/game/gameTypes.ts` held two kinds of types:
  - Types the engine and variants depend on: `Cage`, `Arrow`, `EdgeClues`, `GutterCell`, `GutterSlots`.
  - Board UI types: `Rect`, `Size`, `Direction`, `LayoutStrategy`, `CellState`, `GridInteraction`, `MarkerEdge`, `BoardViewportState`, `BoardProps`, `AnnotatorContext`, `CellAnnotator`, `OverlayComponent`.
  - `GameEvent` was exported but had no importers (dead code).
- Reverse imports into `game` from lower layers (non-test files):
  - `src/engine/types.ts:115`: `deriveGutters?: (structure: unknown) => import('@/game/gameTypes').GutterSlots | undefined;`
  - `src/engine/constraints/arrowSum.ts` (`Arrow`), `cageSum.ts` (`Cage`), `skyscraperVisibility.ts` (`EdgeClues`)
  - `src/variants/arrow.ts` (`Arrow`), `killer.ts` (`Cage`), `sandwich.ts` (`GutterSlots`), `skyscraper.ts` (`EdgeClues`, `GutterSlots`)
  - The colocated tests of those files imported the same types.
- The set of files moved in A2 was closed: none of them imported a file that stays in `src/game/`. The one exception was test-only: `src/game/Cell/cellColors.test.ts` and `src/game/overlays/overlayColors.test.ts` imported `@/game/testing/themeTokens`.
- ESLint (`eslint.config.js`) had no import-boundary rule.
- Two hooks were duplicated between `src/game`/`src/hooks` and `src/learn/hooks`:
  - `useMediaQuery`: `src/game/useMediaQuery.ts` (used by `GamePage.tsx`) read the media query synchronously on first render. `src/learn/hooks/useMediaQuery.ts` (used by `LessonPage.tsx`, `ResetButton.tsx`) returned `false` on the first render and only synced after mount, so desktop users saw the mobile layout for one frame.
  - `useSeoMeta`: `src/hooks/useSeoMeta.ts` (used by `Gallery.tsx`, `GamePage.tsx`) vs `src/learn/hooks/useSeoMeta.ts` (used by `LearnPage.tsx`, `LessonPage.tsx`). Their code differs, but they produce the same tags for every current caller (see A15).

Facts as of 2026-09-25, after A0-A5:

- `src/game/GamePage.tsx` (1,217 lines) builds every board prop inline in `GameInner` (around lines 207-357) and handles numpad input in `handleNumberEntry` (around lines 607-645). None of this can be reused without an extraction (A8, A9).
- `Board` (`src/board/Board/Board.tsx`) requires `grid: GridInteraction`, which only `useSudokuGrid` (`src/board/useSudokuGrid.ts`) produces. Any consumer of `Board` therefore needs `useSudokuGrid` too.
- `useSudokuGrid` has a single `selectedId: CellId | null` that is both the roving-tabindex focus and the selection.
- `parseConfig` in `src/curriculum/loader.ts` parses and validates the lesson `board` block, including solution conflicts and conversion of 1-based lesson cell ids.

## Checklist

The checklist is ordered so every prerequisite appears above the item that depends on it. Independent items may appear between a prerequisite and its dependent.

### Part A: ready for implementation

- [x] A0. Move `StarIcon` from `src/gallery/StarIcon/` into `src/components/icons.tsx` so `src/components/Header/Header.tsx` no longer imports from `@/gallery`
- [x] A1. Move engine-facing types from `gameTypes.ts` into `src/engine/types.ts`; delete `GameEvent`
- [x] A2. Move board files into `src/board/`
- [x] A3. Add ESLint import-boundary rules
- [x] A4. Merge the two `useMediaQuery` hooks into `src/hooks/useMediaQuery.ts`
- [x] A5. Update `AGENTS.md` and `docs/architecture.md` paths
- [x] A6. Export the reducer from `GameProvider` as a pure `boardReducer`
- [x] A7. Replace `highlightPeers` with a `highlights` options object in `useSudokuGrid`
- [x] A8. Extract `useBoardView` (board prop derivation) from `GamePage`
- [x] A9. Extract `useBoardInput` (numpad entry, candidate toggling, announcements) from `GamePage`
- [x] A10. Move `Tabs` to `src/components/` and extract `InputModeTabs` into `src/board/`
- [x] A17. Separate focus from selection; add multi-cell selection (after A7, before A11)
- [x] A11. Add `usePlayableBoard` in `src/board/` and make `GamePage` use it (after A6-A10 and A17)
- [x] A12. Container-based cell sizing for boards outside the game page
- [x] A13. (Optional) Replace the decoration `variant.id` branches in `Board.tsx` with variant-declared cell tags
- [x] A14. Update `docs/architecture.md` and `AGENTS.md` for A6-A12 and A17 (after A12 and A17)
- [x] A15. Merge the two `useSeoMeta` hooks into `src/hooks/useSeoMeta.ts`
- [x] A16. Add `puzzleFromConfig` for predefined boards
- [x] A18. Parse and validate a `board` block in the lesson config; add the `lesson:board` script
- [x] A19. Build the lesson board panel and its `LessonEngine` (after A11, A12, A16, A17, A18)
- [x] A20. Update `docs/architecture.md` and `docs/lesson-authoring.md` for A18 and A19
- [x] A21. ~~Add a `lesson-board-authoring` project skill~~ Superseded: the workflow lives in `docs/lesson-authoring.md` ("Authoring a board")
- [x] A22. Dissolve `src/game/testing/` and colocate every file with its source (after A11)

### Part B: pending decision

- [ ] B1. Pinned `structure` for variants like killer and jigsaw (waiting on the board authoring pass, one variant at a time)

---

## Part A: ready for implementation

Do each step as its own commit. Before each commit, run:

```bash
pnpm build && pnpm test && pnpm lint
```

`pnpm build` typechecks test files too, so a missed import in a test fails the build.

From A6 on, the game must behave exactly as before after each step. The existing `GamePage`, `GameProvider` and `useSudokuGrid` tests are the safety net. Don't weaken or delete a test to get a refactor through. A6 to A10 can land in any order, but all of them must land before A11.

### A1. Move engine-facing types into `src/engine/types.ts` (done)

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

### A2. Move board files into `src/board/` (done)

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
- `src/game/testing/` helpers (`makeFixture.ts`, `renderVariantBoard.tsx`, `renderPlay.tsx`) stay put and import from `@/board/...`. Moving them is A22.

**Done when:** `src/game/` contains none of the files in the table, and all three verify commands pass.

### A3. Add ESLint import-boundary rules (done)

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

Place these blocks after the main `src/**/*.{ts,tsx}` block. Tests are excluded for engine, variants and board because their render tests legitimately use `Board` and board test helpers. Learn tests are not excluded.

**Done when:** `pnpm lint` passes. Also sanity-check by temporarily adding `import '@/game/GamePage';` to a learn file, confirming lint fails, then reverting.

### A4. Merge the two `useMediaQuery` hooks into `src/hooks/useMediaQuery.ts` (done)

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

### A5. Update docs (done)

- `AGENTS.md`
  - Directory roles: add `src/board/` ("shared board rendering: Board, Cell, NumberPad, layout/overlay/annotator registries, grid interaction hook"). Narrow `src/game/` to "game session UI: page, controls, timer, persistence, pan/zoom".
  - Change the layering sentence to engine → variants → board → game / gallery / learn / app.
  - "Cell sizing": `src/game/layouts/cellSizes.ts` becomes `src/board/layouts/cellSizes.ts`. `useResponsiveCellSize` stays in `src/game/`.
- `docs/architecture.md`: update the paths at lines 21, 114-116, 134, 158, 160 and 303-305 (the layout/overlay/annotator registries, `assemblePuzzle`, `Board`, `useSudokuGrid`). Add a `src/board/` row to the directory table.

### A6. Export the reducer as a pure `boardReducer`

- **What:** Lift `createReducer(initialGivens, solution)` out of `src/game/GameProvider.tsx` into `src/board/boardReducer.ts` as a pure exported function. Split out the game-only actions (`tick`, `newGame`) and the `elapsedSeconds`/`timerStarted` fields, so the board core holds only values, candidates, history and revealed cells. Export its `BoardState` and `BoardAction` types. `GameProvider` then composes it with the timer and `newGame`. `LessonEngine<S>.feed(state, input)` in `src/curriculum/lessonEngine.ts` can wrap it later (A19).
- **Why:** A9 and A11 dispatch into it, and lessons need board state whatever their engine looks like.
- **Tests:** add `src/board/boardReducer.test.ts` for each board action (enter value, erase, toggle candidate, undo, clear, reveal). Keep the `GameProvider` tests passing unchanged.

### A7. A `highlights` options object in `useSudokuGrid`

- **Current state** (`src/board/useSudokuGrid.ts`):
  - `highlightPeers?: boolean` (default `true`) gates `peerIds`.
  - `sameValue` is always computed in `getCellState` and in `announceCellState`'s `projectedCellState`, and has no toggle.
  - `conflict` is always computed from `validate(values, model)`.
  - `checkEnabled?: boolean` gates `correct`.
  - The game's toggles live in `src/game/usePersistence.ts` (`highlightPeers`, stored under `sudoku-highlight-peers`) and in `GamePage`'s `highlightOverlaps` state (multigrid overlap tint, passed to `Board` as `overlapCounts`).
- **Change:** replace `highlightPeers` with:
  ```ts
  export interface BoardHighlights {
    peers?: boolean;     // default true
    sameValue?: boolean; // default true
    conflicts?: boolean; // default true
  }
  // UseSudokuGridOptions
  highlights?: BoardHighlights;
  ```
  Export `BoardHighlights` from `src/board/boardTypes.ts`. When a highlight is off, its `CellState` flag is `false`. `GamePage` passes `{ peers: settings.highlightPeers }`. Leave `checkEnabled` and the overlap tint alone. They are game settings with their own UI.
- **Conflicts:** `conflict` also feeds `getCellLabel` ("in conflict"). When `conflicts` is off, drop the spoken flag too, so screen reader users and sighted users get the same information.
- **Tests:** in `src/board/useSudokuGrid.test.ts`, add "should not flag X when highlights.X is false" for each highlight, including the missing "in conflict" in `describeCell`. Keep the default cases passing.

### A8. Extract `useBoardView` from `GamePage`

- **What:** Move the prop-derivation block in `GameInner` (`GamePage.tsx` around lines 207-357; re-locate by content before cutting, since line numbers drift) into `src/board/useBoardView.ts`. That code covers `assemblePuzzle`, layout resolution, `rects`/`size`, `overlapMap`, `gutters`, `overlays`, `annotators` (including the jigsaw special case), `renderSymbol`, `describeSymbol`, `markerGaps`, `displaySymbols`, and the `parityMap` cast in the `<Board>` props. Sketch: `useBoardView({ variant, baseModel, solution, cellSize, seedBase }) => { model, structure, rects, size, gutters, overlays, annotators, renderSymbol, describeSymbol, markerGaps, displaySymbols, parityMap, overlapMap }`.
- **Notes:** `solution` is already optional downstream. `seedBase` stays required, and a lesson can pass a fixed seed.
- **Tests:** `src/board/useBoardView.test.ts` covers one grid variant, one multigrid variant, and the jigsaw annotator case. `GamePage` tests pass unchanged.

### A9. Extract `useBoardInput` from `GamePage`

- **What:** Move `handleNumberEntry` (`GamePage.tsx` around lines 607-645) and the `onEnterValue`/`onToggleCandidate` wrappers (around lines 331-349) into `src/board/useBoardInput.ts`. These pair each dispatch with a screen reader announcement. The `completed` and `isPaused` guards become an `inputLocked: boolean` option. Candidate toggling is included, because lessons use candidate mode.
- **Dispatch target:** the hook takes a `dispatch(action: BoardAction)` (A6) rather than reading `GameContext`. The game passes `GameProvider`'s dispatch, and a lesson will pass one that goes through its `LessonEngine` (A19).
- **Tests:** `src/board/useBoardInput.test.ts` covers entering a value, erasing, toggling a candidate, the announcement for each, and that `inputLocked` ignores input.

### A10. Move `Tabs` to `src/components/`; add `InputModeTabs`

- **Current state:**
  - `src/game/GameControls/DesktopControls.tsx`, `src/game/GameControls/PortraitControls.tsx` and `src/game/HelpDialog/HelpDialog.tsx` import `src/game/Tabs/`. `GamePage.tsx` imports its `Tab` type.
  - `GamePage.tsx` builds `controlTabs` (around line 691): `normal` and `candidate` both point at `panelId: 'control-panel-input'`. Below 1024px a third `controls` tab points at `control-panel-controls`.
  - `inputTabLabelledBy` (around line 773) is `` `${candidateMode ? 'candidate' : 'normal'}-tab` ``.
  - `DesktopControls` renders one tablist (Normal/Candidate) and the input panel. `PortraitControls` renders a tablist that mixes the input modes with Controls, plus a separate Move/Map tablist.
- **Change:**
  1. `git mv src/game/Tabs src/components/Tabs` and update its importers. It's generic. Learn's `src/learn/TabGroup/` stays separate.
  2. Add `src/board/InputModeTabs/InputModeTabs.tsx`. It renders the Normal/Candidate tabs and the number pad panel, and accepts `extraTabs?: { tab: Tab; panel: ReactNode }[]` so the game's mobile Controls tab joins the same tablist.
  3. Generate the tab and panel ids with `useId()`. The hardcoded `control-panel-input`, `normal-tab`, `candidate-tab` and `controls-tab` ids would collide if two boards ever render on one page. Any test that queries by these ids should query by role and name instead.
  4. Make `DesktopControls` and `PortraitControls` render `InputModeTabs`.
- **Tests:** `src/board/InputModeTabs/InputModeTabs.test.tsx` covers switching modes, arrow-key movement between tabs, and an extra tab joining the tablist. The existing `PortraitControls` and `GamePage` tests pass unchanged.

### A17. Separate focus from selection; multi-cell selection

Decided 2026-09-25:

- A lesson can ask the learner to select several cells.
- Cells are announced one way everywhere. Lesson text can refer to a cell as "r3c5", but the screen reader always speaks the full form, "Row 3, column 5, box 2" (today's `formatLocation` output). There is no per-lesson announcement format. Lesson text keeps rc notation as written, and the Markdown pipeline doesn't rewrite it.

- **Current state:** `useSudokuGrid` (`src/board/useSudokuGrid.ts`) has one `selectedId: CellId | null`. It is both the roving-tabindex focus and the selection. Number entry targets it, and `peerIds` and `sameValue` key off it. `Cell` (`src/board/Cell/Cell.tsx`) sets `data-selected` and `aria-selected={selected || undefined}` on `role="gridcell"`. `Board` renders `role="grid"` with `aria-label="Sudoku grid"`. `formatLocation(cell, boxNumber)` always returns "Row 3, column 5, box 2".
- **Change:**
  1. Split the state into `focusedId: CellId | null` (roving tabindex, arrow keys, number entry, peers and same-value highlights) and `selectedIds: Set<CellId>`.
  2. Add options to `UseSudokuGridOptions`:
     ```ts
     cellSelection?: 'single' | 'multiple'; // default 'single'
     selectedIds?: Set<CellId>;              // controlled; omit for uncontrolled
     onSelectionChange?: (ids: Set<CellId>) => void;
     ```
  3. **Single mode (the game):** `selectedIds` always equals `{focusedId}`. Behavior, labels and tests stay the same.
  4. **Multiple mode:** arrow keys move focus without changing the selection. Space and click toggle the focused cell's selection (a click also moves focus). `Board` sets `aria-multiselectable="true"`. Number entry still targets the focused cell, so a lesson can ask for a digit in r3c5 in the same mode.
  5. Add `focused: boolean` to `CellState` in `src/board/boardTypes.ts`, next to `selected`. In multiple mode a cell can be focused without being selected, so `Cell` needs a separate `data-focused` style (a focus ring) that is distinct from the selected fill.
  6. Leave `formatLocation` as it is.
- **Color gate:** the focused-but-not-selected style is a new visual state. Read `docs/color-contrast.md` first, add the new pair to `src/app/contrastSpecs.ts`, and verify it with `pnpm contrast:report` (the selected-border specs are near line 267 and line 460). If the change adds color tokens, run `pnpm docs:colors`.
- **Tests** in `src/board/useSudokuGrid.test.ts`:
  - single mode: the existing cases pass unchanged
  - multiple mode: "should toggle selection with Space", "should keep the selection when arrow keys move focus", "should toggle selection on click", "should call onSelectionChange with the new set", "should enter a digit in the focused cell"
  - `Board`: "should set aria-multiselectable in multiple mode"
- **Order:** do A17 after A7 (both edit `useSudokuGrid`) and before A11, so `usePlayableBoard` exposes the new options from the start.

### A11. `usePlayableBoard`

- **What:** `src/board/usePlayableBoard.ts` composes `boardReducer` (A6), `useSudokuGrid` with `highlights` (A7), `useBoardView` (A8) and `useBoardInput` (A9). It returns the props for `Board`, `NumberPad` and `InputModeTabs` (A10), and renders nothing itself. It also exposes A17's `cellSelection`, `selectedIds` and `onSelectionChange` options. Sketch:
  ```ts
  usePlayableBoard({
    variant, baseModel, givens, solution, seedBase, cellSize,
    highlights?: BoardHighlights,
    cellSelection?: 'single' | 'multiple',
    selectedIds?: Set<CellId>,
    onSelectionChange?: (ids: Set<CellId>) => void,
    state: BoardState,
    dispatch: (action: BoardAction) => void,
    inputLocked?: boolean,
  }) => { boardProps, numberPadProps, inputModeProps, grid }
  ```
- **The game** calls it from `GameInner` and keeps its own timer, toolbar, dialogs, persistence, pan/zoom and three layouts.
- **Done when:** `GameInner` no longer calls `useSudokuGrid`, `assemblePuzzle` or the layout registries directly, and every `GamePage` test passes unchanged.
- **Tests:** `src/board/usePlayableBoard.test.tsx` renders `Board` and `InputModeTabs` from the hook's output for a classic 9×9 board, enters a value and a candidate, and checks the resulting cell state. This is also the smoke test for the future lesson panel.

### A12. Container-based cell sizing (done)

- **Decided:** a lesson board sits beside the number pad inside the interactive panel, so it sizes against its container rather than the viewport. It stacks above the number pad on narrow widths: a column by default, side by side at a `min-width` breakpoint from `docs/breakpoints.md`.
- **What:**
  1. Move `src/game/useElementSize.ts` (and its test) to `src/hooks/`.
  2. Split the general frame-sizing helpers (`boardFrameEdge`, `framedBoardSize`, `gutteredBoardSize`, `gutterOrigin`) out of `src/game/boardViewport.ts` into `src/board/boardFrame.ts`. The pan/zoom math stays in game.
  3. Add `cellSizeForWidth(availableWidth, variant, highContrast)` in `src/board/layouts/`. It picks the largest step in `CELL_SIZE_STEPS`, capped at the layout's `baseCellSize`, whose framed canvas fits `availableWidth`. Every number comes from `src/board/layouts/cellSizes.ts` (see "Cell sizing" in `AGENTS.md`).
- **Scope:** grid-layout boards that fit without pan/zoom. Whether lessons ever show oversized boards (16×16, multigrid) is still open. If they do, that's a later change.
- **Tests:** `cellSizeForWidth` gets unit tests at the 320px baseline, at an in-between width, and at a width above the base size. The side-by-side layout itself is CSS and can't be checked in jsdom, so test it by hand in the browser.

### A13. (Optional) Variant-declared cell tags in `Board.tsx` (done)

- **What:** Add an optional `cellTags(cellId)` hook to `Variant`. The six decorated variants declare their cell membership, and `Board.tsx` maps those tags to the existing `Cell` decoration props without importing variant specs or branching on their IDs.
- **Coverage:** `Board.test.tsx` checks rendered tags for Sudoku X, Windoku, Asterisk, Center Dot, Girandola and both Argyle stripe directions.

### A14. Update the reference docs for A6-A12 and A17

`docs/architecture.md` describes the code as it is, so update it after the code lands. Either update it in the same commit as each step, or in one follow-up after A11, A12 and A17.

- **"Game layer" → "Game state and reducer":** the pure `boardReducer` lives in `src/board/boardReducer.ts`, and `GameProvider` composes it with the timer and `newGame` (A6).
- **"Board rendering":** `GamePage` no longer resolves registries itself. Describe `usePlayableBoard`, `useBoardView`, `useBoardInput`, `InputModeTabs` and the `highlights` option (A7-A11), plus the focus/selection split and `cellSelection` (A17). Move this section out of "Game layer" into a new "Board layer" section, since the game and learn both use it.
- **Key directories table:** add `src/components/Tabs`, and widen the `src/board/` row to cover state and input.
- **`AGENTS.md`:** update the `src/board/` directory role, and the "Cell sizing" section for `cellSizeForWidth` (A12).

### A15. Merge the two `useSeoMeta` hooks

- **Current state:** two copies of the hook exist.
  - `src/hooks/useSeoMeta.ts` (used by `src/gallery/Gallery/Gallery.tsx` and `src/game/GamePage.tsx`) sets `document.title` and every meta tag, including the site-wide ones (`og:image`, `og:image:width/height`, `og:type`, `article:publisher`, `twitter:card`, `twitter:site`, `twitter:image`, `referrer`). It falls back to `seoConfig.siteDescription` when `description` is missing.
  - `src/learn/hooks/useSeoMeta.ts` (used by `src/learn/LearnPage/LearnPage.tsx` and `src/learn/LessonPage/LessonPage.tsx`) sets only the per-page tags (title, description, keywords, `og:site_name`, canonical and URL tags). It removes the description and canonical tags when their inputs are missing. It doesn't set `document.title`, so `LessonPage` sets it in its own `useEffect`.
- **Why the differences don't matter today:** all four callers pass `title`, `description` and `path`, so neither the fallback nor the removals ever run. The site-wide tags are the same on every page, and `scripts/generate-spa-routes.ts` writes them into every prerendered page. Neither hook removes them. The two copies produce the same tags, so this is a duplicate-code cleanup and not a behavior fix. Like `useMediaQuery` (A4), duplicates drift.
- **Change:**
  1. Delete `src/learn/hooks/useSeoMeta.ts`.
  2. Point `LearnPage.tsx` and `LessonPage.tsx` at `@/hooks/useSeoMeta`.
  3. Delete the `document.title` `useEffect` in `LessonPage.tsx`, since the shared hook sets the title.
  4. Update the `vi.mock('@/learn/hooks/useSeoMeta')` paths in `LearnPage.test.tsx` and `LessonPage.test.tsx`.
- **Tests:** `src/hooks/useSeoMeta.test.ts` already exists. Check that it covers `document.title`, since `LessonPage` will rely on it, and add "should set the document title" if not. The learn page tests should pass with only the mock path changed.

### A16. `puzzleFromConfig`

- **What:** add `puzzleFromConfig(variant, givens, solution)` in `src/board/puzzleFromConfig.ts`. It's a sibling of `buildPuzzle` (`src/game/buildPuzzle.ts`) that calls `buildModel` and skips `generate`. `givens` and `solution` are already-parsed `Values` maps, so the function doesn't depend on how the lesson config writes them (A18 does that parsing).
- **`solution` is required.** Confirmed 2026-09-25: lessons ship precomputed givens and solutions. Every board, game or lesson, has a solution, so nothing needs to become optional, and the lesson code never runs `solve`.
- **Tests:** `src/board/puzzleFromConfig.test.ts` covers building a classic board from givens and a solution, and checks that the model, givens and solution match the input.

### A18. Lesson config `board` block (digit-only variants)

- **Current state:** `parseConfig` in `src/curriculum/loader.ts` keeps only `checklist` and silently drops every other key, even though `LessonConfig` in `src/curriculum/types.ts` has an index signature (`[key: string]: unknown`).
- **What:**
  1. Parse an optional `board` block and add a `LessonBoardConfig` type to `src/curriculum/types.ts`.
  2. Throw on invalid input so the build and `curriculumIntegrity.test.ts` catch it.
  3. Add the `lesson:board` script (see "Board authoring" below).
- **Scope:** variants whose spec has no `deriveStructure` or `deriveGutters` hook, such as classic, Sudoku X, windoku and the multigrids. Those boards are fully described by their digits. Variants with a structure hook (currently `arrow`, `chain`, `consecutive`, `evenOdd`, `greaterThan`, `jigsaw`, `killer`, `kropki`, `sandwich`, `skyscraper`, `wordoku`) need a pinned `structure` field, which is B1. Until then, the loader rejects them with a clear error such as "variant killer needs a structure field, which lesson boards don't support yet". Check for the hook rather than keeping a list of names, so a new variant is handled correctly without a doc change.
- **Decided 2026-09-25:**
  - Each board lesson provides precomputed `givens` and `solution`. Nothing is generated or solved at run time.
  - `givens` and `solution` are JSON objects keyed by 1-based cell id (`{ "r3c5": 4 }`), not arrays or row strings. `givens` lists only the filled cells, and `solution` lists every cell. Every layout builds cell ids with `cellId(row, col)` (`src/engine/grid.ts`), including multigrid and triangular, so this works for every variant and any number of symbols. Row strings were rejected because they break on multigrids (gaps between subgrids), triangular boards (rows of different lengths), 16×16 boards (two-digit values) and letter or color variants (`SymbolValue = number` in `src/engine/types.ts`).
  - No pre-filled candidates. Boards start with givens only. Some lessons ask the learner to enter candidates, which the Normal/Candidate tabs (A10) already support.
  - `cellSelection: "single" | "multiple"` (default `"single"`, like the game) sets how many cells the learner can select. Digit and candidate entry are always on, so one lesson can ask for both selecting and entering.
  - Lessons never show correct/incorrect colors. "Check answers" is a game preference (the `sudoku-check-answers` setting in `src/game/usePersistence.ts`), not a lesson option. The lesson panel always passes `checkEnabled: false`, and the config has no field for it.
  - Screen reader announcements on the board always use the full form ("Row 3, column 5, box 2"). There is no announcement option (see A17).
  - Four checklist `test` kinds, graded by the lesson engine (A19):
    - `{ "selected": ["r3c5", "r3c6"] }` passes when the selection is exactly that set.
    - `{ "values": { "r3c5": 4 } }` passes when every listed cell holds that digit.
    - `{ "candidates": { "r3c5": [1, 4] } }` passes when every listed cell has exactly those candidates, in any order. An extra candidate fails the item.
    - `{ "solved": true }` passes when the board matches the solution.
- **Shape:**
  ```json
  {
    "board": {
      "variant": "classic",
      // 1-based cell ids; givens list only the filled cells
      "givens": { "r1c1": 5, "r1c2": 3, "r3c5": 4 },
      // every cell; generated by the lesson:board script
      "solution": { "r1c1": 5, "r1c2": 3, "r1c3": 4 },
      "cellSelection": "multiple", // "single" (default) | "multiple"
      "highlights": { "peers": false, "sameValue": false }
    },
    "checklist": [
      { "label": "Select r3c5", "test": { "selected": ["r3c5"] } },
      { "label": "Enter 4 in r3c5", "test": { "values": { "r3c5": 4 } } },
      {
        "label": "Mark 1 and 4 as candidates in r3c6",
        "test": { "candidates": { "r3c6": [1, 4] } }
      }
    ]
  }
  ```
- **Validation** (all build errors):
  - `variant` is a registered variant id without a structure hook (see Scope).
  - Every key in `givens` and `solution` is a 1-based cell id that exists on the variant's board, and every value is one of the variant's symbols.
  - `solution` has an entry for every cell on the board.
  - Every given matches the solution at that cell.
  - The solution has no conflicts under the variant's constraints (`validate(solution, model)` from `src/engine/validate.ts` returns nothing). This is a cheap check, and it catches a typo in a hand-edited solution. It needs no `solve`.
  - `highlights` has only the keys of `BoardHighlights` (A7).
  - Every cell id in a `test` object exists on the board.
- **Gotcha, 1-based vs. 0-based cell ids:** internal cell ids are 0-based. `cellId(row, col)` in `src/engine/grid.ts` returns `` `r${row}c${col}` ``, so the top-left cell is `r0c0`. Lessons teach 1-based rc notation, where the top-left cell is `r1c1`. The config uses the 1-based form the learner sees, and the parser converts it to internal ids, so `"r3c5"` in a lesson becomes `r2c4`. Never pass a config cell id straight to the engine: the string would parse, and the lesson would grade the wrong cell. Add a test that `"r1c1"` in a config maps to the top-left cell.
- **Layering:** `src/curriculum/` would import the variant registry and `buildModel` to validate. Check that the A3 lint rules allow it. If the curriculum layer shouldn't depend on variants, the checks move to `curriculumIntegrity.test.ts`.
- **Board authoring** (decided 2026-09-25): boards are set up in a separate authoring pass, where the author works with Claude to produce the givens and solutions. Hand-edited data needs two things:
  - **A uniqueness check.** `solve(model, givens, { max: 2 })` from `src/engine/solve.ts` must return exactly one solution, and it must equal the config's `solution`. Otherwise a `{ "solved": true }` test fails a learner who found a different valid answer. `solve` can be slow on hard variants, so run this check in `curriculumIntegrity.test.ts`, not in the loader.
  - **A generator script.** Add `scripts/lessonBoard.ts` and a `"lesson:board": "tsx scripts/lessonBoard.ts"` entry in `package.json`, next to the existing `tsx` scripts. `pnpm lesson:board <variantId> [--seed n]` calls `buildModel` and `generate` once and prints a ready-to-paste `board` block with 1-based ids. Claude runs it, then trims the givens by hand for the lesson's goal, and the build checks catch mistakes in the trimming. `scripts/` isn't typechecked by `tsc --noEmit` (see `AGENTS.md`), so keep the id conversion in a typed, tested module under `src/` and have the script import it.
- **Tests:**
  - `src/curriculum/loader.test.ts`: should parse a valid `board` block; should map `"r1c1"` to the top-left cell; should reject each invalid case in Validation, and should name the lesson and the field in the error; should reject a variant with a structure hook.
  - `curriculumIntegrity.test.ts`: should find exactly one solution for every lesson board, equal to its `solution`.
  - The id-conversion module: 1-based to 0-based and back, including multigrid cells.

### A19. Lesson board panel and engine

- **What:** in `src/learn/`, an `InteractivePanel` implementation (`InteractivePanelProps` in `src/learn/LessonWorkspace/LessonWorkspace.tsx`: `lesson`, `onUpdate`, `onReset`). It:
  - reads `lesson.config.board` (A18) and builds the puzzle with `puzzleFromConfig` (A16)
  - calls `usePlayableBoard` (A11), sized with `cellSizeForWidth` (A12)
  - lays out `Board` and `InputModeTabs` side by side, with no game toolbar

  Its `LessonEngine` (the interface in `src/curriculum/lessonEngine.ts`) wraps `boardReducer` in `feed` and grades the four A18 `test` kinds in `checkRequirements`. The panel replaces `PlaceholderPanel` for lessons that have a `board` block.

- **Checking is live** (confirmed 2026-09-25). After every board change or selection change, the panel runs `checkRequirements` and calls `onUpdate({ checklist, complete })`. `LessonSnapshot` is defined in `src/learn/hooks/useLesson.ts`. The checklist ticks as the learner works, and the panel has no Check button.
- **Reset clears the board and the checklist** (confirmed 2026-09-25). This already works with no panel code. `ResetButton` calls `handleReset` in `LessonWorkspace.tsx`, which calls `useLesson`'s `reset()` (re-seeds the checklist with `initChecklist`) and bumps `resetKey`, the `key` on `<InteractivePanel>`. The remount rebuilds the board from the config. The panel must keep all board state inside itself (no module-level caches), or the remount won't clear it.
- **Tests:** `src/learn/BoardPanel/BoardPanel.test.tsx` (or whatever the panel is named) covers:
  - should tick a `selected` item when the learner selects exactly those cells
  - should untick it when the selection changes away
  - should tick a `values` item when the learner enters the digit
  - should tick a `candidates` item only when the cell has exactly the listed candidates
  - should restore the starting board after reset
- **Order:** after A11, A12, A16, A17 and A18.

### A20. Update the reference docs for A18 and A19

Update these after A18 and A19 land, since they describe code that doesn't exist yet:

- **`docs/architecture.md` "Learn layer":** add a subsection on the lesson board panel covering the config `board` block, `puzzleFromConfig`, the lesson engine, live checking, and container sizing.
- **`docs/lesson-authoring.md`:** document the `board` block under "Config block", the four `test` kinds under "Checklist items", and the `pnpm lesson:board` script.

### A21. `lesson-board-authoring` skill (superseded 2026-09-25)

- **Outcome:** the skill was added, then deleted. It repeated most of `docs/lesson-authoring.md`, so every schema change meant editing two files, and `AGENTS.md` already tells agents to read that doc before editing lessons. The workflow steps now live in the doc's "Authoring a board" section. When B1 adds a variant's `structure`, document it in the doc's "Board config" section.

Original plan, kept for the record:

- **Why:** boards are set up in a separate authoring pass, where the author works with Claude. A project skill keeps that workflow the same across sessions, so the format, script and checks don't have to be worked out again each time.
- **What:** add `.claude/skills/lesson-board-authoring/SKILL.md` (the repo has no `.claude/skills/` directory yet). It covers:
  - When to use it: adding or editing the `board` block of a lesson in `src/curriculum/lessons/`.
  - The `board` block format from A18, including the 1-based cell ids, and the per-variant `structure` shapes that B1 has added so far.
  - The workflow: run `pnpm lesson:board <variantId> [--seed n]`, paste the block, trim givens for the lesson's goal, then run `pnpm exec vitest run src/curriculum/curriculumIntegrity.test.ts` to confirm the board is valid and has a unique solution.
  - Writing checklist `test` objects (`selected`, `values`, `candidates`, `solved`) and matching `label`/`hint` text (`hint` must start with "You can" or "You should").
  - A pointer to `docs/lesson-authoring.md` as the source of truth, so the skill doesn't duplicate it and drift.
- **Order:** after A18 and A20. A skill written before them would describe a format and a command that don't exist yet. Extend it each time B1 adds a variant's structure.

### A22. Dissolve `src/game/testing/`; colocate every file with its source

- **Decided 2026-09-25:** there is no testing folder anywhere in the repo. Each test sits next to the unit it tests, and each test-support helper sits next to the code it supports. This replaces the June 2026 decision to keep `src/game/testing/` for now.
- **Completed 2026-09-25:** moved color tooling to `src/app/`, generic contrast math to `src/utils/`, variant and board test helpers beside their owners, and split special-constraint integration tests across their constraint suites. `renderPlay` now composes `boardReducer` and `useSudokuGrid`; the game-only solved/new-game assertions retain a test-local `GameProvider` harness. The full suite passes with 2,623 tests.
- **Naming:** a test that covers one aspect of a unit uses `<unit>.<aspect>.test.ts`, following the existing `GamePage.regeneration.test.tsx` and `butterfly.render.test.tsx`. Never `index.test.ts`.
- **Mapping** (use `git mv` so history follows):

  | From `src/game/testing/`                 | To                                                                                       | Why there                                                           |
  | ---------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
  | `themeTokens.ts` + test                  | `src/app/themeTokens.ts`                                                                 | Reads `src/app/theme.css`                                           |
  | `contrastSpecs.ts` + test                | `src/app/contrastSpecs.ts`                                                               | Declares pairs of `theme.css` tokens; the test is the contrast gate |
  | `colorSpecs.ts` + `colorSpecs.test.tsx`  | `src/app/colorSpecs.ts`                                                                  | Describes `theme.css` tokens                                        |
  | `colorDocs.ts` + test                    | `src/app/colorDocs.ts`                                                                   | Builds `docs/colors.md` from `theme.css` and `colorSpecs`           |
  | `contrast.ts` + test                     | `src/utils/contrast.ts`                                                                  | Generic WCAG math, beside `src/utils/readThemeColor.ts`             |
  | `colorLadder.ts` + test                  | `src/utils/colorLadder.ts`                                                               | Generic luminance math                                              |
  | `allVariants.ts` + test                  | `src/variants/allVariants.ts`                                                            | Lists the variant registry                                          |
  | `makeFixture.ts` + test                  | `src/board/makeFixture.ts`                                                               | Builds a model, puzzle and layout rects                             |
  | `renderVariantBoard.tsx` + test          | `src/board/Board/renderVariantBoard.tsx`                                                 | Renders `Board`                                                     |
  | `renderPlay.tsx`                         | `src/board/renderPlay.tsx`                                                               | Drives `boardReducer` + `useSudokuGrid` (see gotcha)                |
  | `cellStateDerivation.test.ts`            | `src/board/useSudokuGrid.cellState.test.ts`                                              | Tests `useSudokuGrid`                                               |
  | `variantGameplay.test.ts`                | `src/board/usePlayableBoard.gameplay.test.tsx`                                           | Tests reducer + grid behavior per variant                           |
  | `specialConstraintGameplay.test.ts`      | `src/board/usePlayableBoard.specialConstraints.test.tsx`                                 | Same, for special constraints                                       |
  | `generationSoundness.test.ts`            | `src/engine/generate.soundness.test.ts`                                                  | Tests `generate` across variants                                    |
  | `uniquenessConflicts.test.ts`            | `src/engine/validate.uniqueness.test.ts`                                                 | Tests `validate` uniqueness conflicts                               |
  | `specialConstraints.test.ts` (376 lines) | Split each `describe` block into its constraint's test file in `src/engine/constraints/` | One constraint per block (`evenOdd`, `cageSum`, `kropki`, ...)      |

- **Gotcha, `renderPlay` imports game code.** It wraps tests in `GameProvider` and `useGameContext` (`@/game/...`). In `src/board/` that breaks the A3 lint rule, because `renderPlay.tsx` isn't a `.test` file. Rewrite it on `boardReducer` (A6) with `useReducer`, or on `usePlayableBoard` (A11), before moving it. That's why A22 comes after A11.
- **Gotcha, `specialConstraints.test.ts` split.** Some blocks may share setup at the top of the file. Move the shared setup with each block, or into `makeFixture`, and keep every assertion. Don't drop a case to make the split easier.
- **References to update** (grep for `game/testing` afterward; it should return nothing outside `docs/working/`):
  - Imports in `scripts/chipLadderReport.ts`, `scripts/contrastReport.ts`, `scripts/generateColorDocs.ts`
  - Imports in `src/variants/sujiken.render.test.tsx`, `src/variants/color.test.ts`, `src/board/overlays/overlayColors.test.ts`, `src/board/Cell/cellColors.test.ts`, `src/gallery/previews/previewColors.test.ts`
  - The path string in `colorDocs.ts` line 21 (the "Generated from" header), then run `pnpm docs:colors` to regenerate `docs/colors.md`
  - The comment in `src/app/layers.css` line 20
  - The file table in `docs/color-contrast.md` (lines 11-14)
  - `AGENTS.md`: the "Generated docs" note, the `src/game/` directory role, and a new convention line: "No testing folders. Put each test and test helper next to the unit it covers."
  - Any `readFileSync`/`process.cwd()` path strings in the moved tests (see the A2 gotcha)
- **Done when:** `src/game/testing/` no longer exists, the test count from `pnpm test` is the same as before the move, and `pnpm build && pnpm test && pnpm lint` and `pnpm contrast:report` pass.
- **Order:** after A11, since `renderPlay` needs `boardReducer` or `usePlayableBoard`, and the gameplay tests move next to `usePlayableBoard`.

---

## Part B: pending decision

Each item lists the exact questions it's waiting on and why each answer changes the work.

### B1. Pinned structure for variants with a structure hook

- **What:** add an optional `structure` field to the A18 `board` block for variants whose spec has a `deriveStructure` or `deriveGutters` hook (currently `arrow`, `chain`, `consecutive`, `evenOdd`, `greaterThan`, `jigsaw`, `killer`, `kropki`, `sandwich`, `skyscraper`, `wordoku`). Today their structure (cages, arrows, regions, clues, dots) comes from `deriveStructure(solution, model)` or seeded generation. A lesson must pin it in the config, or a change to the generator silently changes the lesson.
- **Approach:** per-variant JSON that reuses the existing engine types (`Cage`, `Arrow`, `EdgeClues`, `GutterSlots` in `src/engine/types.ts`) with 1-based cell ids. Each variant gets a validator that checks its structure against the board and the solution, and a way to hand the parsed structure to `useBoardView` (A8) in place of `deriveStructure`. The variant specs have no load hook today, so each variant is new work. `lesson:board` (A18) prints the structure too.
- **Waiting on:** the board authoring pass reaching each variant (decided 2026-09-25: do this one variant at a time, when a lesson needs it). The structure shape differs per variant, so design each one against a real lesson.

---

## Architecture decisions and rationale

- **New `src/board/` layer instead of `src/app/`.** `app/` is the shell. A board kit depends on `variants/`, and the shell shouldn't.
- **Engine-facing types go into `engine/types.ts`, not `board/`.** Constraints (`cageSum`, `arrowSum`, `skyscraperVisibility`) and variant specs need them, and those layers sit below `board`.
- **Move whole directories without re-export shims.** Shims hide the new boundary and leave dead code. The move is mechanical, and `pnpm build` typechecks every importer, tests included.
- **`useSudokuGrid` moves in A2.** `Board` can't render without the `GridInteraction` it produces, so any shared `Board` requires it.
- **`useResponsiveCellSize` and pan/zoom stay in game.** Their policy is tied to the game page's full-viewport layout. Lesson boards get `cellSizeForWidth` instead (A12), built on the same `cellSizes.ts` constants.
- **Lint rules make the boundary enforceable.** Without them, the next quick fix can reintroduce an `@/game` import from learn or engine.
- **Share logic and components, not the layout (2026-09-25).** `usePlayableBoard` returns props and renders nothing. The game and lessons each lay out `Board`, `NumberPad` and `InputModeTabs` themselves.
- **No lesson-specific board.** Lesson code in `src/learn/` only maps config to props and connects the engine. Everything that renders or changes a cell lives in `src/board/`, so a fix there reaches both pages.
- **Highlights are options, not settings.** `BoardHighlights` is a plain option on the grid hook. The game fills it from persisted user toggles, and a lesson fills it from its config. `useSudokuGrid` stays free of storage and config parsing.
- **Refactor in small commits.** A6-A10 each land alone, with no change in game behavior, before A11 connects them. `GamePage.tsx` is 1,217 lines, and a single big extraction would be hard to review and to bisect.
- **Ready vs. pending split (2026-09-25).** Part A holds every item that needs no further decision. Part B holds items that wait on the lesson config format or the selection model.

## Mistakes and lessons learned

- Types defined in the UI layer ended up imported by the engine (`engine/types.ts:115` used an inline `import('@/game/gameTypes')`). Put a type in the lowest layer that uses it.
- The two `useMediaQuery` copies had drifted: the learn copy rendered `false` first, which caused a layout flash on desktop. Duplicates drift, so shared hooks belong in `src/hooks/`.
- Some tests reference source paths as strings (`process.cwd()` + `'src/game/...'`). TypeScript won't catch them during a move, so grep for them.
- A21's skill duplicated the authoring doc despite a "don't duplicate" rule. When the schema is still changing and `AGENTS.md` already points agents to a doc, add the workflow to the doc instead of creating a skill.
- An earlier draft of this plan proposed a separate `LessonBoard` component. Even as a thin wrapper, it would have duplicated `GamePage`'s wiring. The shared `usePlayableBoard` hook replaces it.

## Potential issues

- **Merge conflicts.** A2 touched many files, and A6-A11 all edit `GamePage.tsx`. Land them in order, and avoid parallel branches that edit `GamePage.tsx` heavily.
- **Git rename detection.** Keep content changes out of `git mv` commits (A2, A10, A12), apart from import paths, so `git log --follow` keeps working.
- **`react-refresh/only-export-components` warnings** may reappear on moved files. They're existing warnings, not errors.
- **File naming.** Name new files after what they export (`boardReducer.ts`, `useBoardView.ts`, `InputModeTabs.tsx`). Don't create `src/board/index.ts` unless it only re-exports.
- **Silent config drops.** Until A18 lands, `parseConfig` discards any `board` block without an error. A lesson author who adds one early sees nothing happen.
- **Focus vs. selection regressions (A17).** The game relies on focus and selection being the same thing. Keep single-select mode identical, and make sure the existing `useSudokuGrid` and `GamePage` tests cover it before adding multi-select.

## Links

- `AGENTS.md`: layering, cell sizing ownership, conventions
- `docs/architecture.md`: registry and runtime overview (updated in A5, A14 and A20)
- `docs/lesson-authoring.md`: config block and checklist items (updated in A20)
- `docs/breakpoints.md`: allowed breakpoints for A12's side-by-side layout
- `src/curriculum/lessonEngine.ts`: `LessonEngine<S>` interface that A19 implements around `boardReducer`
- `src/curriculum/loader.ts`: `parseConfig`, extended in A18
- Skill used: `web-accessibility` (multi-select grid pattern for A17)
