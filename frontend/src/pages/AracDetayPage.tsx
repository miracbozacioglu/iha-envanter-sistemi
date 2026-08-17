import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  History,
  LoaderCircle,
  PlaneTakeoff,
  Replace,
  Wrench,
  X,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router-dom';
import { z } from 'zod';
import { Bos, Hata, Yukleniyor } from '../components/ui/DurumKutusu';
import { Alan, FormHatasi } from '../components/ui/FormAlani';
import { Modal } from '../components/ui/Modal';
import { ParcaSecici } from '../components/ui/ParcaSecici';
import { Rozet } from '../components/ui/Rozet';
import { CornerFrame } from '../components/ui/CornerFrame';
import {
  useArac,
  useAracBakimGecmisi,
  useParcaDegistir,
  useTamirKaydi,
} from '../hooks/useBakim';
import { useDepolar } from '../hooks/useStok';
import { hataMesaji } from '../lib/api';
import { aracDurumTonu, BAKIM_TIP_BILGISI } from '../lib/bakim';
import { girdiSinifi } from '../lib/formSinif';
import { tarihSaatYaz } from '../lib/talep';
import type { BakimGecmisi, IhaAraci } from '../types';

export function AracDetayPage() {
  const { id } = useParams();
  const aracId = Number(id);
  const gecerli = Number.isInteger(aracId) && aracId > 0;
  const arac = useArac(gecerli ? aracId : undefined);

  if (!gecerli) {
    return (
      <div className="panel">
        <Hata mesaj={`"${id}" geçerli bir araç numarası değil.`} />
      </div>
    );
  }

  if (arac.isPending) {
    return (
      <div className="panel">
        <Yukleniyor mesaj="Araç yükleniyor" />
      </div>
    );
  }

  if (arac.isError) {
    return (
      <div className="space-y-5">
        <GeriBaglantisi />
        <div className="panel">
          <Hata
            mesaj={hataMesaji(arac.error, 'Araç bilgileri alınamadı.')}
            onTekrarDene={() => {
              void arac.refetch();
            }}
          />
        </div>
      </div>
    );
  }

  return <Icerik arac={arac.data} />;
}

