---
date: 2026-09-14
updated: 2026-09-19
project: sudoku
---

# Integrate Split-Pane Curriculum Layout into Sudoku

## Summary

Port the split-pane template's curriculum tree and lesson shell into the Sudoku
app under `/learn` and `/learn/:lessonId`. The curriculum tree (module/lesson
list, progress bar, search) lands at `/learn`; lesson routes at
`/learn/:lessonId` render the lesson page structure (instructions, checklist,
toolbar) but without an interactive panel — just the `PlaceholderPanel` stub.

The template's course-specific UI (NavDrawer, SettingsModal, ShortcutsModal,
HeaderControls, CourseOverlays) ports in as feature-specific components scoped
to the `/learn` routes. Base components (Button, Toggle) use Sudoku's existing
versions. The template's placeholder lesson content (101.md, 102.md, 103.md)
and build pipeline carry over as-is.

## Changes since initial draft (2026-09-19)

Since the doc was written, PR #162 reorganized the header, added a donate
button, and added a favorite button to variant pages. Key impacts on this plan:

1. **Button moved and upgraded.** `src/game/Button/` no longer exists. The new
   `src/app/Button/Button.tsx` is already polymorphic (renders `<button>`,
   `<Link>`, or `<a>`) with `variant: 'default' | 'cta'` and
   `hoverColor: 'blue' | 'yellow' | 'red'`. Phase 3 Button and Link items are
   resolved; no `LearnButton` needed.
2. **New shared components.** `src/app/DonateButton/`,
   `src/app/SegmentedControl/` are now in `src/app/`. Available for the learn
   module if needed.
3. **Header reworked.** `src/app/Header/Header.tsx` now includes: back
   navigation (link or button), title with optional favorite toggle, settings
   dropdown with toggles, keyboard shortcuts button, theme toggle, and donate
   button. Phase 6 should evaluate reusing this Header for the learn layout
   rather than porting a separate header.
4. **Toggle call site count.** The Header's settings dropdown uses 6 Toggle
   instances (dark theme, check answers, timer, highlight peers, nav on left,
   high contrast). The `description` prop extension from Phase 0 remains
   needed.

## Checklist

### Phase 0: Isolated changes to existing code (merge first)

These touch only existing Sudoku files, require no learn module code, and can
each be reviewed and merged independently before the port begins.

- [ ] **Toggle `description` prop** — extend `src/app/Toggle/Toggle.tsx` and
      `Toggle.module.css` with an optional `description?: string` prop. Add
      `aria-describedby` on the input, render a `<p>` below the row, port
      description styles. Add test coverage for the new prop. All 7 existing
      call sites are unchanged.
- [ ] **Layout `pageNameFor()`** — add `/learn` and `/learn/:lessonId` cases
      to `pageNameFor()` in `src/app/Layout/Layout.tsx` for screen-reader
      route-change announcements. Harmless no-op until the routes exist.

### Phase 1: Scaffolding and rename script

- [ ] Write a Node script (`scripts/port-learn-template.ts`) that copies
      template files into `src/learn/`, converting file names from kebab-case to
      the project convention (PascalCase for `.tsx` components, camelCase for
      hooks/utils/stores).
- [ ] Script also copies `src/curriculum/` into `src/learn/curriculum/` and
      `scripts/build-lesson-data.ts` + related prebuild scripts into
      `scripts/`.
- [ ] Script rewrites internal `import` paths to match new file names and
      locations.
- [ ] Script rewrites Wouter imports (`Link`, `useRoute`, `useParams`,
      `useLocation`) to react-router-dom equivalents (`Link` with `to` prop,
      `useMatch`, `useParams`, `useNavigate`/`useLocation`). This is part of
      the copy, not a separate phase.

### Phase 2: Routing

- [ ] Add `/learn` and `/learn/:lessonId` routes to `src/routes.tsx`.
- [ ] Update `pageNameFor()` in `src/app/Layout/Layout.tsx` to handle
      `/learn` and `/learn/:lessonId` paths for screen-reader announcements.
- [ ] Update `scripts/generate-spa-routes.ts` to also generate
      `dist/learn/index.html` and `dist/learn/<lessonId>/index.html` for every
      lesson.

### Phase 3: Component collision resolution

