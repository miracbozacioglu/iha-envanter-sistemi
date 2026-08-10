import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useKaynakListesi, useKaynakMutasyonlari, type Kimlikli } from '../../hooks/useKaynak';
import { hataMesaji } from '../../lib/api';
import type { Depo, IhaAraci, IhaModeli, Kategori, Tedarikci } from '../../types';
import { girdiSinifi } from '../../lib/formSinif';
import { Alan, FormHatasi } from '../ui/FormAlani';
import type { FormBileseniProps } from './KaynakBolumu';

/** Boş metni null'a çevirir: backend'de @IsOptional null'ı atlar, alan temizlenir. */
function bosaNull(deger: string): string | null {
  const kirpilmis = deger.trim();
  return kirpilmis === '' ? null : kirpilmis;
}

/** Ekleme/düzenleme ayrımı, hata durumu ve kaydetme akışı tüm formlarda ortak. */
function useKaydet<T extends Kimlikli, TDto>(yol: string, kayit: T | null, onKapat: () => void) {
  const { olustur, guncelle } = useKaynakMutasyonlari<T, TDto>(yol);
  const [hata, setHata] = useState<string | null>(null);

  async function kaydet(dto: TDto) {
    setHata(null);

    try {
      if (kayit) {
        await guncelle.mutateAsync({ id: kayit.id, dto });
      } else {
        await olustur.mutateAsync(dto);
      }
      onKapat();
    } catch (error) {
      setHata(hataMesaji(error, 'Kayıt kaydedilemedi.'));
    }
  }

  return { kaydet, hata, kaydediyor: olustur.isPending || guncelle.isPending };
}

