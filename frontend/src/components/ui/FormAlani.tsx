import type { ReactNode } from 'react';

interface AlanProps {
  label: string;
  children: ReactNode;
  hata?: string;
  ipucu?: string;
  zorunlu?: boolean;
}

export function Alan({ label, children, hata, ipucu, zorunlu = false }: AlanProps) {
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

/** Form içi hata bandı — sunucudan dönen mesajlar için. */
export function FormHatasi({ mesaj }: { mesaj: string }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-danger-500/30 bg-danger-900/40 px-3.5 py-3 text-sm leading-relaxed text-danger-400"
    >
      {mesaj}
    </div>
  );
}