- [x] **Button** — ~~Sudoku's Button was `<button>` only in `src/game/Button/`.~~
      **Resolved.** Sudoku's Button has moved to `src/app/Button/` and is now
      polymorphic (renders `<button>`, react-router-dom `<Link>`, or external
      `<a>` via `href` + `target_blank` props). Variants: `'default' | 'cta'`;
      hover colors: `'blue' | 'yellow' | 'red'`. The template's `cta` variant
      maps directly. No `LearnButton` needed. The template's `danger` variant
      has no equivalent yet; add a `danger` hover/variant to
      `src/app/Button/Button.module.css` if the learn module needs it, or
      style destructive actions with `hoverColor="red"` on a `default` button.
- [x] **Link** — ~~Template had a styled external anchor wrapper.~~
      **Resolved.** Sudoku's `Button` with `href` + `target_blank` covers
      external links. The template's `Link` component can be dropped entirely.
- [ ] **Toggle** — Template's SettingsModal uses toggle switches internally.
      Use Sudoku's `src/app/Toggle/` component.
- [ ] **Icon components** — Template imports from `@/components/base/Icon`
      (CheckCircleIcon, CircleIcon, XCircleIcon, ListIcon, KeyboardIcon,
      GearIcon, FccLogoIcon). These are generated by the template scaffolding
      pipeline and don't exist in the template source. Create equivalent icon
      components using Bootstrap Icons (per Sudoku's CLAUDE.md convention), or
      SVG icon components in `src/learn/icons/`.

### Phase 4: Theme and styling integration

- [ ] The template has a `global.css` and `colors.css` (generated by
      scaffolding, empty in the template). The template's CSS modules reference
      semantic tokens like `--color-bg`, `--color-text`, `--color-border`,
      `--space-*`, `--text-*`, etc. Map these to Sudoku's existing
      `theme.css` custom properties, or define a thin bridge layer in
      `src/learn/learnTokens.css` that aliases Sudoku tokens to the names the
      template CSS expects.
- [ ] Ensure dark/light theme works: Sudoku uses `.light` class on
      `documentElement`; template uses `data-theme="light"`. Either adapt the
      template CSS to use `.light` selectors, or have the ThemeProvider stamp
      both the class and the data attribute.
- [ ] `main` element: template uses `id="main"`, Sudoku uses
      `id="main-content"`. Standardize to `main-content` (matches SkipLink
      target).

### Phase 5: Build pipeline

- [ ] Port `scripts/build-lesson-data.ts` and its dependencies
      (`prebuild-hooks.ts`, `prebuild-register.ts`).
- [ ] Port `src/curriculum/ordering.ts` and `lessons/*.md` into
      `src/learn/curriculum/`.
- [ ] Port `src/curriculum/loader.ts` (reads markdown, renders to HTML, builds
      lesson JSON).
- [ ] Add `prebuild` script to `package.json` (or integrate into existing
      build pipeline).
- [ ] Verify the Vite `curriculum-data` plugin approach works alongside
      Sudoku's existing Vite config, or adapt the HMR watcher.

### Phase 6: Feature-specific shell

- [ ] Port `CourseLayout` logic as a `LearnLayout` wrapper that mounts under
      the `/learn` routes. Sudoku's `Header` (in `src/app/Header/`) already
      supports back navigation, settings dropdown, keyboard shortcuts, theme
      toggle, and a donate button. Decide whether `LearnLayout` reuses the
      existing `Header` (with learn-specific settings props) or renders its own
      header. The template's course-specific overlays (NavDrawer,
      ShortcutsModal, SettingsModal) still need porting as learn-scoped
      components.
- [ ] Port `courseChrome` store → `src/learn/stores/courseChrome.ts` (manages
      overlay open/close state).
- [ ] Port `progressStore` → `src/learn/stores/progressStore.ts` (lesson
      completion backed by localStorage).
- [ ] Port `useProgress`, `useCourseShortcuts`, `useInitialFocusPreference`
      hooks.

### Phase 7: Pages and views

- [ ] Port `HomePage` → `LearnPage` (`src/learn/LearnPage/LearnPage.tsx`):
      fetches curriculum tree, renders progress + continue CTA +
      CurriculumNavigator.
- [ ] Port `LessonRoute` → `LessonRoute` (`src/learn/LessonRoute/LessonRoute.tsx`):
      reads `:lessonId` from params, fetches lesson data, renders LessonPage
      with PlaceholderPanel.
- [ ] Port `LessonPage` and `LessonWorkspace` as the lesson shell.
- [ ] Port feature components: CurriculumTree, CurriculumNavigator,
      CurriculumSearch, Checklist, PrimaryAction, ResetButton, NavDrawer,
      LessonToolbar, PlaceholderPanel, HeaderControls, CourseOverlays.

### Phase 8: Tests

