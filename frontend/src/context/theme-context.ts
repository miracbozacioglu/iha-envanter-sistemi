import { createContext } from 'react';

export type Tema = 'dark' | 'light';

/** Seçim burada saklanıyor; index.html'deki ön yükleme betiği de aynı anahtarı okur. */
export const TEMA_ANAHTARI = 'iha-envanter:tema';

/** Varsayılan koyu: mevcut komuta-kontrol görünümü bozulmasın. */
export const VARSAYILAN_TEMA: Tema = 'dark';

export interface ThemeContextValue {
  tema: Tema;
  /** Doğrudan atama — belirli bir temaya geçmek için. */
  temaSec: (tema: Tema) => void;
  /** Koyu <-> açık arasında gidip gelir. */
  temaDegistir: () => void;
}

/**
 * Context nesnesi provider'dan ayrı dosyada duruyor ki ThemeContext.tsx
 * yalnızca bileşen export etsin (Vite fast-refresh bunu ister).
 */
export const ThemeContext = createContext<ThemeContextValue | null>(null);

/** localStorage'daki değeri doğrular; bozuk/eksikse varsayılana düşer. */
export function temaOku(): Tema {
  try {
    const kayitli = window.localStorage.getItem(TEMA_ANAHTARI);
    return kayitli === 'light' || kayitli === 'dark' ? kayitli : VARSAYILAN_TEMA;
  } catch {
    // Gizli sekme / storage kapalı: tema yine çalışsın, sadece kalıcı olmasın.
    return VARSAYILAN_TEMA;
  }
}
