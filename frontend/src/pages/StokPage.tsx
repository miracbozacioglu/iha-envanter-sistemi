import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  History,
  LoaderCircle,
  TriangleAlert,
  Warehouse,
  X,
} from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { Bos, Hata, Yukleniyor } from '../components/ui/DurumKutusu';
import { ParcaSecici } from '../components/ui/ParcaSecici';
import { StokRozeti } from '../components/ui/StokRozeti';
import {
  useDepolar,
  useStokCikis,
  useStokGiris,
  useStokKalemleri,
} from '../hooks/useStok';
import { hataMesaji } from '../lib/api';
import { stokDurumu } from '../lib/stok';
import type { HareketTipi, StokKalemDetay } from '../types';

const islemSemasi = z.object({
  parcaId: z.string().min(1, 'Parça seçin.'),
  miktar: z
    .string()
    .trim()
    .regex(/^[1-9]\d*$/, 'Miktar en az 1 olan bir tam sayı olmalı.'),
  aciklama: z.string().max(500, 'Açıklama en fazla 500 karakter.'),
  rafKodu: z.string().max(50, 'Raf kodu en fazla 50 karakter.'),
});

type IslemFormu = z.infer<typeof islemSemasi>;

const BOS_FORM: IslemFormu = { parcaId: '', miktar: '', aciklama: '', rafKodu: '' };

export function StokPage() {
  const [tip, setTip] = useState<HareketTipi>('GIRIS');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-ink-700 bg-ink-900 p-1">
          <Sekme aktif={tip === 'GIRIS'} onClick={() => setTip('GIRIS')} tip="GIRIS" />
          <Sekme aktif={tip === 'CIKIS'} onClick={() => setTip('CIKIS')} tip="CIKIS" />
        </div>

        <Link
          to="/stok/hareketler"
          className="inline-flex items-center gap-2 rounded-lg border border-ink-600 bg-ink-800 px-3.5 py-2.5 text-sm text-fog-300 transition hover:border-signal-500/40 hover:text-fog-100"
        >
          <History className="size-4" strokeWidth={1.75} />
          Hareket geçmişi
        </Link>
      </div>

      {/* key: sekme değişince form tamamen sıfırlansın. */}
      <IslemFormuPaneli key={tip} tip={tip} />

      <MevcutStok />
    </div>
  );
}

