import { ArrowRight, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CornerFrame } from '../components/ui/CornerFrame';
import { useAuth } from '../hooks/useAuth';
import { NAV_GROUPS } from '../lib/navigation';

export function DashboardPage() {
  const { user, hasRole } = useAuth();

  // Kullanıcının gerçekten girebileceği bölümler — Dashboard'ın kendisi hariç.
  const kisayollar = NAV_GROUPS.flatMap((grup) => grup.items).filter(
    (item) => item.to !== '/' && hasRole(item.roller),
  );

  return (
    <div className="space-y-8">
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

      <p className="text-xs leading-relaxed text-fog-700">
        Veri ekranları (parça listesi, stok hareketleri, talep akışı) Gün 8'de devreye alınacak.
      </p>
    </div>
  );
}

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
