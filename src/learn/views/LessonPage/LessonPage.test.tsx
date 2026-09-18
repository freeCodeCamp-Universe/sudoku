import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ProseLessonDefinition } from '@/learn/curriculum/types';
import { LessonPage } from '@/learn/views/LessonPage/LessonPage';

vi.mock('@/components/features/lesson-toolbar', () => ({
  LessonToolbar: () => null,
}));

vi.mock('@/components/features/outline/outline', () => ({
  Outline: () => null,
}));

vi.mock('./lesson-workspace', () => ({
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
  title: 'Getting started with Vim',
  type: 'learn',
  instructions: 'Learn the basics.',
};

describe('LessonPage', () => {
  it('should set the document title from the lesson title', () => {
    render(<LessonPage lesson={lesson} isLastLesson={false} instructionsHtml="" headings={[]} />);

    expect(document.title).toBe('Getting started with Vim | Sudoku | freeCodeCamp.org');
  });
});
