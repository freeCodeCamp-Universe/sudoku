# Board Color & Gameplay Testing — Work Tracker

Master checklist for two related testing efforts. The two specs are reference;
all execution lives in the two plans. Update the **Status** of each task as work
proceeds (`todo` / `in progress` / `done` / `blocked`).

**Hard ordering constraint:** Effort A ships completely before Effort B starts.
Gameplay tests (B2+) import `makeFixture`, which is built in color task **A1**.

## Source documents

| Doc                                                      | Role                           |
| -------------------------------------------------------- | ------------------------------ |
| `specs/2026-06-19-board-color-testing-design.md`         | Effort A rationale (reference) |
| `plans/2026-06-19-board-color-testing.md`                | Effort A tasks (A1–A9)         |
| `specs/2026-06-19-gameplay-validation-testing-design.md` | Effort B rationale (reference) |
| `plans/2026-06-19-gameplay-validation-testing.md`        | Effort B tasks (B1–B6)         |

---

## Effort A — Board color

Branch: `test/board-color` · 9 tasks · order **A1 → A2 → A3 → A4 → A5 → A6 → A7 → A8 → A9**

| #   | Task                                                                                                | Depends on | Status |
| --- | --------------------------------------------------------------------------------------------------- | ---------- | ------ |
| A1  | Deterministic fixture + render harness (`makeFixture`, `renderVariantBoard`, positional safety net) | —          | todo   |
| A2  | theme.css token reader (`readThemeTokens`) + canvas bridge (`readThemeColor`)                       | —          | todo   |
| A3  | Remove dead overlap board code (`overlap` prop, `[data-overlap]` CSS, 2 absence tests)              | —          | todo   |
| A4  | Migrate cell colors → theme.css tokens; value-pin + integrity tests                                 | A1, A2     | todo   |
| A5  | Migrate overlay colors (cage/argyle strokes) → theme.css tokens                                     | A2         | todo   |
| A6  | Color palette → CSS via `data-color` (`--color-1..9`); Cell, NumberPad, color.ts                    | A2         | todo   |
| A7  | Unify gallery preview canvas colors via `readThemeColor`                                            | A2, A4     | todo   |
| A8  | Per-variant color spec table + wiring tests; resolve `chain.color` decision                         | A1, A2, A4 | todo   |
| A9  | Generate `docs/colors.md` + drift test                                                              | A2, A8     | todo   |

Foundation status: Task 1 APIs verified against the codebase (2026-06-19); plan
patched (`resolveLayout` registry, `parityMap` typed `Map<CellId, 0 | 1>`).

---

## Effort B — Gameplay / validation

Branch: `test/gameplay-validation` (new) · 6 tasks · order **B1 → B2 → B3 → B4 → B5 → B6**
Starts only after Effort A merges.

| #   | Task                                                                             | Depends on             | Status |
| --- | -------------------------------------------------------------------------------- | ---------------------- | ------ |
| B1  | Registry iteration helper (`allVariants`, `houseCellIds`, `NON_UNIQUE_VARIANTS`) | A merged               | todo   |
| B2  | Generation soundness, parameterized over all variants                            | B1, A1 (`makeFixture`) | todo   |
| B3  | Uniqueness conflict detection, parameterized                                     | B1                     | todo   |
| B4  | Special-constraint conflicts, one suite per constraint                           | B1                     | todo   |
| B5  | Reducer gameplay simulation (`GameHarness`/`renderGame` + Probe)                 | B1                     | todo   |
| B6  | Grid-hook cell state (`useSudokuGrid` derived `CellState`)                       | B1                     | todo   |

---

## Summary

15 implementation tasks total: A1–A9 (color), then B1–B6 (gameplay).
Specs carry no tasks.
