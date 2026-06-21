# Sudoku

**Sudoku** is a browser-based collection of multiple sudoku variants, from beginner-friendly 4×4 grids to advanced multi-grid puzzles.

## Development

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm build
pnpm preview
```

## Test

```bash
pnpm test
```

## Scripts

| Command                | Description                                           |
| ---------------------- | ----------------------------------------------------- |
| `pnpm dev`             | Start the Vite dev server                             |
| `pnpm build`           | Typecheck (`tsc --noEmit`) then build for production  |
| `pnpm preview`         | Preview the production build                          |
| `pnpm test`            | Run the test suite once (no watch)                    |
| `pnpm typecheck`       | Typecheck without emitting                            |
| `pnpm lint`            | ESLint + Prettier check                               |
| `pnpm lint:fix`        | Autofix lint and format                               |
| `pnpm docs:colors`     | Regenerate `docs/colors.md` from the color tokens     |
| `pnpm report-contrast` | Print WCAG contrast ratios for board colors per theme |

## Stack

- Vite 7, React 19, TypeScript strict
- CSS modules
- Vitest + @testing-library/react
