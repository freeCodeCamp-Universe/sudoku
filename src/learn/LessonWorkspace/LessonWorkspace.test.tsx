import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { ComponentType } from 'react';
import type {
  AuthoredLessonDefinition,
  ClientInteractiveLessonDefinition,
  ProseLessonDefinition,
} from '@/curriculum/types';
import { ThemeProvider } from '@/app/ThemeProvider/ThemeProvider';
import { BoardPanel } from '@/learn/BoardPanel/BoardPanel';
import { renderMarkdown } from '@/learn/Markdown/renderMarkdown';
import { INITIAL_FOCUS_STORAGE_KEY } from '@/learn/hooks/useInitialFocusPreference';
import { progressStore } from '@/learn/stores/progressStore';
import { PlaceholderPanel } from '@/learn/PlaceholderPanel/PlaceholderPanel';
import {
  LessonWorkspace,
  type InteractivePanelProps,
} from '@/learn/LessonWorkspace/LessonWorkspace';
import styles from '@/learn/LessonWorkspace/LessonWorkspace.module.css';

vi.mock('@/curriculum/useCurriculumTree', () => ({
  useCurriculumTree: () => ({
    modules: [],
    orderedLessonIds: ['w-1', 'r-1', 'trailing-id'],
  }),
}));

const workshop: AuthoredLessonDefinition = {
  id: 'w-1',
  module: 1,
  lesson: 1,
  title: 'Delete a character',
  type: 'learn',
  instructions: 'Press `x` to delete the character under the cursor.',
  files: { 'a.txt': 'hello' },
  config: {
    start: 'file',
    open: 'a.txt',
    cursor: [1, 1],
    allowedCommands: ['x'],
    checklist: [{ label: 'Delete a character with x', test: { command: 'x' } }],
  },
};

const prose: ProseLessonDefinition = {
  id: 'r-1',
  module: 1,
  lesson: 1,
  title: 'About modes',
  type: 'review',
  instructions: '## Modes\n\nEditors can have modes.',
};

const boardLesson: ClientInteractiveLessonDefinition & { instructions: string } = {
  id: 'b-1',
  module: 1,
  lesson: 2,
  title: 'Select a cell',
  type: 'learn',
  instructions: 'Select the top-left cell.',
  files: {},
  config: {
    checklist: [{ label: 'Select r1c1', test: { selected: ['r0c0'] } }],
    board: {
      variant: 'mini',
      givens: {},
      solution: Object.fromEntries(
        Array.from({ length: 4 }, (_, row) =>
          Array.from({ length: 4 }, (_, col) => [
            `r${row}c${col}`,
            ((row * 2 + Math.floor(row / 2) + col) % 4) + 1,
          ])
        ).flat()
      ),
      cellSelection: 'single',
      highlights: {},
    },
  },
};

const HINT = 'You can select the top-left cell.';

const workspace = () => screen.getByRole('application', { name: 'interactive lesson workspace' });

/** Reports an unfinished lesson and shows the hint on demand. */
function HintPanel({ onUpdate, onHint }: InteractivePanelProps) {
  return (
    <div>
      <button type="button" onClick={() => onUpdate({ complete: false })}>
        Report unfinished
      </button>
      <button type="button" onClick={() => onHint(HINT)}>
        Miss the requirement
      </button>
      <button type="button" onClick={() => onHint(null)}>
        Meet the requirement
      </button>
    </div>
  );
}

function renderWorkspace(
  lesson: AuthoredLessonDefinition | ProseLessonDefinition | typeof boardLesson,
  tab: 'instructions' | 'terminal' = 'instructions',
  InteractivePanel: ComponentType<InteractivePanelProps> = PlaceholderPanel
) {
  const view = render(
    <ThemeProvider>
      <MemoryRouter>
        <LessonWorkspace
          lesson={lesson}
          nextLessonId="next-id"
          isLastLesson={false}
          instructionsHtml={renderMarkdown(lesson.instructions)}
          tab={tab}
          onSelectTab={vi.fn()}
          InteractivePanel={InteractivePanel}
        />
      </MemoryRouter>
    </ThemeProvider>
  );
  return view;
}

