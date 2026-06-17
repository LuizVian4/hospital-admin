import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@escala/shared';
import { api, setUnauthorizedHandler } from '@/api/client';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (nome: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // Sessão já pode ter expirado; limpa o estado local mesmo assim.
    } finally {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
    });
  }, []);

  useEffect(() => {
    api
      .getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user: loggedUser } = await api.login(email, password);
    setUser(loggedUser);
  }, []);

  const register = useCallback(async (nome: string, email: string, password: string) => {
    const { user: registeredUser } = await api.register({ nome, email, password });
    setUser(registeredUser);
  }, []);

  const refreshUser = useCallback(async () => {
    const me = await api.getMe();
    setUser(me);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, login, register, logout, refreshUser, setUser }),
    [user, isLoading, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}
