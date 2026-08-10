import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import api, { clearToken, getToken, OTURUM_DUSTU_EVENT, setToken } from '../lib/api';
import type { Kullanici, LoginYaniti, Rol } from '../types';
import { AuthContext, type AuthContextValue } from './auth-context';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<Kullanici | null>(null);
  // Token yoksa doğrulanacak bir şey de yok: doğrudan hazır başlarız.
  const [isLoading, setIsLoading] = useState<boolean>(() => getToken() !== null);

  /* Açılışta: elde token varsa gerçekten geçerli mi diye /auth/me'ye sor. */
  useEffect(() => {
    const token = getToken();

    // Token yoksa başlangıç state'i (user: null, isLoading: false) zaten doğru.
    if (!token) {
      return;
    }

    let iptal = false;

    api
      .get<Kullanici>('/auth/me')
      .then(({ data }) => {
        if (!iptal) setUser(data);
      })
      .catch(() => {
        // 401 ise interceptor token'ı zaten sildi; diğer hatalarda da
        // oturumu açık saymak yanlış olur.
        if (!iptal) {
          clearToken();
          setUser(null);
        }
      })
      .finally(() => {
        if (!iptal) setIsLoading(false);
      });

    return () => {
      iptal = true;
    };
  }, []);

  /* Interceptor 401 yakalayınca state'i de temizle. */
  useEffect(() => {
    const oturumDustu = () => setUser(null);

    window.addEventListener(OTURUM_DUSTU_EVENT, oturumDustu);
    return () => window.removeEventListener(OTURUM_DUSTU_EVENT, oturumDustu);
  }, []);

  const login = useCallback(async (email: string, sifre: string): Promise<Kullanici> => {
    const { data } = await api.post<LoginYaniti>('/auth/login', { email, sifre });

    setToken(data.access_token);
    setUser(data.user);

    return data.user;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const hasRole = useCallback(
    (roller?: readonly Rol[]) => {
      if (!roller || roller.length === 0) return true;
      return user !== null && roller.includes(user.rol);
    },
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      login,
      logout,
      hasRole,
    }),
    [user, isLoading, login, logout, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
