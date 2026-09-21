import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LessonRoute } from '@/learn/views/LessonRoute/LessonRoute';

const mockUseLessonData = vi.fn();

vi.mock('@/learn/hooks/useLessonData', () => ({
  useLessonData: (...args: unknown[]) => mockUseLessonData(...args),
}));

vi.mock('react-router-dom', () => ({
  useParams: () => ({ lessonId: 'missing-lesson' }),
}));

describe('LessonRoute', () => {
  it('should show not found when lesson loading fails', () => {
    mockUseLessonData.mockReturnValue({ data: null, loading: false, error: true });

    render(<LessonRoute />);

    expect(screen.getByText('Lesson not found.')).toBeInTheDocument();
  });
});
