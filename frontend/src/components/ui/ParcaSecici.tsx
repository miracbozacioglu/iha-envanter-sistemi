import { Check, ChevronDown, LoaderCircle, Search, X } from 'lucide-react';
import { useId, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useDebounced } from '../../hooks/useDebounced';
import { useParcalar } from '../../hooks/useParcalar';
import type { ParcaOzet } from '../../types';

interface ParcaSeciciProps {
  /** Seçili parçanın id'si, string olarak ('' = seçilmedi). */
  value: string;
  onChange: (deger: string, parca: ParcaOzet | null) => void;
  hataVar?: boolean;
  placeholder?: string;
}

/**
 * Aranabilir parça seçici. Native <select> yerine combobox çünkü katalog
 * büyüdükçe kod/ad araması şart; arama backend'e `search` parametresiyle
 * gidiyor, istemcide filtreleme yapılmıyor.
 */
export function ParcaSecici({
  value,
  onChange,
  hataVar = false,
  placeholder = 'Parça ara ve seç…',
}: ParcaSeciciProps) {
  const [acik, setAcik] = useState(false);
  const [sorgu, setSorgu] = useState('');
  const [secili, setSecili] = useState<ParcaOzet | null>(null);
  const [vurgulu, setVurgulu] = useState(0);

  const listeId = useId();

  const arama = useDebounced(sorgu, 300);
  const { data, isFetching } = useParcalar({ search: arama, limit: 100 });
  const parcalar = data?.data ?? [];

  // value dışarıdan sıfırlanırsa (form reset) etiket de düşsün.
  const gosterilen = value !== '' && secili && String(secili.id) === value ? secili : null;

  function sec(parca: ParcaOzet) {
    setSecili(parca);
    onChange(String(parca.id), parca);
    setAcik(false);
    setSorgu('');
  }

  function temizle() {
    setSecili(null);
    onChange('', null);
    setSorgu('');
  }

  function klavye(e: ReactKeyboardEvent) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!acik) {
        setAcik(true);
        return;
      }
      setVurgulu((mevcut) => {
        const sonraki = e.key === 'ArrowDown' ? mevcut + 1 : mevcut - 1;
        if (parcalar.length === 0) return 0;
        return (sonraki + parcalar.length) % parcalar.length;
      });
      return;
    }

    if (e.key === 'Enter' && acik) {
      e.preventDefault();
      const aday = parcalar[vurgulu];
      if (aday) sec(aday);
      return;
    }

    if (e.key === 'Escape' && acik) {
      e.preventDefault();
      setAcik(false);
    }
  }

  return (
    <div
      className="relative"
      // Odak sarmalayıcıdan tamamen çıkınca kapat: liste içi tıklamada kapanmasın.
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setAcik(false);
      }}
    >
      {gosterilen ? (
        <div
          className={`flex w-full items-center gap-3 rounded-lg border bg-ink-850 px-3.5 py-2.5 ${
            hataVar ? 'border-danger-500/50' : 'border-ink-600'
          }`}
        >
          <span className="rounded border border-signal-500/30 bg-signal-900/50 px-1.5 py-0.5 font-mono text-[0.6875rem] text-signal-400">
            {gosterilen.kod}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm text-fog-100">{gosterilen.ad}</span>
          <button
            type="button"
            onClick={temizle}
            aria-label="Parça seçimini kaldır"
            className="rounded p-1 text-fog-700 transition hover:text-danger-400"
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-fog-700"
            strokeWidth={1.75}
          />
          <input
            type="text"
            role="combobox"
            aria-expanded={acik}
            aria-controls={listeId}
            aria-autocomplete="list"
            value={sorgu}
            placeholder={placeholder}
            onChange={(e) => {
              setSorgu(e.target.value);
              setVurgulu(0);
              setAcik(true);
            }}
            onFocus={() => setAcik(true)}
            onKeyDown={klavye}
            className={`w-full rounded-lg border bg-ink-850 py-2.5 pr-9 pl-10 text-sm text-fog-100 transition placeholder:text-fog-700 hover:border-ink-500 focus:outline-none focus:ring-2 focus:ring-signal-500/15 ${
              hataVar
                ? 'border-danger-500/50 focus:border-danger-500/70'
                : 'border-ink-600 focus:border-signal-500/60'
            }`}
          />
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-fog-700">
            {isFetching ? (
              <LoaderCircle className="size-4 animate-spin" strokeWidth={2} />
            ) : (
              <ChevronDown className="size-4" strokeWidth={2} />
            )}
          </span>
        </div>
      )}

      {acik && !gosterilen && (
        <ul
          id={listeId}
          role="listbox"
          className="absolute z-30 mt-1.5 max-h-64 w-full overflow-y-auto rounded-lg border border-ink-600 bg-ink-850 py-1 shadow-2xl shadow-black/60"
        >
          {parcalar.length === 0 ? (
            <li className="px-3.5 py-3 text-xs text-fog-700">
              {isFetching ? 'Aranıyor…' : 'Eşleşen parça yok.'}
            </li>
          ) : (
            parcalar.map((parca, sira) => (
              <li key={parca.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={sira === vurgulu}
                  onMouseEnter={() => setVurgulu(sira)}
                  // onMouseDown: blur'dan önce çalışsın ki liste kapanmadan seçim olsun.
                  onMouseDown={(e) => {
                    e.preventDefault();
                    sec(parca);
                  }}
                  className={`flex w-full items-center gap-3 px-3.5 py-2 text-left transition ${
                    sira === vurgulu ? 'bg-ink-800' : ''
                  }`}
                >
                  <span className="w-24 shrink-0 truncate font-mono text-[0.6875rem] text-signal-400">
                    {parca.kod}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-fog-100">{parca.ad}</span>
                  <span className="shrink-0 text-[0.625rem] text-fog-700">{parca.kategori.ad}</span>
                  {String(parca.id) === value && (
                    <Check className="size-3.5 shrink-0 text-signal-400" strokeWidth={2.5} />
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
