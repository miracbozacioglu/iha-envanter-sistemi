import type { ReactNode } from 'react';

export type RozetTonu = 'notr' | 'sinyal' | 'haki' | 'uyari' | 'kritik' | 'bilgi' | 'basari';

const TONLAR: Record<RozetTonu, string> = {
  notr: 'border-ink-600 bg-ink-800 text-fog-300',
  sinyal: 'border-signal-500/30 bg-signal-900/50 text-signal-400',
  haki: 'border-olive-600/40 bg-olive-600/10 text-olive-300',
  uyari: 'border-alert-400/30 bg-alert-400/10 text-alert-400',
  kritik: 'border-danger-500/35 bg-danger-900/45 text-danger-400',
  bilgi: 'border-info-500/35 bg-info-900/50 text-info-400',
  basari: 'border-success-500/35 bg-success-900/50 text-success-400',
};

interface RozetProps {
  children: ReactNode;
  ton?: RozetTonu;
  /** Mono + seyrek harf: durum/enum değerleri için. */
  mono?: boolean;
  className?: string;
}

export function Rozet({ children, ton = 'notr', mono = false, className = '' }: RozetProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs ${TONLAR[ton]} ${
        mono ? 'font-mono text-[0.625rem] tracking-[0.1em] uppercase' : ''
      } ${className}`}
    >
      {children}
    </span>
  );
}
