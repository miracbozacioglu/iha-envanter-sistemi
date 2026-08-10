import { useQueryClient } from '@tanstack/react-query';
import { Plus, Search, X } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bos, Hata, Yukleniyor } from '../components/ui/DurumKutusu';
import { FiltreSecici } from '../components/ui/FiltreSecici';
import { Rozet } from '../components/ui/Rozet';
import { Sayfalama } from '../components/ui/Sayfalama';
import { StokRozeti } from '../components/ui/StokRozeti';
import { useAuth } from '../hooks/useAuth';
import { useDebounced } from '../hooks/useDebounced';
import { parcaDetayGetir, parcaKeys, useKritikParcalar, useParcalar } from '../hooks/useParcalar';
import { useIhaModelleri, useKategoriler } from '../hooks/useTanimlar';
import { hataMesaji } from '../lib/api';
import { stokDurumu, type StokDurumu } from '../lib/stok';
import type { ParcaOzet } from '../types';

const SAYFA_BOYUTU = 20;

/**
 * Bir satırın stok bilgisi. Liste ucu depo stoklarını döndürmediği için
 * kesin toplam yalnızca kritik listesinde yer alan parçalar için bilinir;
 * diğerleri için toplamın kritik seviyeden küçük olmadığı bilinir.
 */
interface SatirStok {
  durum: StokDurumu;
  kesin: boolean;
  toplam?: number;
}

