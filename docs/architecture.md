# Architecture

The app is a React SPA with a Sudoku puzzle engine. Four layers depend on each other in one direction only.

```
┌──────────────────────────────────────────────┐
│  App / Gallery / Game / Learn (React UI)     │  routing, pages, board, course UI
├──────────────────────────────────────────────┤
│  Board                  (shared board UI)     │  rendering, interaction, layout registries
├──────────────────────────────────────────────┤
│  Variants               (declarative specs)  │  one data object per puzzle type
├──────────────────────────────────────────────┤
│  Engine                 (pure functions)     │  grid model, solver, generator
└──────────────────────────────────────────────┘
```

## Key directories

| Path                            | What lives there                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------------- |
| `src/engine/`                   | Grid model, constraint solver, puzzle generator. Pure functions only.                       |
| `src/variants/`                 | One spec object per puzzle type, plus the variant/constraint registries.                    |
| `src/board/`                    | Shared board state, input, rendering, interaction, layout strategies, overlays, annotators. |
| `src/game/`                     | Game session UI, game state, controls, timer, persistence, and pan/zoom.                    |
| `src/gallery/`                  | Home screen grid of puzzle cards and canvas previews.                                       |
| `src/learn/`                    | Feature-flagged Sudoku course: lesson views, course shell, and progress.                    |
| `src/curriculum/`               | Course content, lesson definitions, ordering, and curriculum data loading.                  |
| `src/components/Tabs/`          | Generic accessible tabs used by the game and shared board controls.                         |
| `src/hooks/`                    | Shared hooks, including media queries, element sizing, and SEO metadata.                    |
| `src/App.tsx`, `src/routes.tsx` | App entry point and route definitions.                                                      |
| `src/app/`                      | Shell components: page layout, header, theme provider.                                      |
| `scripts/`                      | Build-time Node scripts run via `pnpm <script-name>`. Not typechecked by `tsc`.             |
| `docs/`                         | Reference files. `colors.md` is generated; do not hand-edit it.                             |

---

## Engine layer

`src/engine/` contains no React. Everything is a pure function or a plain data type.

### Core types (`src/engine/types.ts`)

```ts
interface Cell { id: CellId; row: number; col: number; grid?: number }
interface House { id: string; cells: CellId[] }
interface Constraint {
  id: string;
  conflicts(values: Values, model: VariantModel): Conflict[];
  permits?(values: Values, cellId: CellId, value: SymbolValue, model: VariantModel): boolean;
}
interface VariantModel {
  cells: Cell[];
  houses: House[];
  constraints: Constraint[];
  symbols: SymbolValue[];
  // optional hooks variants can attach
  generateSolution?, generateGivens?, minimumClues?, peerHouseFilter?, ...
}
```

`Values` is `Map<CellId, SymbolValue>`. `CellId` is a string like `"r0c3"`.

Board shapes are described by `BoardLayout`:

```ts
type BoardLayout =
  | { kind: 'grid'; size: number; box: { rows: number; cols: number }; cellSize?: 'spacious' }
  | { kind: 'multigrid'; subGridSize: number; box: …; canvasRows: number; canvasCols: number; subGrids: … }
  | { kind: 'triangular'; size: number }
```

### buildModel (`src/engine/buildModel.ts`)

`buildModel(variant: Variant): VariantModel` builds cells and houses from the layout, then calls `resolveConstraints(variant.constraintIds)` to look up `Constraint` implementations from `src/engine/constraints/registry.ts`.

### Solver and generator

`solve(model, givens, opts?)` in `src/engine/solve.ts` is a backtracking solver. `generate(model, difficulty, rng)` in `src/engine/generate.ts` calls it to find a board with a unique solution, then removes givens down to the target difficulty.

---

## Variants layer

A puzzle type is a plain data object of type `Variant` (`src/engine/types.ts`). It declares everything as IDs and layout descriptors; the UI and engine resolve those IDs through registries at runtime.

### Variant spec (`src/engine/types.ts`)

