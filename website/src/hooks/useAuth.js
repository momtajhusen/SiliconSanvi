import useAuthStore from '../stores/authStore';

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  return { user, token, isAuthenticated: Boolean(user && token), login, logout };
}
