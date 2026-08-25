import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  ClipboardList,
  Drone,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { DurumDagilimGrafigi } from '../components/DurumDagilimGrafigi';
import { CornerFrame } from '../components/ui/CornerFrame';
import { Hata } from '../components/ui/DurumKutusu';
import { useAuth } from '../hooks/useAuth';
import { useIstatistik } from '../hooks/useIstatistik';
import { hataMesaji } from '../lib/api';
import { NAV_GROUPS } from '../lib/navigation';
import { STOK_DURUM_BILGISI, stokDurumu } from '../lib/stok';
import { tarihSaatYaz } from '../lib/talep';
import type { IstatistikOzeti, OzetHareket, OzetKritikParca } from '../types';

export function DashboardPage() {
  const { user, hasRole } = useAuth();
  const ozet = useIstatistik();

  // Kullanıcının gerçekten girebileceği bölümler — Dashboard'ın kendisi hariç.
  const kisayollar = NAV_GROUPS.flatMap((grup) => grup.items).filter(
    (item) => item.to !== '/' && hasRole(item.roller),
  );

  return (
    <div className="space-y-6">
      <section className="panel relative overflow-hidden px-6 py-8 sm:px-8 sm:py-10">
        <CornerFrame size={22} />
        <div
          aria-hidden="true"
          className="absolute -top-24 -right-16 size-72 rounded-full bg-signal-500/8 blur-3xl"
        />

        <div className="relative">
          <p className="label-micro">
            {new Date().toLocaleDateString('tr-TR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-fog-100 sm:text-3xl">
            Hoş geldin, <span className="text-signal-400">{user?.ad}</span>
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-fog-500">
            {user?.rol === 'YONETICI'
              ? 'Yönetici oturumu açık. Stok, sipariş ve kullanıcı yönetimi dahil tüm modüllere erişebilirsin.'
              : 'Teknisyen oturumu açık. Parça kataloğunu görüntüleyebilir, talep açabilir ve bakım kaydı girebilirsin.'}
          </p>
        </div>
      </section>

      {ozet.isError ? (
        <div className="panel">
          <Hata
            mesaj={hataMesaji(ozet.error, 'Özet veriler alınamadı.')}
            onTekrarDene={() => {
              void ozet.refetch();
            }}
          />
        </div>
      ) : ozet.isPending ? (
        <Iskelet />
      ) : (
        <Ozet veri={ozet.data} />
      )}

      <section>
        <div className="mb-4 flex items-center gap-3">
          <p className="label-micro">Modüller</p>
          <span aria-hidden="true" className="h-px flex-1 bg-ink-700" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {kisayollar.map((item) => (
            <ModulKarti key={item.to} to={item.to} icon={item.icon} baslik={item.label}>
              {item.aciklama}
            </ModulKarti>
          ))}
        </div>
      </section>
    </div>
  );
}

function Ozet({ veri }: { veri: IstatistikOzeti }) {
  const kritikVar = veri.kritikStokSayisi > 0;

  return (
    <>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <OzetKarti
          icon={Boxes}
          etiket="Toplam parça"
          deger={veri.toplamParca}
          altBilgi={`${veri.toplamKategori} kategori`}
          to="/parcalar"
        />
        <OzetKarti icon={Drone} etiket="Toplam araç" deger={veri.toplamArac} to="/araclar" />
        <OzetKarti
          icon={ClipboardList}
          etiket="Bekleyen talep"
          deger={veri.bekleyenTalep}
          vurgu={veri.bekleyenTalep > 0 ? 'uyari' : undefined}
          to="/talepler?durum=BEKLIYOR"
        />
        <OzetKarti
          icon={TriangleAlert}
          etiket="Kritik stok"
          deger={veri.kritikStokSayisi}
          vurgu={kritikVar ? 'kritik' : undefined}
          altBilgi={kritikVar ? 'Tedarik gerekiyor' : 'Sorun yok'}
          to="/parcalar"
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <KritikParcalar kayitlar={veri.kritikParcalar} toplam={veri.kritikStokSayisi} />

        <section className="panel overflow-hidden">
          <header className="border-b border-ink-700 px-5 py-3">
            <h3 className="label-micro">Talep durum dağılımı</h3>
          </header>
          <DurumDagilimGrafigi dagilim={veri.durumDagilimi} />
        </section>
      </div>

      <SonHareketler kayitlar={veri.sonHareketler} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Özet kartlar                                                        */
/* ------------------------------------------------------------------ */

interface OzetKartiProps {
  icon: LucideIcon;
  etiket: string;
  deger: number;
  altBilgi?: string;
  to: string;
  vurgu?: 'kritik' | 'uyari';
}

function OzetKarti({ icon: Icon, etiket, deger, altBilgi, to, vurgu }: OzetKartiProps) {
  const kenar =
    vurgu === 'kritik'
      ? 'border-danger-500/40 hover:border-danger-500/60'
      : vurgu === 'uyari'
        ? 'border-alert-400/35 hover:border-alert-400/60'
        : 'border-ink-700 hover:border-signal-500/40';

  const ikonSinifi =
    vurgu === 'kritik'
      ? 'border-danger-500/30 bg-danger-900/50 text-danger-400'
      : vurgu === 'uyari'
        ? 'border-alert-400/30 bg-alert-400/10 text-alert-400'
        : 'border-signal-500/25 bg-signal-900/40 text-signal-400';

  const sayiSinifi =
    vurgu === 'kritik' ? 'text-danger-400' : vurgu === 'uyari' ? 'text-alert-400' : 'text-fog-100';

  return (
    <Link
      to={to}
      className={`panel group flex items-start justify-between gap-4 border p-5 transition hover:bg-ink-800 ${kenar}`}
    >
      <div className="min-w-0">
        <p className="label-micro">{etiket}</p>
        <p className={`mt-3 font-mono text-3xl leading-none font-semibold tabular-nums ${sayiSinifi}`}>
          {deger}
        </p>
        {altBilgi && <p className="mt-2 truncate text-xs text-fog-700">{altBilgi}</p>}
      </div>
      <span className={`grid size-10 shrink-0 place-items-center rounded-lg border ${ikonSinifi}`}>
        <Icon className="size-5" strokeWidth={1.75} />
      </span>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Kritik parçalar                                                     */
/* ------------------------------------------------------------------ */

function KritikParcalar({
  kayitlar,
  toplam,
}: {
  kayitlar: OzetKritikParca[];
  toplam: number;
}) {
  return (
    <section className="panel overflow-hidden">
      <header className="flex items-center gap-2.5 border-b border-ink-700 px-5 py-3">
        <TriangleAlert
          className={`size-4 ${toplam > 0 ? 'text-danger-400' : 'text-fog-700'}`}
          strokeWidth={1.75}
        />
        <h3 className="label-micro flex-1">Kritik parçalar</h3>
        {toplam > kayitlar.length && (
          <span className="font-mono text-xs text-fog-500 tabular-nums">
            {kayitlar.length}/{toplam}
          </span>
        )}
      </header>

      {kayitlar.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <span className="grid size-11 place-items-center rounded-xl border border-success-500/30 bg-success-900/40 text-success-400">
            <Boxes className="size-5" strokeWidth={1.75} />
          </span>
          <div>
            <p className="text-sm font-medium text-success-300">Kritik seviyede parça yok</p>
            <p className="mt-1.5 text-xs leading-relaxed text-fog-700">
              Tüm parçaların stoğu kritik eşiğin üzerinde.
            </p>
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-ink-800">
          {kayitlar.map((parca) => {
            const durum = stokDurumu(parca.toplamStok, parca.kritikSeviye);
            const bilgi = STOK_DURUM_BILGISI[durum];

            return (
              <li key={parca.id}>
                <Link
                  to={`/parcalar/${parca.id}`}
                  className="flex items-center gap-3 px-5 py-3 transition hover:bg-ink-800/60"
                >
                  <span
                    aria-hidden="true"
                    className={`size-1.5 shrink-0 rounded-full ${bilgi.nokta}`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-fog-100">{parca.ad}</span>
                    <span className="mt-0.5 block font-mono text-[0.625rem] text-fog-700">
                      {parca.kod}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className={`block font-mono text-sm tabular-nums ${bilgi.metin}`}>
                      {parca.toplamStok}
                    </span>
                    <span className="mt-0.5 block font-mono text-[0.625rem] text-fog-700 tabular-nums">
                      eşik {parca.kritikSeviye}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Son hareketler                                                      */
/* ------------------------------------------------------------------ */

function SonHareketler({ kayitlar }: { kayitlar: OzetHareket[] }) {
  return (
    <section className="panel overflow-hidden">
      <header className="flex items-center gap-2.5 border-b border-ink-700 px-5 py-3">
        <ArrowUpRight className="size-4 text-fog-700" strokeWidth={1.75} />
        <h3 className="label-micro flex-1">Son stok hareketleri</h3>
      </header>

      {kayitlar.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <p className="text-sm font-medium text-fog-300">Henüz hareket yok</p>
          <p className="mt-1.5 text-xs leading-relaxed text-fog-700">
            Stok girişi veya çıkışı yapıldıkça son işlemler burada görünür.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-ink-800">
          {kayitlar.map((hareket) => {
            const giris = hareket.tip === 'GIRIS';

            return (
              <li key={hareket.id}>
                <Link
                  to={`/parcalar/${hareket.parca.id}`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3 transition hover:bg-ink-800/60"
                >
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-lg border ${
                      giris
                        ? 'border-signal-500/30 bg-signal-900/50 text-signal-400'
                        : 'border-alert-400/30 bg-alert-400/10 text-alert-400'
                    }`}
                  >
                    {giris ? (
                      <ArrowDownLeft className="size-4" strokeWidth={2.25} />
                    ) : (
                      <ArrowUpRight className="size-4" strokeWidth={2.25} />
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-fog-100">{hareket.parca.ad}</span>
                    <span className="mt-0.5 block font-mono text-[0.625rem] text-fog-700">
                      {hareket.parca.kod}
                    </span>
                  </span>

                  <span
                    className={`shrink-0 font-mono text-sm tabular-nums ${
                      giris ? 'text-signal-400' : 'text-alert-400'
                    }`}
                  >
                    {giris ? '+' : '−'}
                    {hareket.miktar}
                  </span>

                  <span className="hidden shrink-0 text-right sm:block">
                    <span className="block text-xs text-fog-300">
                      {hareket.kullanici.ad} {hareket.kullanici.soyad}
                    </span>
                    <span className="mt-0.5 block font-mono text-[0.625rem] text-fog-700 tabular-nums">
                      {tarihSaatYaz(hareket.tarih)}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Yükleniyor iskeleti                                                 */
/* ------------------------------------------------------------------ */

function Iskelet() {
  return (
    <div aria-busy="true" aria-label="Özet yükleniyor" className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="panel h-[6.75rem] animate-pulse bg-ink-850/60" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="panel h-64 animate-pulse bg-ink-850/60" />
        <div className="panel h-64 animate-pulse bg-ink-850/60" />
      </div>
      <div className="panel h-72 animate-pulse bg-ink-850/60" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modül kısayolları                                                   */
/* ------------------------------------------------------------------ */

interface ModulKartiProps {
  to: string;
  icon: LucideIcon;
  baslik: string;
  children: string;
}

function ModulKarti({ to, icon: Icon, baslik, children }: ModulKartiProps) {
  return (
    <Link
      to={to}
      className="panel group flex flex-col gap-3 p-5 transition hover:border-signal-500/40 hover:bg-ink-800"
    >
      <span className="flex items-center justify-between">
        <Icon className="size-5 text-signal-400" strokeWidth={1.75} />
        <ArrowRight
          className="size-4 text-fog-700 transition group-hover:translate-x-0.5 group-hover:text-signal-400"
          strokeWidth={1.75}
        />
      </span>
      <span>
        <span className="block text-sm font-medium text-fog-100">{baslik}</span>
        <span className="mt-1.5 block text-xs leading-relaxed text-fog-500">{children}</span>
      </span>
    </Link>
  );
}
