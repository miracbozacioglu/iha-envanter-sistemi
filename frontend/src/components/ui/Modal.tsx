import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { CornerFrame } from './CornerFrame';

interface ModalProps {
  baslik: string;
  altBaslik?: string;
  onKapat: () => void;
  children: ReactNode;
  genis?: boolean;
}

export function Modal({ baslik, altBaslik, onKapat, children, genis = false }: ModalProps) {
  // Escape ile kapat + arka plan kaydırmasını dondur.
  useEffect(() => {
    const tusla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onKapat();
    };

    const oncekiOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', tusla);

    return () => {
      document.body.style.overflow = oncekiOverflow;
      window.removeEventListener('keydown', tusla);
    };
  }, [onKapat]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6">
      <button
        type="button"
        aria-label="Kapat"
        onClick={onKapat}
        className="fixed inset-0 cursor-default bg-ink-950/80 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={baslik}
        className={`panel relative my-auto w-full bg-ink-900 shadow-2xl shadow-black/70 ${
          genis ? 'max-w-2xl' : 'max-w-lg'
        }`}
      >
        <CornerFrame size={18} />

        <header className="flex items-start gap-4 border-b border-ink-700 px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-fog-100">{baslik}</h2>
            {altBaslik && <p className="mt-1 text-xs text-fog-500">{altBaslik}</p>}
          </div>
          <button
            type="button"
            onClick={onKapat}
            aria-label="Kapat"
            className="-mt-1 -mr-1 rounded-md p-1.5 text-fog-500 transition hover:bg-ink-800 hover:text-fog-100"
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        </header>

        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
