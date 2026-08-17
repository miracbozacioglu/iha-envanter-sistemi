import { ArrowRight, History, PlaneTakeoff, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bos, Hata, Yukleniyor } from '../components/ui/DurumKutusu';
import { Rozet } from '../components/ui/Rozet';
import { useAraclar } from '../hooks/useBakim';
import { useKaynakListesi } from '../hooks/useKaynak';
import { hataMesaji } from '../lib/api';
import { aracDurumTonu } from '../lib/bakim';
import type { IhaAraci, IhaModeli } from '../types';

export function AraclarPage() {
  const araclar = useAraclar();
  const modeller = useKaynakListesi<IhaModeli>('iha-modelleri');

  const [arama, setArama] = useState('');
  const [modelId, setModelId] = useState<number | undefined>();

  // Araç listesi sayfasız ve küçük; filtreleme istemcide yapılıyor.
  const gorunen = useMemo(() => {
    const q = arama.trim().toLocaleLowerCase('tr');

    return (araclar.data ?? []).filter((arac) => {
      if (modelId && arac.ihaModeliId !== modelId) return false;
      if (!q) return true;

      const havuz = `${arac.kuyrukNo} ${arac.ihaModeli?.ad ?? ''} ${
        arac.ihaModeli?.uretici ?? ''
      }`.toLocaleLowerCase('tr');

      return havuz.includes(q);
    });
  }, [araclar.data, arama, modelId]);

  const filtreVar = arama !== '' || modelId !== undefined;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1 lg:max-w-sm">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-fog-700"
            strokeWidth={1.75}
          />
          <input
            type="search"
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            placeholder="Kuyruk no veya model ara…"
            aria-label="Araç ara"
            className="w-full rounded-lg border border-ink-600 bg-ink-850 py-2.5 pr-3 pl-10 text-sm text-fog-100 transition placeholder:text-fog-700 hover:border-ink-500 focus:border-signal-500/60 focus:outline-none"
          />
        </div>

        <select
          value={modelId ?? ''}
          onChange={(e) => setModelId(e.target.value === '' ? undefined : Number(e.target.value))}
          aria-label="Modele göre filtrele"
          className={`cursor-pointer rounded-lg border bg-ink-850 py-2.5 pr-9 pl-3.5 text-sm transition hover:border-ink-500 focus:border-signal-500/60 focus:outline-none lg:w-72 ${
            modelId ? 'border-signal-500/40 text-fog-100' : 'border-ink-600 text-fog-500'
          }`}
        >
          <option value="">Tüm modeller</option>
          {(modeller.data ?? []).map((model) => (
            <option key={model.id} value={model.id}>
              {model.ad} · {model.uretici}
            </option>
          ))}
        </select>

        {filtreVar && (
          <button
            type="button"
            onClick={() => {
              setArama('');
              setModelId(undefined);
            }}
            className="inline-flex items-center gap-1.5 self-start rounded-lg border border-ink-600 px-3 py-2.5 text-xs text-fog-500 transition hover:border-ink-500 hover:text-fog-300 lg:self-auto"
          >
            <X className="size-3.5" strokeWidth={2} />
            Temizle
          </button>
        )}

        <Link
          to="/bakim"
          className="inline-flex items-center gap-2 rounded-lg border border-ink-600 bg-ink-800 px-3.5 py-2.5 text-sm text-fog-300 transition hover:border-signal-500/40 hover:text-fog-100 lg:ml-auto"
        >
          <History className="size-4" strokeWidth={1.75} />
          Tüm bakım kayıtları
        </Link>
      </div>

      {araclar.isPending ? (
        <div className="panel">
          <Yukleniyor mesaj="Araçlar yükleniyor" />
        </div>
      ) : araclar.isError ? (
        <div className="panel">
          <Hata
            mesaj={hataMesaji(araclar.error)}
            onTekrarDene={() => {
              void araclar.refetch();
            }}
          />
        </div>
      ) : gorunen.length === 0 ? (
        <div className="panel">
          <Bos
            baslik={filtreVar ? 'Filtrelerle eşleşen araç yok' : 'Henüz İHA aracı yok'}
            aciklama={
              filtreVar
                ? 'Aramayı kısaltmayı ya da model filtresini kaldırmayı deneyin.'
                : 'Araçlar Tanımlamalar ekranından eklenir.'
            }
          />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {gorunen.map((arac) => (
            <AracKarti key={arac.id} arac={arac} />
          ))}
        </div>
      )}
    </div>
  );
}

function AracKarti({ arac }: { arac: IhaAraci }) {
  return (
    <Link
      to={`/araclar/${arac.id}`}
      className="panel group flex flex-col gap-4 p-5 transition hover:border-signal-500/40 hover:bg-ink-800"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-signal-500/25 bg-signal-900/40 text-signal-400">
          <PlaneTakeoff className="size-5" strokeWidth={1.75} />
        </span>
        <Rozet ton={aracDurumTonu(arac.durum)} mono>
          {arac.durum}
        </Rozet>
      </div>

      <div className="min-w-0">
        <p className="truncate font-mono text-base font-semibold tracking-[0.08em] text-fog-100">
          {arac.kuyrukNo}
        </p>
        <p className="mt-1.5 truncate text-sm text-fog-500">
          {arac.ihaModeli ? (
            <>
              {arac.ihaModeli.ad}
              <span className="text-fog-700"> · {arac.ihaModeli.uretici}</span>
            </>
          ) : (
            <span className="italic">Model bilgisi yok</span>
          )}
        </p>
      </div>

      <span className="flex items-center gap-1.5 text-xs text-fog-700 transition group-hover:text-signal-400">
        Bakım geçmişi
        <ArrowRight
          className="size-3.5 transition group-hover:translate-x-0.5"
          strokeWidth={2}
        />
      </span>
    </Link>
  );
}
