import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Check, LoaderCircle, Save, TriangleAlert } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { CornerFrame } from '../components/ui/CornerFrame';
import { Hata, Yukleniyor } from '../components/ui/DurumKutusu';
import {
  useParca,
  useParcaGuncelle,
  useParcaOlustur,
  type ParcaGuncelleDto,
  type ParcaYazDto,
} from '../hooks/useParcalar';
import { useKategoriler } from '../hooks/useTanimlar';
import { hataDurumu, hataMesaji } from '../lib/api';
import type { ParcaDetay } from '../types';

/** Sık kullanılan birimler; kayıtta farklı bir değer varsa listeye eklenir. */
const BIRIMLER = ['adet', 'metre', 'kg', 'litre', 'takım'] as const;

/**
 * Sayısal alanlar formda string tutuluyor; gönderim anında Number'a çevriliyor.
 * Böylece şemanın girdi ve çıktı tipleri aynı kalıyor ve boş alan sessizce
 * 0'a dönüşmüyor.
 */
const parcaSemasi = z.object({
  kod: z.string().trim().min(1, 'Parça kodu zorunlu.').max(50, 'Parça kodu en fazla 50 karakter.'),
  ad: z.string().trim().min(1, 'Parça adı zorunlu.').max(120, 'Parça adı en fazla 120 karakter.'),
  aciklama: z.string().max(500, 'Açıklama en fazla 500 karakter.'),
  birim: z.string().trim().min(1, 'Birim seçin.'),
  kritikSeviye: z
    .string()
    .trim()
    .regex(/^\d+$/, 'Kritik seviye 0 veya daha büyük bir tam sayı olmalı.'),
  kategoriId: z.string().trim().min(1, 'Kategori seçin.'),
  arizali: z.boolean(),
});

type ParcaFormu = z.infer<typeof parcaSemasi>;

const BOS_FORM: ParcaFormu = {
  kod: '',
  ad: '',
  aciklama: '',
  birim: 'adet',
  kritikSeviye: '5',
  kategoriId: '',
  arizali: false,
};

function formaCevir(parca: ParcaDetay): ParcaFormu {
  return {
    kod: parca.kod,
    ad: parca.ad,
    aciklama: parca.aciklama ?? '',
    birim: parca.birim,
    kritikSeviye: String(parca.kritikSeviye),
    kategoriId: String(parca.kategoriId),
    arizali: parca.arizali,
  };
}

