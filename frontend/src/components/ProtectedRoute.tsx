import { ArrowLeft, ShieldAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { Rol } from '../types';
import { CornerFrame } from './ui/CornerFrame';
import { FullScreenLoader } from './ui/FullScreenLoader';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Verilirse yalnızca bu rollerdeki kullanıcılar geçebilir. */
  roller?: readonly Rol[];
}

export function ProtectedRoute({ children, roller }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasRole } = useAuth();
  const location = useLocation();

  // /auth/me çözülmeden karar verirsek yenilemede giriş ekranı parlar.
  if (isLoading) {
    return <FullScreenLoader />;
  }

  if (!isAuthenticated) {
    // Nereden geldiğini taşı ki giriş sonrası oraya dönebilelim.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasRole(roller)) {
    return <YetkisizEkrani roller={roller} />;
  }

  return <>{children}</>;
}

const ROL_ADI: Record<Rol, string> = {
  YONETICI: 'yönetici',
  TEKNISYEN: 'teknisyen',
};

function YetkisizEkrani({ roller }: { roller?: readonly Rol[] }) {
  // Hangi rolün gerektiğini yazalım: sayfa artık hem yönetici hem teknisyen
  // kısıtlı olabiliyor, sabit "yönetici" metni yanıltıcı olurdu.
  const izinliler = (roller ?? []).map((rol) => ROL_ADI[rol]).join(' veya ');
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="panel relative max-w-md px-8 py-10 text-center">
        <CornerFrame className="text-danger-400/40" />

        <span className="mx-auto grid size-14 place-items-center rounded-xl border border-danger-500/30 bg-danger-900/40 text-danger-400">
          <ShieldAlert className="size-7" strokeWidth={1.75} />
        </span>

        <p className="label-micro mt-6 text-danger-400">Erişim reddedildi</p>
        <h2 className="mt-3 text-xl font-semibold text-fog-100">Bu bölüm yetkiniz dışında</h2>
        <p className="mt-2.5 text-sm leading-relaxed text-fog-500">
          {izinliler
            ? `Bu sayfa yalnızca ${izinliler} rolündeki kullanıcılara açık.`
            : 'Bu sayfaya erişim yetkiniz yok.'}{' '}
          Erişim gerekiyorsa sistem yöneticisiyle iletişime geçin.
        </p>

        <Link
          to="/"
          className="mt-7 inline-flex items-center gap-2 rounded-lg border border-ink-600 bg-ink-800 px-4 py-2.5 text-sm font-medium text-fog-300 transition hover:border-signal-500/40 hover:text-fog-100"
        >
          <ArrowLeft className="size-4" strokeWidth={1.75} />
          Dashboard'a dön
        </Link>
      </div>
    </div>
  );
}
