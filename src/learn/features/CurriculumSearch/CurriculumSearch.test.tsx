import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CurriculumSearch } from '@/learn/features/CurriculumSearch/CurriculumSearch';

function renderSearch(query = '', onQueryChange = vi.fn()) {
  render(<CurriculumSearch query={query} onQueryChange={onQueryChange} />);
  return { onQueryChange };
}

describe('CurriculumSearch', () => {
  it('should render a search input with an accessible label', () => {
    renderSearch();

    expect(
      screen.getByRole('searchbox', { name: 'Search lessons by title or ID' })
    ).toBeInTheDocument();
  });

  it('should call onQueryChange when the user types', () => {
    const { onQueryChange } = renderSearch();
    const input = screen.getByRole('searchbox');

    fireEvent.change(input, { target: { value: 'hello' } });

    expect(onQueryChange).toHaveBeenCalledWith('hello');
  });

  it('should focus the input on Alt+K when the input does not have focus', () => {
    renderSearch();
    const input = screen.getByRole('searchbox');

    fireEvent.keyDown(window, { code: 'KeyK', altKey: true });

    expect(input).toHaveFocus();
  });

  it('should not steal focus on Alt+K when the input already has focus', () => {
    renderSearch();
    const input = screen.getByRole('searchbox');
    input.focus();

    const focusSpy = vi.spyOn(input, 'focus');
    fireEvent.keyDown(window, { code: 'KeyK', altKey: true });

    expect(focusSpy).not.toHaveBeenCalled();
  });

  it('should render the keyboard shortcut hint as kbd elements', () => {
    renderSearch();

    expect(screen.getByText(/^(⌥|Alt)$/, { selector: 'kbd' })).toBeInTheDocument();
    expect(screen.getByText('K', { selector: 'kbd' })).toBeInTheDocument();
  });

  it('should expose the keyboard shortcut via aria-keyshortcuts', () => {
    renderSearch();

    const input = screen.getByRole('searchbox');
    // Test env is non-Mac (jsdom), so getAltKeyName() returns 'Alt'.
    // On macOS it returns 'AltGraph', matching the KeyboardEvent.key value for Option.
    expect(input).toHaveAttribute('aria-keyshortcuts', 'Alt+K');
  });

  it('should not respond to Alt+K when a meta key is also held', () => {
    renderSearch();
    const input = screen.getByRole('searchbox');

    fireEvent.keyDown(window, { code: 'KeyK', altKey: true, metaKey: true });

    expect(input).not.toHaveFocus();
  });
});