function KaydetSatiri({
  onKapat,
  kaydediyor,
  duzenleme,
}: {
  onKapat: () => void;
  kaydediyor: boolean;
  duzenleme: boolean;
}) {
  return (
    <div className="flex justify-end gap-3 pt-1">
      <button
        type="button"
        onClick={onKapat}
        className="rounded-lg border border-ink-600 px-4 py-2.5 text-sm text-fog-500 transition hover:border-ink-500 hover:text-fog-300"
      >
        Vazgeç
      </button>
      <button
        type="submit"
        disabled={kaydediyor}
        className="inline-flex items-center gap-2 rounded-lg bg-signal-500 px-4 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-signal-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {kaydediyor && <LoaderCircle className="size-4 animate-spin" strokeWidth={2.25} />}
        {duzenleme ? 'Kaydet' : 'Oluştur'}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Kategori                                                            */
/* ------------------------------------------------------------------ */

const kategoriSemasi = z.object({
  ad: z.string().trim().min(1, 'Kategori adı zorunlu.').max(80, 'En fazla 80 karakter.'),
  aciklama: z.string().max(500, 'En fazla 500 karakter.'),
});

export function KategoriFormu({ kayit, onKapat }: FormBileseniProps<Kategori>) {
  const { kaydet, hata, kaydediyor } = useKaydet<Kategori, Record<string, unknown>>(
    'kategoriler',
    kayit,
    onKapat,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(kategoriSemasi),
    defaultValues: { ad: kayit?.ad ?? '', aciklama: kayit?.aciklama ?? '' },
  });

  return (
    <form
      onSubmit={handleSubmit((d) => kaydet({ ad: d.ad, aciklama: bosaNull(d.aciklama) }))}
      noValidate
      className="space-y-5"
    >
      {hata && <FormHatasi mesaj={hata} />}

      <Alan label="Kategori adı" zorunlu hata={errors.ad?.message}>
        <input {...register('ad')} autoFocus className={girdiSinifi(Boolean(errors.ad))} />
      </Alan>

      <Alan label="Açıklama" hata={errors.aciklama?.message}>
        <textarea
          {...register('aciklama')}
          rows={3}
          className={`${girdiSinifi(Boolean(errors.aciklama))} resize-y`}
        />
      </Alan>

      <KaydetSatiri onKapat={onKapat} kaydediyor={kaydediyor} duzenleme={kayit !== null} />
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* İHA modeli                                                          */
/* ------------------------------------------------------------------ */

const modelSemasi = z.object({
  ad: z.string().trim().min(1, 'Model adı zorunlu.').max(80, 'En fazla 80 karakter.'),
  uretici: z.string().trim().min(1, 'Üretici zorunlu.').max(80, 'En fazla 80 karakter.'),
  aciklama: z.string().max(500, 'En fazla 500 karakter.'),
});

export function IhaModeliFormu({ kayit, onKapat }: FormBileseniProps<IhaModeli>) {
  const { kaydet, hata, kaydediyor } = useKaydet<IhaModeli, Record<string, unknown>>(
    'iha-modelleri',
    kayit,
    onKapat,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(modelSemasi),
    defaultValues: {
      ad: kayit?.ad ?? '',
      uretici: kayit?.uretici ?? '',
      aciklama: kayit?.aciklama ?? '',
    },
  });

  return (
    <form
      onSubmit={handleSubmit((d) =>
        kaydet({ ad: d.ad, uretici: d.uretici, aciklama: bosaNull(d.aciklama) }),
      )}
      noValidate
      className="space-y-5"
    >
      {hata && <FormHatasi mesaj={hata} />}

      <Alan label="Model adı" zorunlu hata={errors.ad?.message}>
        <input {...register('ad')} autoFocus className={girdiSinifi(Boolean(errors.ad))} />
      </Alan>

      <Alan label="Üretici" zorunlu hata={errors.uretici?.message}>
        <input {...register('uretici')} className={girdiSinifi(Boolean(errors.uretici))} />
      </Alan>

      <Alan label="Açıklama" hata={errors.aciklama?.message}>
        <textarea
          {...register('aciklama')}
          rows={3}
          className={`${girdiSinifi(Boolean(errors.aciklama))} resize-y`}
        />
      </Alan>

      <KaydetSatiri onKapat={onKapat} kaydediyor={kaydediyor} duzenleme={kayit !== null} />
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* İHA aracı                                                           */
/* ------------------------------------------------------------------ */

/** `durum` şemada serbest metin; yaygın değerleri sunuyoruz. */
const ARAC_DURUMLARI = ['AKTIF', 'BAKIMDA', 'PASIF'] as const;

const aracSemasi = z.object({
  kuyrukNo: z.string().trim().min(1, 'Kuyruk numarası zorunlu.').max(40, 'En fazla 40 karakter.'),
  ihaModeliId: z.string().min(1, 'İHA modeli seçin.'),
  durum: z.string().min(1, 'Durum seçin.'),
  aciklama: z.string().max(500, 'En fazla 500 karakter.'),
});

export function IhaAraciFormu({ kayit, onKapat }: FormBileseniProps<IhaAraci>) {
  const { kaydet, hata, kaydediyor } = useKaydet<IhaAraci, Record<string, unknown>>(
    'iha-araclari',
    kayit,
    onKapat,
  );
  const modeller = useKaynakListesi<IhaModeli>('iha-modelleri');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(aracSemasi),
    defaultValues: {
      kuyrukNo: kayit?.kuyrukNo ?? '',
      ihaModeliId: kayit ? String(kayit.ihaModeliId) : '',
      durum: kayit?.durum ?? 'AKTIF',
      aciklama: kayit?.aciklama ?? '',
    },
  });

  // Kayıtlı durum listede yoksa seçenek olarak ekle, yoksa değer kaybolur.
  const durumlar: string[] = [...ARAC_DURUMLARI];
  if (kayit?.durum && !durumlar.includes(kayit.durum)) durumlar.unshift(kayit.durum);

  return (
    <form
      onSubmit={handleSubmit((d) =>
        kaydet({
          kuyrukNo: d.kuyrukNo,
          ihaModeliId: Number(d.ihaModeliId),
          durum: d.durum,
          aciklama: bosaNull(d.aciklama),
        }),
      )}
      noValidate
      className="space-y-5"
    >
      {hata && <FormHatasi mesaj={hata} />}

      <Alan label="Kuyruk numarası" zorunlu hata={errors.kuyrukNo?.message}>
        <input
          {...register('kuyrukNo')}
          autoFocus
          placeholder="TB2-001"
          className={girdiSinifi(Boolean(errors.kuyrukNo), 'font-mono')}
        />
      </Alan>

      <Alan
        label="İHA modeli"
        zorunlu
        hata={
          errors.ihaModeliId?.message ?? (modeller.isError ? 'Modeller yüklenemedi.' : undefined)
        }
      >
        <select
          {...register('ihaModeliId')}
          disabled={modeller.isPending}
          className={`${girdiSinifi(Boolean(errors.ihaModeliId))} cursor-pointer disabled:cursor-wait disabled:opacity-60`}
        >
          <option value="">{modeller.isPending ? 'Yükleniyor…' : 'Model seçin'}</option>
          {(modeller.data ?? []).map((model) => (
            <option key={model.id} value={model.id}>
              {model.ad} · {model.uretici}
            </option>
          ))}
        </select>
      </Alan>

      <Alan label="Durum" zorunlu hata={errors.durum?.message}>
        <select
          {...register('durum')}
          className={`${girdiSinifi(Boolean(errors.durum))} cursor-pointer`}
        >
          {durumlar.map((durum) => (
            <option key={durum} value={durum}>
              {durum}
            </option>
          ))}
        </select>
      </Alan>

      <Alan label="Açıklama" hata={errors.aciklama?.message}>
        <textarea
          {...register('aciklama')}
          rows={3}
          className={`${girdiSinifi(Boolean(errors.aciklama))} resize-y`}
        />
      </Alan>

      <KaydetSatiri onKapat={onKapat} kaydediyor={kaydediyor} duzenleme={kayit !== null} />
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Tedarikçi                                                           */
/* ------------------------------------------------------------------ */

const tedarikciSemasi = z.object({
  ad: z.string().trim().min(1, 'Tedarikçi adı zorunlu.').max(120, 'En fazla 120 karakter.'),
  telefon: z.string().max(40, 'En fazla 40 karakter.'),
  email: z.union([z.literal(''), z.email('Geçerli bir e-posta adresi girin.')]),
});

export function TedarikciFormu({ kayit, onKapat }: FormBileseniProps<Tedarikci>) {
  const { kaydet, hata, kaydediyor } = useKaydet<Tedarikci, Record<string, unknown>>(
    'tedarikciler',
    kayit,
    onKapat,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(tedarikciSemasi),
    defaultValues: {
      ad: kayit?.ad ?? '',
      telefon: kayit?.telefon ?? '',
      email: kayit?.email ?? '',
    },
  });

  return (
    <form
      onSubmit={handleSubmit((d) =>
        kaydet({ ad: d.ad, telefon: bosaNull(d.telefon), email: bosaNull(d.email) }),
      )}
      noValidate
      className="space-y-5"
    >
      {hata && <FormHatasi mesaj={hata} />}

      <Alan label="Tedarikçi adı" zorunlu hata={errors.ad?.message}>
        <input {...register('ad')} autoFocus className={girdiSinifi(Boolean(errors.ad))} />
      </Alan>

      <Alan label="Telefon" hata={errors.telefon?.message}>
        <input
          {...register('telefon')}
          type="tel"
          placeholder="+90 212 000 00 00"
          className={girdiSinifi(Boolean(errors.telefon))}
        />
      </Alan>

      <Alan label="E-posta" hata={errors.email?.message}>
        <input
          {...register('email')}
          type="email"
          placeholder="satis@tedarikci.com"
          className={girdiSinifi(Boolean(errors.email))}
        />
      </Alan>

      <KaydetSatiri onKapat={onKapat} kaydediyor={kaydediyor} duzenleme={kayit !== null} />
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Depo                                                                */
/* ------------------------------------------------------------------ */

const depoSemasi = z.object({
  ad: z.string().trim().min(1, 'Depo adı zorunlu.').max(80, 'En fazla 80 karakter.'),
  lokasyon: z.string().max(120, 'En fazla 120 karakter.'),
});

export function DepoFormu({ kayit, onKapat }: FormBileseniProps<Depo>) {
  const { kaydet, hata, kaydediyor } = useKaydet<Depo, Record<string, unknown>>(
    'depolar',
    kayit,
    onKapat,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(depoSemasi),
    defaultValues: { ad: kayit?.ad ?? '', lokasyon: kayit?.lokasyon ?? '' },
  });

  return (
    <form
      onSubmit={handleSubmit((d) => kaydet({ ad: d.ad, lokasyon: bosaNull(d.lokasyon) }))}
      noValidate
      className="space-y-5"
    >
      {hata && <FormHatasi mesaj={hata} />}

      <Alan label="Depo adı" zorunlu hata={errors.ad?.message}>
        <input {...register('ad')} autoFocus className={girdiSinifi(Boolean(errors.ad))} />
      </Alan>

      <Alan label="Lokasyon" hata={errors.lokasyon?.message}>
        <input
          {...register('lokasyon')}
          placeholder="Merkez"
          className={girdiSinifi(Boolean(errors.lokasyon))}
        />
      </Alan>

      <KaydetSatiri onKapat={onKapat} kaydediyor={kaydediyor} duzenleme={kayit !== null} />
    </form>
  );
}
