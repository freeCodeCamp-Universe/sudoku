import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '@/app/ThemeProvider';
import { gridCells } from '@/engine/grid';
import type { Values } from '@/engine/types';
import { GamePage } from './GamePage';

function installMatchMedia({
  width = window.innerWidth,
  orientation = 'portrait',
}: {
  width?: number;
  orientation?: 'portrait' | 'landscape';
}) {
  window.innerWidth = width;
  window.matchMedia = ((query: string): MediaQueryList => {
    const min = /\(min-width:\s*(\d+(?:\.\d+)?)px\)/.exec(query);
    const max = /\(max-width:\s*(\d+(?:\.\d+)?)px\)/.exec(query);
    const orientationMatch = /\(orientation:\s*(portrait|landscape)\)/.exec(query);
    const currentWidth = window.innerWidth;
    const matches =
      (min === null || currentWidth >= Number(min[1])) &&
      (max === null || currentWidth <= Number(max[1])) &&
      (orientationMatch === null || orientationMatch[1] === orientation);

    return {
      matches,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    } as MediaQueryList;
  }) as typeof window.matchMedia;
}

function makeSolution(): Values {
  return new Map(
    gridCells(9).map((cell) => [
      cell.id,
      ((cell.row * 3 + Math.floor(cell.row / 3) + cell.col) % 9) + 1,
    ])
  );
}

vi.mock('@/engine/generate', () => {
  const solution = makeSolution();

  return {
    generate: () => ({
      solution,
      givens: new Map([...solution.entries()].slice(0, 25)),
    }),
  };
});

function renderGamePage(variantId = 'classic') {
  return render(
    <MemoryRouter initialEntries={[`/${variantId}`]}>
      <ThemeProvider>
        <Routes>
          <Route path="/:variantId" element={<GamePage />} />
        </Routes>
      </ThemeProvider>
    </MemoryRouter>
  );
}

function placeSymbolIntoEmptyCells(symbolName: string, placements: number) {
  // Prefix match: an overused symbol's button is named "1, more placed than
  // needed", and these tests keep placing past that point.
  const button = screen.getByRole('button', { name: new RegExp(`^${symbolName}(,|$)`) });

  for (let i = 0; i < placements; i += 1) {
    const [emptyCell] = screen.getAllByRole('gridcell', { name: /empty/ });
    fireEvent.click(emptyCell);
    fireEvent.click(button);
  }
}

// The toast splits the offending symbol (accent-red) from the body text into
// separate spans, so match the body copy the symbol name is folded into.
const OVERUSED_EDGE_HINT_TEXT = /placed more times than the puzzle needs/;

// The toast mirrors its visible text into a persistent sr-only status region,
// so query that region: it asserts what screen readers actually hear, and its
// text is empty whenever the toast is closed.
function queryOverusedEdgeHint() {
  return (
    screen
      .getAllByRole('status')
      .find((region) => OVERUSED_EDGE_HINT_TEXT.test(region.textContent ?? '')) ?? null
  );
}

// jsdom defaults to a 1024px width (desktop layout). Tests that need the mobile
// layout set window.innerWidth before rendering; reset it between tests.
afterEach(() => {
  installMatchMedia({ width: 1024, orientation: 'portrait' });
  window.innerWidth = 1024;
  window.localStorage.clear();
});

beforeEach(() => {
  installMatchMedia({ width: window.innerWidth, orientation: 'portrait' });
});

