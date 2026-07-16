import { useCallback, useState } from 'react';

const STORAGE_KEY = 'sudoku-favorites';

function readFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];

    return new Set(
      Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
    );
  } catch {
    return new Set();
  }
}

export function useFavorites(): {
  favorites: Set<string>;
  toggleFavorite: (id: string) => void;
} {
  const [favorites, setFavorites] = useState<Set<string>>(readFavorites);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // storage quota exceeded — favorites stay in-memory for the session
      }

      return next;
    });
  }, []);

  return { favorites, toggleFavorite };
}
