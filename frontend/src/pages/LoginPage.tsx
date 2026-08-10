import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Eye, EyeOff, LoaderCircle, Lock, Mail, TriangleAlert } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { BrandMark } from '../components/ui/BrandMark';
import { CornerFrame } from '../components/ui/CornerFrame';
import { FullScreenLoader } from '../components/ui/FullScreenLoader';
import { useAuth } from '../hooks/useAuth';
import { hataMesaji } from '../lib/api';

const girisSemasi = z.object({
  email: z.email('Geçerli bir e-posta adresi girin.'),
  sifre: z.string().min(6, 'Şifre en az 6 karakter olmalı.'),
});

type GirisFormu = z.infer<typeof girisSemasi>;

export function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sunucuHatasi, setSunucuHatasi] = useState<string | null>(null);
  const [sifreGorunur, setSifreGorunur] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GirisFormu>({
    resolver: zodResolver(girisSemasi),
    defaultValues: { email: '', sifre: '' },
  });

  // Korumalı bir sayfadan yönlendirildiyse giriş sonrası oraya geri dön.
  const hedef = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/';

  if (isLoading) {
    return <FullScreenLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to={hedef} replace />;
  }

  async function onSubmit(degerler: GirisFormu) {
    setSunucuHatasi(null);

    try {
      await login(degerler.email, degerler.sifre);
      navigate(hedef, { replace: true });
    } catch (error) {
      setSunucuHatasi(hataMesaji(error, 'Giriş yapılamadı. Bilgilerinizi kontrol edin.'));
    }
  }

  return (
    <div className="relative grid min-h-full place-items-center overflow-hidden bg-ink-950 px-4 py-10">
      <ArkaPlan />

      <div className="relative w-full max-w-[26rem]">
        {/* Marka bloğu — kartın üstünde, nefes alan bir alan */}
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="relative grid size-14 place-items-center rounded-xl border border-signal-500/25 bg-ink-900 text-signal-400">
            <span
              aria-hidden="true"
              className="absolute -inset-2 rounded-2xl bg-signal-400/8 blur-lg"
            />
            <BrandMark className="relative size-7" />
          </span>
          <h1 className="mt-5 font-mono text-lg font-semibold tracking-[0.2em] text-fog-100">
            İHA ENVANTER
          </h1>
          <p className="label-micro mt-2.5">Bakım &amp; Lojistik Komuta Paneli</p>
        </div>

        <div className="panel relative bg-ink-900/80 px-7 py-8 shadow-2xl shadow-black/60 backdrop-blur-xl sm:px-8">
          <CornerFrame size={20} />

          <div className="mb-7 flex items-baseline justify-between">
            <h2 className="text-base font-semibold text-fog-100">Oturum aç</h2>
            <span className="font-mono text-[0.625rem] tracking-[0.14em] text-fog-700 uppercase">
              Yetkili erişim
            </span>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <Alan
              label="E-posta"
              hata={errors.email?.message}
              ikon={<Mail className="size-4" strokeWidth={1.75} />}
            >
              <input
                {...register('email')}
                type="email"
                autoComplete="username"
                autoFocus
                placeholder="admin@iha.com"
                aria-invalid={Boolean(errors.email)}
                className="w-full bg-transparent py-3 pr-3 pl-10 text-sm text-fog-100 placeholder:text-fog-700 focus:outline-none"
              />
            </Alan>

            <Alan
              label="Şifre"
              hata={errors.sifre?.message}
              ikon={<Lock className="size-4" strokeWidth={1.75} />}
            >
              <input
                {...register('sifre')}
                type={sifreGorunur ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                aria-invalid={Boolean(errors.sifre)}
                className="w-full bg-transparent py-3 pr-11 pl-10 text-sm text-fog-100 placeholder:text-fog-700 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setSifreGorunur((g) => !g)}
                aria-label={sifreGorunur ? 'Şifreyi gizle' : 'Şifreyi göster'}
                className="absolute top-1/2 right-3 -translate-y-1/2 rounded p-1 text-fog-700 transition hover:text-fog-300"
              >
                {sifreGorunur ? (
                  <EyeOff className="size-4" strokeWidth={1.75} />
                ) : (
                  <Eye className="size-4" strokeWidth={1.75} />
                )}
              </button>
            </Alan>

            {sunucuHatasi && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border border-danger-500/30 bg-danger-900/40 px-3.5 py-3"
              >
                <TriangleAlert
                  className="mt-px size-4 shrink-0 text-danger-400"
                  strokeWidth={1.75}
                />
                <p className="text-sm leading-relaxed text-danger-400">{sunucuHatasi}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="group flex w-full items-center justify-center gap-2 rounded-lg bg-signal-500 py-3 text-sm font-semibold text-ink-950 transition hover:bg-signal-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" strokeWidth={2.25} />
                  Doğrulanıyor
                </>
              ) : (
                <>
                  Giriş yap
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                    strokeWidth={2.25}
                  />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center font-mono text-[0.625rem] leading-relaxed tracking-[0.1em] text-fog-700 uppercase">
          Bu sistem yalnızca yetkili personel içindir
        </p>
      </div>
    </div>
  );
}

interface AlanProps {
  label: string;
  hata?: string;
  ikon: ReactNode;
  children: ReactNode;
}

function Alan({ label, hata, ikon, children }: AlanProps) {
  return (
    <div>
      <label className="label-micro mb-2 block">{label}</label>
      <div
        className={`relative rounded-lg border bg-ink-850 transition focus-within:border-signal-500/60 focus-within:ring-2 focus-within:ring-signal-500/15 ${
          hata ? 'border-danger-500/50' : 'border-ink-600'
        }`}
      >
        <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-fog-700">
          {ikon}
        </span>
        {children}
      </div>
      {hata && <p className="mt-1.5 text-xs text-danger-400">{hata}</p>}
    </div>
  );
}

/** Radar halkaları + ölçüm ızgarası: giriş ekranına derinlik veren dekor. */
function ArkaPlan() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="hud-grid absolute inset-0 opacity-60" />

      <div className="absolute top-1/2 left-1/2 size-[46rem] -translate-x-1/2 -translate-y-1/2">
        <div className="absolute inset-0 rounded-full border border-signal-500/8" />
        <div className="absolute inset-[14%] rounded-full border border-signal-500/8" />
        <div className="absolute inset-[30%] rounded-full border border-signal-500/8" />
        <div className="hud-sweep absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,transparent_300deg,color-mix(in_oklab,var(--color-signal-400)_14%,transparent)_360deg)]" />
      </div>

      {/* Üstten sıcak bir sinyal parıltısı, alta doğru koyulaşan zemin */}
      <div className="absolute -top-40 left-1/2 h-96 w-[52rem] -translate-x-1/2 rounded-full bg-signal-500/8 blur-[120px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink-950/40 via-transparent to-ink-950" />
    </div>
  );
}
