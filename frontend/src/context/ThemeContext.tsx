import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  TEMA_ANAHTARI,
  ThemeContext,
  temaOku,
  type Tema,
  type ThemeContextValue,
} from './theme-context';

interface ThemeProviderProps {
  children: ReactNode;
}

/** Tarayıcı arayüzünün (adres çubuğu vb.) tema ile uyumlu kalması için. */
const TARAYICI_RENGI: Record<Tema, string> = {
  dark: '#050908',
  light: '#ECF1EF',
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  // index.html'deki betik sınıfı ilk boyamadan önce koymuş oluyor; buradaki
  // ilk okuma da aynı kaynaktan geldiği için ikisi baştan uyumlu.
  const [tema, setTema] = useState<Tema>(temaOku);

  useEffect(() => {
    const kok = document.documentElement;

    kok.classList.toggle('dark', tema === 'dark');
    kok.classList.toggle('light', tema === 'light');

    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', TARAYICI_RENGI[tema]);

    try {
      window.localStorage.setItem(TEMA_ANAHTARI, tema);
    } catch {
      // Storage yazılamıyorsa tema bu oturumda çalışır, sonrakine taşınmaz.
    }
  }, [tema]);

  /* Aynı hesapla açılmış diğer sekmeler de tema değişimini görsün. */
  useEffect(() => {
    const digerSekme = (olay: StorageEvent) => {
      if (olay.key === TEMA_ANAHTARI) setTema(temaOku());
    };

    window.addEventListener('storage', digerSekme);
    return () => window.removeEventListener('storage', digerSekme);
  }, []);

  const temaSec = useCallback((yeni: Tema) => setTema(yeni), []);

  const temaDegistir = useCallback(() => {
    setTema((onceki) => (onceki === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ tema, temaSec, temaDegistir }),
    [tema, temaSec, temaDegistir],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