- [ ] Port and adapt all test files alongside their components.
- [ ] Fix test imports (Icon imports, Button imports, any remaining
      router-mock differences).
- [ ] `pnpm build && pnpm test && pnpm lint` passes.

### Phase 9: Navigation

- [ ] Add a link to `/learn` from the Gallery page (and/or Header).
- [ ] Lesson links in CurriculumTree point to `/learn/:lessonId`.
- [ ] Back navigation from LearnPage goes to `/` (Gallery).

## Architecture decisions and rationale

### Feature-scoped module at `src/learn/`

Everything curriculum-related lives under `src/learn/` to keep it isolated from
the existing puzzle engine/game/gallery layers. This matches the Sudoku
architecture's convention of each top-level directory being a self-contained
layer. The `/learn` routes are an independent concern from the puzzle game.

### Wouter → react-router-dom (handled by port script)

The template uses Wouter; Sudoku uses react-router-dom v7. The port script
rewrites the 6 affected files during copy rather than treating it as a separate
phase. The mapping is mechanical:

| Wouter                                            | react-router-dom                             |
| ------------------------------------------------- | -------------------------------------------- |
| `<Link href="/path">`                             | `<Link to="/path">`                          |
| `useRoute('/pattern/:param')` → `[match, params]` | `useMatch('/pattern/:param')` → match object |
| `useParams()`                                     | `useParams()` (same API)                     |
| `useLocation()` → `[path, navigate]`              | `useLocation()` + `useNavigate()`            |
| `<Switch>` + `<Route>`                            | Routes defined in `src/routes.tsx`           |

### Button resolution (resolved)

Sudoku's Button has been refactored and moved to `src/app/Button/` as a shared
polymorphic component. It renders as `<button>`, react-router-dom `<Link>`, or
external `<a>` depending on `href` and `target_blank` props. It supports
`variant: 'default' | 'cta'` and `hoverColor: 'blue' | 'yellow' | 'red'`.

The template's `cta` variant maps directly to Sudoku's `cta`. The template's
`danger` variant has no direct equivalent; if the learn module needs an
explicit destructive style, add a `danger` variant to
`src/app/Button/Button.module.css`. Otherwise, using `hoverColor="red"` on a
`default` button provides a sufficient visual signal.

No `LearnButton` is needed. The template's `Link` wrapper can also be dropped
since Button already handles both internal and external links.

### Icon components

The template scaffolding generates Icon components that don't exist in the
template source. The Sudoku project uses Bootstrap Icons (inline SVGs) per its
CLAUDE.md. Create `src/learn/icons.tsx` (or a directory) with the needed icons
as named SVG components:

- `CheckCircleIcon` — Bootstrap `check-circle` or `check-circle-fill`
- `CircleIcon` — Bootstrap `circle`
- `XCircleIcon` — Bootstrap `x-circle`
- `ListIcon` — Bootstrap `list`
- `KeyboardIcon` — Bootstrap `keyboard`
- `GearIcon` — Bootstrap `gear`
- `FccLogoIcon` — freeCodeCamp logo SVG (external asset, needs sourcing)

### Theme bridge

Rather than rewriting every template CSS module's custom property references,
define a thin `learnTokens.css` that maps Sudoku's theme tokens to the names
the template expects. This file is imported once in the learn module's root
component. Example:

```css
/* src/learn/learnTokens.css */
:root {
  --color-bg: var(--bg-primary);
  --color-text: var(--text-primary);
  --color-border: var(--border-primary);
  /* ... */
}
```

This avoids editing dozens of CSS module files while keeping the mapping
explicit and auditable.

### localStorage key prefix

Template uses `vim-course:progress` as its localStorage key. Change to
`sudoku:learn:progress` for this project.

## Component collision inventory

| Name              | Sudoku location         | Template location             | Resolution                                                                               |
| ----------------- | ----------------------- | ----------------------------- | ---------------------------------------------------------------------------------------- |
| `App`             | `src/App.tsx`           | `src/App.tsx`                 | Not ported                                                                               |
| `Button`          | `src/app/Button/`       | `src/components/base/button/` | **Resolved.** Sudoku's Button is already polymorphic; use it directly. No `LearnButton`. |
| `Link`            | react-router-dom        | `src/components/base/link/`   | **Resolved.** Drop; Sudoku's `Button` with `href` covers both internal and external.     |
| `Toggle`/`Switch` | `src/app/Toggle/`       | `_shared` `base/switch/`      | Extend Sudoku's Toggle with optional `description` prop; don't port Switch               |
| `StarIcon`        | `src/gallery/StarIcon/` | (not in template)             | No collision                                                                             |
| `Header`          | `src/app/Header/`       | (not in template)             | Potential reuse for learn layout; see Phase 6 note                                       |
| `DonateButton`    | `src/app/DonateButton/` | (not in template)             | No collision; available for learn header                                                 |

