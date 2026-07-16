import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useFavorites } from './useFavorites';

afterEach(() => {
  window.localStorage.clear();
});

describe('useFavorites', () => {
  it('should start empty when nothing is stored', () => {
    const { result } = renderHook(() => useFavorites());

    expect(result.current.favorites.size).toBe(0);
  });

  it('should add a favorite on toggle and persist it', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => result.current.toggleFavorite('classic'));

    expect(result.current.favorites.has('classic')).toBe(true);
    expect(JSON.parse(localStorage.getItem('sudoku-favorites')!)).toEqual(['classic']);
  });

  it('should remove a favorite on second toggle', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => result.current.toggleFavorite('classic'));
    act(() => result.current.toggleFavorite('classic'));

    expect(result.current.favorites.has('classic')).toBe(false);
    expect(JSON.parse(localStorage.getItem('sudoku-favorites')!)).toEqual([]);
  });

  it('should read existing favorites on init', () => {
    localStorage.setItem('sudoku-favorites', JSON.stringify(['killer', 'jigsaw']));

    const { result } = renderHook(() => useFavorites());

    expect(result.current.favorites.has('killer')).toBe(true);
    expect(result.current.favorites.has('jigsaw')).toBe(true);
  });

  it('should fall back to empty on malformed stored JSON', () => {
    localStorage.setItem('sudoku-favorites', 'not json {');

    const { result } = renderHook(() => useFavorites());

    expect(result.current.favorites.size).toBe(0);
  });

  it('should ignore non-string entries in stored data', () => {
    localStorage.setItem('sudoku-favorites', JSON.stringify(['classic', 42, null]));

    const { result } = renderHook(() => useFavorites());

    expect([...result.current.favorites]).toEqual(['classic']);
  });
});
