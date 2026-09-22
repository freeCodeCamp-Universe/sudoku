# SidePanel

A panel that renders as a fixed inline sidebar or a slide-in Drawer. The
consumer controls the mode, typically via `useMediaQuery`.

## Props

| Prop             | Type                             | Notes                                                                                |
| ---------------- | -------------------------------- | ------------------------------------------------------------------------------------ |
| `mode`           | `'sidebar' \| 'drawer'`          | Consumer-controlled display mode.                                                    |
| `open`           | `boolean`                        | Whether the panel is visible.                                                        |
| `onClose`        | `() => void`                     | Called when the panel should close.                                                  |
| `title`          | `string`                         | Drawer header title. Falls back to `ariaLabel` for the sidebar nav.                  |
| `id`             | `string`                         | Applied to the sidebar `<nav>` element, referenced by the trigger's `aria-controls`. |
| `ariaLabel`      | `string` (optional)              | `aria-label` for the sidebar `<nav>`. Falls back to `title`.                         |
| `triggerElement` | `HTMLElement \| null` (optional) | Element to restore focus to when the Drawer closes.                                  |
| `children`       | `ReactNode`                      | Panel content.                                                                       |

## Sidebar width

The sidebar width is controlled by the `--side-panel-width` CSS custom
property, which defaults to `clamp(10rem, 18vw, 14rem)`. Override it in
the parent layout without touching SidePanel:

```css
.my-layout {
  --side-panel-width: clamp(12rem, 20vw, 19rem);
}
```

## Basic usage

```tsx
import { useState, useRef } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { SidePanel } from '@/components/core/side-panel/side-panel';

const [open, setOpen] = useState(false);
const triggerRef = useRef<HTMLButtonElement>(null);
const isDesktop = useMediaQuery('(min-width: 1024px)');

<button
  ref={triggerRef}
  type="button"
  aria-expanded={open}
  aria-controls="my-panel"
  onClick={() => setOpen((prev) => !prev)}
>
  Toggle panel
</button>

<SidePanel
  id="my-panel"
  mode={isDesktop ? 'sidebar' : 'drawer'}
  open={open}
  onClose={() => setOpen(false)}
  title="My Panel"
  triggerElement={triggerRef.current}
>
  {/* panel content */}
</SidePanel>
```

## Trigger requirements

SidePanel does not provide a trigger button — the consumer builds one. The
trigger must have:

| Attribute       | Value                         | Purpose                                         |
| --------------- | ----------------------------- | ----------------------------------------------- |
| `aria-expanded` | `{open}`                      | Tells assistive tech whether the panel is open. |
| `aria-controls` | `{panelId}`                   | Points to the sidebar `<nav>` by its `id`.      |
| `ref`           | forwarded to `triggerElement` | Lets the Drawer restore focus on close.         |

## Behavior notes

**Sidebar mode** renders an inline `<nav>` that is hidden by default (`.sidebar`
class) and shown when `open` is true (`.sidebar-open` class). The consumer's
layout determines where the sidebar sits. No click handling is applied — the
sidebar is a persistent panel toggled by the external trigger.

**Drawer mode** renders a modal Drawer. The Drawer auto-closes when the user
clicks any `<a>` element inside it (`onClose` is called). If a future consumer
needs a drawer that does not auto-close on anchor clicks, add an
`autoCloseOnNavigate?: boolean` prop at that point.

**SSR** — Drawer renders `null` until after the component has mounted on the
client (the `mounted` guard). Sidebar renders normally on the server with
`open=false` (the default), so no flash occurs.

**Responsive** — SidePanel contains no responsive logic. The consumer picks the
mode, typically from `useMediaQuery`:

```tsx
const isDesktop = useMediaQuery('(min-width: 1024px)');
<SidePanel mode={isDesktop ? 'sidebar' : 'drawer'} ... />
```

This keeps SidePanel usable in non-responsive contexts (always-drawer,
always-sidebar) and avoids baking a specific breakpoint into a base component.
