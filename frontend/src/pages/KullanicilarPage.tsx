import { zodResolver } from '@hookform/resolvers/zod';
import { Check, LoaderCircle, Pencil, Plus, Trash2, TriangleAlert, UserX } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Bos, Hata, Yukleniyor } from '../components/ui/DurumKutusu';
import { Alan, FormHatasi } from '../components/ui/FormAlani';
import { girdiSinifi } from '../lib/formSinif';
import { Modal } from '../components/ui/Modal';
import { Rozet } from '../components/ui/Rozet';
import { useAuth } from '../hooks/useAuth';
import { useKaynakListesi, useKaynakMutasyonlari } from '../hooks/useKaynak';
import { hataMesaji } from '../lib/api';
import type { Kullanici } from '../types';

const YOL = 'kullanicilar';

export function KullanicilarPage() {
  const { user } = useAuth();
  const liste = useKaynakListesi<Kullanici>(YOL);

  const [formAcik, setFormAcik] = useState(false);
  const [duzenlenen, setDuzenlenen] = useState<Kullanici | null>(null);
  const [silinecek, setSilinecek] = useState<Kullanici | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            setDuzenlenen(null);
            setFormAcik(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-signal-500 px-4 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-signal-400"
        >
          <Plus className="size-4" strokeWidth={2.5} />
          Yeni Kullanıcı
        </button>
      </div>

      <div className="panel overflow-hidden">
        {liste.isPending ? (
          <Yukleniyor mesaj="Kullanıcılar yükleniyor" />
        ) : liste.isError ? (
          <Hata
            mesaj={hataMesaji(liste.error)}
            onTekrarDene={() => {
              void liste.refetch();
            }}
          />
        ) : liste.data.length === 0 ? (
          <Bos baslik="Kullanıcı yok" aciklama="Sisteme ilk kullanıcıyı ekleyin." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-ink-700 bg-ink-900/60">
                  <Baslik>Ad soyad</Baslik>
                  <Baslik className="w-64">E-posta</Baslik>
                  <Baslik className="w-32">Rol</Baslik>
                  <Baslik className="w-44">Unvan</Baslik>
                  <Baslik className="w-28">Durum</Baslik>
                  <th scope="col" className="w-24 px-4 py-3">
                    <span className="sr-only">İşlemler</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {liste.data.map((kullanici) => (
                  <tr
                    key={kullanici.id}
                    className="border-b border-ink-800 transition last:border-b-0 hover:bg-ink-800/50"
                  >
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        <span className="font-medium text-fog-100">
                          {kullanici.ad} {kullanici.soyad}
                        </span>
                        {kullanici.id === user?.id && (
                          <span className="label-micro text-[0.5625rem] text-fog-700">(siz)</span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-fog-500">{kullanici.email}</td>
                    <td className="px-4 py-3">
                      <Rozet ton={kullanici.rol === 'YONETICI' ? 'uyari' : 'sinyal'} mono>
                        {kullanici.rol === 'YONETICI' ? 'Yönetici' : 'Teknisyen'}
                      </Rozet>
                    </td>
                    <td className="px-4 py-3 text-fog-500">
                      {kullanici.unvan ?? <span className="text-fog-700 italic">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {kullanici.aktif ? (
                        <Rozet ton="sinyal" mono>
                          Aktif
                        </Rozet>
                      ) : (
                        <Rozet ton="notr" mono>
                          Pasif
                        </Rozet>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <IslemDugmesi
                          etiket={`${kullanici.ad} ${kullanici.soyad} kaydını düzenle`}
                          onClick={() => {
                            setDuzenlenen(kullanici);
                            setFormAcik(true);
                          }}
                        >
                          <Pencil className="size-3.5" strokeWidth={2} />
                        </IslemDugmesi>
                        <IslemDugmesi
                          etiket={`${kullanici.ad} ${kullanici.soyad} kaydını sil`}
                          tehlikeli
                          onClick={() => setSilinecek(kullanici)}
                        >
                          <Trash2 className="size-3.5" strokeWidth={2} />
                        </IslemDugmesi>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {formAcik && (
        <Modal
          baslik={duzenlenen ? 'Kullanıcı düzenle' : 'Yeni kullanıcı'}
          altBaslik={duzenlenen ? `${duzenlenen.ad} ${duzenlenen.soyad}` : undefined}
          onKapat={() => setFormAcik(false)}
          genis
        >
          <KullaniciFormu kayit={duzenlenen} onKapat={() => setFormAcik(false)} />
        </Modal>
      )}

      {silinecek && (
        <SilmeModali kullanici={silinecek} onKapat={() => setSilinecek(null)} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Silme + pasife alma                                                 */
/* ------------------------------------------------------------------ */

function SilmeModali({ kullanici, onKapat }: { kullanici: Kullanici; onKapat: () => void }) {
  const { sil, guncelle } = useKaynakMutasyonlari<Kullanici, Record<string, unknown>>(YOL);
  const [hata, setHata] = useState<string | null>(null);
  // Silme ilişkiler yüzünden reddedildiyse pasife alma alternatifini öneriyoruz.
  const [pasifeAlOner, setPasifeAlOner] = useState(false);

  async function silmeyiOnayla() {
    setHata(null);

    try {
      await sil.mutateAsync(kullanici.id);
      onKapat();
    } catch (error) {
      setHata(hataMesaji(error, 'Kullanıcı silinemedi.'));
      setPasifeAlOner(kullanici.aktif);
    }
  }

  async function pasifeAl() {
    setHata(null);

    try {
      await guncelle.mutateAsync({ id: kullanici.id, dto: { aktif: false } });
      onKapat();
    } catch (error) {
      setHata(hataMesaji(error, 'Kullanıcı pasife alınamadı.'));
    }
  }

  return (
    <Modal baslik="Kullanıcı sil" onKapat={onKapat}>
      <div className="space-y-5">
        <p className="text-sm leading-relaxed text-fog-300">
          <strong className="text-fog-100">
            {kullanici.ad} {kullanici.soyad}
          </strong>{' '}
          hesabı silinecek. Bu işlem geri alınamaz.
        </p>

        {hata && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-danger-500/30 bg-danger-900/40 px-3.5 py-3"
          >
            <TriangleAlert className="mt-px size-4 shrink-0 text-danger-400" strokeWidth={1.75} />
            <p className="text-sm leading-relaxed text-danger-400">{hata}</p>
          </div>
        )}

        {pasifeAlOner && (
          <p className="rounded-lg border border-alert-400/25 bg-alert-400/8 px-3.5 py-3 text-xs leading-relaxed text-alert-400">
            Hesabı pasife alırsanız kayıtları korunur ama kullanıcı giriş yapamaz.
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onKapat}
            className="rounded-lg border border-ink-600 px-4 py-2.5 text-sm text-fog-500 transition hover:border-ink-500 hover:text-fog-300"
          >
            Vazgeç
          </button>

          {pasifeAlOner && (
            <button
              type="button"
              onClick={() => void pasifeAl()}
              disabled={guncelle.isPending}
              className="inline-flex items-center gap-2 rounded-lg border border-alert-400/40 bg-alert-400/10 px-4 py-2.5 text-sm font-semibold text-alert-400 transition hover:bg-alert-400/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {guncelle.isPending ? (
                <LoaderCircle className="size-4 animate-spin" strokeWidth={2.25} />
              ) : (
                <UserX className="size-4" strokeWidth={2} />
              )}
              Pasife al
            </button>
          )}

          <button
            type="button"
            onClick={() => void silmeyiOnayla()}
            disabled={sil.isPending}
            className="rounded-lg bg-danger-500 px-4 py-2.5 text-sm font-semibold text-fog-100 transition hover:bg-danger-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sil.isPending ? 'Siliniyor…' : 'Evet, sil'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Form                                                                */
/* ------------------------------------------------------------------ */

/**
 * Şifre eklemede zorunlu, düzenlemede opsiyonel. Tek şema iki modu da
 * karşılasın diye alan boş bırakılabilir tutuluyor; zorunluluk `superRefine`
 * ile moda göre uygulanıyor.
 */
function kullaniciSemasi(duzenleme: boolean) {
  return z
    .object({
      ad: z.string().trim().min(1, 'Ad zorunlu.').max(60, 'En fazla 60 karakter.'),
      soyad: z.string().trim().min(1, 'Soyad zorunlu.').max(60, 'En fazla 60 karakter.'),
      email: z.email('Geçerli bir e-posta adresi girin.'),
      sifre: z.string(),
      rol: z.enum(['TEKNISYEN', 'YONETICI']),
      unvan: z.string().max(80, 'En fazla 80 karakter.'),
      aktif: z.boolean(),
    })
    .superRefine((degerler, ctx) => {
      const bos = degerler.sifre.length === 0;

      if (!duzenleme && bos) {
        ctx.addIssue({ code: 'custom', path: ['sifre'], message: 'Şifre zorunlu.' });
        return;
      }

      if (!bos && degerler.sifre.length < 6) {
        ctx.addIssue({
          code: 'custom',
          path: ['sifre'],
          message: 'Şifre en az 6 karakter olmalı.',
        });
      }
    });
}

function KullaniciFormu({ kayit, onKapat }: { kayit: Kullanici | null; onKapat: () => void }) {
  const duzenleme = kayit !== null;
  const { olustur, guncelle } = useKaynakMutasyonlari<Kullanici, Record<string, unknown>>(YOL);
  const [hata, setHata] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(kullaniciSemasi(duzenleme)),
    defaultValues: {
      ad: kayit?.ad ?? '',
      soyad: kayit?.soyad ?? '',
      email: kayit?.email ?? '',
      sifre: '',
      rol: kayit?.rol ?? 'TEKNISYEN',
      unvan: kayit?.unvan ?? '',
      aktif: kayit?.aktif ?? true,
    },
  });

  const kaydediyor = olustur.isPending || guncelle.isPending;

  async function kaydet(d: {
    ad: string;
    soyad: string;
    email: string;
    sifre: string;
    rol: 'TEKNISYEN' | 'YONETICI';
    unvan: string;
    aktif: boolean;
  }) {
    setHata(null);

    const unvan = d.unvan.trim() === '' ? null : d.unvan.trim();
    const sifre = d.sifre.trim();

    try {
      if (duzenleme) {
        await guncelle.mutateAsync({
          id: kayit.id,
          dto: {
            ad: d.ad,
            soyad: d.soyad,
            email: d.email,
            rol: d.rol,
            unvan,
            aktif: d.aktif,
            // Boş şifre alanı "değiştirme" demek; gövdeye hiç konmuyor.
            ...(sifre ? { sifre } : {}),
          },
        });
      } else {
        await olustur.mutateAsync({
          ad: d.ad,
          soyad: d.soyad,
          email: d.email,
          sifre,
          rol: d.rol,
          unvan,
        });
      }
      onKapat();
    } catch (error) {
      setHata(hataMesaji(error, 'Kullanıcı kaydedilemedi.'));
    }
  }

  return (
    <form onSubmit={handleSubmit(kaydet)} noValidate className="space-y-5">
      {hata && <FormHatasi mesaj={hata} />}

      <div className="grid gap-5 sm:grid-cols-2">
        <Alan label="Ad" zorunlu hata={errors.ad?.message}>
          <input {...register('ad')} autoFocus className={girdiSinifi(Boolean(errors.ad))} />
        </Alan>

        <Alan label="Soyad" zorunlu hata={errors.soyad?.message}>
          <input {...register('soyad')} className={girdiSinifi(Boolean(errors.soyad))} />
        </Alan>
      </div>

      <Alan label="E-posta" zorunlu hata={errors.email?.message}>
        <input
          {...register('email')}
          type="email"
          autoComplete="off"
          className={girdiSinifi(Boolean(errors.email), 'font-mono')}
        />
      </Alan>

      <Alan
        label="Şifre"
        zorunlu={!duzenleme}
        hata={errors.sifre?.message}
        ipucu={duzenleme ? 'Boş bırakılırsa mevcut şifre korunur.' : 'En az 6 karakter.'}
      >
        <input
          {...register('sifre')}
          type="password"
          autoComplete="new-password"
          placeholder={duzenleme ? '••••••••' : ''}
          className={girdiSinifi(Boolean(errors.sifre))}
        />
      </Alan>

      <div className="grid gap-5 sm:grid-cols-2">
        <Alan label="Rol" zorunlu hata={errors.rol?.message}>
          <select
            {...register('rol')}
            className={`${girdiSinifi(Boolean(errors.rol))} cursor-pointer`}
          >
            <option value="TEKNISYEN">Teknisyen</option>
            <option value="YONETICI">Yönetici</option>
          </select>
        </Alan>

        <Alan label="Unvan" hata={errors.unvan?.message}>
          <input
            {...register('unvan')}
            placeholder="Bakım Teknisyeni"
            className={girdiSinifi(Boolean(errors.unvan))}
          />
        </Alan>
      </div>

      {/* aktif yalnızca PATCH gövdesinde var; eklemede hesap zaten aktif başlar. */}
      {duzenleme && (
        <label className="group flex cursor-pointer items-start gap-3.5">
          <input {...register('aktif')} type="checkbox" className="peer sr-only" />
          <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border border-ink-500 bg-ink-850 transition peer-checked:border-signal-500/60 peer-checked:bg-signal-900/60 peer-checked:[&_svg]:opacity-100 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-signal-400">
            <Check className="size-3.5 text-signal-400 opacity-0 transition" strokeWidth={3} />
          </span>
          <span>
            <span className="block text-sm text-fog-100">Hesap aktif</span>
            <span className="mt-1 block text-xs leading-relaxed text-fog-500">
              Pasif hesaplar sisteme giriş yapamaz.
            </span>
          </span>
        </label>
      )}

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
    </form>
  );
}

function IslemDugmesi({
  etiket,
  onClick,
  tehlikeli = false,
  children,
}: {
  etiket: string;
  onClick: () => void;
  tehlikeli?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={etiket}
      aria-label={etiket}
      className={`rounded-md border border-transparent p-2 text-fog-700 transition hover:border-ink-600 ${
        tehlikeli
          ? 'hover:bg-danger-900/40 hover:text-danger-400'
          : 'hover:bg-ink-800 hover:text-fog-100'
      }`}
    >
      {children}
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
