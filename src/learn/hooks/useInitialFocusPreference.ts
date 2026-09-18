import { useEffect, useState } from 'react';

export const INITIAL_FOCUS_STORAGE_KEY = 'sudoku:learn:focusInstructionsOnLoad';
export const INITIAL_FOCUS_PREFERENCE_EVENT = 'sudoku:learn:initial-focus-preference-change';

function readInitialFocusPreference(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return window.localStorage.getItem(INITIAL_FOCUS_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export interface UseInitialFocusPreferenceResult {
  focusInstructionsOnLoad: boolean;
  setFocusInstructionsOnLoad: (enabled: boolean) => void;
}

export function useInitialFocusPreference(): UseInitialFocusPreferenceResult {
  const [focusInstructionsOnLoad, setFocusInstructionsOnLoad] = useState(
    readInitialFocusPreference
  );

  useEffect(() => {
    const updatePreference = () => {
      setFocusInstructionsOnLoad(readInitialFocusPreference());
    };

    window.addEventListener(INITIAL_FOCUS_PREFERENCE_EVENT, updatePreference);

    return () => {
      window.removeEventListener(INITIAL_FOCUS_PREFERENCE_EVENT, updatePreference);
    };
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(INITIAL_FOCUS_STORAGE_KEY, String(focusInstructionsOnLoad));
    } catch {
      // Persistence is best-effort when browser storage is unavailable.
    }

    window.dispatchEvent(new Event(INITIAL_FOCUS_PREFERENCE_EVENT));
  }, [focusInstructionsOnLoad]);

  return { focusInstructionsOnLoad, setFocusInstructionsOnLoad };
}
