/**
 * Backend (Prisma) şemasının JSON üzerinden gelen karşılıkları.
 *
 * Notlar:
 * - `DateTime` alanları JSON'da ISO-8601 string olarak gelir.
 * - `Decimal` alanları (ör. birimFiyat) string olarak serialize edilir.
 * - İlişkili alanlar backend'in `include` ettiği uçlarda dolu gelir;
 *   bu yüzden opsiyonel (`?`) işaretlendiler.
 */

/* ------------------------------------------------------------------ */
/* Enum karşılıkları                                                   */
/* ------------------------------------------------------------------ */

export type Rol = 'TEKNISYEN' | 'YONETICI';

export type HareketTipi = 'GIRIS' | 'CIKIS';

export type TalepDurumu =
  | 'BEKLIYOR'
  | 'ONAYLANDI'
  | 'REDDEDILDI'
  | 'SIPARIS_VERILDI'
  | 'TESLIM_ALINDI';

export type BakimTipi = 'DEGISTIRILDI' | 'TAMIR_EDILDI';

/** Şemada serbest metin (`String @default("AKTIF")`); pratikte bu değerler kullanılır. */
export type AracDurumu = 'AKTIF' | 'BAKIMDA' | 'ARIZALI' | 'HIZMET_DISI';

/** Seçim kutuları / filtreler için sıralı listeler. */
export const ROLLER: readonly Rol[] = ['TEKNISYEN', 'YONETICI'];
export const TALEP_DURUMLARI: readonly TalepDurumu[] = [
  'BEKLIYOR',
  'ONAYLANDI',
  'REDDEDILDI',
  'SIPARIS_VERILDI',
  'TESLIM_ALINDI',
];
export const HAREKET_TIPLERI: readonly HareketTipi[] = ['GIRIS', 'CIKIS'];
export const BAKIM_TIPLERI: readonly BakimTipi[] = ['DEGISTIRILDI', 'TAMIR_EDILDI'];

/* ------------------------------------------------------------------ */
/* Modeller                                                            */
/* ------------------------------------------------------------------ */

/** `sifreHash` backend tarafından hiçbir yanıtta dönmez. */
export interface Kullanici {
  id: number;
  ad: string;
  soyad: string;
  email: string;
  rol: Rol;
  unvan: string | null;
  aktif: boolean;
  olusturma: string;
}

export interface Kategori {
  id: number;
  ad: string;
  aciklama: string | null;
}

export interface IhaModeli {
  id: number;
  ad: string;
  uretici: string;
  aciklama: string | null;
}

export interface IhaAraci {
  id: number;
  kuyrukNo: string;
  ihaModeliId: number;
  durum: AracDurumu | string;
  aciklama: string | null;
  olusturma: string;

  ihaModeli?: IhaModeli;
}

export interface Parca {
  id: number;
  kod: string;
  ad: string;
  aciklama: string | null;
  birim: string;
  kritikSeviye: number;
  arizali: boolean;
  kategoriId: number;
  olusturma: string;
  guncelleme: string;

  kategori?: Kategori;
  uyumluluklar?: ParcaUyumluluk[];
  stokKalemler?: StokKalem[];
}

/**
 * GET /parcalar liste satırı — kategori her zaman dolu gelir.
 * `Omit` ile yeniden tanımlanıyor: doğrudan kesişim alsaydık alan opsiyonel kalırdı.
 */
export type ParcaOzet = Omit<Parca, 'kategori'> & { kategori: Kategori };

/** GET /parcalar/:id — kategori, uyumluluklar ve depo stokları dolu. */
export type ParcaDetay = Omit<ParcaOzet, 'uyumluluklar' | 'stokKalemler'> & {
  uyumluluklar: (Omit<ParcaUyumluluk, 'ihaModeli'> & { ihaModeli: IhaModeli })[];
  stokKalemler: (Omit<StokKalem, 'depo'> & { depo: Depo })[];
};

/** GET /parcalar/kritik — toplam stoğu kritik seviyenin altındaki parçalar. */
export type KritikParca = ParcaOzet & { toplamStok: number };

