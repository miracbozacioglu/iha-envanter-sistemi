import { ArrowDownLeft, ArrowLeft, ArrowUpRight, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bos, Hata, Yukleniyor } from '../components/ui/DurumKutusu';
import { ParcaSecici } from '../components/ui/ParcaSecici';
import { Sayfalama } from '../components/ui/Sayfalama';
import { useStokHareketleri } from '../hooks/useStok';
import { hataMesaji } from '../lib/api';
import type { HareketDetay, HareketTipi } from '../types';

const SAYFA_BOYUTU = 20;

type TipFiltresi = HareketTipi | 'HEPSI';

export function StokHareketleriPage() {
  const [parcaDegeri, setParcaDegeri] = useState('');
  const [tip, setTip] = useState<TipFiltresi>('HEPSI');
  const [page, setPage] = useState(1);

  const hareketler = useStokHareketleri({
    parcaId: parcaDegeri ? Number(parcaDegeri) : undefined,
    tip: tip === 'HEPSI' ? undefined : tip,
    page,
    limit: SAYFA_BOYUTU,
  });

  const filtreVar = parcaDegeri !== '' || tip !== 'HEPSI';

  function filtreleriTemizle() {
    setParcaDegeri('');
    setTip('HEPSI');
    setPage(1);
  }

  return (
    <div className="space-y-5">
      <Link
        to="/stok"
        className="inline-flex items-center gap-2 text-xs text-fog-500 transition hover:text-signal-400"
      >
        <ArrowLeft className="size-3.5" strokeWidth={2} />
        Stok işlemlerine dön
      </Link>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="lg:w-96">
          <ParcaSecici
            value={parcaDegeri}
            placeholder="Parçaya göre filtrele…"
            onChange={(deger) => {
              setParcaDegeri(deger);
              setPage(1);
            }}
          />
        </div>

        <div className="inline-flex rounded-lg border border-ink-700 bg-ink-900 p-1">
          {(['HEPSI', 'GIRIS', 'CIKIS'] as const).map((secenek) => (
            <TipDugmesi
              key={secenek}
              secenek={secenek}
              aktif={tip === secenek}
              onClick={() => {
                setTip(secenek);
                setPage(1);
              }}
            />
          ))}
        </div>

        {filtreVar && (
          <button
            type="button"
            onClick={filtreleriTemizle}
            className="inline-flex items-center gap-1.5 self-start rounded-lg border border-ink-600 px-3 py-2.5 text-xs text-fog-500 transition hover:border-ink-500 hover:text-fog-300 lg:self-auto"
          >
            <X className="size-3.5" strokeWidth={2} />
            Temizle
          </button>
        )}
      </div>

      <div className="panel overflow-hidden">
        {hareketler.isPending ? (
          <Yukleniyor mesaj="Hareketler yükleniyor" />
        ) : hareketler.isError ? (
          <Hata
            mesaj={hataMesaji(hareketler.error)}
            onTekrarDene={() => {
              void hareketler.refetch();
            }}
          />
        ) : hareketler.data.data.length === 0 ? (
          <Bos
            baslik={filtreVar ? 'Filtrelerle eşleşen hareket yok' : 'Henüz hareket kaydı yok'}
            aciklama={
              filtreVar
                ? 'Farklı bir parça veya tip seçmeyi deneyin.'
                : 'Stok girişi veya çıkışı yapıldıkça kayıtlar burada listelenir.'
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[64rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-ink-700 bg-ink-900/60">
                    <Baslik className="w-40">Tarih</Baslik>
                    <Baslik className="w-28">Tip</Baslik>
                    <Baslik className="w-24 text-right">Miktar</Baslik>
                    <Baslik className="w-64">Parça</Baslik>
                    <Baslik className="w-36">Depo</Baslik>
                    <Baslik className="w-36">Kullanıcı</Baslik>
                    <Baslik>Açıklama</Baslik>
                  </tr>
                </thead>
                <tbody>
                  {hareketler.data.data.map((hareket) => (
                    <HareketSatiri key={hareket.id} hareket={hareket} />
                  ))}
                </tbody>
              </table>
            </div>

            <Sayfalama
              page={hareketler.data.page}
              limit={hareketler.data.limit}
              total={hareketler.data.total}
              totalPages={hareketler.data.totalPages}
              onDegis={setPage}
              bekliyor={hareketler.isFetching}
            />
          </>
        )}
      </div>
    </div>
  );
}

function TipDugmesi({
  secenek,
  aktif,
  onClick,
}: {
  secenek: TipFiltresi;
  aktif: boolean;
  onClick: () => void;
}) {
  const etiket = secenek === 'HEPSI' ? 'Hepsi' : secenek === 'GIRIS' ? 'Giriş' : 'Çıkış';

  const aktifSinif =
    secenek === 'GIRIS'
      ? 'bg-signal-500/12 text-signal-400'
      : secenek === 'CIKIS'
        ? 'bg-alert-400/12 text-alert-400'
        : 'bg-ink-700 text-fog-100';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={aktif}
      className={`rounded-md px-3.5 py-2 text-sm font-medium transition ${
        aktif ? aktifSinif : 'text-fog-500 hover:text-fog-300'
      }`}
    >
      {etiket}
    </button>
  );
}

function HareketSatiri({ hareket }: { hareket: HareketDetay }) {
  const giris = hareket.tip === 'GIRIS';

  return (
    <tr className="border-b border-ink-800 last:border-b-0 hover:bg-ink-800/40">
      <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-fog-500 tabular-nums">
        {tarihSaatYaz(hareket.tarih)}
      </td>
      <td className="px-4 py-3">
        <HareketTipRozeti tip={hareket.tip} />
      </td>
      <td
        className={`px-4 py-3 text-right font-mono tabular-nums ${
          giris ? 'text-signal-400' : 'text-alert-400'
        }`}
      >
        {giris ? '+' : '−'}
        {hareket.miktar}
      </td>
      <td className="px-4 py-3">
        <Link to={`/parcalar/${hareket.parcaId}`} className="group flex items-center gap-2">
          <span className="font-mono text-xs text-signal-400 transition group-hover:text-signal-300">
            {hareket.parca.kod}
          </span>
          <span className="min-w-0 truncate text-fog-300">{hareket.parca.ad}</span>
        </Link>
      </td>
      <td className="px-4 py-3 text-fog-500">{hareket.depo.ad}</td>
      <td className="px-4 py-3 whitespace-nowrap text-fog-300">
        {hareket.kullanici.ad} {hareket.kullanici.soyad}
      </td>
      <td className="px-4 py-3 text-fog-500">
        {hareket.aciklama ? hareket.aciklama : <span className="text-fog-700 italic">—</span>}
      </td>
    </tr>
  );
}

function HareketTipRozeti({ tip }: { tip: HareketTipi }) {
  const giris = tip === 'GIRIS';
  const Icon = giris ? ArrowDownLeft : ArrowUpRight;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[0.625rem] tracking-[0.1em] uppercase ${
        giris
          ? 'border-signal-500/30 bg-signal-900/50 text-signal-400'
          : 'border-alert-400/30 bg-alert-400/10 text-alert-400'
      }`}
    >
      <Icon className="size-3" strokeWidth={2.5} />
      {giris ? 'Giriş' : 'Çıkış'}
    </span>
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

function tarihSaatYaz(iso: string): string {
  return new Date(iso).toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
