import { useCallback, useState } from 'react';

interface Settings {
  checkEnabled: boolean;
  timerEnabled: boolean;
}

interface PersistenceResult {
  settings: Settings;
  toggleCheck: () => void;
  toggleTimer: () => void;
}

const CHECK_STORAGE_KEY = 'sudoku-check-answers';
const TIMER_STORAGE_KEY = 'sudoku-timer';

export function usePersistence(_variantId: string): PersistenceResult {
  const [settings, setSettings] = useState<Settings>(() => ({
    checkEnabled: localStorage.getItem(CHECK_STORAGE_KEY) !== 'false',
    timerEnabled: localStorage.getItem(TIMER_STORAGE_KEY) !== 'false',
  }));

  const toggleCheck = useCallback(() => {
    setSettings((currentSettings) => {
      const next = !currentSettings.checkEnabled;
      localStorage.setItem(CHECK_STORAGE_KEY, String(next));

      return { ...currentSettings, checkEnabled: next };
    });
  }, []);

  const toggleTimer = useCallback(() => {
    setSettings((currentSettings) => {
      const next = !currentSettings.timerEnabled;
      localStorage.setItem(TIMER_STORAGE_KEY, String(next));

      return { ...currentSettings, timerEnabled: next };
    });
  }, []);

  return { settings, toggleCheck, toggleTimer };
}
