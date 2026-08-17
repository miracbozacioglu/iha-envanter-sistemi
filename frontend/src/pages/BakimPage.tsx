import { PlaneTakeoff, Replace, Wrench, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bos, Hata, Yukleniyor } from '../components/ui/DurumKutusu';
import { Rozet } from '../components/ui/Rozet';
import { Sayfalama } from '../components/ui/Sayfalama';
import { useAraclar, useBakimKayitlari } from '../hooks/useBakim';
import { hataMesaji } from '../lib/api';
import { BAKIM_TIP_BILGISI, BAKIM_TIPLERI_LISTE } from '../lib/bakim';
import { tarihSaatYaz } from '../lib/talep';
import type { BakimDetay, BakimTipi } from '../types';

const SAYFA_BOYUTU = 20;

type TipFiltresi = BakimTipi | 'HEPSI';

export function BakimPage() {
  const [aracId, setAracId] = useState<number | undefined>();
  const [tip, setTip] = useState<TipFiltresi>('HEPSI');
  const [page, setPage] = useState(1);

  const araclar = useAraclar();
  const kayitlar = useBakimKayitlari({
    ihaAraciId: aracId,
    tip: tip === 'HEPSI' ? undefined : tip,
    page,
    limit: SAYFA_BOYUTU,
  });

  const filtreVar = aracId !== undefined || tip !== 'HEPSI';

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <select
          value={aracId ?? ''}
          onChange={(e) => {
            setAracId(e.target.value === '' ? undefined : Number(e.target.value));
            setPage(1);
          }}
          aria-label="Araca göre filtrele"
          disabled={araclar.isPending}
          className={`cursor-pointer rounded-lg border bg-ink-850 py-2.5 pr-9 pl-3.5 text-sm transition hover:border-ink-500 focus:border-signal-500/60 focus:outline-none disabled:cursor-wait disabled:opacity-60 lg:w-80 ${
            aracId ? 'border-signal-500/40 text-fog-100' : 'border-ink-600 text-fog-500'
          }`}
        >
          <option value="">{araclar.isPending ? 'Yükleniyor…' : 'Tüm araçlar'}</option>
          {(araclar.data ?? []).map((arac) => (
            <option key={arac.id} value={arac.id}>
              {arac.kuyrukNo}
              {arac.ihaModeli ? ` · ${arac.ihaModeli.ad}` : ''}
            </option>
          ))}
        </select>

        <div className="inline-flex gap-1 self-start rounded-lg border border-ink-700 bg-ink-900 p-1 lg:self-auto">
          <TipDugmesi
            aktif={tip === 'HEPSI'}
            onClick={() => {
              setTip('HEPSI');
              setPage(1);
            }}
            etiket="Hepsi"
            aktifSinif="bg-ink-700 text-fog-100"
          />
          {BAKIM_TIPLERI_LISTE.map((secenek) => (
            <TipDugmesi
              key={secenek}
              aktif={tip === secenek}
              onClick={() => {
                setTip(secenek);
                setPage(1);
              }}
              etiket={BAKIM_TIP_BILGISI[secenek].etiket}
              aktifSinif={
                secenek === 'DEGISTIRILDI'
                  ? 'bg-info-500/15 text-info-400'
                  : 'bg-success-500/15 text-success-400'
              }
            />
          ))}
        </div>

        {filtreVar && (
          <button
            type="button"
            onClick={() => {
              setAracId(undefined);
              setTip('HEPSI');
              setPage(1);
            }}
            className="inline-flex items-center gap-1.5 self-start rounded-lg border border-ink-600 px-3 py-2.5 text-xs text-fog-500 transition hover:border-ink-500 hover:text-fog-300 lg:self-auto"
          >
            <X className="size-3.5" strokeWidth={2} />
            Temizle
          </button>
        )}

        <Link
          to="/araclar"
          className="inline-flex items-center gap-2 rounded-lg border border-ink-600 bg-ink-800 px-3.5 py-2.5 text-sm text-fog-300 transition hover:border-signal-500/40 hover:text-fog-100 lg:ml-auto"
        >
          <PlaneTakeoff className="size-4" strokeWidth={1.75} />
          Araç listesi
        </Link>
      </div>

      <div className="panel overflow-hidden">
        {kayitlar.isPending ? (
          <Yukleniyor mesaj="Bakım kayıtları yükleniyor" />
        ) : kayitlar.isError ? (
          <Hata
            mesaj={hataMesaji(kayitlar.error)}
            onTekrarDene={() => {
              void kayitlar.refetch();
            }}
          />
        ) : kayitlar.data.data.length === 0 ? (
          <Bos
            baslik={filtreVar ? 'Filtrelerle eşleşen kayıt yok' : 'Henüz bakım kaydı yok'}
            aciklama={
              filtreVar
                ? 'Farklı bir araç veya işlem tipi seçmeyi deneyin.'
                : 'Araç detayından parça değişimi veya tamir kaydı ekleyebilirsiniz.'
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[68rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-ink-700 bg-ink-900/60">
                    <Baslik className="w-40">Tarih</Baslik>
                    <Baslik className="w-36">İşlem</Baslik>
                    <Baslik className="w-36">Araç</Baslik>
                    <Baslik className="w-64">Parça</Baslik>
                    <Baslik className="w-40">Yapan</Baslik>
                    <Baslik>Açıklama</Baslik>
                  </tr>
                </thead>
                <tbody>
                  {kayitlar.data.data.map((kayit) => (
                    <KayitSatiri key={kayit.id} kayit={kayit} />
                  ))}
                </tbody>
              </table>
            </div>

            <Sayfalama
              page={kayitlar.data.page}
              limit={kayitlar.data.limit}
              total={kayitlar.data.total}
              totalPages={kayitlar.data.totalPages}
              onDegis={setPage}
              bekliyor={kayitlar.isFetching}
            />
          </>
        )}
      </div>
    </div>
  );
}

function KayitSatiri({ kayit }: { kayit: BakimDetay }) {
  const bilgi = BAKIM_TIP_BILGISI[kayit.tip];
  const Icon = kayit.tip === 'DEGISTIRILDI' ? Replace : Wrench;

  return (
    <tr className="border-b border-ink-800 last:border-b-0 hover:bg-ink-800/40">
      <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-fog-500 tabular-nums">
        {tarihSaatYaz(kayit.tarih)}
      </td>
      <td className="px-4 py-3">
        <Rozet ton={bilgi.ton} mono>
          <Icon className="size-3" strokeWidth={2.5} />
          {bilgi.etiket}
        </Rozet>
      </td>
      <td className="px-4 py-3">
        <Link
          to={`/araclar/${kayit.ihaAraciId}`}
          className="font-mono text-xs text-signal-400 transition hover:text-signal-300"
        >
          {kayit.ihaArac.kuyrukNo}
        </Link>
      </td>
      <td className="px-4 py-3">
        <Link to={`/parcalar/${kayit.parcaId}`} className="group flex items-center gap-2">
          <span className="font-mono text-xs text-fog-500 transition group-hover:text-signal-400">
            {kayit.parca.kod}
          </span>
          <span className="min-w-0 truncate text-fog-300">{kayit.parca.ad}</span>
        </Link>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-fog-300">
        {kayit.kullanici.ad} {kayit.kullanici.soyad}
      </td>
      <td className="px-4 py-3 text-fog-500">
        {kayit.aciklama ? kayit.aciklama : <span className="text-fog-700 italic">—</span>}
      </td>
    </tr>
  );
}

function TipDugmesi({
  aktif,
  onClick,
  etiket,
  aktifSinif,
}: {
  aktif: boolean;
  onClick: () => void;
  etiket: string;
  aktifSinif: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={aktif}
      onClick={onClick}
      className={`rounded-md px-3.5 py-2 text-sm font-medium whitespace-nowrap transition ${
        aktif ? aktifSinif : 'text-fog-500 hover:text-fog-300'
      }`}
    >
      {etiket}
    </button>
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
