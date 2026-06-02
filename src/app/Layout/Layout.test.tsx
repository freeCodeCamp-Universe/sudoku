import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { variantRegistry } from '@/variants/registry';
import { Layout } from './Layout';

function renderLayout() {
  render(
    <MemoryRouter initialEntries={['/']}>
      <Layout>
        <Link to="/classic">Open game</Link>
        <Routes>
          <Route path="/" element={<p>home</p>} />
          <Route path="/classic" element={<p>game</p>} />
        </Routes>
      </Layout>
    </MemoryRouter>
  );
}

const SKIP_LINK = { name: /skip to main content/i };

describe('Layout', () => {
  it('should make the skip link the first tab stop', async () => {
    const user = userEvent.setup();
    renderLayout();

    await user.tab();

    expect(screen.getByRole('link', SKIP_LINK)).toHaveFocus();
  });

  it('should not steal focus on the initial render', () => {
    renderLayout();

    expect(document.body).toHaveFocus();
  });

  it('should reset focus to the top on route change so the skip link is the next tab stop', async () => {
    const user = userEvent.setup();
    renderLayout();
    const openGame = screen.getByRole('link', { name: 'Open game' });

    await user.click(openGame);

    expect(screen.getByText('game')).toBeInTheDocument();
    // Focus moved off the activated link back to the top of the page,
    // so the next Tab lands on the skip link rather than resuming mid-page.
    expect(openGame).not.toHaveFocus();
    await user.tab();
    expect(screen.getByRole('link', SKIP_LINK)).toHaveFocus();
  });

  it('should announce the new page name to screen readers on route change', async () => {
    const user = userEvent.setup();
    renderLayout();

    expect(screen.getByRole('status')).not.toHaveTextContent(variantRegistry.classic.name);

    await user.click(screen.getByRole('link', { name: 'Open game' }));

    expect(screen.getByRole('status')).toHaveTextContent(variantRegistry.classic.name);
  });
});
