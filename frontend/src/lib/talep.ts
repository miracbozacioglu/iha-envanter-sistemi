import type { RozetTonu } from '../components/ui/Rozet';
import type { TalepDurumu } from '../types';

export interface DurumBilgisi {
  etiket: string;
  ton: RozetTonu;
  /** Adım dairesinin dolu hali. */
  dolu: string;
  /** Bağlantı çizgisinin tamamlanmış hali. */
  cizgi: string;
  metin: string;
}

/**
 * Durum renkleri tek yerden geliyor ki liste, stepper ve detay ekranı
 * birbirinden ayrışmasın.
 */
export const TALEP_DURUM_BILGISI: Record<TalepDurumu, DurumBilgisi> = {
  BEKLIYOR: {
    etiket: 'Beklemede',
    ton: 'uyari',
    dolu: 'border-alert-400/60 bg-alert-400/15 text-alert-400',
    cizgi: 'bg-alert-400/40',
    metin: 'text-alert-400',
  },
  ONAYLANDI: {
    etiket: 'Onaylandı',
    ton: 'sinyal',
    dolu: 'border-signal-500/60 bg-signal-900/70 text-signal-400',
    cizgi: 'bg-signal-500/40',
    metin: 'text-signal-400',
  },
  REDDEDILDI: {
    etiket: 'Reddedildi',
    ton: 'kritik',
    dolu: 'border-danger-500/60 bg-danger-900/70 text-danger-400',
    cizgi: 'bg-danger-500/40',
    metin: 'text-danger-400',
  },
  SIPARIS_VERILDI: {
    etiket: 'Sipariş verildi',
    ton: 'bilgi',
    dolu: 'border-info-500/60 bg-info-900/70 text-info-400',
    cizgi: 'bg-info-500/40',
    metin: 'text-info-400',
  },
  TESLIM_ALINDI: {
    etiket: 'Teslim alındı',
    ton: 'basari',
    dolu: 'border-success-500/60 bg-success-900/70 text-success-400',
    cizgi: 'bg-success-500/40',
    metin: 'text-success-400',
  },
};

/** Mutlu yol. REDDEDILDI bu akışın dışında, ayrı gösterilir. */
export const TALEP_AKISI = ['BEKLIYOR', 'ONAYLANDI', 'SIPARIS_VERILDI', 'TESLIM_ALINDI'] as const;

/** Akışta yer alan durumlar — REDDEDILDI hariç. */
export type AkisDurumu = (typeof TALEP_AKISI)[number];

/** Filtre sekmeleri için tüm durumlar, akış sırasına yakın bir düzende. */
export const TUM_DURUMLAR: TalepDurumu[] = [
  'BEKLIYOR',
  'ONAYLANDI',
  'SIPARIS_VERILDI',
  'TESLIM_ALINDI',
  'REDDEDILDI',
];

export function tarihSaatYaz(iso: string): string {
  return new Date(iso).toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Decimal alanlar JSON'da string gelir; para biçiminde yazar. */
export function paraYaz(deger: string | null): string {
  if (deger === null) return '—';

  const sayi = Number(deger);
  if (!Number.isFinite(sayi)) return deger;

  return sayi.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