export function ParcalarPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const yonetici = user?.rol === 'YONETICI';

  const [aramaGirdisi, setAramaGirdisi] = useState('');
  const [kategoriId, setKategoriId] = useState<number | undefined>();
  const [ihaModeliId, setIhaModeliId] = useState<number | undefined>();
  const [page, setPage] = useState(1);

  const arama = useDebounced(aramaGirdisi, 350);

  const filtreler = { search: arama, kategoriId, ihaModeliId, page, limit: SAYFA_BOYUTU };
  const parcalar = useParcalar(filtreler);
  const kritikler = useKritikParcalar();

  // parcaId -> toplamStok. Kritik listesinde olmayan parçanın stoğu
  // en az kendi kritik seviyesi kadardır.
  const kritikStoklar = useMemo(() => {
    const harita = new Map<number, number>();
    for (const parca of kritikler.data ?? []) harita.set(parca.id, parca.toplamStok);
    return harita;
  }, [kritikler.data]);

  function satirStoku(parca: ParcaOzet): SatirStok {
    const bilinen = kritikStoklar.get(parca.id);

    if (bilinen !== undefined) {
      return { durum: stokDurumu(bilinen, parca.kritikSeviye), kesin: true, toplam: bilinen };
    }

    return { durum: 'YETERLI', kesin: false };
  }

  const filtreVar = Boolean(aramaGirdisi || kategoriId || ihaModeliId);

  function filtreleriTemizle() {
    setAramaGirdisi('');
    setKategoriId(undefined);
    setIhaModeliId(undefined);
    setPage(1);
  }

  return (
    <div className="space-y-5">
      <Araclar
        aramaGirdisi={aramaGirdisi}
        onArama={(deger) => {
          setAramaGirdisi(deger);
          setPage(1);
        }}
        kategoriId={kategoriId}
        onKategori={(deger) => {
          setKategoriId(deger);
          setPage(1);
        }}
        ihaModeliId={ihaModeliId}
        onIhaModeli={(deger) => {
          setIhaModeliId(deger);
          setPage(1);
        }}
        filtreVar={filtreVar}
        onTemizle={filtreleriTemizle}
        yonetici={yonetici}
      />

      <div className="panel overflow-hidden">
        {parcalar.isPending ? (
          <Yukleniyor mesaj="Parçalar yükleniyor" />
        ) : parcalar.isError ? (
          <Hata
            mesaj={hataMesaji(parcalar.error)}
            onTekrarDene={() => {
              void parcalar.refetch();
            }}
          />
        ) : parcalar.data.data.length === 0 ? (
          <Bos
            baslik={filtreVar ? 'Filtrelerle eşleşen parça yok' : 'Henüz parça kaydı yok'}
            aciklama={
              filtreVar
                ? 'Arama metnini kısaltmayı ya da filtreleri temizlemeyi deneyin.'
                : 'Parça kataloğu boş görünüyor.'
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[56rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-ink-700 bg-ink-900/60">
                    <Baslik className="w-32">Kod</Baslik>
                    <Baslik>Ad</Baslik>
                    <Baslik className="w-44">Kategori</Baslik>
                    <Baslik className="w-24">Birim</Baslik>
                    <Baslik className="w-28 text-right">Stok</Baslik>
                    <Baslik className="w-32">Durum</Baslik>
                    <Baslik className="w-28 text-right">Kritik sev.</Baslik>
                  </tr>
                </thead>
                <tbody>
                  {parcalar.data.data.map((parca) => {
                    const stok = satirStoku(parca);

                    return (
                      <tr
                        key={parca.id}
                        onClick={() => navigate(`/parcalar/${parca.id}`)}
                        // Detay verisini önden ısıt: satıra tıklayınca ekran hazır gelsin.
                        onMouseEnter={() => {
                          void queryClient.prefetchQuery({
                            queryKey: parcaKeys.detay(parca.id),
                            queryFn: () => parcaDetayGetir(parca.id),
                            staleTime: 30_000,
                          });
                        }}
                        className="cursor-pointer border-b border-ink-800 transition last:border-b-0 hover:bg-ink-800/60"
                      >
                        <Hucre>
                          {/* Klavye ve ekran okuyucular için gerçek bağlantı */}
                          <Link
                            to={`/parcalar/${parca.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-mono text-xs text-signal-400 transition hover:text-signal-300"
                          >
                            {parca.kod}
                          </Link>
                        </Hucre>
                        <Hucre>
                          <span className="flex items-center gap-2">
                            <span className="text-fog-100">{parca.ad}</span>
                            {parca.arizali && (
                              <Rozet ton="kritik" mono>
                                Arızalı
                              </Rozet>
                            )}
                          </span>
                        </Hucre>
                        <Hucre className="text-fog-500">{parca.kategori.ad}</Hucre>
                        <Hucre className="font-mono text-xs text-fog-500">{parca.birim}</Hucre>
                        <Hucre className="text-right">
                          {stok.kesin ? (
                            <span className="font-mono text-fog-100 tabular-nums">
                              {stok.toplam}
                            </span>
                          ) : (
                            <span
                              title={`Bu parçanın toplam stoğu kritik seviyesinin (${parca.kritikSeviye}) altında değil. Kesin miktar için detaya girin.`}
                              className="font-mono text-fog-700 tabular-nums"
                            >
                              ≥ {parca.kritikSeviye}
                            </span>
                          )}
                        </Hucre>
                        <Hucre>
                          <StokRozeti
                            durum={stok.durum}
                            tahmini={!stok.kesin}
                            title={
                              stok.kesin ? undefined : 'Kesin miktar için parça detayına girin.'
                            }
                          />
                        </Hucre>
                        <Hucre className="text-right font-mono text-fog-500 tabular-nums">
                          {parca.kritikSeviye}
                        </Hucre>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Sayfalama
              page={parcalar.data.page}
              limit={parcalar.data.limit}
              total={parcalar.data.total}
              totalPages={parcalar.data.totalPages}
              onDegis={setPage}
              bekliyor={parcalar.isFetching}
            />
          </>
        )}
      </div>

      <p className="text-xs leading-relaxed text-fog-700">
        Liste ucu depo stoklarını taşımadığı için kesin toplam yalnızca stoğu kritik seviyesinin
        altındaki parçalarda gösterilir; diğerleri <span className="font-mono">≥ kritik seviye</span>{' '}
        olarak işaretlenir. Depo bazlı kesin miktarlar parça detayında.
      </p>
    </div>
  );
}

interface AraclarProps {
  aramaGirdisi: string;
  onArama: (deger: string) => void;
  kategoriId: number | undefined;
  onKategori: (deger: number | undefined) => void;
  ihaModeliId: number | undefined;
  onIhaModeli: (deger: number | undefined) => void;
  filtreVar: boolean;
  onTemizle: () => void;
  yonetici: boolean;
}

function Araclar(props: AraclarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="relative flex-1 lg:max-w-sm">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-fog-700"
          strokeWidth={1.75}
        />
        <input
          type="search"
          value={props.aramaGirdisi}
          onChange={(e) => props.onArama(e.target.value)}
          placeholder="Kod veya ad ara…"
          aria-label="Parça ara"
          className="w-full rounded-lg border border-ink-600 bg-ink-850 py-2.5 pr-3 pl-10 text-sm text-fog-100 transition placeholder:text-fog-700 hover:border-ink-500 focus:border-signal-500/60 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:w-auto sm:grid-cols-2 lg:w-[28rem]">
        <KategoriFiltresi deger={props.kategoriId} onDegis={props.onKategori} />
        <ModelFiltresi deger={props.ihaModeliId} onDegis={props.onIhaModeli} />
      </div>

      <div className="flex items-center gap-2 lg:ml-auto">
        {props.filtreVar && (
          <button
            type="button"
            onClick={props.onTemizle}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink-600 px-3 py-2.5 text-xs text-fog-500 transition hover:border-ink-500 hover:text-fog-300"
          >
            <X className="size-3.5" strokeWidth={2} />
            Temizle
          </button>
        )}

        {props.yonetici && (
          <Link
            to="/parcalar/yeni"
            className="inline-flex items-center gap-2 rounded-lg bg-signal-500 px-4 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-signal-400"
          >
            <Plus className="size-4" strokeWidth={2.5} />
            Yeni Parça
          </Link>
        )}
      </div>
    </div>
  );
}

/* Dropdown'lar kendi verisini çeksin ki araç çubuğu prop yığınına dönmesin. */

function KategoriFiltresi({
  deger,
  onDegis,
}: {
  deger: number | undefined;
  onDegis: (deger: number | undefined) => void;
}) {
  const { data, isPending } = useKategoriler();

  return (
    <FiltreSecici
      label="Kategori"
      deger={deger}
      onDegis={onDegis}
      yukleniyor={isPending}
      tumuEtiketi="Tüm kategoriler"
      secenekler={(data ?? []).map((k) => ({ deger: k.id, etiket: k.ad }))}
    />
  );
}

function ModelFiltresi({
  deger,
  onDegis,
}: {
  deger: number | undefined;
  onDegis: (deger: number | undefined) => void;
}) {
  const { data, isPending } = useIhaModelleri();

  return (
    <FiltreSecici
      label="İHA modeli"
      deger={deger}
      onDegis={onDegis}
      yukleniyor={isPending}
      tumuEtiketi="Tüm İHA modelleri"
      secenekler={(data ?? []).map((m) => ({ deger: m.id, etiket: `${m.ad} · ${m.uretici}` }))}
    />
  );
}

function Baslik({ children, className = '' }: { children: string; className?: string }) {
  return (
    <th
      scope="col"
      className={`label-micro px-4 py-3 text-left font-normal whitespace-nowrap ${className}`}
    >
      {children}
    </th>
  );
}

function Hucre({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
}
