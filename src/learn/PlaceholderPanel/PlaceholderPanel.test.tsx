import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ClientInteractiveLessonDefinition } from '@/curriculum/types';
import { PlaceholderPanel } from '@/learn/PlaceholderPanel/PlaceholderPanel';

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
    render(
      <PlaceholderPanel lesson={LESSON} onUpdate={vi.fn()} onReset={vi.fn()} onHint={vi.fn()} />
    );

    expect(screen.getByText(/replace this component/i)).toBeInTheDocument();
  });

  it('should immediately report the lesson complete', () => {
    const onUpdate = vi.fn();
    render(
      <PlaceholderPanel lesson={LESSON} onUpdate={onUpdate} onReset={vi.fn()} onHint={vi.fn()} />
    );

    expect(onUpdate).toHaveBeenCalledWith({ complete: true });
  });
});