export interface ParcaUyumluluk {
  parcaId: number;
  ihaModeliId: number;

  parca?: Parca;
  ihaModeli?: IhaModeli;
}

export interface Depo {
  id: number;
  ad: string;
  lokasyon: string | null;
}

export interface StokKalem {
  id: number;
  parcaId: number;
  depoId: number;
  miktar: number;
  rafKodu: string | null;

  parca?: Parca;
  depo?: Depo;
}

/**
 * Hareket listelerinde kullanıcı tam nesne olarak değil, seçilmiş alanlarla
 * gelir (backend `sifreHash` sızmasın diye `select` kullanıyor).
 *
 * Dikkat: iki uç farklı alan seçiyor —
 * `/parcalar/:id/hareketler` rol de döner, `/stok/hareketler` dönmez.
 */
export type HareketKullanicisi = Pick<Kullanici, 'id' | 'ad' | 'soyad' | 'rol'>;
export type HareketKullanicisiKisa = Pick<Kullanici, 'id' | 'ad' | 'soyad'>;

export interface StokHareketi {
  id: number;
  parcaId: number;
  depoId: number;
  tip: HareketTipi;
  miktar: number;
  aciklama: string | null;
  kullaniciId: number;
  tarih: string;

  parca?: Parca;
  depo?: Depo;
  kullanici?: HareketKullanicisi;
}

/** GET /stok — stok kalemi her zaman parçası ve deposuyla döner. */
export type StokKalemDetay = Omit<StokKalem, 'parca' | 'depo'> & {
  parca: Parca;
  depo: Depo;
};

/** GET /stok/hareketler — parça, depo ve işlemi yapan kullanıcı dolu. */
export type HareketDetay = Omit<StokHareketi, 'parca' | 'depo' | 'kullanici'> & {
  parca: Parca;
  depo: Depo;
  kullanici: HareketKullanicisiKisa;
};

export interface ParcaTalebi {
  id: number;
  parcaId: number;
  miktar: number;
  aciklama: string | null;
  durum: TalepDurumu;
  teknisyenId: number;
  onaylayanId: number | null;
  redSebebi: string | null;
  olusturma: string;
  guncelleme: string;

  parca?: Parca;
  teknisyen?: Kullanici;
  onaylayan?: Kullanici | null;
  siparis?: Siparis | null;
}

export interface Tedarikci {
  id: number;
  ad: string;
  telefon: string | null;
  email: string | null;
}

export interface Siparis {
  id: number;
  talepId: number;
  tedarikciId: number;
  miktar: number;
  /** Prisma `Decimal` — JSON'da string olarak gelir. */
  birimFiyat: string | null;
  siparisTarihi: string;
  teslimTarihi: string | null;
  teslimAlindi: boolean;

  talep?: ParcaTalebi;
  tedarikci?: Tedarikci;
}

export interface BakimKaydi {
  id: number;
  ihaAraciId: number;
  parcaId: number;
  kullaniciId: number;
  tip: BakimTipi;
  aciklama: string | null;
  tarih: string;

  ihaArac?: IhaAraci;
  parca?: Parca;
  kullanici?: Kullanici;
}

/* ------------------------------------------------------------------ */
/* Yanıt zarfları                                                      */
/* ------------------------------------------------------------------ */

/** Backend'deki `SayfaliSonuc<T>` zarfının aynısı. */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LoginYaniti {
  access_token: string;
  user: Kullanici;
}

/** GET /istatistik/ozet — dashboard tek istekte bunu döner. */
export interface IstatistikOzeti {
  toplamParca: number;
  toplamArac: number;
  toplamKategori: number;
  bekleyenTalep: number;
  kritikStokSayisi: number;
  sonHareketler: StokHareketi[];
  kritikParcalar: Parca[];
  durumDagilimi: Record<TalepDurumu, number>;
}

/** NestJS'in standart hata gövdesi. */
export interface ApiHatasi {
  statusCode: number;
  message: string | string[];
  error?: string;
}