describe('GamePage - Classic integration', () => {
  it('should render the sudoku grid', () => {
    renderGamePage();

    expect(screen.getByRole('grid', { name: /sudoku grid/i })).toBeInTheDocument();
  });

  it('should render 81 cells', () => {
    renderGamePage();

    const board = screen.getByRole('grid', { name: /sudoku grid/i });
    expect(within(board).getAllByRole('gridcell')).toHaveLength(81);
  });

  it('should render the number pad', () => {
    renderGamePage();

    expect(screen.getByRole('button', { name: '5' })).toBeInTheDocument();
  });

  it('should show the Reveal Cell button in the desktop toolbar', () => {
    renderGamePage();

    expect(screen.getByRole('button', { name: /reveal/i })).toBeInTheDocument();
  });

  it('should not render the minimap, zoom controls, or Controls tab at desktop width', () => {
    window.innerWidth = 1024;
    renderGamePage();

    expect(screen.queryByRole('img', { name: /board overview/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /fit whole board/i })).toBeNull();
    expect(screen.queryByRole('tab', { name: 'Controls' })).toBeNull();
  });

  it('should render the minimap, zoom controls, and Controls tab below tablet width', async () => {
    const user = userEvent.setup();
    window.innerWidth = 500;
    renderGamePage();

    expect(screen.getByRole('tab', { name: 'Controls' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /fit whole board/i })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Map' }));

    expect(screen.getByRole('img', { name: /board overview/i })).toBeInTheDocument();
  });

  it('should render the Move and Map navigation tabs with the D-pad below tablet width', () => {
    window.innerWidth = 500;
    renderGamePage();

    expect(screen.getByRole('tab', { name: 'Move' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Map' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Move selected cell' })).toBeInTheDocument();
  });

  it('should keep the zoom controls visible while switching between Move and Map below tablet width', async () => {
    const user = userEvent.setup();
    window.innerWidth = 500;
    renderGamePage();

    expect(screen.getByRole('button', { name: /fit whole board/i })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Map' }));

    expect(screen.getByRole('img', { name: /board overview/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /fit whole board/i })).toBeInTheDocument();
  });

  it('should not render the navigation tabs at desktop width', () => {
    renderGamePage();

    expect(screen.queryByRole('tab', { name: 'Move' })).toBeNull();
    expect(screen.queryByRole('tab', { name: 'Map' })).toBeNull();
  });

  it('should throw when an unknown variantId is used', () => {
    expect(() => renderGamePage('not-a-variant')).toThrow();
  });

  it('should render the jigsaw variant', () => {
    renderGamePage('jigsaw');

    const board = screen.getByRole('grid', { name: /sudoku grid/i });
    expect(within(board).getAllByRole('gridcell')).toHaveLength(81);
  });

  it('should use color names in cell accessibility labels for the color variant', () => {
    renderGamePage('color');

    expect(
      screen.getByRole('gridcell', { name: /Row 1, column 1, box 1, Red, readonly/i })
    ).toBeInTheDocument();
  });

  it('should label the Lavender numpad button with the correct color name', () => {
    renderGamePage('color');

    expect(screen.getByRole('button', { name: 'Lavender' })).toBeInTheDocument();
  });

  it('should render a Show numbers switch for the color variant', () => {
    renderGamePage('color');

    expect(screen.getByRole('switch', { name: 'Show numbers' })).toBeInTheDocument();
  });

  it('should not render a Show numbers switch for the classic variant', () => {
    renderGamePage('classic');

    expect(screen.queryByRole('switch', { name: 'Show numbers' })).toBeNull();
  });

  it('should show the digit label inside color cells when the Show numbers switch is toggled', async () => {
    const user = userEvent.setup();
    renderGamePage('color');

    const toggle = screen.getByRole('switch', { name: 'Show numbers' });
    expect(toggle).not.toBeChecked();

    await user.click(toggle);

    expect(toggle).toBeChecked();
    expect(screen.getAllByTestId('cell-color-label').length).toBeGreaterThan(0);
  });

  it('should render the Show numbers switch in the color variant input panel below tablet width', () => {
    window.innerWidth = 500;
    renderGamePage('color');

    expect(screen.getByRole('switch', { name: 'Show numbers' })).toBeInTheDocument();
  });

  it('should keep the Show numbers switch visible when switching between Normal and Candidate below tablet width', async () => {
    const user = userEvent.setup();
    window.innerWidth = 500;
    renderGamePage('color');

    expect(screen.getByRole('switch', { name: 'Show numbers' })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Candidate' }));
    expect(screen.getByRole('switch', { name: 'Show numbers' })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Normal' }));
    expect(screen.getByRole('switch', { name: 'Show numbers' })).toBeInTheDocument();
  });

  it('should render a Highlight overlaps switch, on by default, for a multigrid variant', () => {
    renderGamePage('samurai');

    const toggle = screen.getByRole('switch', { name: 'Highlight overlaps' });
    expect(toggle).toBeChecked();
  });

  it('should not render a Highlight overlaps switch for a single-grid variant', () => {
    renderGamePage('classic');

    expect(screen.queryByRole('switch', { name: 'Highlight overlaps' })).toBeNull();
  });

  it('should tint overlap cells by default and drop the tint when the switch is toggled off', async () => {
    const user = userEvent.setup();
    renderGamePage('samurai');

    const overlapCells = () =>
      screen.getAllByRole('gridcell').filter((cell) => cell.hasAttribute('data-overlap'));

    expect(overlapCells().length).toBeGreaterThan(0);

    const toggle = screen.getByRole('switch', { name: 'Highlight overlaps' });

    await user.click(toggle);
    expect(toggle).not.toBeChecked();
    expect(overlapCells()).toHaveLength(0);

    await user.click(toggle);
    expect(toggle).toBeChecked();
    expect(overlapCells().length).toBeGreaterThan(0);
  });

  it('should not persist the Highlight overlaps state to localStorage', async () => {
    const user = userEvent.setup();
    renderGamePage('samurai');

    await user.click(screen.getByRole('switch', { name: 'Highlight overlaps' }));

    const stored = Object.entries(window.localStorage).map(([key, value]) => `${key}=${value}`);
    expect(stored.some((entry) => /overlap/i.test(entry))).toBe(false);
  });

  it('should render skyscraper gutters from derived structure', () => {
    renderGamePage('skyscraper');

    expect(screen.getAllByLabelText(/visible from the top of column /i)).toHaveLength(9);
    expect(screen.getAllByLabelText(/visible from the start of row /i)).toHaveLength(9);
  });

  it('should render the arrow rule legend for arrow sudoku', () => {
    renderGamePage('arrow');

    expect(
      screen.getByText('Digits along each arrow sum to the number in the circle.')
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Arrow rule legend')).toBeInTheDocument();
  });

  it('should not render the arrow rule legend for non-arrow variants', () => {
    renderGamePage('classic');

    expect(
      screen.queryByText('Digits along each arrow sum to the number in the circle.')
    ).toBeNull();
  });

  it('should open the help dialog with the current variant help rules', async () => {
    const user = userEvent.setup();

    renderGamePage();
    await user.click(screen.getByRole('button', { name: /how to play/i }));

    expect(screen.getByRole('dialog', { name: 'How to Play' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Basic Rules', level: 3 })).toBeNull();
    expect(screen.getByText('The board:')).toBeInTheDocument();
    // Rule text is interleaved with no-wrap token spans, so match on the
    // list item's full text content instead of a single text node.
    expect(
      screen
        .getAllByRole('listitem')
        .some(
          (item) =>
            item.textContent ===
            'The board: A 9×9 board divided into nine 3×3 boxes. Fill every cell with a symbol from 1 to 9.'
        )
    ).toBe(true);
    expect(screen.queryByRole('heading', { name: 'Additional Rules', level: 3 })).toBeNull();
  });

  it('should render samurai additional rules from the upstream dialog content', async () => {
    const user = userEvent.setup();

    renderGamePage('samurai');
    await user.click(screen.getByRole('button', { name: /how to play/i }));

    expect(screen.getByRole('heading', { name: 'Additional Rules', level: 3 })).toBeInTheDocument();
    expect(screen.getByText('Shared regions:')).toBeInTheDocument();
    expect(screen.getByText('Solve as one:')).toBeInTheDocument();
  });

  it('should announce the entered value when a numpad button is clicked', () => {
    vi.useFakeTimers();
    renderGamePage();

    const [emptyCell] = screen.getAllByRole('gridcell', { name: /empty/ });
    fireEvent.click(emptyCell);
    fireEvent.click(screen.getByRole('button', { name: '5' }));

    // Advance just enough to fire the setTimeout(0) in announce() without
    // triggering the 1-second game clock interval.
    act(() => {
      vi.advanceTimersByTime(10);
    });

    const gridAnnouncer = screen
      .getAllByRole('status')
      .find((el) => el.getAttribute('id') === 'grid-announcer')!;
    expect(gridAnnouncer.textContent).toContain('5');
    vi.useRealTimers();
  });

  it('should announce "empty" when the Erase numpad button is clicked', () => {
    vi.useFakeTimers();
    renderGamePage();

    const [emptyCell] = screen.getAllByRole('gridcell', { name: /empty/ });
    fireEvent.click(emptyCell);
    fireEvent.click(screen.getByRole('button', { name: 'Erase' }));

    act(() => {
      vi.advanceTimersByTime(10);
    });

    const gridAnnouncer = screen
      .getAllByRole('status')
      .find((el) => el.getAttribute('id') === 'grid-announcer')!;
    expect(gridAnnouncer.textContent).toContain('empty');
    vi.useRealTimers();
  });

  it('should announce the color name when a color numpad button is clicked', () => {
    vi.useFakeTimers();
    renderGamePage('color');

    const [emptyCell] = screen.getAllByRole('gridcell', { name: /empty/ });
    fireEvent.click(emptyCell);
    fireEvent.click(screen.getByRole('button', { name: 'Red' }));

    act(() => {
      vi.advanceTimersByTime(10);
    });

    const gridAnnouncer = screen
      .getAllByRole('status')
      .find((el) => el.getAttribute('id') === 'grid-announcer')!;
    expect(gridAnnouncer.textContent).toContain('Red');
    vi.useRealTimers();
  });

  it('should announce candidate added when Candidate mode is active and a numpad symbol is clicked', () => {
    vi.useFakeTimers();
    renderGamePage();

    fireEvent.click(screen.getByRole('tab', { name: 'Candidate' }));
    const [emptyCell] = screen.getAllByRole('gridcell', { name: /empty/ });
    fireEvent.click(emptyCell);
    fireEvent.click(screen.getByRole('button', { name: '5' }));

    act(() => {
      vi.advanceTimersByTime(10);
    });

    const gridAnnouncer = screen
      .getAllByRole('status')
      .find((el) => el.getAttribute('id') === 'grid-announcer')!;
    expect(gridAnnouncer.textContent).toMatch(/Row \d+, column \d+, box \d+, candidate 5 added/);
    vi.useRealTimers();
  });

  it('should announce the revealed value when the Reveal Cell button is clicked', () => {
    vi.useFakeTimers();
    renderGamePage();

    const [emptyCell] = screen.getAllByRole('gridcell', { name: /empty/ });
    fireEvent.click(emptyCell);
    fireEvent.click(screen.getByRole('button', { name: /reveal/i }));

    act(() => {
      vi.advanceTimersByTime(10);
    });

    const gridAnnouncer = screen
      .getAllByRole('status')
      .find((el) => el.getAttribute('id') === 'grid-announcer')!;
    expect(gridAnnouncer.textContent).toContain('revealed');
    vi.useRealTimers();
  });

  it('should show the overused edge hint when a symbol becomes overused, then auto-dismiss it', () => {
    vi.useFakeTimers();

    try {
      renderGamePage();

      placeSymbolIntoEmptyCells('1', 10);

      const message = queryOverusedEdgeHint();
      expect(message).not.toBeNull();
      expect(message).toHaveTextContent('Symbol 1 is placed more times than the puzzle needs.');
      expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();

      // Duration timer starts the close; a second flush runs the exit timer.
      act(() => {
        vi.advanceTimersByTime(6000);
      });
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(queryOverusedEdgeHint()).toBeNull();
      // The status region itself must stay mounted with its text cleared:
      // screen readers do not announce live regions that enter the DOM with
      // content already in them, so the next crossing relies on this region.
      expect(message).toBeInTheDocument();
      expect(message?.textContent).toBe('');
    } finally {
      vi.useRealTimers();
    }
  });

  it('should show the overused edge hint when a symbol becomes overused via keyboard entry', () => {
    vi.useFakeTimers();

    try {
      renderGamePage();

      for (let i = 0; i < 10; i += 1) {
        const [emptyCell] = screen.getAllByRole('gridcell', { name: /empty/ });
        fireEvent.focus(emptyCell);
        fireEvent.keyDown(emptyCell, { key: '1' });
      }

      expect(queryOverusedEdgeHint()).not.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('should not show the overused edge hint again while the symbol stays overused', () => {
    vi.useFakeTimers();

    try {
      renderGamePage();

      placeSymbolIntoEmptyCells('1', 10);
      // Duration timer starts the close; a second flush runs the exit timer.
      act(() => {
        vi.advanceTimersByTime(6000);
      });
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(queryOverusedEdgeHint()).toBeNull();

      placeSymbolIntoEmptyCells('1', 1);

      expect(queryOverusedEdgeHint()).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('should show the overused edge hint again after erasing below the limit and crossing it again', () => {
    vi.useFakeTimers();

    try {
      // Checking off so the erase below cannot be blocked by the
      // correctly-filled guard if the last placement happens to be right.
      window.localStorage.setItem('sudoku-check-answers', 'false');

      renderGamePage();

      // Place 1s only until the toast first appears, so the board sits exactly
      // one over the limit; blindly placing more would leave it overused even
      // after the erase below.
      let placements = 0;
      while (!queryOverusedEdgeHint() && placements < 15) {
        placeSymbolIntoEmptyCells('1', 1);
        placements += 1;
      }
      expect(queryOverusedEdgeHint()).not.toBeNull();

      // Duration timer starts the close; a second flush runs the exit timer.
      act(() => {
        vi.advanceTimersByTime(6000);
      });
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(queryOverusedEdgeHint()).toBeNull();

      // The last-placed cell is still selected; erasing it drops the count
      // back under the limit, so the next placement crosses it again.
      fireEvent.click(screen.getByRole('button', { name: 'Erase' }));
      expect(queryOverusedEdgeHint()).toBeNull();

      // Place into a different empty cell: clicking the just-erased cell
      // (still selected) would toggle the selection off instead.
      const [, otherEmptyCell] = screen.getAllByRole('gridcell', { name: /empty/ });
      fireEvent.click(otherEmptyCell);
      fireEvent.click(screen.getByRole('button', { name: /^1(,|$)/ }));

      expect(queryOverusedEdgeHint()).not.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('should stack one toast per overused symbol, each with its own countdown', () => {
    vi.useFakeTimers();

    try {
      renderGamePage();

      placeSymbolIntoEmptyCells('1', 10);
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      placeSymbolIntoEmptyCells('2', 10);
      expect(screen.getAllByRole('button', { name: 'Dismiss' })).toHaveLength(2);
      // The live region announces the newest crossing.
      expect(queryOverusedEdgeHint()).toHaveTextContent(
        'Symbol 2 is placed more times than the puzzle needs.'
      );

      // The first toast expires on its own schedule (1s + exit later) while
      // the second sticks around for its full duration.
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(screen.getAllByRole('button', { name: 'Dismiss' })).toHaveLength(1);

      act(() => {
        vi.advanceTimersByTime(4800);
      });
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(screen.queryAllByRole('button', { name: 'Dismiss' })).toHaveLength(0);
      expect(queryOverusedEdgeHint()).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('should replace the open toast instead of stacking a duplicate when the same symbol re-crosses', () => {
    vi.useFakeTimers();

    try {
      // Checking off so the erase below cannot be blocked by the
      // correctly-filled guard if the last placement happens to be right.
      window.localStorage.setItem('sudoku-check-answers', 'false');

      renderGamePage();

      // Place 1s only until the toast first appears, so the board sits exactly
      // one over the limit.
      let placements = 0;
      while (!queryOverusedEdgeHint() && placements < 15) {
        placeSymbolIntoEmptyCells('1', 1);
        placements += 1;
      }

      // Erase below the limit and re-cross while the first toast is still
      // open: the toast is replaced, not duplicated.
      fireEvent.click(screen.getByRole('button', { name: 'Erase' }));
      const [, otherEmptyCell] = screen.getAllByRole('gridcell', { name: /empty/ });
      fireEvent.click(otherEmptyCell);
      fireEvent.click(screen.getByRole('button', { name: /^1(,|$)/ }));

      expect(screen.getAllByRole('button', { name: 'Dismiss' })).toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('should pause the auto-dismiss countdown while the dismiss button has focus', () => {
    vi.useFakeTimers();

    try {
      renderGamePage();

      placeSymbolIntoEmptyCells('1', 10);
      const dismissButton = screen.getByRole('button', { name: 'Dismiss' });

      fireEvent.focus(dismissButton);
      act(() => {
        vi.advanceTimersByTime(60000);
      });
      expect(queryOverusedEdgeHint()).not.toBeNull();

      // Leaving restarts the full duration.
      fireEvent.blur(dismissButton);
      act(() => {
        vi.advanceTimersByTime(6000);
      });
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(queryOverusedEdgeHint()).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('should dismiss the overused edge hint with the dismiss button', () => {
    vi.useFakeTimers();

    try {
      renderGamePage();

      placeSymbolIntoEmptyCells('1', 10);

      fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(queryOverusedEdgeHint()).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('GamePage - check prompt', () => {
  // The prompt only appears when the board is full but checking is off, so seed
  // a completed board via saved progress and turn checking off before rendering.
  function seedCompletedBoardWithCheckingOff() {
    window.localStorage.setItem('sudoku-check-answers', 'false');
    window.localStorage.setItem(
      'sudoku-progress-classic',
      JSON.stringify({
        seedBase: 1,
        jigsawLayoutStart: 0,
        genKey: 0,
        values: [...makeSolution()],
        candidates: [],
        revealed: [],
        elapsedSeconds: 0,
      })
    );
  }

  it('should render the check prompt inside a polite live region when the board is full and checking is off', () => {
    seedCompletedBoardWithCheckingOff();
    renderGamePage();

    const promptRegion = screen
      .getAllByRole('status')
      .find((region) => /looks like you're done/i.test(region.textContent ?? ''));

    expect(promptRegion).toBeDefined();
    expect(promptRegion).toHaveAttribute('aria-live', 'polite');
    expect(
      within(promptRegion!).getByRole('button', { name: /check your answers/i })
    ).toBeInTheDocument();
  });

  it('should remove the check prompt once the user checks their answers', async () => {
    const user = userEvent.setup();
    seedCompletedBoardWithCheckingOff();
    renderGamePage();

    await user.click(screen.getByRole('button', { name: /check your answers/i }));

    expect(screen.queryByText(/looks like you're done/i)).not.toBeInTheDocument();
  });

  it('should re-show the check prompt after the board is edited and refilled, not keep checking', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem('sudoku-check-answers', 'false');
    // Seed a full but incorrect board (one wrong cell) so checking does not mark
    // it solved and open the win dialog, which would block board interaction.
    const values = [...makeSolution()];
    const wrongCell = values.find(([id]) => id === 'r8c8');
    if (wrongCell) wrongCell[1] = 1;
    window.localStorage.setItem(
      'sudoku-progress-classic',
      JSON.stringify({
        seedBase: 1,
        jigsawLayoutStart: 0,
        genKey: 0,
        values,
        candidates: [],
        revealed: [],
        elapsedSeconds: 0,
      })
    );
    renderGamePage();

    await user.click(screen.getByRole('button', { name: /check your answers/i }));
    expect(screen.queryByText(/looks like you're done/i)).not.toBeInTheDocument();

    // Editing the board so it is no longer full drops the one-shot verify mode.
    await user.click(screen.getByRole('gridcell', { name: /Row 9, column 9,/i }));
    await user.click(screen.getByRole('button', { name: 'Erase' }));

    // Refilling it brings back the completion prompt instead of auto-checking,
    // because global checking is still off and verify mode did not persist.
    // Prefix match: the board is otherwise fully solved, so 5 may already be
    // fully placed elsewhere and its label reads "5, all placed".
    await user.click(screen.getByRole('button', { name: /^5(,|$)/ }));

    expect(screen.getByText(/looks like you're done/i)).toBeInTheDocument();
  });
});

describe('GamePage - solved puzzle', () => {
  // Seed a solved board (checking stays on by default), so the win dialog
  // opens on mount and View Puzzle shows the finished board.
  function seedSolvedBoard() {
    window.localStorage.setItem(
      'sudoku-progress-classic',
      JSON.stringify({
        seedBase: 1,
        jigsawLayoutStart: 0,
        genKey: 0,
        values: [...makeSolution()],
        candidates: [],
        revealed: [],
        elapsedSeconds: 5,
      })
    );
  }

  it('should not reveal cells while viewing the solved puzzle', async () => {
    const user = userEvent.setup();
    seedSolvedBoard();
    renderGamePage();

    await user.click(screen.getByRole('button', { name: 'View Puzzle' }));
    await user.click(screen.getByRole('gridcell', { name: /Row 9, column 9,/i }));
    await user.click(screen.getByRole('button', { name: /reveal/i }));

    expect(screen.queryByRole('gridcell', { name: /revealed/i })).toBeNull();
  });

  it('should stay completed when the check toggle is flipped off afterwards', async () => {
    const user = userEvent.setup();
    seedSolvedBoard();
    renderGamePage();

    await user.click(screen.getByRole('button', { name: 'View Puzzle' }));
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    await user.click(screen.getByRole('switch', { name: 'Check answers' }));

    // Turning checking off must not resurrect the round: no completion
    // prompt, no reveal, no editing.
    expect(screen.queryByText(/looks like you're done/i)).toBeNull();

    await user.click(screen.getByRole('gridcell', { name: /Row 9, column 9,/i }));
    await user.click(screen.getByRole('button', { name: /reveal/i }));
    expect(screen.queryByRole('gridcell', { name: /revealed/i })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Erase' }));
    expect(screen.queryByRole('gridcell', { name: /Row 9, column 9,.*empty/i })).toBeNull();
  });

  it('should not reopen the win dialog when checking is toggled off and on', async () => {
    const user = userEvent.setup();
    seedSolvedBoard();
    renderGamePage();

    await user.click(screen.getByRole('button', { name: 'View Puzzle' }));
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    await user.click(screen.getByRole('switch', { name: 'Check answers' }));
    await user.click(screen.getByRole('switch', { name: 'Check answers' }));

    expect(screen.queryByRole('dialog', { name: /great job/i })).toBeNull();
  });

  it('should allow replaying the same board after Clear All', async () => {
    const user = userEvent.setup();
    seedSolvedBoard();
    renderGamePage();

    await user.click(screen.getByRole('button', { name: 'View Puzzle' }));
    await user.click(screen.getByRole('button', { name: 'Clear All' }));
    await user.click(
      within(screen.getByRole('dialog', { name: /clear all entries/i })).getByRole('button', {
        name: 'Clear All',
      })
    );

    const [emptyCell] = screen.getAllByRole('gridcell', { name: /empty/ });
    await user.click(emptyCell);
    await user.click(screen.getByRole('button', { name: '5' }));

    expect(screen.getAllByRole('gridcell', { name: /, 5(,|$)/ }).length).toBeGreaterThan(0);
  });
});

describe('GamePage - back navigation', () => {
  it('should navigate immediately when Back is clicked with no progress', async () => {
    const user = userEvent.setup();
    renderGamePage();

    await user.click(screen.getByRole('button', { name: /back/i }));

    expect(screen.queryByRole('dialog', { name: /leave puzzle/i })).toBeNull();
  });

  it('should navigate immediately when Back is clicked after entering a value', async () => {
    const user = userEvent.setup();
    renderGamePage();

    const [emptyCell] = screen.getAllByRole('gridcell', { name: /empty/ });
    await user.click(emptyCell);
    await user.click(screen.getByRole('button', { name: '5' }));
    await user.click(screen.getByRole('button', { name: /back/i }));

    expect(screen.queryByRole('dialog', { name: /leave puzzle/i })).toBeNull();
  });
});

describe('GamePage - progress persistence', () => {
  it('should save progress to localStorage after entering a value', async () => {
    const user = userEvent.setup();
    renderGamePage();

    const [emptyCell] = screen.getAllByRole('gridcell', { name: /empty/ });
    await user.click(emptyCell);
    await user.click(screen.getByRole('button', { name: '5' }));

    const saved = localStorage.getItem('sudoku-progress-classic');
    expect(saved).not.toBeNull();
    const parsed = JSON.parse(saved!);
    expect(parsed.values.length).toBeGreaterThan(0);
  });
});

describe('GamePage - pause', () => {
  async function startGame(user: ReturnType<typeof userEvent.setup>) {
    const [emptyCell] = screen.getAllByRole('gridcell', { name: /empty/ });
    await user.click(emptyCell);
    await user.click(screen.getByRole('button', { name: '5' }));
  }

  it('should not offer pause before the timer has started', () => {
    renderGamePage();

    expect(screen.queryByRole('button', { name: 'Pause game' })).toBeNull();
  });

  it('should hide the puzzle and show the pause cover while paused', async () => {
    const user = userEvent.setup();
    renderGamePage();
    await startGame(user);

    await user.click(screen.getByRole('button', { name: 'Pause game' }));

    expect(screen.queryByRole('grid', { name: /sudoku grid/i })).toBeNull();
    expect(screen.getByText('Paused')).toBeInTheDocument();
    expect(screen.getByText('Game paused, puzzle hidden.')).toBeInTheDocument();
  });

  it('should restore the puzzle when Resume is clicked on the cover', async () => {
    const user = userEvent.setup();
    renderGamePage();
    await startGame(user);

    await user.click(screen.getByRole('button', { name: 'Pause game' }));
    await user.click(screen.getByRole('button', { name: 'Resume' }));

    expect(screen.getByRole('grid', { name: /sudoku grid/i })).toBeInTheDocument();
    expect(screen.queryByText('Paused')).toBeNull();
    expect(screen.getByText('Game resumed.')).toBeInTheDocument();
  });

  it('should restore the puzzle from the timer Resume game button', async () => {
    const user = userEvent.setup();
    renderGamePage();
    await startGame(user);

    await user.click(screen.getByRole('button', { name: 'Pause game' }));
    await user.click(screen.getByRole('button', { name: 'Resume game' }));

    expect(screen.getByRole('grid', { name: /sudoku grid/i })).toBeInTheDocument();
  });

  it('should not tick the timer while paused', async () => {
    const user = userEvent.setup();
    renderGamePage();
    await startGame(user);

    vi.useFakeTimers();
    fireEvent.click(screen.getByRole('button', { name: 'Pause game' }));
    const readTimer = () => screen.getAllByText(/\d+:\d{2}/)[0].textContent;
    const displayed = readTimer();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(readTimer()).toBe(displayed);
    vi.useRealTimers();
  });

  it('should ignore numpad entry while paused', async () => {
    const user = userEvent.setup();
    renderGamePage();

    const [emptyCell] = screen.getAllByRole('gridcell', { name: /empty/ });
    await user.click(emptyCell);
    await user.click(screen.getByRole('button', { name: '5' }));
    await user.click(screen.getByRole('button', { name: 'Erase' }));

    await user.click(screen.getByRole('button', { name: 'Pause game' }));
    await user.click(screen.getByRole('button', { name: '7' }));
    await user.click(screen.getByRole('button', { name: 'Resume game' }));

    expect(screen.queryByRole('gridcell', { name: /Row 4, column 1, box 4, 7/ })).toBeNull();
  });
});

// Pass 3 (gap G2): clicking a real Cell + NumberPad digit that duplicates a peer
// must surface the conflict in the rendered DOM. The mocked generate leaves rows
// 4+ empty, so r3c0 and r3c1 (Row 4, columns 1-2) are guaranteed empty peers in
// one box. The conflict marker is asserted via the cell's accessible name ("in
// conflict"), which is what assistive tech announces; the warning <svg> is
// aria-hidden and, under the default check mode, also marks merely-incorrect
// cells, so it is not a clean conflict signal.
describe('GamePage - conflict interaction', () => {
  it('should mark both cells in conflict when a played digit duplicates a peer', async () => {
    const user = userEvent.setup();
    renderGamePage();

    await user.click(screen.getByRole('gridcell', { name: /Row 4, column 1,/i }));
    await user.click(screen.getByRole('button', { name: '5' }));
    await user.click(screen.getByRole('gridcell', { name: /Row 4, column 2,/i }));
    await user.click(screen.getByRole('button', { name: '5' }));

    expect(
      screen.getByRole('gridcell', { name: /Row 4, column 1,.*in conflict/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('gridcell', { name: /Row 4, column 2,.*in conflict/i })
    ).toBeInTheDocument();
  });

  it('should clear the conflict when one duplicate is erased', async () => {
    const user = userEvent.setup();
    renderGamePage();

    await user.click(screen.getByRole('gridcell', { name: /Row 4, column 1,/i }));
    await user.click(screen.getByRole('button', { name: '5' }));
    await user.click(screen.getByRole('gridcell', { name: /Row 4, column 2,/i }));
    await user.click(screen.getByRole('button', { name: '5' }));
    // The second cell stays selected, so Erase empties it and breaks the duplicate.
    await user.click(screen.getByRole('button', { name: 'Erase' }));

    expect(screen.queryByRole('gridcell', { name: /in conflict/i })).not.toBeInTheDocument();
  });
});

// Regression for the mobile fit clipping the board's outer border: the grid
// draws its 3px frame border outside the cell canvas, so the fit scale must
// divide the viewport by the framed extent (canvas + 2×3px), not the bare
// canvas — fitting the canvas alone pushed the end-side borders past the clip.
describe('GamePage - oversized board fit', () => {
  const FRAME = { width: 370, height: 489 };

  beforeEach(() => {
    window.innerWidth = 390;
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: FRAME.width,
      bottom: FRAME.height,
      ...FRAME,
      toJSON: () => ({}),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fit the framed board extent, not the bare cell canvas', () => {
    renderGamePage('super');

    // Super at mobile size: 16 × 40px canvas + one 3px border per side.
    const framedWidth = 16 * 40 + 2 * 3;
    const transform = screen.getByTestId('board-viewport-content').style.transform;
    const scale = Number(/scale\((.+)\)/.exec(transform)?.[1]);

    expect(scale).toBeCloseTo(FRAME.width / framedWidth, 10);
  });
});

describe('GamePage - landscape mobile controls', () => {
  it('should render the two-group controls in landscape mobile', () => {
    installMatchMedia({ width: 852, orientation: 'landscape' });
    renderGamePage();

    const controlTablist = screen.getByRole('tablist', { name: 'Input mode and controls' });
    const navTablist = screen.getByRole('tablist', { name: 'Board navigation' });

    expect(within(controlTablist).getAllByRole('tab')).toHaveLength(3);
    expect(within(navTablist).getAllByRole('tab')).toHaveLength(2);
    expect(screen.queryByRole('tablist', { name: 'Game controls' })).toBeNull();
  });

  it('should keep the input panel visible while using the nav tabs in landscape mobile', async () => {
    const user = userEvent.setup();
    installMatchMedia({ width: 852, orientation: 'landscape' });
    renderGamePage();

    const mapTab = screen.getByRole('tab', { name: 'Map' });
    const inputPanel = screen.getByRole('tabpanel', { name: 'Normal' });

    await user.click(mapTab);

    expect(mapTab).toHaveAttribute('aria-selected', 'true');
    expect(inputPanel).toHaveAttribute('data-active', 'true');
  });

  it('should preserve candidate mode when rotating from landscape to portrait', async () => {
    const user = userEvent.setup();
    installMatchMedia({ width: 852, orientation: 'landscape' });
    const view = renderGamePage();

    await user.click(screen.getByRole('tab', { name: 'Candidate' }));

    installMatchMedia({ width: 500, orientation: 'portrait' });
    view.rerender(
      <MemoryRouter initialEntries={['/classic']}>
        <ThemeProvider>
          <Routes>
            <Route path="/:variantId" element={<GamePage />} />
          </Routes>
        </ThemeProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('tab', { name: 'Candidate' })).toHaveAttribute('aria-selected', 'true');
  });

  it('should preserve the active nav tab when rotating from landscape to portrait', async () => {
    const user = userEvent.setup();
    installMatchMedia({ width: 852, orientation: 'landscape' });
    const view = renderGamePage();

    await user.click(screen.getByRole('tab', { name: 'Move' }));

    installMatchMedia({ width: 500, orientation: 'portrait' });
    view.rerender(
      <MemoryRouter initialEntries={['/classic']}>
        <ThemeProvider>
          <Routes>
            <Route path="/:variantId" element={<GamePage />} />
          </Routes>
        </ThemeProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('tab', { name: 'Move' })).toHaveAttribute('aria-selected', 'true');
  });
});