export function ParcaFormPage() {
  const { id } = useParams();
  const duzenleme = id !== undefined;
  const parcaId = Number(id);
  const gecerliId = !duzenleme || (Number.isInteger(parcaId) && parcaId > 0);

  const parca = useParca(duzenleme && gecerliId ? parcaId : undefined);

  if (duzenleme && !gecerliId) {
    return (
      <div className="panel">
        <Hata mesaj={`"${id}" geçerli bir parça numarası değil.`} />
      </div>
    );
  }

  if (duzenleme && parca.isPending) {
    return (
      <div className="panel">
        <Yukleniyor mesaj="Parça bilgileri yükleniyor" />
      </div>
    );
  }

  if (duzenleme && parca.isError) {
    return (
      <div className="space-y-5">
        <GeriBaglantisi to="/parcalar" etiket="Parça listesine dön" />
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

  return <Form mevcut={duzenleme ? parca.data : undefined} />;
}

function Form({ mevcut }: { mevcut?: ParcaDetay }) {
  const navigate = useNavigate();
  const duzenleme = mevcut !== undefined;
  const [sunucuHatasi, setSunucuHatasi] = useState<string | null>(null);

  const kategoriler = useKategoriler();
  const olustur = useParcaOlustur();
  const guncelle = useParcaGuncelle(mevcut?.id ?? 0);

  // Referansı sabit tut: her render'da yeni nesne verirsek form sürekli sıfırlanır.
  const values = useMemo(() => (mevcut ? formaCevir(mevcut) : undefined), [mevcut]);

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ParcaFormu>({
    resolver: zodResolver(parcaSemasi),
    defaultValues: BOS_FORM,
    values,
    // Arka planda veri tazelenirse kullanıcının yazdıkları silinmesin.
    resetOptions: { keepDirtyValues: true },
  });

  // watch() yerine useWatch: React Compiler ile uyumlu, yalnızca bu alanı izler.
  const aciklamaUzunlugu = useWatch({ control, name: 'aciklama' })?.length ?? 0;

  // Kayıtlı birim listede yoksa seçenek olarak ekle, yoksa değer kaybolur.
  const birimler = useMemo(() => {
    const mevcutBirim = mevcut?.birim;
    const liste: string[] = [...BIRIMLER];
    if (mevcutBirim && !liste.includes(mevcutBirim)) liste.unshift(mevcutBirim);
    return liste;
  }, [mevcut?.birim]);

  const iptalHedefi = duzenleme ? `/parcalar/${mevcut.id}` : '/parcalar';

  async function onSubmit(degerler: ParcaFormu) {
    setSunucuHatasi(null);

    const aciklama = degerler.aciklama.trim();
    const ortak = {
      kod: degerler.kod,
      ad: degerler.ad,
      birim: degerler.birim,
      kritikSeviye: Number(degerler.kritikSeviye),
      kategoriId: Number(degerler.kategoriId),
    };

    try {
      if (duzenleme) {
        // Düzenlemede açıklama her zaman gönderilir ki kullanıcı temizleyebilsin.
        const govde: ParcaGuncelleDto = { ...ortak, aciklama, arizali: degerler.arizali };
        const guncel = await guncelle.mutateAsync(govde);
        navigate(`/parcalar/${guncel.id}`, { replace: true });
      } else {
        // Eklemede boş açıklamayı hiç göndermeyip null kalmasını sağlıyoruz.
        const govde: ParcaYazDto = aciklama ? { ...ortak, aciklama } : ortak;
        const yeni = await olustur.mutateAsync(govde);
        navigate(`/parcalar/${yeni.id}`, { replace: true });
      }
    } catch (error) {
      const mesaj = hataMesaji(error, 'Parça kaydedilemedi.');

      // 409 her zaman kod çakışmasıdır; hatayı alanın yanında da göster.
      if (hataDurumu(error) === 409) {
        setError('kod', { type: 'server', message: mesaj });
      }

      setSunucuHatasi(mesaj);
    }
  }

  return (
    <div className="space-y-5">
      <GeriBaglantisi
        to={iptalHedefi}
        etiket={duzenleme ? 'Parça detayına dön' : 'Parça listesine dön'}
      />

      <section className="panel relative overflow-hidden px-6 py-6">
        <CornerFrame size={20} />
        <div className="relative">
          <p className="label-micro">{duzenleme ? 'Parça düzenleme' : 'Yeni kayıt'}</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-fog-100">
            {duzenleme ? mevcut.ad : 'Yeni Parça'}
          </h2>
          <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-fog-500">
            {duzenleme
              ? 'Katalog bilgilerini güncelleyin. Kod değiştirilirse benzersizliği yeniden denetlenir.'
              : 'Katalog kaydını oluşturun. Depo stokları ve model uyumlulukları kayıttan sonra tanımlanır.'}
          </p>
        </div>
      </section>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {sunucuHatasi && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-danger-500/30 bg-danger-900/40 px-3.5 py-3"
          >
            <TriangleAlert className="mt-px size-4 shrink-0 text-danger-400" strokeWidth={1.75} />
            <p className="text-sm leading-relaxed text-danger-400">{sunucuHatasi}</p>
          </div>
        )}

        <Bolum baslik="Tanım">
          <div className="grid gap-5 sm:grid-cols-2">
            <Alan
              label="Parça kodu"
              zorunlu
              hata={errors.kod?.message}
              ipucu="Katalogda benzersiz olmalı."
            >
              <input
                {...register('kod')}
                type="text"
                autoComplete="off"
                placeholder="MTR-4212"
                aria-invalid={Boolean(errors.kod)}
                className={girdiSinifi(Boolean(errors.kod), 'font-mono')}
              />
            </Alan>

            <Alan label="Parça adı" zorunlu hata={errors.ad?.message}>
              <input
                {...register('ad')}
                type="text"
                autoComplete="off"
                placeholder="Fırçasız motor 4212"
                aria-invalid={Boolean(errors.ad)}
                className={girdiSinifi(Boolean(errors.ad))}
              />
            </Alan>
          </div>

          <Alan
            label="Açıklama"
            hata={errors.aciklama?.message}
            ipucu={`${aciklamaUzunlugu}/500 karakter`}
          >
            <textarea
              {...register('aciklama')}
              rows={3}
              placeholder="Ana gövde itki motoru…"
              aria-invalid={Boolean(errors.aciklama)}
              className={`${girdiSinifi(Boolean(errors.aciklama))} resize-y`}
            />
          </Alan>
        </Bolum>

        <Bolum baslik="Sınıflandırma ve stok">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Alan
              label="Kategori"
              zorunlu
              hata={errors.kategoriId?.message ?? (kategoriler.isError ? 'Kategoriler yüklenemedi.' : undefined)}
            >
              <select
                {...register('kategoriId')}
                disabled={kategoriler.isPending}
                aria-invalid={Boolean(errors.kategoriId)}
                className={`${girdiSinifi(Boolean(errors.kategoriId))} cursor-pointer disabled:cursor-wait disabled:opacity-60`}
              >
                <option value="">
                  {kategoriler.isPending ? 'Yükleniyor…' : 'Kategori seçin'}
                </option>
                {(kategoriler.data ?? []).map((kategori) => (
                  <option key={kategori.id} value={kategori.id}>
                    {kategori.ad}
                  </option>
                ))}
              </select>
            </Alan>

            <Alan label="Birim" zorunlu hata={errors.birim?.message}>
              <select
                {...register('birim')}
                aria-invalid={Boolean(errors.birim)}
                className={`${girdiSinifi(Boolean(errors.birim))} cursor-pointer`}
              >
                {birimler.map((birim) => (
                  <option key={birim} value={birim}>
                    {birim}
                  </option>
                ))}
              </select>
            </Alan>

            <Alan
              label="Kritik seviye"
              zorunlu
              hata={errors.kritikSeviye?.message}
              ipucu="Toplam stok bu eşiğin altına düşünce parça kritik sayılır."
            >
              <input
                {...register('kritikSeviye')}
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                aria-invalid={Boolean(errors.kritikSeviye)}
                className={girdiSinifi(Boolean(errors.kritikSeviye), 'font-mono tabular-nums')}
              />
            </Alan>
          </div>
        </Bolum>

        {/* Arızalı bayrağı yalnızca PATCH gövdesinde var; eklemede gösterilmiyor. */}
        {duzenleme && (
          <Bolum baslik="Durum">
            <label className="group flex cursor-pointer items-start gap-3.5">
              <input {...register('arizali')} type="checkbox" className="peer sr-only" />
              {/* İkon input'un kardeşi değil, o yüzden peer-checked'i alt seçiciyle uyguluyoruz. */}
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border border-ink-500 bg-ink-850 transition peer-checked:border-danger-500/60 peer-checked:bg-danger-900/60 peer-checked:[&_svg]:opacity-100 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-signal-400">
                <Check className="size-3.5 text-danger-400 opacity-0 transition" strokeWidth={3} />
              </span>
              <span>
                <span className="block text-sm text-fog-100">Arızalı olarak işaretle</span>
                <span className="mt-1 block text-xs leading-relaxed text-fog-500">
                  Arızalı parçalar listede kırmızı rozetle görünür.
                </span>
              </span>
            </label>
          </Bolum>
        )}

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Link
            to={iptalHedefi}
            className="rounded-lg border border-ink-600 px-4 py-2.5 text-sm text-fog-500 transition hover:border-ink-500 hover:text-fog-300"
          >
            İptal
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-signal-500 px-5 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-signal-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle className="size-4 animate-spin" strokeWidth={2.25} />
                Kaydediliyor
              </>
            ) : (
              <>
                <Save className="size-4" strokeWidth={2.25} />
                {duzenleme ? 'Değişiklikleri kaydet' : 'Parçayı oluştur'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function girdiSinifi(hataVar: boolean, ek = ''): string {
  return `w-full rounded-lg border bg-ink-850 px-3.5 py-2.5 text-sm text-fog-100 transition placeholder:text-fog-700 hover:border-ink-500 focus:outline-none focus:ring-2 focus:ring-signal-500/15 ${
    hataVar ? 'border-danger-500/50 focus:border-danger-500/70' : 'border-ink-600 focus:border-signal-500/60'
  } ${ek}`;
}

function GeriBaglantisi({ to, etiket }: { to: string; etiket: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 text-xs text-fog-500 transition hover:text-signal-400"
    >
      <ArrowLeft className="size-3.5" strokeWidth={2} />
      {etiket}
    </Link>
  );
}

function Bolum({ baslik, children }: { baslik: string; children: ReactNode }) {
  return (
    <section className="panel overflow-hidden">
      <header className="border-b border-ink-700 px-5 py-3">
        <h3 className="label-micro">{baslik}</h3>
      </header>
      <div className="space-y-5 p-5">{children}</div>
    </section>
  );
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
