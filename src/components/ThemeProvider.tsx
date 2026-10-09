'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'dark';

interface ThemeContextType {
  theme: 'dark';
  resolvedTheme: 'dark';
  setTheme: (theme: any) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  resolvedTheme: 'dark',
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Cloudflare Radar is dark-only
    const root = document.documentElement;
    root.classList.add('dark');
    root.classList.remove('light');
    root.style.colorScheme = 'dark';
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme: 'dark',
        resolvedTheme: 'dark',
        setTheme: () => {},
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
