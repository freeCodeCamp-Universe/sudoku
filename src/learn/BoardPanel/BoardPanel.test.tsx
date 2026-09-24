import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ChecklistRequirement, ClientInteractiveLessonDefinition } from '@/curriculum/types';
import { ThemeProvider } from '@/app/ThemeProvider/ThemeProvider';
import { BoardPanel } from '@/learn/BoardPanel/BoardPanel';

function makeLesson(
  checklist: ChecklistRequirement[],
  cellSelection: 'single' | 'multiple' = 'single'
): ClientInteractiveLessonDefinition {
  const solution = Object.fromEntries(
    Array.from({ length: 9 }, (_, row) =>
      Array.from({ length: 9 }, (_, col) => [
        `r${row}c${col}`,
        ((row * 3 + Math.floor(row / 3) + col) % 9) + 1,
      ])
    ).flat()
  );

  return {
    id: 'board-practice',
    module: 1,
    lesson: 1,
    title: 'Board practice',
    type: 'practice',
    files: {},
    config: {
      checklist,
      board: {
        variant: 'classic',
        givens: { r0c0: 1 },
        solution,
        cellSelection,
        highlights: { peers: false, sameValue: false },
      },
    },
  };
}

function renderPanel(lesson: ClientInteractiveLessonDefinition, onUpdate = vi.fn()) {
  const view = render(
    <ThemeProvider>
      <BoardPanel lesson={lesson} onUpdate={onUpdate} onReset={vi.fn()} />
    </ThemeProvider>
  );
  return { ...view, onUpdate };
}

describe('BoardPanel', () => {
  it('should tick and untick a selected-cell item as the selection changes', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    const lesson = makeLesson(
      [{ label: 'Select two cells', test: { selected: ['r0c1', 'r0c2'] } }],
      'multiple'
    );
    renderPanel(lesson, onUpdate);

    await user.click(screen.getByRole('gridcell', { name: /row 1, column 2/i }));
    await user.click(screen.getByRole('gridcell', { name: /row 1, column 3/i }));
    await waitFor(() =>
      expect(onUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ complete: true }))
    );

    await user.click(screen.getByRole('gridcell', { name: /row 1, column 2/i }));
    await waitFor(() =>
      expect(onUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ complete: false }))
    );
  });

  it('should tick a values item when the learner enters the digit', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    renderPanel(makeLesson([{ label: 'Enter 2', test: { values: { r0c1: 2 } } }]), onUpdate);

    await user.click(screen.getByRole('gridcell', { name: /row 1, column 2/i }));
    await user.click(screen.getByRole('button', { name: '2' }));

    await waitFor(() =>
      expect(onUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ complete: true }))
    );
  });

  it('should tick candidates only when the cell has exactly the listed candidates', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    renderPanel(
      makeLesson([{ label: 'Add candidates 1 and 4', test: { candidates: { r0c1: [1, 4] } } }]),
      onUpdate
    );

    await user.click(screen.getByRole('tab', { name: 'Candidate' }));
    await user.click(screen.getByRole('gridcell', { name: /row 1, column 2/i }));
    await user.click(screen.getByRole('button', { name: '1' }));
    await user.click(screen.getByRole('button', { name: '4' }));
    await waitFor(() =>
      expect(onUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ complete: true }))
    );

    await user.click(screen.getByRole('button', { name: '3' }));
    await waitFor(() =>
      expect(onUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ complete: false }))
    );
  });

  it('should restore the starting board when the panel is reset', async () => {
    const user = userEvent.setup();
    const lesson = makeLesson([{ label: 'Enter 4', test: { values: { r0c1: 4 } } }]);
    const { rerender } = renderPanel(lesson);
    const targetCell = () => screen.getByRole('gridcell', { name: /row 1, column 2/i });

    await user.click(targetCell());
    await user.click(screen.getByRole('button', { name: '4' }));
    expect(targetCell()).toHaveTextContent('4');

    rerender(
      <ThemeProvider>
        <BoardPanel key="reset" lesson={lesson} onUpdate={vi.fn()} onReset={vi.fn()} />
      </ThemeProvider>
    );

    expect(targetCell()).not.toHaveTextContent('4');
    expect(screen.getByRole('gridcell', { name: /row 1, column 1.*1/i })).toHaveTextContent('1');
  });
});
