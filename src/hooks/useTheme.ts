// ============================================
// useTheme Hook - Light/Dark Mode Toggle
// ============================================

import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';

interface UseThemeReturn {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const THEME_STORAGE_KEY = 'pruefstand-theme';

export function useTheme(): UseThemeReturn {
  // Initialer Wert immer 'light' für SSR-Kompatibilität
  const [theme, setThemeState] = useState<Theme>('light');
  const [isHydrated, setIsHydrated] = useState(false);

  // Nach Hydration: Theme aus localStorage laden
  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (stored === 'light' || stored === 'dark') {
      setThemeState(stored);
    }
    setIsHydrated(true);
  }, []);

  // Theme auf DOM anwenden (nur nach Hydration)
  useEffect(() => {
    if (!isHydrated) return;
    
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
    
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme, isHydrated]);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  return {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
    setTheme,
  };
}

export default useTheme;
