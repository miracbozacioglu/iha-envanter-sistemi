import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Boxes,
  PencilLine,
  PlaneTakeoff,
  TriangleAlert,
  Warehouse,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bos, Hata, Yukleniyor } from '../components/ui/DurumKutusu';
import { Rozet } from '../components/ui/Rozet';
import { Sayfalama } from '../components/ui/Sayfalama';
import { StokRozeti } from '../components/ui/StokRozeti';
import { CornerFrame } from '../components/ui/CornerFrame';
import { useAuth } from '../hooks/useAuth';
import { useParca, useParcaHareketler } from '../hooks/useParcalar';
import { hataMesaji } from '../lib/api';
import { stokDurumu, toplamStok } from '../lib/stok';
import type { HareketTipi, ParcaDetay, StokHareketi } from '../types';

const HAREKET_SAYFA_BOYUTU = 10;

export function ParcaDetayPage() {
  const { id } = useParams();
  const parcaId = Number(id);
  const gecerliId = Number.isInteger(parcaId) && parcaId > 0;

  const parca = useParca(gecerliId ? parcaId : undefined);

  if (!gecerliId) {
    return (
      <div className="panel">
        <Hata mesaj={`"${id}" geçerli bir parça numarası değil.`} />
      </div>
    );
  }

  if (parca.isPending) {
    return (
      <div className="panel">
        <Yukleniyor mesaj="Parça bilgileri yükleniyor" />
      </div>
    );
  }

  if (parca.isError) {
    return (
      <div className="space-y-5">
        <GeriBaglantisi />
        <div className="panel">
          <Hata
            mesaj={hataMesaji(parca.error, 'Parça bilgileri alınamadı.')}
            onTekrarDene={() => {
              void parca.refetch();
            }}
          />
        </div>
      </div>
    );
  }

  return <Icerik parca={parca.data} parcaId={parcaId} />;
}

