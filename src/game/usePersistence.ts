import { useCallback, useState } from 'react';

interface Settings {
  checkEnabled: boolean;
  timerEnabled: boolean;
  highlightPeers: boolean;
  showColorLabels: boolean;
}

interface PersistenceResult {
  settings: Settings;
  toggleCheck: () => void;
  toggleTimer: () => void;
  toggleHighlightPeers: () => void;
  toggleColorLabels: () => void;
  onboardingShown: boolean;
  acknowledgeOnboarding: () => void;
}

const CHECK_STORAGE_KEY = 'sudoku-check-answers';
const TIMER_STORAGE_KEY = 'sudoku-timer';
const HIGHLIGHT_PEERS_STORAGE_KEY = 'sudoku-highlight-peers';
const COLOR_LABELS_STORAGE_KEY = 'sudoku-color-number-labels';
const ONBOARDING_STORAGE_KEY = 'sudoku-onboarding-shown';

export function usePersistence(_variantId: string): PersistenceResult {
  const [settings, setSettings] = useState<Settings>(() => ({
    checkEnabled: localStorage.getItem(CHECK_STORAGE_KEY) !== 'false',
    timerEnabled: localStorage.getItem(TIMER_STORAGE_KEY) !== 'false',
    highlightPeers: localStorage.getItem(HIGHLIGHT_PEERS_STORAGE_KEY) !== 'false',
    showColorLabels: localStorage.getItem(COLOR_LABELS_STORAGE_KEY) === 'true',
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

  const toggleHighlightPeers = useCallback(() => {
    setSettings((currentSettings) => {
      const next = !currentSettings.highlightPeers;
      localStorage.setItem(HIGHLIGHT_PEERS_STORAGE_KEY, String(next));
      return { ...currentSettings, highlightPeers: next };
    });
  }, []);

  const toggleColorLabels = useCallback(() => {
    setSettings((currentSettings) => {
      const next = !currentSettings.showColorLabels;
      localStorage.setItem(COLOR_LABELS_STORAGE_KEY, String(next));
      return { ...currentSettings, showColorLabels: next };
    });
  }, []);

  return {
    settings,
    toggleCheck,
    toggleTimer,
    toggleHighlightPeers,
    toggleColorLabels,
    onboardingShown,
    acknowledgeOnboarding,
  };
}
