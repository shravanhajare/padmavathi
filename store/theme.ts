'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Theme = 'light' | 'dark';

interface ThemeState {
  /** The user's explicit choice, or null to follow the OS preference. */
  choice: Theme | null;
  /** The theme actually applied to the document. */
  resolved: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
  setResolved: (t: Theme) => void;
}

export const THEME_STORAGE_KEY = 'pe-theme';

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      choice: null,
      resolved: 'light',
      setTheme: (t) => set({ choice: t, resolved: t }),
      toggle: () => {
        const next: Theme = get().resolved === 'dark' ? 'light' : 'dark';
        set({ choice: next, resolved: next });
      },
      setResolved: (t) => set({ resolved: t }),
    }),
    {
      name: THEME_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ choice: s.choice }),
      skipHydration: true,
    },
  ),
);

/**
 * Inline script injected in <head> so the right theme is applied before the
 * first paint (no flash). Mirrors the persisted shape above.
 */
export const themeInitScript = `(function(){try{var d=document.documentElement,t=null,s=localStorage.getItem('${THEME_STORAGE_KEY}');if(s){var p=JSON.parse(s);t=p&&p.state&&p.state.choice}if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}d.setAttribute('data-theme',t);d.style.colorScheme=t}catch(e){}})();`;
