import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useCurriculumTree } from '@/learn/curriculum/useCurriculumTree';
import { LearnPage } from '@/learn/views/LearnPage/LearnPage';

vi.mock('@/learn/curriculum/useCurriculumTree', () => ({
  useCurriculumTree: vi.fn(),
}));

vi.mock('@/learn/hooks/useSeoMeta', () => ({
  useSeoMeta: vi.fn(),
}));

vi.mock('@/utils/seo.config', () => ({
  seoConfig: {
    siteTitle: 'Sudoku | freeCodeCamp.org',
    siteDescription: undefined,
  },
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe('LearnPage', () => {
  it('should show the full-page loading state before course data is ready', () => {
    vi.mocked(useCurriculumTree).mockReturnValue(null);

    render(<LearnPage />);

    expect(document.title).toBe('Sudoku | freeCodeCamp.org');
    expect(screen.getByRole('status', { name: 'Loading course' })).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Learn Vim for Terminal Text Editing' })
    ).toBeNull();
    expect(screen.queryByRole('contentinfo')).toBeNull();
  });
});
