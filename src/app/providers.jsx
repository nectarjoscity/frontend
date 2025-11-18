'use client';

import { Provider } from 'react-redux';
import { store } from '../store/store';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { palettes } from './colors';

const ThemeContext = createContext({
  theme: 'dark',
  setTheme: () => {},
  colors: palettes.dark
});

export function useTheme() {
  return useContext(ThemeContext);
}

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark');

  // Prefer user choice, fallback to system preference on first load
  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('theme') : null;
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored);
      return;
    }
    if (typeof window !== 'undefined' && window.matchMedia) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  // Persist and update CSS variables for body background/text
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('theme', theme);
      const c = theme === 'dark' ? palettes.dark : palettes.light;
      document.body.style.background = c.background;
      document.body.style.color = c.text;
      // Update placeholder color based on theme
      document.documentElement.style.setProperty('--placeholder-color', theme === 'dark' ? '#FFFFFF' : '#2F2F2F');
    }
  }, [theme]);

  const value = useMemo(() => ({
    theme,
    setTheme,
    colors: theme === 'dark' ? palettes.dark : palettes.light
  }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export default function Providers({ children }) {
  return (
    <Provider store={store}>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </Provider>
  );
}