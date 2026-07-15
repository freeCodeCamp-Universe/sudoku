# Shared `Dialog` component + dialog refactor

Status: **planned, not yet implemented**
Branch: `fix/dialogs`

## Summary

The app has five modal surfaces. Three (`HelpDialog`, `OnboardingDialog`,
`KeyboardShortcutsDialog`) are built on the native `<dialog>` element and behave
correctly. Two (`winOpen`, `newGameConfirmOpen`, both inline in
`GamePage.tsx`) are hand-rolled `<div role="dialog">` overlays and are missing:

- focus trap
- Escape-to-close
- a close (`×`) button (only `newGameConfirmOpen`; `winOpen` has one)

`KeyboardShortcutsDialog` is also missing an `×`.

The fix is a single shared `Dialog` component that wraps the native `<dialog>`
element and owns the one unavoidable piece of imperative glue (`showModal()`),
then migrating all five surfaces onto it.

## Why native `<dialog>` + imperative `showModal()` (not a workaround)

A `<dialog>` becomes visible three ways, and only one is modal:

| How                              | Result                                                        |
| -------------------------------- | ------------------------------------------------------------- |
| `<dialog open>` (HTML attribute) | **non-modal** — inline, no backdrop, no focus trap, no Escape |
| `.show()`                        | **non-modal**                                                 |
| `.showModal()`                   | **modal** — top layer, backdrop, focus trap, Escape-to-close  |

Modal behavior is reachable **only** through the `.showModal()` method. There is
no HTML attribute or React prop that maps to it (React 19 did not add one), so
`<dialog open={open}>` would render a non-modal dialog with no focus trap. The
`useRef` + effect pattern that calls `showModal()`/`close()` is the canonical,
correct approach — not a hack. The right move is to isolate that one imperative
call in a single component so no call site repeats it.

Newer platform features considered and rejected for now:

- **`closedby="closerequest" | "any"`** (declarative light-dismiss): still
  limited-availability as of mid-2026. `showModal()` already gives Escape for
  free; backdrop dismiss is handled manually. Treat as future progressive
  enhancement only.
- **Invoker Commands API** (`command="show-modal"` / `commandfor`): button-driven
  only, so it cannot express a state-driven open like `winOpen` (opened as a side
  effect of solving). Support still rolling out. Not applicable.

## The bug the current pattern hides

The shared sync effect in the three existing dialogs can call `onClose` twice, or
call it in reaction to a close it initiated:

```
open=false (React) → effect calls dialog.close() → native 'close' event → onClose()
Escape pressed     → native 'close' event → onClose() → parent sets open=false → effect no-op
```

Today this is harmless because every `onClose` only sets state to `false`
(idempotent). But `winOpen`'s close also runs `onFirstWin?.()`, a real side
effect. Migrating it naively would let the onboarding dialog fire twice.

## Architecture decision: single source of truth for close

The shared `Dialog` enforces one rule: **only the native `close` event calls
`props.onClose`.**

- The sync effect handles both directions: `showModal()` when
  `open && !dialog.open`, `dialog.close()` when `!open && dialog.open`. The
  `close()` call fires the native `close` event, which is the single place
  `props.onClose` runs.
- Affordances the `Dialog` owns (the `×` button, backdrop click) call
  `dialogRef.current.close()` directly, never `props.onClose`.
- Footer buttons ("Got it", "Keep Playing", "Play Again") live in call-site
  children and have no access to the ref. They close by setting the parent's
  open state to `false`, which routes through the effect → `close()` → native
  `close` event → `onClose`. No context or render prop needed.
- Because `onClose` is the single owner of close side effects, footer button
  handlers must **not** duplicate what `onClose` does — they run only their
  button-specific extras (e.g. `clearProgress`, `dispatch`) plus the state
  flip.

This removes the double-fire and makes side-effectful `onClose` (e.g.
`onFirstWin`) safe. Net result is strictly better than any of the five current
call sites.

## Proposed component

Location: `src/game/Dialog/` — `Dialog.tsx`, `Dialog.module.css`,
`Dialog.test.tsx`, `index.ts` (barrel, re-export only).

Proposed props:

```
open: boolean
onClose: () => void
title?: string             // plain-string title; Dialog renders the <h2>
labelledBy?: string        // custom title markup in children; caller owns the heading
children: ReactNode
showCloseX?: boolean       // default true
closeOnBackdrop?: boolean  // default true
className?: string         // per-dialog width / content overrides
```

`title` and `labelledBy` are mutually exclusive and exactly one is required
(the win dialog's multi-line JSX title can't be a string prop, so it passes
`labelledBy`). The component owns: `dialogRef`, the `showModal()`/`close()`
sync effect, the native `onClose` wiring (single source of truth),
backdrop-click close, the `×` button, and — when `title` is given —
`aria-labelledby` via `useId` and the title `<h2>`.

Shared styles that move into `Dialog.module.css` (duplicated verbatim across the
three existing CSS modules today): `.dialog`, `.closeX`, `::backdrop`,
`.content`, `.title`.

## Migration table

