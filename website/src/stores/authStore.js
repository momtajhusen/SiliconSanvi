import { create } from 'zustand';

const STORAGE_KEY = 'silicon-auth';

function readSession() {
  try {
    const session = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return session?.token && session?.user ? session : null;
  } catch {
    return null;
  }
}

const initial = readSession();

const useAuthStore = create((set) => ({
  user: initial?.user || null,
  token: initial?.token || null,
  hydrated: false,

  hydrate: () => {
    const session = readSession();
    set({ user: session?.user || null, token: session?.token || null, hydrated: true });
  },

  login: ({ user, token }) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token }));
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ user: null, token: null });
  },
}));

export default useAuthStore;
