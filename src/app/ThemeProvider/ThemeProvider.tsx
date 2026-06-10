import { useEffect, useMemo, useRef, useState } from 'react';
import '@/app/theme.css';
import { ThemeContext, type Theme, type ThemeContextValue } from './context';
import styles from './ThemeProvider.module.css';

interface ThemeProviderProps {
  children: React.ReactNode;
}

const THEME_STORAGE_KEY = 'sudoku-theme';

function getInitialTheme(): Theme {
  return localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark';
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [announcement, setAnnouncement] = useState('');
  const isMounted = useRef(false);

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

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
    }),
    [theme]
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
