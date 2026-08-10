import { Inbox, LoaderCircle, RotateCw, TriangleAlert } from 'lucide-react';

interface YukleniyorProps {
  mesaj?: string;
}

export function Yukleniyor({ mesaj = 'Yükleniyor' }: YukleniyorProps) {
  return (
    <div className="flex items-center justify-center gap-3 px-6 py-16">
      <LoaderCircle className="size-4 animate-spin text-signal-400" strokeWidth={2} />
      <span className="label-micro">{mesaj}</span>
    </div>
  );
}

interface HataProps {
  mesaj: string;
  onTekrarDene?: () => void;
}

export function Hata({ mesaj, onTekrarDene }: HataProps) {
  return (
    <div role="alert" className="flex flex-col items-center gap-4 px-6 py-14 text-center">
      <span className="grid size-11 place-items-center rounded-xl border border-danger-500/30 bg-danger-900/40 text-danger-400">
        <TriangleAlert className="size-5" strokeWidth={1.75} />
      </span>
      <div>
        <p className="label-micro text-danger-400">Veri alınamadı</p>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-fog-500">{mesaj}</p>
      </div>
      {onTekrarDene && (
        <button
          type="button"
          onClick={onTekrarDene}
          className="inline-flex items-center gap-2 rounded-lg border border-ink-600 bg-ink-800 px-3.5 py-2 text-xs font-medium text-fog-300 transition hover:border-signal-500/40 hover:text-fog-100"
        >
          <RotateCw className="size-3.5" strokeWidth={2} />
          Tekrar dene
        </button>
      )}
    </div>
  );
}

interface BosProps {
  baslik: string;
  aciklama?: string;
}

export function Bos({ baslik, aciklama }: BosProps) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-14 text-center">
      <span className="grid size-11 place-items-center rounded-xl border border-ink-600 bg-ink-850 text-fog-700">
        <Inbox className="size-5" strokeWidth={1.75} />
      </span>
      <div>
        <p className="text-sm font-medium text-fog-300">{baslik}</p>
        {aciklama && <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-fog-700">{aciklama}</p>}
      </div>
    </div>
  );
}
