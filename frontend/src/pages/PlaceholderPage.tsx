import { Hammer } from 'lucide-react';
import { CornerFrame } from '../components/ui/CornerFrame';

interface PlaceholderPageProps {
  baslik: string;
  aciklama: string;
  /** Bu ekranın planlandığı geliştirme günü. */
  gun?: string;
}

export function PlaceholderPage({ baslik, aciklama, gun = 'Gün 8' }: PlaceholderPageProps) {
  return (
    <div className="panel hud-grid-fine relative grid min-h-[24rem] place-items-center px-6 py-16">
      <CornerFrame size={22} className="text-ink-500" />

      <div className="max-w-md text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-xl border border-alert-400/25 bg-alert-400/8 text-alert-400">
          <Hammer className="size-6" strokeWidth={1.75} />
        </span>

        <p className="label-micro mt-6 text-alert-400">Yapım aşamasında</p>
        <h2 className="mt-3 text-xl font-semibold text-fog-100">{baslik}</h2>
        <p className="mt-2.5 text-sm leading-relaxed text-fog-500">{aciklama}</p>

        <p className="mt-6 inline-block rounded-md border border-ink-600 bg-ink-850 px-3 py-1.5 font-mono text-[0.6875rem] tracking-[0.12em] text-fog-700 uppercase">
          Planlanan: {gun}
        </p>
      </div>
    </div>
  );
}
