import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ClientInteractiveLessonDefinition } from '@/learn/curriculum/types';
import { PlaceholderPanel } from '@/learn/features/PlaceholderPanel/PlaceholderPanel';

const LESSON: ClientInteractiveLessonDefinition = {
  id: 'test-lesson',
  module: 1,
  lesson: 1,
  type: 'learn',
  title: 'Test Lesson',
  files: {},
  config: {
    checklist: [
      { label: 'Item one', test: {} },
      { label: 'Item two', hint: 'A hint', test: {} },
    ],
  },
};

describe('PlaceholderPanel', () => {
  it('should render the placeholder text', () => {
    render(<PlaceholderPanel lesson={LESSON} onUpdate={vi.fn()} onReset={vi.fn()} />);

    expect(screen.getByText(/replace this component/i)).toBeInTheDocument();
  });

  it('should immediately mark all checklist items as complete', () => {
    const onUpdate = vi.fn();
    render(<PlaceholderPanel lesson={LESSON} onUpdate={onUpdate} onReset={vi.fn()} />);

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        complete: true,
        checklist: expect.arrayContaining([expect.objectContaining({ label: 'Item one', status: 'completed' }), expect.objectContaining({ label: 'Item two', status: 'completed' })]),
      })
    );
  });
});