```ts
interface Variant {
  id: string;
  name: string;
  description: string;
  popularity: number;
  difficulty: Difficulty; // 'beginner' | 'intermediate' | 'advanced'
  layout: BoardLayout;
  symbols: SymbolValue[];
  symbolKind?: 'digit' | 'letter' | 'color';
  constraintIds: string[]; // resolved via constraint registry
  overlayIds?: string[]; // resolved via overlay registry
  annotatorIds?: string[]; // resolved via annotator registry
  cellTags?: (cellId: CellId) => readonly string[]; // visual tags for a cell
  // optional hooks that override defaults
  buildHouses?;
  extraHouses?;
  peerHouseFilter?;
  deriveStructure?;
  deriveGutters?;
  renderSymbol?;
  generateSolution?;
  generateGivens?;
  minimumClues?;
  solve?;
}
```

### Registries

- **Variant registry** (`src/variants/registry.ts`): `variantRegistry: Record<string, Variant>` keyed by `variant.id`. The gallery and the `/:variantId` route both read it.
- **Constraint registry** (`src/engine/constraints/registry.ts`): `constraintRegistry: Record<string, Constraint>`. `resolveConstraints(ids)` looks up implementations; throws on an unknown id.
- **Layout registry** (`src/board/layouts/registry.ts`): `layouts: Record<string, LayoutStrategy>` with keys `'grid'`, `'multigrid'`, `'triangular'`. Maps a `layout.kind` to a strategy that knows cell geometry and canvas sizing.
- **Overlay registry** (`src/board/overlays/registry.ts`): `overlayRegistry: Record<string, OverlayComponent>`. Overlays are React components that draw variant-specific decorations on the board canvas.
- **Annotator registry** (`src/board/annotators/registry.ts`): `annotatorRegistry: Record<string, CellAnnotator>`. Annotators produce accessible cell descriptions (e.g. "bulb cell for arrow").
- **Cell tags:** `Variant.cellTags(cellId)` declares per-cell decorations. The shared `Board` maps those tags to the cell's existing visual data attributes.

To add a puzzle type, add a spec under `src/variants/` and register it, then register any new constraint, overlay, annotator, or layout strategy in its registry. See the quick reference at the bottom of this doc.

---

## Board layer

`src/board/` contains the shared playable board used by the game and learn
features. It owns board state and input as well as rendering, so consumers
provide their puzzle data and page-specific layout without duplicating board
behavior.

### Board state and reducer

`boardReducer` and `createBoardState` (`src/board/boardReducer.ts`) are pure
board-state functions. `BoardState` contains values, candidates, undo history,
and revealed cells; `BoardAction` covers entering or erasing values, toggling
candidates, clearing, undoing, and revealing a cell.

`GameProvider` (`src/game/GameProvider.tsx`) composes that reducer with the
game-only timer and `newGame` behavior. Its game state also tracks elapsed
time, whether the puzzle is solved, and whether the timer has started.

### Playable board

`usePlayableBoard` (`src/board/usePlayableBoard.ts`) composes the shared board
hooks and returns props for `Board`, `NumberPad`, and `InputModeTabs`. It accepts
board state and a dispatch function, so a consumer can route input through its
own state owner.

- `useBoardView` (`src/board/useBoardView.ts`) assembles the puzzle view and
  resolves layout, overlays, annotators, gutters, symbols, and other derived
  rendering props.
- `useBoardInput` (`src/board/useBoardInput.ts`) handles number-pad entry,
  candidate toggling, input locking, and screen-reader announcements.
- `InputModeTabs` (`src/board/InputModeTabs/`) provides Normal and Candidate
  modes around the shared number pad. It can include extra tabs, as the game's
  mobile Controls tab does; `Tabs` (`src/components/Tabs/`) supplies the
  generic accessible tab behavior.

`useSudokuGrid` (`src/board/useSudokuGrid.ts`) derives per-cell state,
highlights, accessible descriptions, and keyboard navigation. Its `highlights`
option independently controls peers, same-value cells, and conflicts, all on
by default. The game maps its persisted peer-highlight setting to this option;
correct-answer checking remains controlled separately by `checkEnabled`.