| Call site                       | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `KeyboardShortcutsDialog`       | Wrap in `Dialog`, keep table body. **Gains `×`.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `HelpDialog`                    | Wrap in `Dialog`, keep tabs/panels + "Got it".                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `OnboardingDialog`              | Wrap in `Dialog`, keep settings list + "Got it".                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `winOpen` (GamePage)            | Replace `<div>` overlay with `Dialog`. **Gains focus trap + Escape + real modal.** `onClose` → `setWinOpen(false); onFirstWin?.()` and is the **only** place `onFirstWin` runs — "Play Again" and "View Puzzle" drop their own `onFirstWin` calls and keep only `setWinOpen(false)` (the close trigger) plus their extras (`clearProgress`, `onNewGame`, `dispatch`). Accessible name becomes the visible title ("Great job, puzzle master!") via `labelledBy`, replacing the current mismatched `aria-label="Puzzle solved"`. |
| `newGameConfirmOpen` (GamePage) | Replace `<div>` overlay with `Dialog`. **Gains all three + `×`.** Escape / `×` / backdrop → "Keep Playing" (non-destructive default), confirmed with the user.                                                                                                                                                                                                                                                                                                                                                                 |

The win dialog's "Start Page" control is navigation, not an action: it becomes
a react-router `<Link to="/">` styled like the other modal buttons, replacing
the current `<button onClick={() => navigate('/')}>`. Clicking it unmounts
`GamePage`, and unmounting removes the open dialog from the top layer without
firing the native `close` event — so `onClose` (and `onFirstWin`) do not run
on that path. That is correct: the onboarding dialog lives in `GamePage` and
would unmount immediately anyway, and since `acknowledgeOnboarding` never ran,
onboarding simply shows after the next win. `Dialog` needs no unmount cleanup
(do **not** call `close()` in the effect cleanup — it would fire `onClose`
side effects mid-teardown).

GamePage styles to relocate: generic overlay/backdrop styling is dropped (native
`<dialog>` handles centering + backdrop). Content-specific styles (`.win*`,
`.modalBtn`, `.primary`, `.secondary`, `.modalTitle`, `.modalSub`,
`.modalActions`) move next to the content that uses them.

## Decisions confirmed with the user

1. `newGameConfirmOpen`: Escape and `×` map to **Keep Playing** (non-destructive).
2. Redundant per-dialog test assertions get trimmed once `Dialog.test.tsx`
   covers the shared behavior.
3. Win dialog's "Start Page" becomes an anchor (`<Link to="/">`), and closing
   via navigation-unmount (no `onClose` side effects on that path) is the
   intended behavior.

## Testing

- Vitest setup already polyfills `HTMLDialogElement` for jsdom
  (`src/test/setup.ts`); `HelpDialog.test.tsx` relies on it, so the shared
  component is testable. The polyfill is minimal: `close()` dispatches a
  `close` event, but nothing wires Escape → `cancel` → `close`, so
  `user.keyboard('{Escape}')` would do nothing. **Extend the polyfill** to
  mirror spec behavior (keydown Escape on an open modal dialog → `cancel`
  event → if not `preventDefault`ed, `close()`), so tests drive a real
  keypress via `userEvent`. Do not dispatch the `close` event manually from
  tests — that only proves the component reacts to an event the test faked.
- `Dialog.test.tsx` covers: Escape close, backdrop close, `×` close, `onClose`
  fires exactly once per dismissal (including the programmatic
  `open=true → false` path), and accessible name via both `title` and
  `labelledBy`.
- Trim now-redundant assertions from the per-dialog tests.
- Query the way a user / assistive tech does (`getByRole('dialog', { name })`),
  drive interactions with `userEvent`, assert focus with `toHaveFocus()`.

## Potential issues / watch items

- **Mount-open case:** `winOpen` toggles `true` after mount, and the win effect
  in GamePage sets it. The sync effect must handle `open` starting `true` on
  mount as well as toggling later.
- **Double `onClose` / `onFirstWin`:** addressed by the single-source-of-truth
  contract above; verify in `Dialog.test.tsx`. During migration, also strip the
  duplicated `onFirstWin` calls from the win dialog's footer buttons (see
  migration table) — keeping them would reintroduce the double-fire through
  the new close path.
- **Unmount-while-open ("Start Page" navigation):** unmounting must not fire
  `onClose`; no `close()` in effect cleanup (see migration section).
- **`build` typechecks tests:** `tsc --noEmit` covers `*.test.tsx`, so prop
  changes must propagate to colocated tests or the build fails.
- **CSS logical properties:** existing `.closeX` / `.winClose` use physical
  `top`/`right`. The shared component must use `inset-block-start` /
  `inset-inline-end` per the project CSS rules.
- **Backdrop-click detection depends on `.content`:** the
  `e.target === dialog` check only reads as a backdrop click because the
  `.content` wrapper fills the dialog's inner area, so clicks on content never
  land on the `<dialog>` node itself. Keep that wrapper (and no padding on
  `.dialog` itself), or clicks on dialog padding would dismiss it.

## Verify before done

```
pnpm build && pnpm test && pnpm lint
```

## Links

- `src/game/GamePage.tsx` — `winOpen`, `newGameConfirmOpen` (to migrate)
- `src/game/HelpDialog/`, `src/game/OnboardingDialog/`,
  `src/game/KeyboardShortcutsDialog/` — existing native-dialog pattern
- `AGENTS.md` — conventions, verify step, jsdom dialog polyfill note
