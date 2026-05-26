# Sudoku - README

**Sudoku** is a browser-based collection of 20 sudoku variants, from beginner-friendly 4×4 grids to advanced multi-grid puzzles, all playable from a single index page.

## Variants

**Beginner**: Mini Sudoku 4×4, Even-Odd Sudoku, Wordoku, Color Sudoku

**Intermediate**: Classic Sudoku, Sudoku X, Jigsaw Sudoku, Windoku, Consecutive Sudoku, Greater-Than Sudoku

**Advanced**: Killer Sudoku, Samurai Sudoku, Arrow Sudoku, Skyscraper Sudoku, Super Sudoku (16×16), Asterisk Sudoku, Argyle Sudoku, Butterfly Sudoku, Chain Sudoku, Sujiken

## Key Features

**Index Page**: A searchable card gallery lists all 20 variants with live mini-previews of each puzzle type, difficulty badges, and one-click navigation to each game.

**Unique Constraints per Variant**: Each variant adds its own twist — cage sums (Killer), diagonal rules (Sudoku X), irregular regions (Jigsaw), arrow sums (Arrow), edge clues (Skyscraper), colored chains (Chain), and more.

**Multi-Grid Puzzles**: Samurai (5 overlapping 9×9 grids) and Butterfly (4 overlapping grids on a 12×12 board) require solving all grids simultaneously.

**Light and Dark Theme**: A toggle switches between dark (default) and light themes, with the preference saved to localStorage.

## Tech Stack

Vanilla HTML, CSS, and JavaScript. No build step or dependencies — open `index.html` directly in a browser.
