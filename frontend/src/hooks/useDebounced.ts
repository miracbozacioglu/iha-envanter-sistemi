import { useEffect, useState } from 'react';

/** Değeri belirtilen süre boyunca sabit kaldıktan sonra yansıtır. */
export function useDebounced<T>(deger: T, gecikmeMs = 350): T {
  const [gecikmisDeger, setGecikmisDeger] = useState(deger);

  useEffect(() => {
    const id = window.setTimeout(() => setGecikmisDeger(deger), gecikmeMs);
    return () => window.clearTimeout(id);
  }, [deger, gecikmeMs]);

  return gecikmisDeger;
}
