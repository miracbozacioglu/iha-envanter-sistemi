import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SayfalamaProps {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onDegis: (yeniSayfa: number) => void;
  /** Yeni sayfa gelene kadar butonları kilitle. */
  bekliyor?: boolean;
}

export function Sayfalama({
  page,
  limit,
  total,
  totalPages,
  onDegis,
  bekliyor = false,
}: SayfalamaProps) {
  if (total === 0) return null;

  const ilk = (page - 1) * limit + 1;
  const son = Math.min(page * limit, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-700 px-4 py-3">
      <p className="font-mono text-xs text-fog-700">
        <span className="text-fog-300 tabular-nums">
          {ilk}–{son}
        </span>{' '}
        / <span className="tabular-nums">{total}</span> kayıt
      </p>

      <div className="flex items-center gap-1.5">
        <SayfaButonu
          yon="onceki"
          disabled={page <= 1 || bekliyor}
          onClick={() => onDegis(page - 1)}
        />
        <span className="px-2 font-mono text-xs text-fog-500 tabular-nums">
          {page} <span className="text-fog-700">/ {Math.max(totalPages, 1)}</span>
        </span>
        <SayfaButonu
          yon="sonraki"
          disabled={page >= totalPages || bekliyor}
          onClick={() => onDegis(page + 1)}
        />
      </div>
    </div>
  );
}

interface SayfaButonuProps {
  yon: 'onceki' | 'sonraki';
  disabled: boolean;
  onClick: () => void;
}

function SayfaButonu({ yon, disabled, onClick }: SayfaButonuProps) {
  const onceki = yon === 'onceki';
  const Icon = onceki ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={onceki ? 'Önceki sayfa' : 'Sonraki sayfa'}
      className="rounded-md border border-ink-600 bg-ink-800 p-1.5 text-fog-300 transition hover:border-signal-500/40 hover:text-fog-100 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-ink-600 disabled:hover:text-fog-300"
    >
      <Icon className="size-4" strokeWidth={2} />
    </button>
  );
}
