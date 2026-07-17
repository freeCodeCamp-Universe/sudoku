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
    await user.click(screen.getByRole('button', { name: '5' }));

    expect(screen.getByText(/looks like you're done/i)).toBeInTheDocument();
  });
});

describe('GamePage - solved puzzle', () => {
  it('should not reveal cells while viewing the solved puzzle', async () => {
    const user = userEvent.setup();
    // Seed a solved board (checking stays on by default), so the win dialog
    // opens on mount and View Puzzle shows the finished board.
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
    renderGamePage();

    await user.click(screen.getByRole('button', { name: 'View Puzzle' }));
    await user.click(screen.getByRole('gridcell', { name: /Row 9, column 9,/i }));
    await user.click(screen.getByRole('button', { name: /reveal/i }));

    expect(screen.queryByRole('gridcell', { name: /revealed/i })).toBeNull();
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
