import axios, { AxiosError } from 'axios';
import type { ApiHatasi } from '../types';

export const TOKEN_KEY = 'token';

/**
 * Oturum düştüğünde (401) yayınlanır. AuthContext bunu dinleyip state'i
 * temizler; böylece api.ts'in React'e doğrudan bağımlılığı olmaz.
 */
export const OTURUM_DUSTU_EVENT = 'auth:unauthorized';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

/* Her isteğe, varsa, Bearer token'ı ekle. */
api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }

  return config;
});

/**
 * Login isteğinin kendi 401'i "şifre yanlış" demektir — bunu global oturum
 * düşmesi saymayız, yoksa form hatayı gösteremeden sayfa yönlenir.
 */
function girisDenemesiMi(url: string | undefined): boolean {
  return (url ?? '').includes('/auth/login');
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiHatasi>) => {
    const status = error.response?.status;

    if (status === 401 && !girisDenemesiMi(error.config?.url)) {
      clearToken();
      window.dispatchEvent(new CustomEvent(OTURUM_DUSTU_EVENT));

      // Halihazırda giriş ekranındaysak yönlendirme yapıp formu sıfırlamayalım.
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }

    return Promise.reject(error);
  },
);

/** Axios hatasından kullanıcıya gösterilebilir tek bir mesaj çıkarır. */
export function hataMesaji(error: unknown, varsayilan = 'Beklenmeyen bir hata oluştu.'): string {
  if (axios.isAxiosError<ApiHatasi>(error)) {
    const mesaj = error.response?.data?.message;

    if (Array.isArray(mesaj)) return mesaj.join(' ');
    if (typeof mesaj === 'string') return mesaj;

    // Yanıt hiç gelmediyse (backend kapalı / CORS) daha yardımcı bir metin ver.
    if (!error.response) {
      return 'Sunucuya ulaşılamadı. Backend çalışıyor mu?';
    }
  }

  return varsayilan;
}

export default api;