Grid focus and cell selection are separate. Focus drives the roving `tabindex`,
arrow-key navigation, number entry, and peer/same-value highlights. The default
`cellSelection: 'single'` mode keeps the focused cell selected, preserving game
behavior. In `multiple` mode, arrow keys move focus without changing the
selection, while Space and click toggle selected cells; the grid exposes
`aria-multiselectable`. Selection can be controlled through `selectedIds` and
`onSelectionChange`.

`Cell` draws the solid blue ring (`data-ring`, `--cell-ring-width` wide) on the focused cell in place of the browser focus outline, and in
single mode on the selected cell, which is the focused one. In `multiple` mode
(`Board` passes `multiSelect`), a selected cell instead gets `data-marked` and a
`--cell-selection-bg` fill and check mark; the focus ring stays on the active
cell. Every cell carries an explicit `aria-selected` of `true` or `false`, and
each toggle is spoken through the live region ("…, selected" / "…, not
selected"), because screen readers don't reliably re-announce `aria-selected` on
the focused cell.

`Board` (`src/board/Board/`) renders cells through the resolved layout
strategy's `cellRects(variant)`. The game and learn features own their page
layouts and decide how the returned board and number-pad props are arranged.

For boards sized to a containing panel, `useElementSize` (`src/hooks/`) observes
the container, and `cellSizeForWidth` (`src/board/layouts/`) selects a fitting
cell-size step using the board frame and any gutters. The game uses its separate
viewport-based responsive sizing and pan/zoom behavior.

## Game layer

### Puzzle generation pipeline

`buildPuzzle(variant, jigsawLayoutStart, genKey, seedBase): BuiltPuzzle` in `src/game/buildPuzzle.ts`:

1. Calls `buildModel(variant)` to get the `VariantModel`.
2. Calls `generate(model, variant.difficulty, rng)` with a seeded RNG to get `{ givens, solution }`.
3. Returns `{ model, gameVariant, givens, solution }`.

Jigsaw regions are generated from a separate seed stream so saved `(jigsawLayoutStart, genKey)` pairs always reproduce the same board.

`assemblePuzzle` in `src/board/assemblePuzzle.ts` handles the full setup call from `GamePage`, including seeding and progress restore.

`GamePage` owns the game-specific controls, timer, persistence, dialogs,
pan/zoom viewport, and responsive layouts. It uses `usePlayableBoard` for
shared board state presentation, input, and rendering rather than resolving
board registries or deriving board props itself.

`GameContext` exposes `{ state, dispatch, variant, model, givens, solution }`
to components in the game tree through `useGameContext()`. `GameState` extends
the shared `BoardState` with elapsed time, solved status, and timer status;
`GameAction` adds the game-only `tick` and `newGame` actions.

### Pan/zoom viewport

The board pan/zoom viewport (minimap, zoom controls, `boardFrameOversized` clip) is mobile-only. `GamePage` gates `panZoomActive` on `!isDesktop` (desktop is `≥ 1024px`). At desktop widths, boards render at natural size.

### Persistence

Two separate stores in `localStorage`:

- **Settings** (`usePersistence`, `src/game/usePersistence.ts`): per-session toggles (check answers, timer, highlight peers, color labels, onboarding). Keys: `sudoku-check-answers`, `sudoku-timer`, `sudoku-highlight-peers`, `sudoku-color-number-labels`, `sudoku-onboarding-shown`.
- **Progress** (`src/game/useProgressPersistence.ts`): per-variant puzzle state. Key: `sudoku-progress-{variantId}`. Saved shape:

  ```ts
  interface SavedProgress {
    seedBase: number;
    jigsawLayoutStart: number;
    genKey: number;
    values: [CellId, SymbolValue][];
    candidates: [CellId, SymbolValue[]][];
    revealed: CellId[];
    elapsedSeconds: number;
    layoutSchema?: number; // bumped when seed → board mapping changes
  }
  ```

  A jigsaw save written under an older `layoutSchema` is discarded rather than restoring values onto a different board.

---

## Learn layer

The learn experience is a separate React feature under `src/learn/`. It is enabled only when `SHOW_LEARN=true` in non-production mode; production builds always omit the learn routes and curriculum data. This keeps the in-progress course out of the production application while allowing it to be developed and tested locally.

### Routing and course shell

`src/routes.tsx` defines two feature-flagged routes:

- `/learn` renders `LearnPage` inside `CourseLayout`, showing the curriculum overview.
- `/learn/:lessonId` renders `LessonRoute` inside `CourseLayout`, loading and displaying an individual lesson.

`CourseLayout` provides the course header, navigation controls, skip link, touch-device banner, and course overlays. `LearnPage` and `LessonPage` provide the overview and lesson workspaces respectively. Lesson content is rendered from generated JSON rather than imported directly into React components.

### Curriculum data and lesson loading

`src/curriculum/ordering.ts` is the source of truth for module order and lesson file order. During development, the Vite `curriculum-data` plugin runs `scripts/build-lesson-data.ts` and generates the curriculum tree and lesson JSON under `public/data/`. Changes to curriculum Markdown or the Markdown renderer trigger regeneration and a full reload.

`useCurriculumTree` fetches and caches `/data/curriculum-tree.json`. `useLessonData` resolves a lesson from that tree, fetches `/data/lessons/<dataFile>`, caches it, and prefetches the next lesson. Lesson Markdown is sanitized and transformed by the learn Markdown pipeline before it is serialized for the client.

### Lesson validation

`parseLesson` (`src/curriculum/loader.ts`) validates each lesson as it loads, so a bad lesson fails both `pnpm build` and `curriculumIntegrity.test.ts`. `assertImageAltText` requires an `alt` attribute on every `<img>`. `assertSanitizedHtml` rejects HTML outside `LESSON_HTML_OPTIONS` (`src/curriculum/sanitize.ts`). `parseJsonWithComments` (`src/curriculum/jsonWithComments.ts`) parses the config block's `json` fence, allowing `//` and `/* */` comments.

### Interactive lesson boards

A lesson can define a `board` object in its config to show a playable puzzle
instead of the placeholder panel. The board identifies a registered `variant`
and supplies `givens` and a complete `solution`, keyed by the learner-facing,
1-based cell ids (for example, `"r1c1"` is the top-left cell). Optional
`cellSelection` is `"single"` by default or `"multiple"`, and `highlights` can
set `peers`, `sameValue`, and `conflicts` independently. Variants with
`deriveStructure` or `deriveGutters` are not supported for lesson boards yet;
the structure must be pinned before those variants can be used.

The loader validates the variant, cells, symbols, givens, solution, selection,
highlights, and board checklist tests, then converts cell ids to the engine's
0-based form. `BoardPanel` (`src/learn/BoardPanel/BoardPanel.tsx`) maps the
validated config through `puzzleFromConfig` (`src/board/puzzleFromConfig.ts`)
and `usePlayableBoard` (`src/board/usePlayableBoard.ts`). It lays out the
shared `Board` beside the Normal/Candidate input tabs. The panel sizes its
board from its available width using `useElementSize` and
`cellSizeForWidth`, rather than the game's viewport sizing or pan/zoom.

`createBoardLessonEngine` (`src/curriculum/lessonEngine.ts`) wraps the shared
`boardReducer` and grades `selected`, `values`, `candidates`, and `solved`
checklist tests. The checklist is not rendered. Its items are the lesson's
requirements, and grading runs after every board or selection change. The panel
reports `{ complete }` through `onUpdate`, and the Next button appears once
every requirement passes. Reset remounts the panel from the configured starting
board.

### Requirement hints

After each input, `LessonEngine.reviewInput(previous, next, input,
requirements)` returns an `InputReview`:

- `{ kind: 'hint', index }`: the input left the topmost unmet requirement unmet
  and did not move toward it. The panel calls `onHint(requirements[index].hint)`.
- `{ kind: 'clear' }`: the input met that requirement, or every requirement now
  passes. The panel calls `onHint(null)`.
- `{ kind: 'none' }`: the input changed nothing, moved toward the requirement,
  or is an input kind the requirement ignores.

A `selected` test only reacts to selection input. `values`, `candidates`, and
`solved` only react to board input. Progress is a score: matching cells or
candidates minus wrong ones, so adding a correct cell of a multi-cell selection
counts as progress rather than a miss.

`LessonWorkspace` owns the toast. It wraps the panel in a clipping `.work-area`
above the Reset/Next toolbar and renders `ToastStack`
(`src/components/ToastStack/`) into it with `placement="bottom"`, so the hint
slides out of the edge the working area shares with the toolbar. Lesson hints
do not auto-dismiss; learners can dismiss them or clear them by meeting the
requirement. It shows at most one hint at a time, clears it on reset, and keeps
an unchanged hint on screen instead of replaying it. Cmd/Ctrl+Enter only works
while Next is visible.

On load, and on the focus-panel shortcut, the workspace focuses the panel's
first focusable element (the board's active cell) and falls back to the
`role="application"` container for a panel with no controls.

### Creating curriculum modules and lessons

Scaffolding commands, frontmatter, sections, the HTML allowlist, images, config, and checklist rules are in [`lesson-authoring.md`](lesson-authoring.md).

### Learn progress

Course completion is stored separately from puzzle progress in `localStorage`. `progressStore` provides the shared external store, while `useProgress` exposes completed lesson IDs and completion actions to the overview, navigation, and lesson views. The store re-reads storage before writes so completions from another tab are preserved.

---

## App and gallery layers

`src/App.tsx` wires `BrowserRouter`, `ThemeProvider`, and `Layout` around `AppRoutes`.

Routes (`src/routes.tsx`):

- `/` renders `Gallery`
- `/learn` and `/learn/:lessonId` render the feature-flagged learn experience described above
- `/:variantId` renders `GamePage`

`Gallery` (`src/gallery/Gallery/`) reads `variantRegistry`, sorts and filters by popularity/alpha/difficulty, and renders `VariantCard` components. Each card links to `/:variantId` and shows a canvas preview.

---

## Build process

`pnpm build` runs three steps in sequence:

```
tsc --noEmit && vite build && tsx scripts/generate-spa-routes.ts
```

1. **Type-check**: `tsc --noEmit` covers all files in `src/`, including test files.
2. **Bundle**: Vite outputs `dist/index.html` and hashed assets to `dist/assets/`.
3. **Per-route HTML**: `scripts/generate-spa-routes.ts` imports `variantRegistry`, iterates its keys, and copies `dist/index.html` into `dist/<variantId>/index.html` for each of the 32 variants. This lets any static host serve deep links like `/classic` or `/killer` as a real file. React Router resolves the route client-side.

When the learn feature is enabled, the same script also creates `dist/learn/index.html` and one `dist/learn/<lessonId>/index.html` per lesson, with route-specific SEO metadata. The learn route files are omitted from production builds because `SHOW_LEARN` is disabled there.

---

## Testing

- **Engine tests** (`src/engine/*.test.ts`): call `buildModel`, `generate`, `solve`, `validate` directly and assert on return values.
- **Variant tests** (`src/variants/*.test.ts`): exercise the full pipeline for each variant (build model, generate a puzzle, solve it, check uniqueness).
- **Game tests** (`src/game/**/*.test.tsx`): React Testing Library, queried by role. `GameProvider.test.tsx` covers the reducer through simulated interactions.
- **Gallery tests** (`src/gallery/**/*.test.tsx`): render tests and card link assertions.

All test files are co-located with source. Run with `pnpm test` (single run, no watch).

`pnpm build` must also pass before claiming work is done: a type error in a test file fails the build, not just the test run.

---

## Adding a puzzle type (quick reference)

1. Create `src/variants/<name>.ts` exporting a `Variant` object with a unique `id`.
2. Add it to `variantRegistry` in `src/variants/registry.ts`.
3. Register any new `Constraint` in `src/engine/constraints/registry.ts`.
4. Register any new overlay component in `src/board/overlays/registry.ts`.
5. Register any new annotator in `src/board/annotators/registry.ts`.
6. If the variant needs a new board shape, implement `LayoutStrategy` and add it to `src/board/layouts/registry.ts`.
7. Add a test file `src/variants/<name>.test.ts` covering at least build and generation.
