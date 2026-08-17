import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, LoaderCircle, Send } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { CornerFrame } from '../components/ui/CornerFrame';
import { Alan, FormHatasi } from '../components/ui/FormAlani';
import { ParcaSecici } from '../components/ui/ParcaSecici';
import { useTalepOlustur } from '../hooks/useTalepler';
import { hataMesaji } from '../lib/api';
import { girdiSinifi } from '../lib/formSinif';

const talepSemasi = z.object({
  parcaId: z.string().min(1, 'Parça seçin.'),
  miktar: z
    .string()
    .trim()
    .regex(/^[1-9]\d*$/, 'Miktar en az 1 olan bir tam sayı olmalı.'),
  aciklama: z.string().max(500, 'En fazla 500 karakter.'),
});

type TalepFormu = z.infer<typeof talepSemasi>;

export function TalepFormPage() {
  const navigate = useNavigate();
  const olustur = useTalepOlustur();
  const [sunucuHatasi, setSunucuHatasi] = useState<string | null>(null);
  const [parcaDegeri, setParcaDegeri] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TalepFormu>({
    resolver: zodResolver(talepSemasi),
    defaultValues: { parcaId: '', miktar: '', aciklama: '' },
  });

  async function onSubmit(degerler: TalepFormu) {
    setSunucuHatasi(null);
    const aciklama = degerler.aciklama.trim();

    try {
      await olustur.mutateAsync({
        parcaId: Number(degerler.parcaId),
        miktar: Number(degerler.miktar),
        ...(aciklama ? { aciklama } : {}),
      });
      navigate('/talepler', { replace: true });
    } catch (error) {
      setSunucuHatasi(hataMesaji(error, 'Talep oluşturulamadı.'));
    }
  }

  return (
    <div className="space-y-5">
      <Link
        to="/talepler"
        className="inline-flex items-center gap-2 text-xs text-fog-500 transition hover:text-signal-400"
      >
        <ArrowLeft className="size-3.5" strokeWidth={2} />
        Talep listesine dön
      </Link>

      <section className="panel relative overflow-hidden px-6 py-6">
        <CornerFrame size={20} />
        <div className="relative">
          <p className="label-micro">Yeni kayıt</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-fog-100">Parça Talebi</h2>
          <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-fog-500">
            Talep <span className="text-alert-400">Beklemede</span> durumunda açılır ve yönetici
            onayına düşer.
          </p>
        </div>
      </section>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <section className="panel overflow-hidden">
          <header className="border-b border-ink-700 px-5 py-3">
            <h3 className="label-micro">Talep bilgileri</h3>
          </header>

          <div className="space-y-5 p-5">
            {sunucuHatasi && <FormHatasi mesaj={sunucuHatasi} />}

            <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
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
            </div>

            <Alan
              label="Gerekçe"
              hata={errors.aciklama?.message}
              ipucu="Talebin neden açıldığını yazmak onay sürecini hızlandırır."
            >
              <textarea
                {...register('aciklama')}
                rows={3}
                placeholder="TR-114 kuyruk nolu aracın motor değişimi için"
                aria-invalid={Boolean(errors.aciklama)}
                className={`${girdiSinifi(Boolean(errors.aciklama))} resize-y`}
              />
            </Alan>
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <Link
            to="/talepler"
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
                Gönderiliyor
              </>
            ) : (
              <>
                <Send className="size-4" strokeWidth={2.25} />
                Talebi gönder
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