## File name conversion

The rename script converts:

- Component files (`.tsx`): kebab-case → PascalCase directories and files
  - `curriculum-tree.tsx` → `CurriculumTree/CurriculumTree.tsx`
  - `nav-drawer.tsx` → `NavDrawer/NavDrawer.tsx`
  - `header-controls.tsx` → `HeaderControls/HeaderControls.tsx`
- Hook files (`.ts`): kebab-case → camelCase
  - `use-progress.ts` → `useProgress.ts`
  - `use-lesson-data.ts` → `useLessonData.ts`
  - `progress-storage.ts` → `progressStorage.ts`
- Store files (`.ts`): kebab-case → camelCase
  - `course-chrome.ts` → `courseChromeStore.ts`
  - `progress-store.ts` → `progressStore.ts`
- Curriculum logic (`.ts`): kebab-case → camelCase
  - `filter-curriculum.ts` → `filterCurriculum.ts`
  - `lesson-progress.ts` → `lessonProgress.ts`
- CSS modules follow their component: `curriculum-tree.module.css` →
  `CurriculumTree.module.css`
- Test files follow their subject: `curriculum-tree.test.tsx` →
  `CurriculumTree.test.tsx`

## Generated dependency manifest

20 modules imported by the split-pane template that don't exist in its source
directory. Grouped by
resolution strategy.

### Port from `_shared` (17 modules)

These have no Sudoku equivalent and must be copied into `src/learn/`.

**UI primitives:**

| Module                             | Exports                                                                                                           | ~Lines | Used by                                                              |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------- |
| `base/Icon`                        | 16 named SVG components (CheckCircleIcon, CircleIcon, XCircleIcon, ListIcon, KeyboardIcon, GearIcon, XIcon, etc.) | ~15 ea | CurriculumTree, Checklist, HeaderControls, HomePage, LessonWorkspace |
| `base/modal/modal`                 | `Modal` (compound: `Modal`, `Modal.Header`, `Modal.Body`)                                                         | 247    | SettingsModal, ShortcutsModal                                        |
| `base/drawer/drawer`               | `Drawer` (compound: `Drawer`, `Drawer.Body`, `Drawer.Footer`)                                                     | 263    | NavDrawer, ResetButton (mobile confirmation)                         |
| `base/banner/banner`               | `Banner`                                                                                                          | 23     | CourseLayout (mobile touch warning)                                  |
| `base/loading-state/loading-state` | `LoadingState`                                                                                                    | 37     | HomePage, LessonRoute                                                |
| `base/kbd-combo/kbd-combo`         | `KbdCombo`                                                                                                        | 67     | ShortcutsModal                                                       |
| `base/side-panel/side-panel`       | `SidePanel`                                                                                                       | 74     | Outline                                                              |

Transitive deps of Modal and Drawer (also from `_shared`):

- `hooks/use-body-scroll-lock` (~26 lines)
- `utils/focus-trap` (~17 lines)

**Content rendering:**

| Module                              | Exports            | ~Lines | Used by                                                   |
| ----------------------------------- | ------------------ | ------ | --------------------------------------------------------- |
| `features/markdown/markdown`        | `Markdown`         | 23     | LessonWorkspace                                           |
| `features/markdown/render-inline`   | `renderInline`     | 29     | CurriculumTree, Checklist, LessonWorkspace                |
| `features/markdown/render-markdown` | `renderMarkdown`   | 84     | Build-time only (prebuild script). Requires npm `marked`. |
| `features/progress/progress`        | `Progress`         | 20     | Home, NavDrawer                                           |
| `features/outline/outline`          | `Outline`          | 108    | LessonPage (prose lessons)                                |
| `features/tab-group/tab-group`      | `TabGroup`         | 90     | LessonWorkspace (code file tabs)                          |
| `features/code-block-copy/`         | `useCodeBlockCopy` | ~40    | Markdown (transitive)                                     |

**Hooks:**

