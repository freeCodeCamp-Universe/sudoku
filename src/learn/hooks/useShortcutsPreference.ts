import { useEffect, useState } from 'react';

export const SHORTCUTS_STORAGE_KEY = 'sudoku:learn:shortcutsEnabled';
export const SHORTCUTS_PREFERENCE_EVENT = 'sudoku:learn:shortcuts-preference-change';

function readShortcutsPreference(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }

  try {
    return window.localStorage.getItem(SHORTCUTS_STORAGE_KEY) !== 'false';
  } catch {
    return true;
  }
}

export interface UseShortcutsPreferenceResult {
  shortcutsEnabled: boolean;
  setShortcutsEnabled: (enabled: boolean) => void;
}

export function useShortcutsPreference(): UseShortcutsPreferenceResult {
  const [shortcutsEnabled, setShortcutsEnabled] = useState(readShortcutsPreference);

  useEffect(() => {
    const updatePreference = () => {
      setShortcutsEnabled(readShortcutsPreference());
    };

    window.addEventListener(SHORTCUTS_PREFERENCE_EVENT, updatePreference);

    return () => {
      window.removeEventListener(SHORTCUTS_PREFERENCE_EVENT, updatePreference);
    };
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(SHORTCUTS_STORAGE_KEY, String(shortcutsEnabled));
    } catch {
      // Persistence is best-effort when browser storage is unavailable.
    }

    window.dispatchEvent(new Event(SHORTCUTS_PREFERENCE_EVENT));
  }, [shortcutsEnabled]);

  return { shortcutsEnabled, setShortcutsEnabled };
}