function Icerik({ arac }: { arac: IhaAraci }) {
  const [degistirAcik, setDegistirAcik] = useState(false);
  const [tamirAcik, setTamirAcik] = useState(false);

  return (
    <div className="space-y-5">
      <GeriBaglantisi />

      <section className="panel relative overflow-hidden px-6 py-6">
        <CornerFrame size={20} />

        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div className="flex min-w-0 items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-signal-500/25 bg-signal-900/40 text-signal-400">
              <PlaneTakeoff className="size-6" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="font-mono text-2xl font-semibold tracking-[0.08em] text-fog-100">
                  {arac.kuyrukNo}
                </h2>
                <Rozet ton={aracDurumTonu(arac.durum)} mono>
                  {arac.durum}
                </Rozet>
              </div>

              <p className="mt-2 text-sm text-fog-500">
                {arac.ihaModeli ? (
                  <>
                    {arac.ihaModeli.ad}
                    <span className="text-fog-700"> · {arac.ihaModeli.uretici}</span>
                  </>
                ) : (
                  <span className="italic">Model bilgisi yok</span>
                )}
              </p>

              {arac.aciklama && (
                <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-fog-500">
                  {arac.aciklama}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setDegistirAcik(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-info-500 px-4 py-2.5 text-sm font-semibold text-fog-100 transition hover:bg-info-400"
            >
              <Replace className="size-4" strokeWidth={2.25} />
              Parça değiştir
            </button>
            <button
              type="button"
              onClick={() => setTamirAcik(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-success-500/40 bg-success-900/40 px-4 py-2.5 text-sm font-semibold text-success-400 transition hover:bg-success-900/70"
            >
              <Wrench className="size-4" strokeWidth={2.25} />
              Tamir kaydı ekle
            </button>
          </div>
        </div>
      </section>

      <BakimGecmisiBolumu aracId={arac.id} />

      {degistirAcik && (
        <DegistirModali arac={arac} onKapat={() => setDegistirAcik(false)} />
      )}
      {tamirAcik && <TamirModali arac={arac} onKapat={() => setTamirAcik(false)} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bakım geçmişi                                                       */
/* ------------------------------------------------------------------ */

function BakimGecmisiBolumu({ aracId }: { aracId: number }) {
  const gecmis = useAracBakimGecmisi(aracId);

  return (
    <section className="panel overflow-hidden">
      <header className="flex items-center gap-2.5 border-b border-ink-700 px-5 py-3">
        <History className="size-4 text-fog-700" strokeWidth={1.75} />
        <h3 className="label-micro flex-1">Bakım geçmişi</h3>
        {gecmis.data && (
          <span className="font-mono text-xs text-fog-500 tabular-nums">
            {gecmis.data.length} kayıt
          </span>
        )}
      </header>

      {gecmis.isPending ? (
        <Yukleniyor mesaj="Bakım geçmişi yükleniyor" />
      ) : gecmis.isError ? (
        <Hata
          mesaj={hataMesaji(gecmis.error, 'Bakım geçmişi alınamadı.')}
          onTekrarDene={() => {
            void gecmis.refetch();
          }}
        />
      ) : gecmis.data.length === 0 ? (
        <Bos
          baslik="Bu araçta bakım kaydı yok"
          aciklama="Parça değişimi veya tamir işlemi yapıldıkça burada listelenir."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[56rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink-700 bg-ink-900/60">
                <Baslik className="w-40">Tarih</Baslik>
                <Baslik className="w-36">İşlem</Baslik>
                <Baslik className="w-64">Parça</Baslik>
                <Baslik className="w-40">Yapan</Baslik>
                <Baslik>Açıklama</Baslik>
              </tr>
            </thead>
            <tbody>
              {gecmis.data.map((kayit) => (
                <GecmisSatiri key={kayit.id} kayit={kayit} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function GecmisSatiri({ kayit }: { kayit: BakimGecmisi }) {
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
        <Link to={`/parcalar/${kayit.parcaId}`} className="group flex items-center gap-2">
          <span className="font-mono text-xs text-signal-400 transition group-hover:text-signal-300">
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

/* ------------------------------------------------------------------ */
/* Parça değiştir                                                      */
/* ------------------------------------------------------------------ */

const degistirSemasi = z.object({
  parcaId: z.string().min(1, 'Parça seçin.'),
  miktar: z
    .string()
    .trim()
    .regex(/^[1-9]\d*$/, 'Miktar en az 1 olan bir tam sayı olmalı.'),
  aciklama: z.string().max(500, 'En fazla 500 karakter.'),
});

function DegistirModali({ arac, onKapat }: { arac: IhaAraci; onKapat: () => void }) {
  const degistir = useParcaDegistir();
  const { data: depolar } = useDepolar();
  const [hata, setHata] = useState<string | null>(null);
  const [parcaDegeri, setParcaDegeri] = useState('');
  const [depoId, setDepoId] = useState<number | null>(null);

  const liste = depolar ?? [];
  // Tek depoda backend kendisi seçiyor; birden fazlaysa depoId zorunlu.
  const cokDepo = liste.length > 1;
  const etkinDepoId = depoId ?? (cokDepo ? (liste[0]?.id ?? null) : null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(degistirSemasi),
    defaultValues: { parcaId: '', miktar: '1', aciklama: '' },
  });

  return (
    <Modal
      baslik="Parça değiştir"
      altBaslik={`${arac.kuyrukNo} · stoktan düşülecek`}
      onKapat={onKapat}
      genis
    >
      <form
        onSubmit={handleSubmit(async (d) => {
          setHata(null);
          const aciklama = d.aciklama.trim();

          try {
            await degistir.mutateAsync({
              ihaAraciId: arac.id,
              parcaId: Number(d.parcaId),
              miktar: Number(d.miktar),
              ...(cokDepo && etkinDepoId ? { depoId: etkinDepoId } : {}),
              ...(aciklama ? { aciklama } : {}),
            });
            onKapat();
          } catch (error) {
            // Yetersiz stok dahil tüm 400'ler backend'in kendi metniyle çıkar.
            setHata(hataMesaji(error, 'Parça değişimi kaydedilemedi.'));
          }
        })}
        noValidate
        className="space-y-5"
      >
        {hata && <FormHatasi mesaj={hata} />}

        <p className="rounded-lg border border-info-500/25 bg-info-900/30 px-3.5 py-3 text-xs leading-relaxed text-info-300">
          Bu işlem seçilen parçayı <strong>stoktan düşer</strong> ve bir çıkış hareketi yazar;
          bakım kaydıyla birlikte tek transaction içinde yapılır.
        </p>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Alan label="Takılan parça" zorunlu hata={errors.parcaId?.message}>
            <ParcaSecici
              value={parcaDegeri}
              hataVar={Boolean(errors.parcaId)}
              onChange={(deger) => {
                setParcaDegeri(deger);
                setValue('parcaId', deger, { shouldValidate: true });
              }}
            />
          </Alan>

          <Alan label="Miktar" zorunlu hata={errors.miktar?.message}>
            <input
              {...register('miktar')}
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              className={girdiSinifi(Boolean(errors.miktar), 'font-mono tabular-nums')}
            />
          </Alan>
        </div>

        {cokDepo && (
          <Alan label="Düşülecek depo" zorunlu>
            <select
              value={etkinDepoId ?? ''}
              onChange={(e) => setDepoId(Number(e.target.value))}
              className={`${girdiSinifi(false)} cursor-pointer`}
            >
              {liste.map((depo) => (
                <option key={depo.id} value={depo.id}>
                  {depo.ad}
                  {depo.lokasyon ? ` · ${depo.lokasyon}` : ''}
                </option>
              ))}
            </select>
          </Alan>
        )}

        <Alan label="Bakım notu" hata={errors.aciklama?.message}>
          <textarea
            {...register('aciklama')}
            rows={3}
            placeholder="Sol ön motor titreşim yaptığı için değiştirildi."
            className={`${girdiSinifi(Boolean(errors.aciklama))} resize-y`}
          />
        </Alan>

        <ModalDugmeleri
          onKapat={onKapat}
          bekliyor={degistir.isPending}
          etiket="Değişimi kaydet"
          ikon={<Replace className="size-4" strokeWidth={2.25} />}
          sinif="bg-info-500 text-fog-100 hover:bg-info-400"
        />
      </form>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Tamir kaydı                                                         */
/* ------------------------------------------------------------------ */

const tamirSemasi = z.object({
  parcaId: z.string().min(1, 'Parça seçin.'),
  aciklama: z.string().max(500, 'En fazla 500 karakter.'),
});

function TamirModali({ arac, onKapat }: { arac: IhaAraci; onKapat: () => void }) {
  const tamir = useTamirKaydi();
  const [hata, setHata] = useState<string | null>(null);
  const [parcaDegeri, setParcaDegeri] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(tamirSemasi),
    defaultValues: { parcaId: '', aciklama: '' },
  });

  return (
    <Modal
      baslik="Tamir kaydı ekle"
      altBaslik={`${arac.kuyrukNo} · stoğa dokunmaz`}
      onKapat={onKapat}
      genis
    >
      <form
        onSubmit={handleSubmit(async (d) => {
          setHata(null);
          const aciklama = d.aciklama.trim();

          try {
            await tamir.mutateAsync({
              ihaAraciId: arac.id,
              parcaId: Number(d.parcaId),
              ...(aciklama ? { aciklama } : {}),
            });
            onKapat();
          } catch (error) {
            setHata(hataMesaji(error, 'Tamir kaydı oluşturulamadı.'));
          }
        })}
        noValidate
        className="space-y-5"
      >
        {hata && <FormHatasi mesaj={hata} />}

        <p className="rounded-lg border border-success-500/25 bg-success-900/30 px-3.5 py-3 text-xs leading-relaxed text-success-300">
          Yerinde tamir: yalnızca bakım kaydı yazılır, <strong>stok değişmez</strong>.
        </p>

        <Alan label="Tamir edilen parça" zorunlu hata={errors.parcaId?.message}>
          <ParcaSecici
            value={parcaDegeri}
            hataVar={Boolean(errors.parcaId)}
            onChange={(deger) => {
              setParcaDegeri(deger);
              setValue('parcaId', deger, { shouldValidate: true });
            }}
          />
        </Alan>

        <Alan label="Bakım notu" hata={errors.aciklama?.message}>
          <textarea
            {...register('aciklama')}
            rows={3}
            placeholder="Konnektör lehimi yenilendi, parça yerinde tamir edildi."
            className={`${girdiSinifi(Boolean(errors.aciklama))} resize-y`}
          />
        </Alan>

        <ModalDugmeleri
          onKapat={onKapat}
          bekliyor={tamir.isPending}
          etiket="Tamiri kaydet"
          ikon={<Wrench className="size-4" strokeWidth={2.25} />}
          sinif="bg-success-500 text-ink-950 hover:bg-success-400"
        />
      </form>
    </Modal>
  );
}

function ModalDugmeleri({
  onKapat,
  bekliyor,
  etiket,
  ikon,
  sinif,
}: {
  onKapat: () => void;
  bekliyor: boolean;
  etiket: string;
  ikon: ReactNode;
  sinif: string;
}) {
  return (
    <div className="flex justify-end gap-3 pt-1">
      <button
        type="button"
        onClick={onKapat}
        className="inline-flex items-center gap-2 rounded-lg border border-ink-600 px-4 py-2.5 text-sm text-fog-500 transition hover:border-ink-500 hover:text-fog-300"
      >
        <X className="size-4" strokeWidth={2} />
        Vazgeç
      </button>
      <button
        type="submit"
        disabled={bekliyor}
        className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${sinif}`}
      >
        {bekliyor ? <LoaderCircle className="size-4 animate-spin" strokeWidth={2.25} /> : ikon}
        {etiket}
      </button>
    </div>
  );
}

function GeriBaglantisi() {
  return (
    <Link
      to="/araclar"
      className="inline-flex items-center gap-2 text-xs text-fog-500 transition hover:text-signal-400"
    >
      <ArrowLeft className="size-3.5" strokeWidth={2} />
      Araç listesine dön
    </Link>
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
