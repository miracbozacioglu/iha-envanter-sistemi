import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  Check,
  LoaderCircle,
  PackageCheck,
  Truck,
  X,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router-dom';
import { z } from 'zod';
import { TalepDurumStepper } from '../components/TalepDurumStepper';
import { CornerFrame } from '../components/ui/CornerFrame';
import { Hata, Yukleniyor } from '../components/ui/DurumKutusu';
import { Alan, FormHatasi } from '../components/ui/FormAlani';
import { Modal } from '../components/ui/Modal';
import { Rozet } from '../components/ui/Rozet';
import { useAuth } from '../hooks/useAuth';
import { useKaynakListesi } from '../hooks/useKaynak';
import { useDepolar } from '../hooks/useStok';
import {
  useSiparisOlustur,
  useSiparisTeslimAl,
  useTalep,
  useTalepOnayla,
  useTalepReddet,
} from '../hooks/useTalepler';
import { hataMesaji } from '../lib/api';
import { girdiSinifi } from '../lib/formSinif';
import { paraYaz, TALEP_DURUM_BILGISI, tarihSaatYaz } from '../lib/talep';
import type { TalepDetay, Tedarikci } from '../types';

export function TalepDetayPage() {
  const { id } = useParams();
  const talepId = Number(id);
  const gecerli = Number.isInteger(talepId) && talepId > 0;
  const talep = useTalep(gecerli ? talepId : undefined);

  if (!gecerli) {
    return (
      <div className="panel">
        <Hata mesaj={`"${id}" geçerli bir talep numarası değil.`} />
      </div>
    );
  }

  if (talep.isPending) {
    return (
      <div className="panel">
        <Yukleniyor mesaj="Talep yükleniyor" />
      </div>
    );
  }

  if (talep.isError) {
    return (
      <div className="space-y-5">
        <GeriBaglantisi />
        <div className="panel">
          <Hata
            mesaj={hataMesaji(talep.error, 'Talep bilgileri alınamadı.')}
            onTekrarDene={() => {
              void talep.refetch();
            }}
          />
        </div>
      </div>
    );
  }

  return <Icerik talep={talep.data} />;
}

