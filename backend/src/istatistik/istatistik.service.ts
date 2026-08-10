import { Injectable } from '@nestjs/common';
import type { HareketTipi } from '../../generated/prisma/enums';
import { TalepDurumu } from '../../generated/prisma/enums';
import { ParcalarService } from '../parcalar/parcalar.service';
import { PrismaService } from '../prisma/prisma.service';

/** Dashboard'da gosterilen son hareket satiri. */
export type SonHareket = {
  id: number;
  tip: HareketTipi;
  miktar: number;
  tarih: Date;
  parca: { id: number; kod: string; ad: string };
  kullanici: { id: number; ad: string; soyad: string };
};

/** Kritik listesinde parcanin sadece uyari icin gereken alanlari yer alir. */
export type KritikParca = {
  id: number;
  kod: string;
  ad: string;
  toplamStok: number;
  kritikSeviye: number;
};

export type OzetSonuc = {
  toplamParca: number;
  toplamArac: number;
  toplamKategori: number;
  bekleyenTalep: number;
  kritikStokSayisi: number;
  sonHareketler: SonHareket[];
  kritikParcalar: KritikParca[];
  durumDagilimi: Record<TalepDurumu, number>;
};

/** Kritik uyari panelinde gosterilecek satir sayisi. */
const KRITIK_LISTE_BOYUTU = 5;

/** Dashboard'daki son hareket satiri sayisi. */
const SON_HAREKET_SAYISI = 5;

@Injectable()
export class IstatistikService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly parcalarService: ParcalarService,
  ) {}

  /**
   * Dashboard ozeti.
   *
   * Sorgular birbirine bagimli olmadigi icin hepsi Promise.all ile ayni anda
   * calisir; ozetin suresi en yavas sorgu kadardir, toplamlari kadar degil.
   */
  async ozet(): Promise<OzetSonuc> {
    const [
      toplamParca,
      toplamArac,
      toplamKategori,
      bekleyenTalep,
      sonHareketler,
      kritikler,
      durumSayilari,
    ] = await Promise.all([
      this.prisma.parca.count(),
      this.prisma.ihaAraci.count(),
      this.prisma.kategori.count(),
      this.prisma.parcaTalebi.count({
        where: { durum: TalepDurumu.BEKLIYOR },
      }),
      this.prisma.stokHareketi.findMany({
        select: {
          id: true,
          tip: true,
          miktar: true,
          tarih: true,
          parca: { select: { id: true, kod: true, ad: true } },
          // Kullanici modeli sifreHash tasidigi icin alanlar tek tek seciliyor.
          kullanici: { select: { id: true, ad: true, soyad: true } },
        },
        orderBy: { tarih: 'desc' },
        take: SON_HAREKET_SAYISI,
      }),
      // Kritik tanimi (toplam stok < kritikSeviye) ParcalarService'te tek yerde
      // duruyor; dashboard ile GET /parcalar/kritik ayni cevabi versin diye
      // hesap kopyalanmiyor. Tek sorgu hem sayiyi hem listeyi besliyor.
      this.parcalarService.findKritik(),
      this.prisma.parcaTalebi.groupBy({
        by: ['durum'],
        _count: { _all: true },
      }),
    ]);

    return {
      toplamParca,
      toplamArac,
      toplamKategori,
      bekleyenTalep,
      kritikStokSayisi: kritikler.length,
      sonHareketler,
      kritikParcalar: kritikler
        .slice(0, KRITIK_LISTE_BOYUTU)
        .map(({ id, kod, ad, toplamStok, kritikSeviye }) => ({
          id,
          kod,
          ad,
          toplamStok,
          kritikSeviye,
        })),
      durumDagilimi: this.durumDagilimiKur(durumSayilari),
    };
  }

  /**
   * groupBy yalnizca en az bir kaydi olan durumlari dondurur; dashboard'in
   * her durum icin bir kutusu oldugundan eksik durumlar 0 ile tamamlanir.
   */
  private durumDagilimiKur(
    sayilar: { durum: TalepDurumu; _count: { _all: number } }[],
  ): Record<TalepDurumu, number> {
    const dagilim = Object.fromEntries(
      Object.values(TalepDurumu).map((durum) => [durum, 0]),
    ) as Record<TalepDurumu, number>;

    for (const satir of sayilar) {
      dagilim[satir.durum] = satir._count._all;
    }

    return dagilim;
  }
}
