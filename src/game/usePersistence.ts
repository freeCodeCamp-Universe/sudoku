import { useCallback, useState } from 'react';

interface Settings {
  checkEnabled: boolean;
  timerEnabled: boolean;
  colorblindEnabled: boolean;
  highlightPeers: boolean;
}

interface PersistenceResult {
  settings: Settings;
  toggleCheck: () => void;
  toggleTimer: () => void;
  toggleColorblind: () => void;
  toggleHighlightPeers: () => void;
  onboardingShown: boolean;
  acknowledgeOnboarding: () => void;
}

const CHECK_STORAGE_KEY = 'sudoku-check-answers';
const TIMER_STORAGE_KEY = 'sudoku-timer';
const COLORBLIND_STORAGE_KEY = 'sudoku-colorblind';
const HIGHLIGHT_PEERS_STORAGE_KEY = 'sudoku-highlight-peers';
const ONBOARDING_STORAGE_KEY = 'sudoku-onboarding-shown';

export function usePersistence(_variantId: string): PersistenceResult {
  const [settings, setSettings] = useState<Settings>(() => ({
    checkEnabled: localStorage.getItem(CHECK_STORAGE_KEY) !== 'false',
    timerEnabled: localStorage.getItem(TIMER_STORAGE_KEY) !== 'false',
    colorblindEnabled: localStorage.getItem(COLORBLIND_STORAGE_KEY) === 'true',
    highlightPeers: localStorage.getItem(HIGHLIGHT_PEERS_STORAGE_KEY) !== 'false',
  }));

  const [onboardingShown, setOnboardingShown] = useState(
    () => localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true'
  );

  const acknowledgeOnboarding = useCallback(() => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setOnboardingShown(true);
  }, []);

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

  const toggleColorblind = useCallback(() => {
    setSettings((currentSettings) => {
      const next = !currentSettings.colorblindEnabled;
      localStorage.setItem(COLORBLIND_STORAGE_KEY, String(next));
      return { ...currentSettings, colorblindEnabled: next };
    });
  }, []);

  const toggleHighlightPeers = useCallback(() => {
    setSettings((currentSettings) => {
      const next = !currentSettings.highlightPeers;
      localStorage.setItem(HIGHLIGHT_PEERS_STORAGE_KEY, String(next));
      return { ...currentSettings, highlightPeers: next };
    });
  }, []);

  return {
    settings,
    toggleCheck,
    toggleTimer,
    toggleColorblind,
    toggleHighlightPeers,
    onboardingShown,
    acknowledgeOnboarding,
  };
}
