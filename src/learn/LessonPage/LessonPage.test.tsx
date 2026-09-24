import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { ProseLessonDefinition } from '@/curriculum/types';
import { useSeoMeta } from '@/hooks/useSeoMeta';
import { LessonPage } from '@/learn/LessonPage/LessonPage';

vi.mock('@/learn/LessonToolbar/LessonToolbar', () => ({
  LessonToolbar: () => null,
}));

vi.mock('@/learn/Outline/Outline', () => ({
  Outline: () => null,
}));

vi.mock('@/learn/LessonWorkspace/LessonWorkspace', () => ({
  LessonWorkspace: () => null,
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

const lesson: ProseLessonDefinition = {
  id: 'intro',
  module: 1,
  lesson: 1,
  title: 'Getting started with Sudoku',
  type: 'learn',
  instructions: 'Learn the basics.',
};

describe('LessonPage', () => {
  it('should set SEO metadata from the lesson title', () => {
    render(
      <MemoryRouter>
        <LessonPage lesson={lesson} isLastLesson={false} instructionsHtml="" headings={[]} />
      </MemoryRouter>
    );

    expect(useSeoMeta).toHaveBeenCalledWith({
      title: 'Getting started with Sudoku | Sudoku | freeCodeCamp.org',
      description: undefined,
      path: '/learn/intro',
    });
  });
});