function Icerik({ talep }: { talep: TalepDetay }) {
  const { user } = useAuth();
  const yonetici = user?.rol === 'YONETICI';
  const bilgi = TALEP_DURUM_BILGISI[talep.durum];

  const [reddetAcik, setReddetAcik] = useState(false);
  const [siparisAcik, setSiparisAcik] = useState(false);
  const [teslimAcik, setTeslimAcik] = useState(false);

  const onayla = useTalepOnayla();
  const [onayHatasi, setOnayHatasi] = useState<string | null>(null);

  async function onaylaTiklandi() {
    setOnayHatasi(null);
    try {
      await onayla.mutateAsync(talep.id);
    } catch (error) {
      setOnayHatasi(hataMesaji(error, 'Talep onaylanamadı.'));
    }
  }

  return (
    <div className="space-y-5">
      <GeriBaglantisi />

      <section className="panel relative overflow-hidden px-6 py-6">
        <CornerFrame size={20} />

        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-md border border-ink-600 bg-ink-850 px-2 py-1 font-mono text-xs text-fog-500">
                #{talep.id}
              </span>
              <Rozet ton={bilgi.ton} mono>
                {bilgi.etiket}
              </Rozet>
            </div>

            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-fog-100">
              {talep.parca.ad}
            </h2>
            <p className="mt-1.5 font-mono text-xs text-signal-400">
              <Link to={`/parcalar/${talep.parcaId}`} className="transition hover:text-signal-300">
                {talep.parca.kod}
              </Link>
            </p>
          </div>

          <div className="text-right">
            <p className="label-micro">Talep edilen</p>
            <p className="mt-1.5 font-mono text-3xl leading-none font-semibold text-fog-100 tabular-nums">
              {talep.miktar}
              <span className="ml-1.5 text-sm font-normal text-fog-700">{talep.parca.birim}</span>
            </p>
          </div>
        </div>
      </section>

      {/* Durum akışı */}
      <section className="panel overflow-hidden">
        <header className="border-b border-ink-700 px-5 py-3">
          <h3 className="label-micro">Durum akışı</h3>
        </header>
        <div className="p-6">
          <TalepDurumStepper durum={talep.durum} redSebebi={talep.redSebebi} />
        </div>
      </section>

      {/* Yönetici aksiyonları */}
      {yonetici && talep.durum === 'BEKLIYOR' && (
        <section className="panel overflow-hidden">
          <header className="border-b border-ink-700 px-5 py-3">
            <h3 className="label-micro">Onay bekliyor</h3>
          </header>
          <div className="space-y-4 p-5">
            {onayHatasi && <FormHatasi mesaj={onayHatasi} />}
            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setReddetAcik(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-danger-500/40 bg-danger-900/30 px-4 py-2.5 text-sm font-semibold text-danger-400 transition hover:bg-danger-900/60"
              >
                <X className="size-4" strokeWidth={2.5} />
                Reddet
              </button>
              <button
                type="button"
                onClick={() => void onaylaTiklandi()}
                disabled={onayla.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-signal-500 px-5 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-signal-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {onayla.isPending ? (
                  <LoaderCircle className="size-4 animate-spin" strokeWidth={2.25} />
                ) : (
                  <Check className="size-4" strokeWidth={2.5} />
                )}
                Onayla
              </button>
            </div>
          </div>
        </section>
      )}

      {yonetici && talep.durum === 'ONAYLANDI' && (
        <section className="panel overflow-hidden">
          <header className="border-b border-ink-700 px-5 py-3">
            <h3 className="label-micro">Sipariş bekliyor</h3>
          </header>
          <div className="flex flex-wrap items-center justify-between gap-4 p-5">
            <p className="text-sm leading-relaxed text-fog-500">
              Talep onaylandı. Tedarikçi siparişi oluşturulduğunda durum{' '}
              <span className="text-info-400">Sipariş verildi</span> olur.
            </p>
            <button
              type="button"
              onClick={() => setSiparisAcik(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-info-500 px-5 py-2.5 text-sm font-semibold text-fog-100 transition hover:bg-info-400"
            >
              <Truck className="size-4" strokeWidth={2.25} />
              Sipariş oluştur
            </button>
          </div>
        </section>
      )}

      {/* Sipariş bilgisi */}
      {talep.siparis && (
        <section className="panel overflow-hidden">
          <header className="flex items-center gap-2.5 border-b border-ink-700 px-5 py-3">
            <Truck className="size-4 text-fog-700" strokeWidth={1.75} />
            <h3 className="label-micro flex-1">Sipariş</h3>
            {talep.siparis.teslimAlindi ? (
              <Rozet ton="basari" mono>
                Teslim alındı
              </Rozet>
            ) : (
              <Rozet ton="bilgi" mono>
                Yolda
              </Rozet>
            )}
          </header>

          <dl className="divide-y divide-ink-800">
            <Satir etiket="Tedarikçi">{talep.siparis.tedarikci.ad}</Satir>
            <Satir etiket="Sipariş miktarı">
              <span className="font-mono tabular-nums">{talep.siparis.miktar}</span>{' '}
              <span className="text-xs text-fog-700">{talep.parca.birim}</span>
            </Satir>
            <Satir etiket="Birim fiyat">
              <span className="font-mono tabular-nums">{paraYaz(talep.siparis.birimFiyat)}</span>
            </Satir>
            <Satir etiket="Sipariş tarihi">
              <span className="font-mono text-xs tabular-nums">
                {tarihSaatYaz(talep.siparis.siparisTarihi)}
              </span>
            </Satir>
            {talep.siparis.teslimTarihi && (
              <Satir etiket="Teslim tarihi">
                <span className="font-mono text-xs tabular-nums">
                  {tarihSaatYaz(talep.siparis.teslimTarihi)}
                </span>
              </Satir>
            )}
          </dl>

          {yonetici && !talep.siparis.teslimAlindi && (
            <div className="flex justify-end border-t border-ink-700 p-5">
              <button
                type="button"
                onClick={() => setTeslimAcik(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-success-500 px-5 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-success-400"
              >
                <PackageCheck className="size-4" strokeWidth={2.25} />
                Teslim al
              </button>
            </div>
          )}
        </section>
      )}

      {talep.durum === 'TESLIM_ALINDI' && (
        <p className="flex items-start gap-2.5 rounded-lg border border-success-500/30 bg-success-900/40 px-4 py-3.5 text-sm leading-relaxed text-success-300">
          <PackageCheck className="mt-px size-4 shrink-0 text-success-400" strokeWidth={2} />
          Talep tamamlandı. Sipariş teslim alındı ve parça stoğa girildi.
        </p>
      )}

      {/* Künye */}
      <section className="panel overflow-hidden">
        <header className="border-b border-ink-700 px-5 py-3">
          <h3 className="label-micro">Talep künyesi</h3>
        </header>
        <dl className="divide-y divide-ink-800">
          <Satir etiket="Talep eden">
            {talep.teknisyen.ad} {talep.teknisyen.soyad}
          </Satir>
          <Satir etiket="Açılış">
            <span className="font-mono text-xs tabular-nums">{tarihSaatYaz(talep.olusturma)}</span>
          </Satir>
          <Satir etiket="Son güncelleme">
            <span className="font-mono text-xs tabular-nums">{tarihSaatYaz(talep.guncelleme)}</span>
          </Satir>
          <Satir etiket="Onaylayan">
            {talep.onaylayan ? (
              `${talep.onaylayan.ad} ${talep.onaylayan.soyad}`
            ) : (
              <span className="text-fog-700 italic">—</span>
            )}
          </Satir>
          <Satir etiket="Gerekçe">
            {talep.aciklama ? (
              talep.aciklama
            ) : (
              <span className="text-fog-700 italic">Belirtilmemiş</span>
            )}
          </Satir>
        </dl>
      </section>

      {reddetAcik && <ReddetModali talep={talep} onKapat={() => setReddetAcik(false)} />}
      {siparisAcik && <SiparisModali talep={talep} onKapat={() => setSiparisAcik(false)} />}
      {teslimAcik && talep.siparis && (
        <TeslimAlModali siparisId={talep.siparis.id} onKapat={() => setTeslimAcik(false)} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Reddet                                                              */
/* ------------------------------------------------------------------ */

const redSemasi = z.object({
  redSebebi: z.string().trim().min(1, 'Red sebebi zorunlu.').max(500, 'En fazla 500 karakter.'),
});

function ReddetModali({ talep, onKapat }: { talep: TalepDetay; onKapat: () => void }) {
  const reddet = useTalepReddet();
  const [hata, setHata] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(redSemasi), defaultValues: { redSebebi: '' } });

  return (
    <Modal
      baslik="Talebi reddet"
      altBaslik={`#${talep.id} · ${talep.parca.ad}`}
      onKapat={onKapat}
    >
      <form
        onSubmit={handleSubmit(async (d) => {
          setHata(null);
          try {
            await reddet.mutateAsync({ id: talep.id, redSebebi: d.redSebebi });
            onKapat();
          } catch (error) {
            setHata(hataMesaji(error, 'Talep reddedilemedi.'));
          }
        })}
        noValidate
        className="space-y-5"
      >
        {hata && <FormHatasi mesaj={hata} />}

        <Alan
          label="Red sebebi"
          zorunlu
          hata={errors.redSebebi?.message}
          ipucu="Talebi açan teknisyen bu metni görecek."
        >
          <textarea
            {...register('redSebebi')}
            rows={3}
            autoFocus
            placeholder="Stokta yeterli parça var, yeni tedariğe gerek yok."
            className={`${girdiSinifi(Boolean(errors.redSebebi))} resize-y`}
          />
        </Alan>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onKapat}
            className="rounded-lg border border-ink-600 px-4 py-2.5 text-sm text-fog-500 transition hover:border-ink-500 hover:text-fog-300"
          >
            Vazgeç
          </button>
          <button
            type="submit"
            disabled={reddet.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-danger-500 px-4 py-2.5 text-sm font-semibold text-fog-100 transition hover:bg-danger-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {reddet.isPending && <LoaderCircle className="size-4 animate-spin" strokeWidth={2.25} />}
            Reddet
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Sipariş oluştur                                                     */
/* ------------------------------------------------------------------ */

const siparisSemasi = z.object({
  tedarikciId: z.string().min(1, 'Tedarikçi seçin.'),
  miktar: z
    .string()
    .trim()
    .regex(/^[1-9]\d*$/, 'Miktar en az 1 olan bir tam sayı olmalı.'),
  birimFiyat: z
    .string()
    .trim()
    .refine(
      (v) => v === '' || /^\d+([.,]\d{1,2})?$/.test(v),
      'En fazla 2 ondalık basamaklı bir sayı girin.',
    ),
});

function SiparisModali({ talep, onKapat }: { talep: TalepDetay; onKapat: () => void }) {
  const olustur = useSiparisOlustur();
  const tedarikciler = useKaynakListesi<Tedarikci>('tedarikciler');
  const [hata, setHata] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(siparisSemasi),
    defaultValues: { tedarikciId: '', miktar: String(talep.miktar), birimFiyat: '' },
  });

  return (
    <Modal
      baslik="Sipariş oluştur"
      altBaslik={`#${talep.id} · ${talep.parca.kod} — ${talep.parca.ad}`}
      onKapat={onKapat}
    >
      <form
        onSubmit={handleSubmit(async (d) => {
          setHata(null);
          // Virgüllü giriş de kabul ediliyor; backend sayı bekliyor.
          const fiyat = d.birimFiyat.replace(',', '.');

          try {
            await olustur.mutateAsync({
              talepId: talep.id,
              tedarikciId: Number(d.tedarikciId),
              miktar: Number(d.miktar),
              ...(fiyat ? { birimFiyat: Number(fiyat) } : {}),
            });
            onKapat();
          } catch (error) {
            setHata(hataMesaji(error, 'Sipariş oluşturulamadı.'));
          }
        })}
        noValidate
        className="space-y-5"
      >
        {hata && <FormHatasi mesaj={hata} />}

        <Alan
          label="Tedarikçi"
          zorunlu
          hata={
            errors.tedarikciId?.message ??
            (tedarikciler.isError ? 'Tedarikçiler yüklenemedi.' : undefined)
          }
        >
          <select
            {...register('tedarikciId')}
            autoFocus
            disabled={tedarikciler.isPending}
            className={`${girdiSinifi(Boolean(errors.tedarikciId))} cursor-pointer disabled:cursor-wait disabled:opacity-60`}
          >
            <option value="">
              {tedarikciler.isPending ? 'Yükleniyor…' : 'Tedarikçi seçin'}
            </option>
            {(tedarikciler.data ?? []).map((tedarikci) => (
              <option key={tedarikci.id} value={tedarikci.id}>
                {tedarikci.ad}
              </option>
            ))}
          </select>
        </Alan>

        <div className="grid gap-5 sm:grid-cols-2">
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

          <Alan
            label="Birim fiyat"
            hata={errors.birimFiyat?.message}
            ipucu="Opsiyonel. Örn. 1250.50"
          >
            <input
              {...register('birimFiyat')}
              inputMode="decimal"
              placeholder="—"
              className={girdiSinifi(Boolean(errors.birimFiyat), 'font-mono tabular-nums')}
            />
          </Alan>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onKapat}
            className="rounded-lg border border-ink-600 px-4 py-2.5 text-sm text-fog-500 transition hover:border-ink-500 hover:text-fog-300"
          >
            Vazgeç
          </button>
          <button
            type="submit"
            disabled={olustur.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-info-500 px-4 py-2.5 text-sm font-semibold text-fog-100 transition hover:bg-info-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {olustur.isPending && (
              <LoaderCircle className="size-4 animate-spin" strokeWidth={2.25} />
            )}
            Siparişi oluştur
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Teslim al                                                           */
/* ------------------------------------------------------------------ */

export function TeslimAlModali({
  siparisId,
  onKapat,
}: {
  siparisId: number;
  onKapat: () => void;
}) {
  const teslimAl = useSiparisTeslimAl();
  const { data: depolar } = useDepolar();
  const [hata, setHata] = useState<string | null>(null);
  const [depoId, setDepoId] = useState<number | null>(null);

  const liste = depolar ?? [];
  // Tek depoda backend kendisi seçiyor; birden fazlaysa depoId zorunlu.
  const cokDepo = liste.length > 1;
  const etkinDepoId = depoId ?? (cokDepo ? (liste[0]?.id ?? null) : null);

  async function onayla() {
    setHata(null);
    try {
      await teslimAl.mutateAsync({
        id: siparisId,
        ...(cokDepo && etkinDepoId ? { depoId: etkinDepoId } : {}),
      });
      onKapat();
    } catch (error) {
      setHata(hataMesaji(error, 'Teslim alma işlemi tamamlanamadı.'));
    }
  }

  return (
    <Modal baslik="Siparişi teslim al" onKapat={onKapat}>
      <div className="space-y-5">
        <p className="text-sm leading-relaxed text-fog-300">
          Sipariş teslim alınmış sayılacak: parça <strong className="text-fog-100">stoğa
          girilecek</strong>, talep <strong className="text-success-400">Teslim alındı</strong>{' '}
          durumuna geçecek. Bu işlem tek bir transaction içinde yapılır.
        </p>

        {cokDepo && (
          <Alan label="Giriş yapılacak depo" zorunlu>
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

        {hata && <FormHatasi mesaj={hata} />}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onKapat}
            className="rounded-lg border border-ink-600 px-4 py-2.5 text-sm text-fog-500 transition hover:border-ink-500 hover:text-fog-300"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={() => void onayla()}
            disabled={teslimAl.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-success-500 px-4 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-success-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {teslimAl.isPending ? (
              <LoaderCircle className="size-4 animate-spin" strokeWidth={2.25} />
            ) : (
              <PackageCheck className="size-4" strokeWidth={2.25} />
            )}
            Teslim aldım
          </button>
        </div>
      </div>
    </Modal>
  );
}

function GeriBaglantisi() {
  return (
    <Link
      to="/talepler"
      className="inline-flex items-center gap-2 text-xs text-fog-500 transition hover:text-signal-400"
    >
      <ArrowLeft className="size-3.5" strokeWidth={2} />
      Talep listesine dön
    </Link>
  );
}

function Satir({ etiket, children }: { etiket: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-3">
      <dt className="shrink-0 text-xs text-fog-700">{etiket}</dt>
      <dd className="text-right text-sm text-fog-300">{children}</dd>
    </div>
  );
}