| Module                            | Exports                                                     | ~Lines | Used by                                                       |
| --------------------------------- | ----------------------------------------------------------- | ------ | ------------------------------------------------------------- |
| `hooks/use-media-query`           | `useMediaQuery`                                             | 19     | ResetButton, CourseLayout, LessonPage                         |
| `hooks/use-platform-modifier`     | `usePlatformModifier`, `useAltLabel`, `useAltKeyName`, etc. | 69     | CurriculumSearch, PrimaryAction                               |
| `hooks/use-shortcuts-preference`  | `useShortcutsPreference`                                    | 49     | SettingsModal, ShortcutsModal, PrimaryAction, LessonWorkspace |
| `hooks/use-animations-preference` | `useAnimationsPreference`                                   | 39     | SettingsModal                                                 |

**Utilities:**

| Module                   | Exports                      | ~Lines | Used by    |
| ------------------------ | ---------------------------- | ------ | ---------- |
| `utils/extract-headings` | `extractHeadings`, `slugify` | 41     | LessonPage |

### Bridge to Sudoku equivalent (1 module)

| Module            | ~Lines | Sudoku equivalent                             | Resolution                                                                                                                                                                                                                                 |
| ----------------- | ------ | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `hooks/use-theme` | 59     | `src/app/ThemeProvider/` + `useTheme` context | Don't port. Wire learn components to Sudoku's `useTheme`. The template's `useTheme` uses `data-theme` attribute + hook-local state; Sudoku uses `.light` class + React context. SettingsModal's theme toggle calls Sudoku's `toggleTheme`. |

### Use Sudoku's Toggle, extended (1 module)

| Module               | ~Lines | Sudoku equivalent | Resolution                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------- | ------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `base/switch/switch` | 50     | `src/app/Toggle/` | **Extend Sudoku's Toggle** with an optional `description?: string` prop. Add `aria-describedby` linking the input to a description `<p>` below the row. Port the description styling from the template's Switch CSS. All 8 existing Toggle call sites (7 in Header, 1 in SettingsModal) pass no description, so the change is purely additive. SettingsModal in the learn module uses Sudoku's Toggle with descriptions. |

Toggle changes needed (`src/app/Toggle/Toggle.tsx` + `Toggle.module.css`):

- Add optional `description?: string` prop.
- Generate a description id via `useId()`.
- Add `aria-describedby={description ? descriptionId : undefined}` on the
  input.
- Render `{description && <p id={descriptionId} className={styles.description}>{description}</p>}`
  below the `.row` div (wrap both in a fragment or container div).
- CSS: `.description` with `font-size: 0.75rem`, `color: var(--text-muted)`,
  `margin: 0`. Sits below the label/toggle row.

### npm dependency to add

| Package  | Used by                                | Client bundle impact                    |
| -------- | -------------------------------------- | --------------------------------------- |
| `marked` | `render-markdown.ts` (build-time only) | **Zero** — only runs in prebuild script |

### Modules NOT ported from Sudoku (different patterns)

| Sudoku component              | Why not used for learn                                                                                                                                                                                                                                |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Dialog` (`src/game/Dialog/`) | Native `<dialog>` + `showModal()`. Template's Modal/Drawer use portal-based divs with manual inert/focus-trap. SettingsModal and ShortcutsModal expect the compound `Modal.Header`/`Modal.Body` API. Swapping would require rewriting both consumers. |
| `Tabs` (`src/game/Tabs/`)     | Simpler API (`items` + `selected`). Template's TabGroup is for code file tabs in lesson content with roving tabindex. Different use case.                                                                                                             |

## Potential issues

1. **Generated dependency volume**: 17 modules (plus 4 transitive deps) need
   porting from `_shared`. Total is roughly 1,200 lines of implementation
   code plus their CSS modules and tests. The port script must copy from both
   `_shared/src/` and `split-pane/src/` into the target tree.

2. **Route conflict**: `/learn/:lessonId` won't conflict with `/:variantId`
   because React Router matches routes in order and `/learn` is a more
   specific prefix. But the SPA route generator needs updating.

3. **Two theme systems**: If the bridge CSS approach gets complex, it may be
   simpler to do a find-and-replace on the template's CSS custom property
   names during the port script.

4. **Build pipeline complexity**: The template's prebuild step
   (`build-lesson-data.ts`) uses custom Node module hooks
   (`prebuild-hooks.ts`) to patch `import.meta.env` and `import.meta.glob`.
   This needs to coexist with Sudoku's existing build. The Vite
   `curriculum-data` plugin (file watcher for HMR) also needs merging into
   Sudoku's `vite.config.ts`.

5. **React version**: Both are on React 19. No compatibility issue.

## Links and references

- Sudoku routing: `src/routes.tsx`
- Sudoku theme: `src/app/theme.css`
- Sudoku layout: `src/app/Layout/Layout.tsx`
- Sudoku SPA route gen: `scripts/generate-spa-routes.ts`
