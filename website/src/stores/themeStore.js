import { create } from 'zustand';

export const THEME_STORAGE_KEY = 'silicon-theme';
export const DEFAULT_THEME = 'light';

function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  if (document.documentElement.classList.contains('force-light')) return;
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

function resolveTheme() {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

const useThemeStore = create((set) => ({
  theme: resolveTheme(),

  initializeTheme: () => {
    const theme = resolveTheme();
    applyTheme(theme);
    set({ theme });
  },

  toggleTheme: () => {
    set((state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      applyTheme(newTheme);
      return { theme: newTheme };
    });
  },

  setTheme: (value) => {
    localStorage.setItem(THEME_STORAGE_KEY, value);
    applyTheme(value);
    set({ theme: value });
  },
}));

export default useThemeStore;
