import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import type { ProseLessonDefinition, AuthoredLessonDefinition } from '@/curriculum/types';
import { LessonToolbar } from '@/learn/LessonToolbar/LessonToolbar';

const prose: ProseLessonDefinition = {
  id: 'r-1',
  module: 1,
  lesson: 1,
  title: 'About modes',
  type: 'review',
  instructions: '## Modes\n\nEditors can have modes.',
};

const interactive: AuthoredLessonDefinition = {
  id: 'w-1',
  module: 1,
  lesson: 1,
  title: 'Delete a character',
  type: 'learn',
  instructions: 'Press `x` to delete.',
  files: { 'a.txt': 'hello' },
  config: {
    start: 'file',
    open: 'a.txt',
    cursor: [1, 1],
    allowedCommands: ['x'],
    checklist: [{ label: 'Delete with x', test: { command: 'x' } }],
  },
};

function renderToolbar(
  lesson: ProseLessonDefinition | AuthoredLessonDefinition,
  overrides: Partial<Parameters<typeof LessonToolbar>[0]> = {}
) {
  const ref = createRef<HTMLButtonElement | null>();
  const props = {
    lesson,
    tab: 'instructions' as const,
    onSelectTab: vi.fn(),
    outlineOpen: false,
    onOutlineToggle: vi.fn(),
    outlineButtonRef: ref,
    ...overrides,
  };
  return { ...render(<LessonToolbar {...props} />), props };
}

describe('LessonToolbar', () => {
  it('should render the Outline button for prose lessons', () => {
    renderToolbar(prose);

    expect(screen.getByRole('button', { name: 'Outline' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Instructions' })).not.toBeInTheDocument();
  });

  it('should set aria-expanded on the Outline button based on outlineOpen', () => {
    const { rerender, props } = renderToolbar(prose, { outlineOpen: false });
    expect(screen.getByRole('button', { name: 'Outline' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );

    rerender(<LessonToolbar {...props} outlineOpen={true} />);
    expect(screen.getByRole('button', { name: 'Outline' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  it('should call onOutlineToggle when the Outline button is clicked', async () => {
    const user = userEvent.setup();
    const { props } = renderToolbar(prose);

    await user.click(screen.getByRole('button', { name: 'Outline' }));
    expect(props.onOutlineToggle).toHaveBeenCalledOnce();
  });

  it('should render the Instructions and Terminal buttons for interactive lessons', () => {
    renderToolbar(interactive);

    expect(screen.queryByRole('button', { name: 'Outline' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Instructions' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Terminal' })).toBeInTheDocument();
  });

  it('should mark the active tab with aria-pressed', () => {
    renderToolbar(interactive, { tab: 'instructions' });
    expect(screen.getByRole('button', { name: 'Instructions' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Terminal' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('should call onSelectTab when a tab button is clicked', async () => {
    const user = userEvent.setup();
    const { props } = renderToolbar(interactive, { tab: 'instructions' });

    await user.click(screen.getByRole('button', { name: 'Terminal' }));
    expect(props.onSelectTab).toHaveBeenCalledWith('terminal');
  });
});