function Sekme({
  aktif,
  onClick,
  tip,
}: {
  aktif: boolean;
  onClick: () => void;
  tip: HareketTipi;
}) {
  const giris = tip === 'GIRIS';
  const Icon = giris ? ArrowDownLeft : ArrowUpRight;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={aktif}
      className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
        aktif
          ? giris
            ? 'bg-signal-500/12 text-signal-400'
            : 'bg-alert-400/12 text-alert-400'
          : 'text-fog-500 hover:text-fog-300'
      }`}
    >
      <Icon className="size-4" strokeWidth={2} />
      {giris ? 'Stok Girişi' : 'Stok Çıkışı'}
    </button>
  );
}

interface BasariBilgisi {
  parcaKodu: string;
  parcaAdi: string;
  depoAdi: string;
  miktar: number;
  yeniMiktar: number;
}

function IslemFormuPaneli({ tip }: { tip: HareketTipi }) {
  const giris = tip === 'GIRIS';
  const [sunucuHatasi, setSunucuHatasi] = useState<string | null>(null);
  const [basari, setBasari] = useState<BasariBilgisi | null>(null);

  const { data: depoListesi, isPending: depolarYukleniyor } = useDepolar();
  const depolar = depoListesi ?? [];
  const [seciliDepoId, setSeciliDepoId] = useState<number | null>(null);
  // Tek depo varsa kullanıcıya seçtirmeye gerek yok; ilk depo varsayılan.
  const etkinDepoId = seciliDepoId ?? depolar[0]?.id ?? null;
  const etkinDepo = depolar.find((depo) => depo.id === etkinDepoId);

  const stokGiris = useStokGiris();
  const stokCikis = useStokCikis();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<IslemFormu>({
    resolver: zodResolver(islemSemasi),
    defaultValues: BOS_FORM,
  });

  const [parcaDegeri, setParcaDegeri] = useState('');

  async function onSubmit(degerler: IslemFormu) {
    setSunucuHatasi(null);
    setBasari(null);

    if (etkinDepoId === null) {
      setSunucuHatasi('Sistemde kayıtlı depo bulunamadı; işlem yapılamaz.');
      return;
    }

    const aciklama = degerler.aciklama.trim();
    const rafKodu = degerler.rafKodu.trim();
    const miktar = Number(degerler.miktar);

    const temel = {
      parcaId: Number(degerler.parcaId),
      depoId: etkinDepoId,
      miktar,
      ...(aciklama ? { aciklama } : {}),
    };

    try {
      const sonuc = giris
        ? await stokGiris.mutateAsync({
            ...temel,
            // rafKodu boş gönderilirse backend reddediyor; hiç göndermiyoruz.
            ...(rafKodu ? { rafKodu } : {}),
          })
        : await stokCikis.mutateAsync(temel);

      setBasari({
        parcaKodu: sonuc.parca.kod,
        parcaAdi: sonuc.parca.ad,
        depoAdi: sonuc.depo.ad,
        miktar,
        yeniMiktar: sonuc.miktar,
      });

      reset(BOS_FORM);
      setParcaDegeri('');
    } catch (error) {
      // Yetersiz stok da dahil tüm 400'ler backend'in kendi metniyle gösterilir.
      setSunucuHatasi(hataMesaji(error, 'İşlem tamamlanamadı.'));
    }
  }

  return (
    <section className="panel overflow-hidden">
      <header className="flex items-center gap-2.5 border-b border-ink-700 px-5 py-3">
        <span className={giris ? 'text-signal-400' : 'text-alert-400'}>
          {giris ? (
            <ArrowDownLeft className="size-4" strokeWidth={2} />
          ) : (
            <ArrowUpRight className="size-4" strokeWidth={2} />
          )}
        </span>
        <h2 className="label-micro">{giris ? 'Depoya giriş' : 'Depodan çıkış'}</h2>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5 p-5">
        {sunucuHatasi && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-danger-500/30 bg-danger-900/40 px-3.5 py-3"
          >
            <TriangleAlert className="mt-px size-4 shrink-0 text-danger-400" strokeWidth={1.75} />
            <p className="text-sm leading-relaxed text-danger-400">{sunucuHatasi}</p>
          </div>
        )}

        {basari && (
          <div
            role="status"
            className="flex items-start gap-2.5 rounded-lg border border-signal-500/30 bg-signal-900/40 px-3.5 py-3"
          >
            <Check className="mt-px size-4 shrink-0 text-signal-400" strokeWidth={2.5} />
            <p className="flex-1 text-sm leading-relaxed text-fog-300">
              <span className="font-mono text-signal-400">{basari.parcaKodu}</span> ·{' '}
              {basari.parcaAdi} — {basari.depoAdi} deposunda{' '}
              <strong className="font-mono text-fog-100">
                {giris ? '+' : '−'}
                {basari.miktar}
              </strong>{' '}
              işlendi. Yeni miktar:{' '}
              <strong className="font-mono text-fog-100">{basari.yeniMiktar}</strong>
            </p>
            <button
              type="button"
              onClick={() => setBasari(null)}
              aria-label="Bildirimi kapat"
              className="rounded p-0.5 text-fog-700 transition hover:text-fog-300"
            >
              <X className="size-3.5" strokeWidth={2} />
            </button>
          </div>
        )}

        {/* Kaydet butonu zaten kilitli; kullanıcıya nedenini de söylüyoruz. */}
        {!depolarYukleniyor && depolar.length === 0 && (
          <p className="flex items-start gap-2.5 rounded-lg border border-alert-400/25 bg-alert-400/8 px-3.5 py-3 text-xs leading-relaxed text-alert-400">
            <TriangleAlert className="mt-px size-3.5 shrink-0" strokeWidth={2} />
            Sistemde kayıtlı depo yok. Stok işlemi yapabilmek için önce en az bir depo
            tanımlanmalı.
          </p>
        )}

        <div className="grid gap-5 lg:grid-cols-2">
          <Alan label="Parça" zorunlu hata={errors.parcaId?.message}>
            <ParcaSecici
              value={parcaDegeri}
              hataVar={Boolean(errors.parcaId)}
              onChange={(deger) => {
                setParcaDegeri(deger);
                setValue('parcaId', deger, { shouldValidate: true });
              }}
            />
          </Alan>

          <Alan label="Depo" zorunlu>
            {depolar.length > 1 ? (
              <select
                value={etkinDepoId ?? ''}
                onChange={(e) => setSeciliDepoId(Number(e.target.value))}
                className="w-full cursor-pointer rounded-lg border border-ink-600 bg-ink-850 px-3.5 py-2.5 text-sm text-fog-100 transition hover:border-ink-500 focus:border-signal-500/60 focus:outline-none"
              >
                {depolar.map((depo) => (
                  <option key={depo.id} value={depo.id}>
                    {depo.ad}
                    {depo.lokasyon ? ` · ${depo.lokasyon}` : ''}
                  </option>
                ))}
              </select>
            ) : (
              // Tek depolu kurulumda seçim kutusu gürültü; sabit gösteriyoruz.
              <div className="flex items-center gap-2.5 rounded-lg border border-ink-600 bg-ink-850 px-3.5 py-2.5 text-sm">
                <Warehouse className="size-4 shrink-0 text-fog-700" strokeWidth={1.75} />
                {depolarYukleniyor ? (
                  <span className="text-fog-700">Yükleniyor…</span>
                ) : etkinDepo ? (
                  <>
                    <span className="text-fog-100">{etkinDepo.ad}</span>
                    {etkinDepo.lokasyon && (
                      <span className="text-xs text-fog-700">· {etkinDepo.lokasyon}</span>
                    )}
                  </>
                ) : (
                  <span className="text-fog-700">Depo bulunamadı</span>
                )}
              </div>
            )}
          </Alan>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Alan label="Miktar" zorunlu hata={errors.miktar?.message}>
            <input
              {...register('miktar')}
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              placeholder="0"
              aria-invalid={Boolean(errors.miktar)}
              className={girdiSinifi(Boolean(errors.miktar), 'font-mono tabular-nums')}
            />
          </Alan>

          {giris && (
            <Alan
              label="Raf kodu"
              hata={errors.rafKodu?.message}
              ipucu="Boş bırakılırsa mevcut raf bilgisi korunur."
            >
              <input
                {...register('rafKodu')}
                type="text"
                placeholder="A-03-2"
                aria-invalid={Boolean(errors.rafKodu)}
                className={girdiSinifi(Boolean(errors.rafKodu), 'font-mono')}
              />
            </Alan>
          )}
        </div>

        <Alan label="Açıklama" hata={errors.aciklama?.message}>
          <textarea
            {...register('aciklama')}
            rows={2}
            placeholder={
              giris ? 'Tedarikçi teslimatı - irsaliye 2026/118' : 'Fire / hurdaya ayrıldı'
            }
            aria-invalid={Boolean(errors.aciklama)}
            className={`${girdiSinifi(Boolean(errors.aciklama))} resize-y`}
          />
        </Alan>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || etkinDepoId === null}
            className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-ink-950 transition disabled:cursor-not-allowed disabled:opacity-60 ${
              giris ? 'bg-signal-500 hover:bg-signal-400' : 'bg-alert-400 hover:bg-alert-300'
            }`}
          >
            {isSubmitting ? (
              <>
                <LoaderCircle className="size-4 animate-spin" strokeWidth={2.25} />
                İşleniyor
              </>
            ) : (
              <>
                {giris ? (
                  <ArrowDownLeft className="size-4" strokeWidth={2.5} />
                ) : (
                  <ArrowUpRight className="size-4" strokeWidth={2.5} />
                )}
                {giris ? 'Girişi kaydet' : 'Çıkışı kaydet'}
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}

function MevcutStok() {
  const kalemler = useStokKalemleri();

  const sirali = useMemo(() => {
    return [...(kalemler.data ?? [])].sort((a, b) => a.parca.kod.localeCompare(b.parca.kod, 'tr'));
  }, [kalemler.data]);

  return (
    <section className="panel overflow-hidden">
      <header className="flex items-center gap-2.5 border-b border-ink-700 px-5 py-3">
        <Warehouse className="size-4 text-fog-700" strokeWidth={1.75} />
        <h2 className="label-micro flex-1">Mevcut stok</h2>
        {kalemler.data && (
          <span className="font-mono text-xs text-fog-500 tabular-nums">
            {kalemler.data.length} kalem
          </span>
        )}
      </header>

      {kalemler.isPending ? (
        <Yukleniyor mesaj="Stok yükleniyor" />
      ) : kalemler.isError ? (
        <Hata
          mesaj={hataMesaji(kalemler.error)}
          onTekrarDene={() => {
            void kalemler.refetch();
          }}
        />
      ) : sirali.length === 0 ? (
        <Bos
          baslik="Stok kaydı yok"
          aciklama="Henüz hiçbir depoda stok kalemi oluşmamış. İlk girişi yukarıdan yapabilirsiniz."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[52rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink-700 bg-ink-900/60">
                <Baslik className="w-32">Kod</Baslik>
                <Baslik>Parça</Baslik>
                <Baslik className="w-40">Depo</Baslik>
                <Baslik className="w-28">Raf</Baslik>
                <Baslik className="w-24 text-right">Miktar</Baslik>
                <Baslik className="w-32">Durum</Baslik>
              </tr>
            </thead>
            <tbody>
              {sirali.map((kalem) => (
                <StokSatiri key={kalem.id} kalem={kalem} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function StokSatiri({ kalem }: { kalem: StokKalemDetay }) {
  const durum = stokDurumu(kalem.miktar, kalem.parca.kritikSeviye);

  return (
    <tr className="border-b border-ink-800 transition last:border-b-0 hover:bg-ink-800/60">
      <td className="px-4 py-3">
        <Link
          to={`/parcalar/${kalem.parcaId}`}
          className="font-mono text-xs text-signal-400 transition hover:text-signal-300"
        >
          {kalem.parca.kod}
        </Link>
      </td>
      <td className="px-4 py-3 text-fog-100">{kalem.parca.ad}</td>
      <td className="px-4 py-3 text-fog-500">{kalem.depo.ad}</td>
      <td className="px-4 py-3 font-mono text-xs text-fog-500">{kalem.rafKodu ?? '—'}</td>
      <td className="px-4 py-3 text-right font-mono text-fog-100 tabular-nums">{kalem.miktar}</td>
      <td className="px-4 py-3">
        <StokRozeti durum={durum} />
      </td>
    </tr>
  );
}

function girdiSinifi(hataVar: boolean, ek = ''): string {
  return `w-full rounded-lg border bg-ink-850 px-3.5 py-2.5 text-sm text-fog-100 transition placeholder:text-fog-700 hover:border-ink-500 focus:outline-none focus:ring-2 focus:ring-signal-500/15 ${
    hataVar
      ? 'border-danger-500/50 focus:border-danger-500/70'
      : 'border-ink-600 focus:border-signal-500/60'
  } ${ek}`;
}

interface AlanProps {
  label: string;
  children: ReactNode;
  hata?: string;
  ipucu?: string;
  zorunlu?: boolean;
}

function Alan({ label, children, hata, ipucu, zorunlu = false }: AlanProps) {
  return (
    <div>
      <label className="mb-2 flex items-baseline gap-1.5">
        <span className="label-micro">{label}</span>
        {zorunlu && (
          <span aria-hidden="true" className="text-xs text-signal-400">
            *
          </span>
        )}
      </label>
      {children}
      {hata ? (
        <p className="mt-1.5 text-xs text-danger-400">{hata}</p>
      ) : ipucu ? (
        <p className="mt-1.5 text-xs text-fog-700">{ipucu}</p>
      ) : null}
    </div>
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
