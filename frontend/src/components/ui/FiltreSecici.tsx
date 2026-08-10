import { ChevronDown } from 'lucide-react';

interface Secenek {
  deger: number;
  etiket: string;
}

interface FiltreSeciciProps {
  label: string;
  deger: number | undefined;
  secenekler: Secenek[];
  tumuEtiketi: string;
  onDegis: (deger: number | undefined) => void;
  yukleniyor?: boolean;
}

/**
 * Native <select> üzerine kurulu filtre kutusu — klavye ve mobil davranışı
 * bedava gelsin diye özel bir dropdown yerine bu tercih edildi.
 */
export function FiltreSecici({
  label,
  deger,
  secenekler,
  tumuEtiketi,
  onDegis,
  yukleniyor = false,
}: FiltreSeciciProps) {
  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <select
        value={deger ?? ''}
        disabled={yukleniyor}
        onChange={(e) => onDegis(e.target.value === '' ? undefined : Number(e.target.value))}
        className={`w-full cursor-pointer appearance-none rounded-lg border bg-ink-850 py-2.5 pr-9 pl-3.5 text-sm transition hover:border-ink-500 focus:border-signal-500/60 focus:outline-none disabled:cursor-wait disabled:opacity-60 ${
          deger ? 'border-signal-500/40 text-fog-100' : 'border-ink-600 text-fog-500'
        }`}
      >
        <option value="">{yukleniyor ? 'Yükleniyor…' : tumuEtiketi}</option>
        {secenekler.map((secenek) => (
          <option key={secenek.deger} value={secenek.deger}>
            {secenek.etiket}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-fog-700"
        strokeWidth={2}
      />
    </label>
  );
}
