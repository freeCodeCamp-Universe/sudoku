# Breakpoints

Mobile-first `min-width` media queries only — no `max-width` queries except for clearly viewport-tied features (e.g., print). 320px is the implicit baseline and needs no query.

The only breakpoints allowed in `min-width` queries:

| Breakpoint | Use case                                                       |
| ---------- | -------------------------------------------------------------- |
| `600px`    | Phablets / small tablets (e.g. iPad Mini portrait, 744px wide) |
| `768px`    | Standard tablet ramp                                           |
| `1024px`   | Small laptop / tablet landscape                                |
| `1440px`   | Desktop                                                        |
| `2560px`   | Large / high-resolution desktop                                |

Do not introduce other breakpoint values. If a component needs an adjustment at a width not on this list, reconsider the layout rather than adding a new breakpoint.

## Compound Gates

When a layout depends on more than one condition, such as "landscape and sub-desktop", compute that gate in JavaScript with `useMediaQuery` and apply a class from that single source of truth. Do not recreate the same gate in CSS with orientation queries or banned `max-width` terms.

Orientation queries stay out of CSS in this repo. If orientation affects layout, branch in JS and scope the CSS under the applied class.
