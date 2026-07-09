# Cell-size consolidation

Date: 2026-07-10
Branch: lands on `main` (before `fix/mobile-layout`)
Status: Draft, for review

## Problem

On `main`, the board cell size is defined in four places that overlap and can
drift:

1. `src/game/useResponsiveCellSize.ts` — `getBaseCellSize` maps variant layout
   → base size (grid 16 → 30, other grids → 52; multigrid 21/15 → 30, 12 → 40,
   else `floor(400 / cols)`), then applies ratio steps for small viewports.
   `GamePage` passes the result to the layout strategy as `cellSizeOverride`,
   so this is the runtime authority.
2. `src/game/layouts/grid.ts` — a private `getCellSize` fallback (16 → 30,
   4 → 80, else 52) used only when no override is passed (i.e. only in tests).
3. `src/game/layouts/multigrid.ts` — a private `getCellSize` fallback that
   duplicates the hook's multigrid formula line for line.
4. `src/game/layouts/triangular.ts` — a hardcoded `CELL_SIZE = 52` that ignores
   `cellSizeOverride` entirely.

The duplication has already produced two live inconsistencies:

- **Mini 4×4** (`src/variants/mini.ts`): the grid layout's fallback says 80px,
  but the hook says 52px and always wins at runtime. The 80px path is dead
  code that disagrees with shipped behavior.
- **Sujiken** (`src/variants/sujiken.ts`, triangular 9): the layout ignores the
  responsive override, so the board is always `9 × 52 = 468px` wide and
  overflows any viewport below ~520px. The hook computes a responsive size for
  it that is silently discarded.

`fix/mobile-layout` adds more sizing policy to the hook (classic 9×9 step
table, comfortable size for oversized boards). Landing that on top of the
duplication deepens the drift, so consolidation should land on `main` first.

## Goal

One owner for each concern:

- **Base cell size** (what a variant's cells measure with no viewport
  pressure) is owned by the layout strategy, defined once per layout kind.
- **Responsive policy** (how the base shrinks or is replaced per viewport) is
  owned by `useResponsiveCellSize`, expressed only in terms of the base it
  gets from the strategy.

Every layout, including triangular, respects the responsive override.

## Design

### 1. `LayoutStrategy` gains `baseCellSize`

In `src/game/gameTypes.ts`:

```ts
interface LayoutStrategy {
  baseCellSize(variant: Variant): number;
  cellRects(variant: Variant, cellSizeOverride?: number): Map<CellId, Rect>;
  canvasSize(variant: Variant, cellSizeOverride?: number): Size;
  // ...existing optional members unchanged
}
```

`cellSizeOverride` stays optional; when omitted, `cellRects` / `canvasSize`
default to `baseCellSize(variant)`. That keeps no-override callers (layout
unit tests) working against the same single source instead of a private copy.

### 2. Each layout implements it, private copies deleted

- `grid.ts`: move the formula into `baseCellSize` — 16 → 30, else 52. The
  dead `4 → 80` branch is dropped so consolidation is behavior-neutral (mini
  ships at 52 today). If 80px mini cells are actually wanted, that is a
  separate, visible decision, not a fallback.
- `multigrid.ts`: move the existing formula into `baseCellSize`; delete the
  private `getCellSize`.
- `triangular.ts`: `baseCellSize` returns 52; `cellRects` and `canvasSize`
  accept and apply `cellSizeOverride` like the other layouts.

### 3. The hook consumes the strategy

`useResponsiveCellSize` deletes `getBaseCellSize` and computes:

```ts
const base = resolveLayout(variant.layout.kind).baseCellSize(variant);
```

The ratio steps (≤375 → `base × 38/52`, ≤520 → `base × 44/52`) are unchanged.
No import cycle: the hook already sits beside the layout registry in
`src/game`.

### Behavior change: Sujiken becomes responsive

Once triangular honors the override, Sujiken picks up the existing ratio
steps (38px cells ≤375px, 44px ≤520px). This is a change from `main`, but it
fixes the mobile overflow rather than preserving it. Called out so it is
reviewed as intended, not noticed as a regression.

## Testing

- Per-layout `baseCellSize` assertions in the existing colocated layout tests
  (grid 9 → 52, grid 16 → 30, multigrid 21 → 30, triangular → 52).
- Grid layout tests asserting 80px for size 4 (if any) update to 52.
- Triangular: add cases proving `cellRects` / `canvasSize` scale with an
  explicit override.
- Hook tests on `main` need no changes; the observable mapping variant →
  size is identical except Sujiken on small widths, which gets new cases.

## How `fix/mobile-layout` builds on this

Order of operations:

1. Branch off `origin/main`, land this consolidation as its own PR.
2. Rebase `fix/mobile-layout` onto the result.

The only overlapping file is `useResponsiveCellSize.ts`. Resolution:

- Delete the branch's copy of `getBaseCellSize` in favor of
  `resolveLayout(...).baseCellSize(variant)`.
- Keep the branch's policy layers exactly as they are — they already treat
  `base` as an input: the classic 9×9 step table (which never reads `base`),
  the `COMFORTABLE_CELL_SIZE` path for oversized boards below 1024px, and the
  ratio steps for everything else.
- The branch's deferred work (desktop shrink-to-fit with zoom/fit controls
  for oversized boards, see the TODO in the hook) also consumes
  `baseCellSize` — it needs the true base to compute the fit scale, which is
  exactly what the strategy now exposes.

Net effect: after the rebase the hook is pure policy, the strategies are the
only place a base size is written, and the classic/oversized/triangular cases
all flow through the same pipeline.

## Out of scope

- Gallery previews (`src/gallery/previews/*`) — they derive cell size from
  their own canvas width and never touch the layout strategies.
- The desktop oversized-board treatment (zoom/fit controls) — deferred per
  the `fix/mobile-layout` TODO.
- Revisiting the mini 4×4 size (52 vs 80) — flagged above; decide separately
  if anyone wants roomier mini cells.
