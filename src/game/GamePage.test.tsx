import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '@/app/ThemeProvider';
import { gridCells } from '@/engine/grid';
import type { Values } from '@/engine/types';
import { GamePage } from './GamePage';

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
  window.innerWidth = 1024;
  window.localStorage.clear();
});

describe('GamePage - Classic integration', () => {
  it('should render the sudoku grid', () => {
    renderGamePage();

    expect(screen.getByRole('grid', { name: /sudoku grid/i })).toBeTruthy();
  });

  it('should render 81 cells', () => {
    renderGamePage();

    const board = screen.getByRole('grid', { name: /sudoku grid/i });
    expect(within(board).getAllByRole('gridcell')).toHaveLength(81);
  });

  it('should render the number pad', () => {
    renderGamePage();

    expect(screen.getByRole('button', { name: '5' })).toBeTruthy();
  });

  it('should show the Reveal Cell button in the desktop toolbar', () => {
    renderGamePage();

    expect(screen.getByRole('button', { name: /reveal/i })).toBeTruthy();
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

    expect(screen.getByRole('tab', { name: 'Controls' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /fit whole board/i })).toBeTruthy();

    await user.click(screen.getByRole('tab', { name: 'Map' }));

    expect(screen.getByRole('img', { name: /board overview/i })).toBeTruthy();
  });

  it('should render the Move and Map navigation tabs with the D-pad below tablet width', () => {
    window.innerWidth = 500;
    renderGamePage();

    expect(screen.getByRole('tab', { name: 'Move' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Map' })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Move selected cell' })).toBeTruthy();
  });

  it('should keep the zoom controls visible while switching between Move and Map below tablet width', async () => {
    const user = userEvent.setup();
    window.innerWidth = 500;
    renderGamePage();

    expect(screen.getByRole('button', { name: /fit whole board/i })).toBeTruthy();

    await user.click(screen.getByRole('tab', { name: 'Map' }));

    expect(screen.getByRole('img', { name: /board overview/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /fit whole board/i })).toBeTruthy();
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
    ).toBeTruthy();
  });

  it('should label the Lavender numpad button with the correct color name', () => {
    renderGamePage('color');

    expect(screen.getByRole('button', { name: 'Lavender' })).toBeTruthy();
  });

  it('should render a Show numbers switch for the color variant', () => {
    renderGamePage('color');

    expect(screen.getByRole('switch', { name: 'Show numbers' })).toBeTruthy();
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

  it('should render skyscraper gutters from derived structure', () => {
    renderGamePage('skyscraper');

    expect(screen.getAllByLabelText(/visible from the top of column /i)).toHaveLength(9);
    expect(screen.getAllByLabelText(/visible from the start of row /i)).toHaveLength(9);
  });

  it('should render the arrow rule legend for arrow sudoku', () => {
    renderGamePage('arrow');

    expect(
      screen.getByText('Digits along each arrow sum to the number in the circle.')
    ).toBeTruthy();
    expect(screen.getByLabelText('Arrow rule legend')).toBeTruthy();
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

    expect(screen.getByRole('dialog', { name: 'How to Play' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Basic Rules', level: 3 })).toBeTruthy();
    expect(screen.getByText('The grid:')).toBeTruthy();
    expect(
      screen.getByText(
        'A 9×9 board divided into nine 3×3 boxes. Fill every cell with a digit from 1 to 9.'
      )
    ).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Additional Rules', level: 3 })).toBeTruthy();
    expect(screen.getByText('Given digits:')).toBeTruthy();
  });

  it('should render samurai additional rules from the upstream dialog content', async () => {
    const user = userEvent.setup();

    renderGamePage('samurai');
    await user.click(screen.getByRole('button', { name: /how to play/i }));

    expect(screen.getByRole('heading', { name: 'Additional Rules', level: 3 })).toBeTruthy();
    expect(screen.getByText('Shared corners:')).toBeTruthy();
    expect(screen.getByText('Solve as one:')).toBeTruthy();
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

describe('GamePage - leave confirmation dialog', () => {
  it('should navigate immediately when Back is clicked with no progress', async () => {
    const user = userEvent.setup();
    renderGamePage();

    await user.click(screen.getByRole('button', { name: /back/i }));

    expect(screen.queryByRole('dialog', { name: /leave puzzle/i })).toBeNull();
  });

  it('should show the leave dialog when Back is clicked after entering a value', async () => {
    const user = userEvent.setup();
    renderGamePage();

    const [emptyCell] = screen.getAllByRole('gridcell', { name: /empty/ });
    await user.click(emptyCell);
    await user.click(screen.getByRole('button', { name: '5' }));
    await user.click(screen.getByRole('button', { name: /back/i }));

    expect(screen.getByRole('dialog', { name: /leave puzzle/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Leave' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Keep Playing' })).toBeTruthy();
  });

  it('should close the leave dialog when Keep Playing is clicked', async () => {
    const user = userEvent.setup();
    renderGamePage();

    const [emptyCell] = screen.getAllByRole('gridcell', { name: /empty/ });
    await user.click(emptyCell);
    await user.click(screen.getByRole('button', { name: '5' }));
    await user.click(screen.getByRole('button', { name: /back/i }));
    await user.click(screen.getByRole('button', { name: 'Keep Playing' }));

    expect(screen.queryByRole('dialog', { name: /leave puzzle/i })).toBeNull();
  });

  it('should close the leave dialog when Escape is pressed', async () => {
    const user = userEvent.setup();
    renderGamePage();

    const [emptyCell] = screen.getAllByRole('gridcell', { name: /empty/ });
    await user.click(emptyCell);
    await user.click(screen.getByRole('button', { name: '5' }));
    await user.click(screen.getByRole('button', { name: /back/i }));
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog', { name: /leave puzzle/i })).toBeNull();
  });

  it('should move focus into the dialog when it opens', async () => {
    const user = userEvent.setup();
    renderGamePage();

    const [emptyCell] = screen.getAllByRole('gridcell', { name: /empty/ });
    await user.click(emptyCell);
    await user.click(screen.getByRole('button', { name: '5' }));
    await user.click(screen.getByRole('button', { name: /back/i }));

    expect(screen.getByRole('dialog', { name: /leave puzzle/i })).toHaveFocus();
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
