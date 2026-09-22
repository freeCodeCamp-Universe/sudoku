import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import type { ChecklistItem } from '@/learn/curriculum/lessonProgress';
import { Checklist } from '@/learn/Checklist/Checklist';

function items(...statuses: ChecklistItem['status'][]): ChecklistItem[] {
  return statuses.map((status, index) => ({ label: `step ${index + 1}`, showHint: false, status }));
}

describe('Checklist', () => {
  it('should render a semantic list with one item per requirement', () => {
    render(<Checklist items={items('not-done', 'not-done')} />);

    expect(screen.getByRole('separator')).toBeInTheDocument();
    const list = screen.getByRole('list', { name: /task checklist/i });
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
  });

  it('should convey each state by text, announced before the label', () => {
    render(<Checklist items={items('not-done', 'completed', 'error')} />);

    const [notDone, completed, error] = screen.getAllByRole('listitem');

    // Status text precedes the label in the accessible reading order.
    expect(notDone).toHaveTextContent('(not done) step 1');
    expect(completed).toHaveTextContent('(done) step 2');
    expect(error).toHaveTextContent('(not yet) step 3');

    // Icons are decorative, not exposed as images.
    expect(within(notDone).queryByRole('img')).not.toBeInTheDocument();
    expect(within(completed).queryByRole('img')).not.toBeInTheDocument();
    expect(within(error).queryByRole('img')).not.toBeInTheDocument();

    // Each state carries a distinct status marker (drives a distinct icon shape).
    expect(notDone).toHaveAttribute('data-status', 'not-done');
    expect(completed).toHaveAttribute('data-status', 'completed');
    expect(error).toHaveAttribute('data-status', 'error');
  });

  it('should announce a state change once via the live region', () => {
    const { rerender } = render(<Checklist items={items('not-done', 'not-done')} />);

    const region = screen.getByTestId('checklist-announcement');
    expect(region).toHaveTextContent('');

    rerender(<Checklist items={items('completed', 'not-done')} />);
    expect(region).toHaveTextContent(/step 1: done/i);
    expect(region).not.toHaveTextContent(/step 2/i);
  });

  it('should not re-announce when statuses are unchanged', () => {
    const stable = items('completed', 'not-done');
    const { rerender } = render(<Checklist items={stable} />);

    rerender(<Checklist items={[...stable]} />);
    expect(screen.getByTestId('checklist-announcement')).toHaveTextContent('');
  });

  it('should announce count changes without duplicating a status change', () => {
    const before: ChecklistItem[] = [
      { label: 'Trace the V (2 of 7)', showHint: false, status: 'not-done', count: 2 },
    ];
    const { rerender } = render(<Checklist items={before} />);

    rerender(<Checklist items={[{ ...before[0], label: 'Trace the V (3 of 7)', count: 3 }]} />);
    expect(screen.getByTestId('checklist-announcement')).toHaveTextContent('Trace the V (3 of 7)');

    rerender(
      <Checklist
        items={[{ ...before[0], label: 'Trace the V (7 of 7)', status: 'completed', count: 7 }]}
      />
    );
    expect(screen.getByTestId('checklist-announcement')).toHaveTextContent(
      'Trace the V (7 of 7): done'
    );
    expect(screen.getByTestId('checklist-announcement')).not.toHaveTextContent(
      'Trace the V (7 of 7): done. Trace the V (7 of 7)'
    );
  });

  it('should suppress the announcement when muteAnnouncement is true', () => {
    const { rerender } = render(<Checklist items={items('not-done', 'not-done')} />);

    const region = screen.getByTestId('checklist-announcement');

    // Transition to error with muteAnnouncement — the summary message covers it.
    rerender(<Checklist items={items('error', 'error')} muteAnnouncement />);
    expect(region).toHaveTextContent('');

    // After muting is lifted, announcements resume normally.
    rerender(<Checklist items={items('completed', 'error')} muteAnnouncement={false} />);
    expect(region).toHaveTextContent(/step 1: done/i);
  });

  it('should announce a lab error state', () => {
    const { rerender } = render(<Checklist items={items('not-done')} />);

    rerender(<Checklist items={items('error')} />);
    expect(screen.getByTestId('checklist-announcement')).toHaveTextContent(/step 1: not yet/i);
  });

  it('should announce a hint through the live region when it is revealed', () => {
    const hidden: ChecklistItem[] = [
      { label: 'step 1', hint: 'press i first', showHint: false, status: 'not-done' },
    ];
    const { rerender } = render(<Checklist items={hidden} />);

    const region = screen.getByTestId('checklist-announcement');
    expect(region).toHaveTextContent('');

    rerender(<Checklist items={[{ ...hidden[0], showHint: true }]} />);

    expect(region).toHaveTextContent(/hint for step 1: press i first/i);
  });

  it('should announce a completion and the next hint together', () => {
    const before: ChecklistItem[] = [
      { label: 'step 1', hint: 'press j', showHint: false, status: 'not-done' },
      { label: 'step 2', hint: 'press k', showHint: false, status: 'not-done' },
    ];
    const { rerender } = render(<Checklist items={before} />);

    rerender(
      <Checklist
        items={[
          { ...before[0], status: 'completed' },
          { ...before[1], showHint: true },
        ]}
      />
    );

    const region = screen.getByTestId('checklist-announcement');
    expect(region).toHaveTextContent(/step 1: done/i);
    expect(region).toHaveTextContent(/hint for step 2: press k/i);
  });

  it('should not re-announce a hint that is already showing', () => {
    const shown: ChecklistItem[] = [
      { label: 'step 1', hint: 'press i first', showHint: true, status: 'not-done' },
    ];
    const { rerender } = render(<Checklist items={shown} />);

    rerender(<Checklist items={[...shown]} />);

    expect(screen.getByTestId('checklist-announcement')).toHaveTextContent('');
  });

  it('should show an item hint only once it has been revealed', () => {
    const hidden: ChecklistItem[] = [
      { label: 'step 1', hint: 'press i first', showHint: false, status: 'not-done' },
    ];
    const { rerender } = render(<Checklist items={hidden} />);

    expect(screen.queryByText(/press i first/i)).not.toBeInTheDocument();

    rerender(<Checklist items={[{ ...hidden[0], showHint: true }]} />);
    expect(screen.getByRole('listitem')).toHaveTextContent(/press i first/i);
  });

  it('should render keyboard key tags in revealed hints', () => {
    render(
      <Checklist
        items={[
          {
            label: 'step 1',
            hint: 'Press <kbd>Enter</kbd> to confirm.',
            showHint: true,
            status: 'not-done',
          },
        ]}
      />
    );

    expect(screen.getByText('Enter').tagName).toBe('KBD');
  });

  it('should expose a polite live region', () => {
    render(<Checklist items={items('not-done')} />);

    const region = screen.getByTestId('checklist-announcement');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveAttribute('role', 'status');
  });
});
