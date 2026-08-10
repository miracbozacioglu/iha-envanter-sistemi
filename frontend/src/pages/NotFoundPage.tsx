import { Radar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CornerFrame } from '../components/ui/CornerFrame';

export function NotFoundPage() {
  return (
    <div className="panel relative grid min-h-[24rem] place-items-center px-6 py-16">
      <CornerFrame size={22} className="text-ink-500" />

      <div className="max-w-sm text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-xl border border-ink-600 bg-ink-850 text-fog-500">
          <Radar className="size-6" strokeWidth={1.75} />
        </span>

        <p className="label-micro mt-6">Hata 404</p>
        <h2 className="mt-3 text-xl font-semibold text-fog-100">Bu adreste bir şey yok</h2>
        <p className="mt-2.5 text-sm leading-relaxed text-fog-500">
          Aradığın sayfa taşınmış ya da hiç var olmamış olabilir.
        </p>

        <Link
          to="/"
          className="mt-7 inline-flex rounded-lg border border-ink-600 bg-ink-800 px-4 py-2.5 text-sm font-medium text-fog-300 transition hover:border-signal-500/40 hover:text-fog-100"
        >
          Dashboard'a dön
        </Link>
      </div>
    </div>
  );
}
