import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { ProseLessonDefinition } from '@/curriculum/types';
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

vi.mock('@/learn/hooks/useSeoMeta', () => ({
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
  it('should set the document title from the lesson title', () => {
    render(
      <MemoryRouter>
        <LessonPage lesson={lesson} isLastLesson={false} instructionsHtml="" headings={[]} />
      </MemoryRouter>
    );

    expect(document.title).toBe('Getting started with Sudoku | Sudoku | freeCodeCamp.org');
  });
});
