import { createContext } from 'react';
import type { Kullanici, Rol } from '../types';

export interface AuthContextValue {
  user: Kullanici | null;
  /** Açılışta /auth/me çözülene kadar true. */
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, sifre: string) => Promise<Kullanici>;
  logout: () => void;
  /** Kullanıcının rolü verilen listede mi? Liste boşsa herkese açık sayılır. */
  hasRole: (roller?: readonly Rol[]) => boolean;
}

/**
 * Context nesnesi provider'dan ayrı dosyada duruyor ki AuthContext.tsx
 * yalnızca bileşen export etsin (Vite fast-refresh bunu ister).
 */
export const AuthContext = createContext<AuthContextValue | null>(null);
