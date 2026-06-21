import { StrictMode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ThemeProvider } from '@/app/ThemeProvider';
import { GamePage } from './GamePage';

// Uses the real generator (no vi.mock) under StrictMode. StrictMode double-invokes
// the puzzle-generation memo in dev; if generation is not deterministic, the two
// invocations produce different puzzles, the reducer keeps the first puzzle's
// givens while validation runs against the second puzzle's solution, and every
// untouched given is flagged incorrect on a board the user never touched.
function renderGamePage(variantId = 'classic') {
  return render(
    <StrictMode>
      <MemoryRouter initialEntries={[`/${variantId}`]}>
        <ThemeProvider>
          <Routes>
            <Route path="/:variantId" element={<GamePage />} />
          </Routes>
        </ThemeProvider>
      </MemoryRouter>
    </StrictMode>
  );
}

describe('GamePage - generation stability', () => {
  it('should not flag any cell incorrect on a freshly generated, untouched board', () => {
    renderGamePage();

    expect(screen.queryAllByRole('gridcell', { name: /incorrect/i })).toHaveLength(0);
  });
});
