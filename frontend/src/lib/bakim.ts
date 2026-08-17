import type { RozetTonu } from '../components/ui/Rozet';
import type { AracDurumu, BakimTipi } from '../types';

export interface BakimTipBilgisi {
  etiket: string;
  ton: RozetTonu;
  metin: string;
}

/**
 * İki bakım tipi net biçimde ayrışmalı: biri stoktan parça düşürür
 * (değiştirildi), diğeri stoğa hiç dokunmaz (tamir edildi).
 */
export const BAKIM_TIP_BILGISI: Record<BakimTipi, BakimTipBilgisi> = {
  DEGISTIRILDI: {
    etiket: 'Değiştirildi',
    ton: 'bilgi',
    metin: 'text-info-400',
  },
  TAMIR_EDILDI: {
    etiket: 'Tamir edildi',
    ton: 'basari',
    metin: 'text-success-400',
  },
};

export const BAKIM_TIPLERI_LISTE: BakimTipi[] = ['DEGISTIRILDI', 'TAMIR_EDILDI'];

/** Araç durumu şemada serbest metin; bilinen değerlere renk veriyoruz. */
export function aracDurumTonu(durum: AracDurumu | string): RozetTonu {
  switch (durum) {
    case 'AKTIF':
      return 'basari';
    case 'BAKIMDA':
      return 'uyari';
    case 'ARIZALI':
      return 'kritik';
    default:
      return 'notr';
  }
}
