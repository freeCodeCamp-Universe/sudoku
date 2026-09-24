import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useCurriculumTree } from '@/curriculum/useCurriculumTree';
import { useSeoMeta } from '@/hooks/useSeoMeta';
import { LearnPage } from '@/learn/LearnPage/LearnPage';

vi.mock('@/curriculum/useCurriculumTree', () => ({
  useCurriculumTree: vi.fn(),
}));

vi.mock('@/hooks/useSeoMeta', () => ({
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

    expect(useSeoMeta).toHaveBeenCalledWith({
      title: 'Sudoku | freeCodeCamp.org',
      description: undefined,
      path: '/learn',
    });
    expect(screen.getByRole('status', { name: 'Loading course' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Learn Sudoku' })).toBeNull();
    expect(screen.queryByRole('contentinfo')).toBeNull();
  });
});