describe('LessonWorkspace', () => {
  afterEach(() => {
    localStorage.clear();
    progressStore.reset();
  });

  it('should focus the terminal on load for interactive lessons', () => {
    vi.useFakeTimers();

    // The terminal view's focus() method checks offsetParent to avoid focusing
    // a collapsed tab panel. jsdom returns null for offsetParent (no layout),
    // so mock it to simulate the desktop side-by-side layout.
    const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetParent');
    Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
      get() {
        return document.body;
      },
      configurable: true,
    });

    try {
      renderWorkspace(workshop);

      // Focus is deferred to the next macrotask so the browser can finish layout
      // after dynamically mounting the terminal DOM (not needed under Astro where
      // React hydrated pre-existing server-rendered elements).
      vi.runAllTimers();

      expect(
        screen.getByRole('application', { name: 'interactive lesson workspace' })
      ).toHaveFocus();
      expect(screen.queryByText('completed')).not.toBeInTheDocument();
    } finally {
      if (original) {
        Object.defineProperty(HTMLElement.prototype, 'offsetParent', original);
      }
      vi.useRealTimers();
    }
  });

  it('should show a completed icon and status before a completed lesson title', () => {
    localStorage.setItem(
      'sudoku:learn:progress',
      JSON.stringify({ completed: [{ id: 'w-1', completedAt: 1000 }] })
    );
    progressStore.reset();
    renderWorkspace(workshop);

    const heading = screen.getByRole('heading', { level: 1, name: /Delete a character/ });
    expect(within(heading).getByText('completed')).toBeInTheDocument();
    // eslint-disable-next-line testing-library/no-node-access -- aria-hidden SVG has no accessible role to query
    expect(heading.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('should render the terminal and controls without the checklist', () => {
    renderWorkspace(workshop);

    expect(
      screen.getByRole('application', { name: 'interactive lesson workspace' })
    ).toBeInTheDocument();
    expect(screen.queryByText('Delete a character with x')).not.toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'task checklist' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next (Ctrl + Enter)' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
  });

  it('should advance when the placeholder panel marks the lesson complete', async () => {
    const user = userEvent.setup();
    renderWorkspace(workshop);

    await user.keyboard('{Control>}{Enter}{/Control}');

    expect(screen.getByRole('button', { name: /Next/ })).toBeInTheDocument();
  });

  it('should announce the tab change when the tab prop changes', async () => {
    const { rerender } = renderWorkspace(workshop, 'instructions');

    // No announcement on initial render.
    expect(screen.queryByText('terminal', { exact: true })).not.toBeInTheDocument();

    rerender(
      <ThemeProvider>
        <MemoryRouter>
          <LessonWorkspace
            lesson={workshop}
            nextLessonId="next-id"
            isLastLesson={false}
            instructionsHtml={renderMarkdown(workshop.instructions)}
            tab="terminal"
            onSelectTab={vi.fn()}
            InteractivePanel={PlaceholderPanel}
          />
        </MemoryRouter>
      </ThemeProvider>
    );

    expect(screen.getByText('terminal', { exact: true })).toBeInTheDocument();
  });

  it('should render a reading lesson as prose only, with no terminal, checklist, or reset', () => {
    renderWorkspace(prose);

    expect(screen.getByRole('heading', { level: 1, name: 'About modes' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Modes' })).toBeInTheDocument();
    const reviewNavigation = screen.getByRole('group', { name: 'Review navigation' });
    expect(reviewNavigation).toHaveClass(styles['review-next']);
    expect(within(reviewNavigation).getByRole('button', { name: 'Next' })).toBeEnabled();

    expect(screen.queryByRole('application')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reset' })).not.toBeInTheDocument();
  });

  it('should include the instructions panel in the tab order', () => {
    renderWorkspace(workshop);

    const instructions = screen.getByRole('region', { name: /Delete a character/i });
    expect(instructions).toHaveAttribute('tabindex', '0');
  });

  it('should focus the instructions panel on load when the preference is enabled', () => {
    vi.useFakeTimers();
    localStorage.setItem(INITIAL_FOCUS_STORAGE_KEY, 'true');

    try {
      renderWorkspace(workshop);
      vi.runAllTimers();

      const instructions = screen.getByRole('region', { name: /Delete a character/i });
      expect(instructions).toHaveFocus();
    } finally {
      vi.useRealTimers();
    }
  });

  it('should focus the board rather than the workspace on load', () => {
    vi.useFakeTimers();

    try {
      renderWorkspace(boardLesson, 'terminal', BoardPanel);
      vi.runAllTimers();

      expect(screen.getByRole('gridcell', { name: /row 1, column 1/i })).toHaveFocus();
    } finally {
      vi.useRealTimers();
    }
  });

  it('should show a hint toast inside the workspace, above the toolbar', async () => {
    const user = userEvent.setup();
    renderWorkspace(boardLesson, 'terminal', HintPanel);

    await user.click(screen.getByRole('button', { name: 'Miss the requirement' }));

    const toast = within(workspace()).getByText(HINT);
    const reset = within(workspace()).getByRole('button', { name: 'Reset' });
    expect(toast.compareDocumentPosition(reset) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getAllByRole('status').some((region) => region.textContent === HINT)).toBe(true);
  });

  it('should clear the hint toast when the panel reports the requirement met', async () => {
    const user = userEvent.setup();
    renderWorkspace(boardLesson, 'terminal', HintPanel);

    await user.click(screen.getByRole('button', { name: 'Miss the requirement' }));
    expect(within(workspace()).getByText(HINT)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Meet the requirement' }));
    expect(within(workspace()).queryByText(HINT)).not.toBeInTheDocument();
  });

  it('should clear the hint toast on reset', async () => {
    const user = userEvent.setup();
    renderWorkspace(boardLesson, 'terminal', HintPanel);

    await user.click(screen.getByRole('button', { name: 'Miss the requirement' }));
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    await user.click(screen.getByRole('button', { name: 'Yes, reset' }));

    expect(within(workspace()).queryByText(HINT)).not.toBeInTheDocument();
  });

  it('should ignore the advance shortcut while the lesson is unfinished', async () => {
    const user = userEvent.setup();
    renderWorkspace(boardLesson, 'terminal', HintPanel);

    await user.click(screen.getByRole('button', { name: 'Report unfinished' }));
    await user.keyboard('{Control>}{Enter}{/Control}');

    expect(screen.queryByRole('button', { name: /Next/ })).not.toBeInTheDocument();
    expect(screen.queryByText(HINT)).not.toBeInTheDocument();
  });
});
