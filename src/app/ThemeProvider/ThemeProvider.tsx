import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import '@/app/theme.css';
import { ThemeContext, type Theme, type ThemeContextValue } from './context';
import styles from './ThemeProvider.module.css';

interface ThemeProviderProps {
  children: React.ReactNode;
}

const THEME_STORAGE_KEY = 'sudoku-theme';
const HIGH_CONTRAST_STORAGE_KEY = 'sudoku-high-contrast';
// The retired per-variant colorblind toggle folded into the global
// high-contrast setting; carry an enabled value over once.
const LEGACY_COLORBLIND_STORAGE_KEY = 'sudoku-colorblind';

function getInitialTheme(): Theme {
  return localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark';
}

function getInitialHighContrast(): boolean {
  const stored = localStorage.getItem(HIGH_CONTRAST_STORAGE_KEY);
  if (stored !== null) {
    return stored === 'true';
  }
  return localStorage.getItem(LEGACY_COLORBLIND_STORAGE_KEY) === 'true';
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [highContrast, setHighContrast] = useState(getInitialHighContrast);
  const [announcement, setAnnouncement] = useState('');
  const isMounted = useRef(false);

  useLayoutEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useLayoutEffect(() => {
    document.documentElement.classList.toggle('high-contrast', highContrast);
    localStorage.setItem(HIGH_CONTRAST_STORAGE_KEY, String(highContrast));
    localStorage.removeItem(LEGACY_COLORBLIND_STORAGE_KEY);
  }, [highContrast]);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    setAnnouncement(theme === 'light' ? 'Light theme' : 'Dark theme');
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      toggleTheme: () => {
        setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
      },
      highContrast,
      toggleHighContrast: () => {
        setHighContrast((current) => !current);
      },
    }),
    [theme, highContrast]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
      <span role="status" aria-live="polite" aria-atomic="true" className={styles.srOnly}>
        {announcement}
      </span>
    </ThemeContext.Provider>
  );
}