function Icerik({ parca, parcaId }: { parca: ParcaDetay; parcaId: number }) {
  const { user } = useAuth();
  const yonetici = user?.rol === 'YONETICI';

  const toplam = toplamStok(parca.stokKalemler);
  const durum = stokDurumu(toplam, parca.kritikSeviye);

  return (
    <div className="space-y-5">
      <GeriBaglantisi />

      {/* Başlık bloğu */}
      <section className="panel relative overflow-hidden px-6 py-6">
        <CornerFrame size={20} />

        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-md border border-signal-500/30 bg-signal-900/50 px-2 py-1 font-mono text-xs text-signal-400">
                {parca.kod}
              </span>
              <Rozet ton="haki">{parca.kategori.ad}</Rozet>
              {parca.arizali && (
                <Rozet ton="kritik" mono>
                  <TriangleAlert className="size-3" strokeWidth={2.25} />
                  Arızalı
                </Rozet>
              )}
            </div>

            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-fog-100">{parca.ad}</h2>

            {parca.aciklama ? (
              <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-fog-500">
                {parca.aciklama}
              </p>
            ) : (
              <p className="mt-2.5 text-sm text-fog-700 italic">Açıklama girilmemiş.</p>
            )}
          </div>

          <div className="flex shrink-0 flex-col items-end gap-3">
            <div className="text-right">
              <p className="label-micro">Toplam stok</p>
              <p className="mt-1.5 font-mono text-3xl leading-none font-semibold text-fog-100 tabular-nums">
                {toplam}
                <span className="ml-1.5 text-sm font-normal text-fog-700">{parca.birim}</span>
              </p>
            </div>
            <StokRozeti durum={durum} />

            {yonetici && (
              <Link
                to={`/parcalar/${parca.id}/duzenle`}
                className="mt-1 inline-flex items-center gap-2 rounded-lg border border-ink-600 bg-ink-800 px-3.5 py-2 text-xs font-medium text-fog-300 transition hover:border-signal-500/40 hover:text-fog-100"
              >
                <PencilLine className="size-3.5" strokeWidth={2} />
                Düzenle
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="order-2 space-y-5 xl:order-1">
          <HareketGecmisi parcaId={parcaId} />
        </div>

        <div className="order-1 space-y-5 xl:order-2">
          <Kunye parca={parca} />
          <DepoStoklari parca={parca} />
          <UyumluModeller parca={parca} />
        </div>
      </div>
    </div>
  );
}

function GeriBaglantisi() {
  return (
    <Link
      to="/parcalar"
      className="inline-flex items-center gap-2 text-xs text-fog-500 transition hover:text-signal-400"
    >
      <ArrowLeft className="size-3.5" strokeWidth={2} />
      Parça listesine dön
    </Link>
  );
}

function Bolum({
  baslik,
  ikon,
  sagUst,
  children,
}: {
  baslik: string;
  ikon: ReactNode;
  sagUst?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="panel overflow-hidden">
      <header className="flex items-center gap-2.5 border-b border-ink-700 px-4 py-3">
        <span className="text-fog-700">{ikon}</span>
        <h3 className="label-micro flex-1 text-fog-500">{baslik}</h3>
        {sagUst}
      </header>
      {children}
    </section>
  );
}

function Kunye({ parca }: { parca: ParcaDetay }) {
  return (
    <Bolum baslik="Künye" ikon={<Boxes className="size-4" strokeWidth={1.75} />}>
      <dl className="divide-y divide-ink-800">
        <Satir etiket="Kategori">{parca.kategori.ad}</Satir>
        <Satir etiket="Birim">
          <span className="font-mono text-xs">{parca.birim}</span>
        </Satir>
        <Satir etiket="Kritik seviye">
          <span className="font-mono tabular-nums">{parca.kritikSeviye}</span>
        </Satir>
        <Satir etiket="Arızalı">
          {parca.arizali ? (
            <Rozet ton="kritik" mono>
              Evet
            </Rozet>
          ) : (
            <Rozet ton="sinyal" mono>
              Hayır
            </Rozet>
          )}
        </Satir>
        <Satir etiket="Kayıt">
          <span className="font-mono text-xs tabular-nums">{tarihYaz(parca.olusturma)}</span>
        </Satir>
        <Satir etiket="Güncelleme">
          <span className="font-mono text-xs tabular-nums">{tarihYaz(parca.guncelleme)}</span>
        </Satir>
      </dl>
    </Bolum>
  );
}

function Satir({ etiket, children }: { etiket: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5">
      <dt className="text-xs text-fog-700">{etiket}</dt>
      <dd className="text-right text-sm text-fog-300">{children}</dd>
    </div>
  );
}

function DepoStoklari({ parca }: { parca: ParcaDetay }) {
  const toplam = toplamStok(parca.stokKalemler);

  return (
    <Bolum
      baslik="Depo bazlı stok"
      ikon={<Warehouse className="size-4" strokeWidth={1.75} />}
      sagUst={
        <span className="font-mono text-xs text-fog-500 tabular-nums">
          {toplam} {parca.birim}
        </span>
      }
    >
      {parca.stokKalemler.length === 0 ? (
        <Bos baslik="Hiçbir depoda kayıt yok" aciklama="Bu parça için stok kalemi açılmamış." />
      ) : (
        <ul className="divide-y divide-ink-800">
          {parca.stokKalemler.map((kalem) => (
            <li key={kalem.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="min-w-0">
                <span className="block truncate text-sm text-fog-100">{kalem.depo.ad}</span>
                <span className="mt-0.5 block truncate font-mono text-[0.625rem] tracking-[0.08em] text-fog-700 uppercase">
                  {kalem.rafKodu ? `Raf ${kalem.rafKodu}` : 'Raf kodu yok'}
                  {kalem.depo.lokasyon ? ` · ${kalem.depo.lokasyon}` : ''}
                </span>
              </span>
              <span
                className={`shrink-0 font-mono text-lg tabular-nums ${
                  kalem.miktar === 0 ? 'text-danger-400' : 'text-fog-100'
                }`}
              >
                {kalem.miktar}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Bolum>
  );
}

function UyumluModeller({ parca }: { parca: ParcaDetay }) {
  return (
    <Bolum
      baslik="Uyumlu İHA modelleri"
      ikon={<PlaneTakeoff className="size-4" strokeWidth={1.75} />}
      sagUst={
        <span className="font-mono text-xs text-fog-500 tabular-nums">
          {parca.uyumluluklar.length}
        </span>
      }
    >
      {parca.uyumluluklar.length === 0 ? (
        <Bos
          baslik="Uyumluluk tanımlanmamış"
          aciklama="Bu parça henüz bir İHA modeliyle eşleştirilmemiş."
        />
      ) : (
        <div className="flex flex-wrap gap-2 p-4">
          {parca.uyumluluklar.map((uyum) => (
            <Rozet key={uyum.ihaModeliId} ton="sinyal">
              <span className="font-medium">{uyum.ihaModeli.ad}</span>
              <span className="text-fog-700">·</span>
              <span className="text-fog-500">{uyum.ihaModeli.uretici}</span>
            </Rozet>
          ))}
        </div>
      )}
    </Bolum>
  );
}

function HareketGecmisi({ parcaId }: { parcaId: number }) {
  const [page, setPage] = useState(1);
  const hareketler = useParcaHareketler(parcaId, page, HAREKET_SAYFA_BOYUTU);

  return (
    <Bolum
      baslik="Stok hareket geçmişi"
      ikon={<ArrowUpRight className="size-4" strokeWidth={1.75} />}
      sagUst={
        hareketler.data ? (
          <span className="font-mono text-xs text-fog-500 tabular-nums">
            {hareketler.data.total} kayıt
          </span>
        ) : null
      }
    >
      {hareketler.isPending ? (
        <Yukleniyor mesaj="Hareketler yükleniyor" />
      ) : hareketler.isError ? (
        <Hata
          mesaj={hataMesaji(hareketler.error, 'Hareket geçmişi alınamadı.')}
          onTekrarDene={() => {
            void hareketler.refetch();
          }}
        />
      ) : hareketler.data.data.length === 0 ? (
        <Bos
          baslik="Hareket kaydı yok"
          aciklama="Bu parça için henüz giriş veya çıkış işlemi yapılmamış."
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-ink-700 bg-ink-900/60">
                  <Baslik className="w-40">Tarih</Baslik>
                  <Baslik className="w-28">Tip</Baslik>
                  <Baslik className="w-24 text-right">Miktar</Baslik>
                  <Baslik className="w-40">Depo</Baslik>
                  <Baslik>Açıklama</Baslik>
                  <Baslik className="w-40">Kullanıcı</Baslik>
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
    </Bolum>
  );
}

function HareketSatiri({ hareket }: { hareket: StokHareketi }) {
  const giris = hareket.tip === 'GIRIS';

  return (
    <tr className="border-b border-ink-800 last:border-b-0">
      <td className="px-4 py-3 font-mono text-xs text-fog-500 whitespace-nowrap tabular-nums">
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
      <td className="px-4 py-3 text-fog-300">{hareket.depo?.ad ?? '—'}</td>
      <td className="px-4 py-3 text-fog-500">
        {hareket.aciklama ? (
          hareket.aciklama
        ) : (
          <span className="text-fog-700 italic">—</span>
        )}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-fog-300">
        {hareket.kullanici ? `${hareket.kullanici.ad} ${hareket.kullanici.soyad}` : '—'}
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

function tarihYaz(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
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
