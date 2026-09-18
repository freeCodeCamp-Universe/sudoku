import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { Router } from 'react-router-dom';
import { memoryLocation } from 'react-router-dom';
import { CurriculumNavigator } from '@/learn/features/CurriculumNavigator/CurriculumNavigator';
import type { CurriculumTreeModule } from '@/learn/features/CurriculumTree/CurriculumTree';

const modules: CurriculumTreeModule[] = [
  {
    number: 1,
    slug: 'modes',
    title: 'Modes',
    lessons: [
      { id: 'insert-mode', title: 'Enter insert mode' },
      { id: 'save-quit', title: 'Save and quit' },
    ],
  },
  {
    number: 2,
    slug: 'navigation',
    title: 'Navigation',
    lessons: [{ id: 'word-motions', title: 'Word motions' }],
  },
];

function renderWithRouter(ui: ReactElement) {
  const { hook } = memoryLocation({ path: '/', record: true });
  return render(<Router hook={hook}>{ui}</Router>);
}

describe('CurriculumNavigator', () => {
  it.each(['home', 'drawer'] as const)('should search the %s curriculum tree', async (variant) => {
    const user = userEvent.setup();
    renderWithRouter(<CurriculumNavigator modules={modules} variant={variant} />);

    await user.type(screen.getByRole('searchbox'), 'word');

    expect(screen.getByRole('link', { name: /Not completed Word motions/ })).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent('Showing 1 matching lesson for "word".');
    expect(screen.queryByRole('link', { name: 'Save and quit' })).toBeNull();
    expect(screen.queryByRole('heading', { name: '1. Modes' })).toBeNull();
  });

  it('should show an empty result message when no lesson matches', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CurriculumNavigator modules={modules} variant="home" />);

    await user.type(screen.getByRole('searchbox'), 'unknown');

    expect(screen.getByRole('status')).toHaveTextContent('No lessons found for "unknown".');
    expect(screen.getAllByText(/No lessons found/)).toHaveLength(1);
  });
});
