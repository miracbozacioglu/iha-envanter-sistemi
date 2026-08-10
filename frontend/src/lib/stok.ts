import type { StokKalem } from '../types';

export type StokDurumu = 'TUKENDI' | 'KRITIK' | 'YETERLI';

export interface StokDurumBilgisi {
  durum: StokDurumu;
  etiket: string;
  /** Rozet için sınıf demeti (metin + zemin + kenarlık). */
  sinif: string;
  /** Küçük durum noktası rengi. */
  nokta: string;
}

/**
 * Toplam stok ile kritik seviyeyi karşılaştırıp üç durumdan birini verir.
 * Sınır dahil: toplam == kritikSeviye ise durum KRİTİK sayılır.
 */
export function stokDurumu(toplam: number, kritikSeviye: number): StokDurumu {
  if (toplam <= 0) return 'TUKENDI';
  if (toplam <= kritikSeviye) return 'KRITIK';
  return 'YETERLI';
}

export const STOK_DURUM_BILGISI: Record<StokDurumu, StokDurumBilgisi> = {
  TUKENDI: {
    durum: 'TUKENDI',
    etiket: 'Tükendi',
    sinif: 'border-danger-500/35 bg-danger-900/45 text-danger-400',
    nokta: 'bg-danger-400',
  },
  KRITIK: {
    durum: 'KRITIK',
    etiket: 'Kritik',
    sinif: 'border-alert-400/30 bg-alert-400/10 text-alert-400',
    nokta: 'bg-alert-400',
  },
  YETERLI: {
    durum: 'YETERLI',
    etiket: 'Yeterli',
    sinif: 'border-signal-500/30 bg-signal-900/50 text-signal-400',
    nokta: 'bg-signal-400',
  },
};

/** Depo bazlı stok kalemlerinin miktar toplamı. */
export function toplamStok(kalemler: Pick<StokKalem, 'miktar'>[] | undefined): number {
  return (kalemler ?? []).reduce((toplam, kalem) => toplam + kalem.miktar, 0);
}
