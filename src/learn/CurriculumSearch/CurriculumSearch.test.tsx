import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CurriculumSearch } from '@/learn/CurriculumSearch/CurriculumSearch';

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

  it('should focus the input on Ctrl+K when the input does not have focus', () => {
    renderSearch();
    const input = screen.getByRole('searchbox');

    fireEvent.keyDown(window, { code: 'KeyK', ctrlKey: true });

    expect(input).toHaveFocus();
  });

  it('should focus the input on Cmd+K when the input does not have focus', () => {
    renderSearch();
    const input = screen.getByRole('searchbox');

    fireEvent.keyDown(window, { code: 'KeyK', metaKey: true });

    expect(input).toHaveFocus();
  });

  it('should not steal focus on Ctrl+K when the input already has focus', () => {
    renderSearch();
    const input = screen.getByRole('searchbox');
    input.focus();

    const focusSpy = vi.spyOn(input, 'focus');
    fireEvent.keyDown(window, { code: 'KeyK', ctrlKey: true });

    expect(focusSpy).not.toHaveBeenCalled();
  });

  it('should render the keyboard shortcut hint as kbd elements', () => {
    renderSearch();

    expect(screen.getByText(/^(⌘|Ctrl)$/, { selector: 'kbd' })).toBeInTheDocument();
    expect(screen.getByText('K', { selector: 'kbd' })).toBeInTheDocument();
    expect(screen.queryByText('+', { selector: 'span' })).not.toBeInTheDocument();
  });

  it('should expose the keyboard shortcut via aria-keyshortcuts', () => {
    renderSearch();

    const input = screen.getByRole('searchbox');
    expect(input).toHaveAttribute('aria-keyshortcuts', 'Meta+K Control+K');
  });

  it('should not respond when Alt is also held', () => {
    renderSearch();
    const input = screen.getByRole('searchbox');

    fireEvent.keyDown(window, { code: 'KeyK', altKey: true, metaKey: true });

    expect(input).not.toHaveFocus();
  });
});
