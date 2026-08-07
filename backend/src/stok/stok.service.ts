import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import type {
  Depo,
  Parca,
  Prisma,
  StokHareketi,
  StokKalem,
} from '../../generated/prisma/client';
import { HareketTipi } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { HareketSorguDto } from './dto/hareket-sorgu.dto';
import { StokCikisDto } from './dto/stok-cikis.dto';
import { StokGirisDto } from './dto/stok-giris.dto';
import { StokSorguDto } from './dto/stok-sorgu.dto';

/** Sayfalanan listeler bu zarfla doner. */
export type SayfaliSonuc<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

/** Stok kalemi her zaman parcasi ve deposuyla birlikte doner. */
export type StokKalemDetay = StokKalem & { parca: Parca; depo: Depo };

/** Hareket listesinde parca, depo ve islemi yapan kullanici yer alir. */
export type HareketDetay = StokHareketi & {
  parca: Parca;
  depo: Depo;
  kullanici: { id: number; ad: string; soyad: string };
};

const VARSAYILAN_SAYFA = 1;
const VARSAYILAN_LIMIT = 20;

/** Stok kalemi donuslerinde tekrarlanan include. */
const KALEM_INCLUDE = { parca: true, depo: true } as const;

/** Hareket donuslerinde tekrarlanan include; kullanicidan sifreHash disarida kalir. */
const HAREKET_INCLUDE = {
  parca: true,
  depo: true,
  kullanici: { select: { id: true, ad: true, soyad: true } },
} as const;

@Injectable()
export class StokService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Depoya stok girisi.
   *
   * Stok kaleminin guncellenmesi ile hareket kaydi tek bir interaktif
   * transaction icinde yapilir: ikisinden biri patlarsa hicbiri yazilmaz,
   * boylece miktar ile hareket gecmisi birbirinden ayrisamaz.
   */
  async giris(dto: StokGirisDto, kullaniciId: number): Promise<StokKalemDetay> {
    return this.prisma.$transaction(async (tx) => {
      await this.parcaVarMi(tx, dto.parcaId);
      await this.depoVarMi(tx, dto.depoId);

      const kalem = await tx.stokKalem.upsert({
        where: { parcaId_depoId: { parcaId: dto.parcaId, depoId: dto.depoId } },
        // Satir varsa mevcut miktarin uzerine eklenir. `increment` degeri
        // veritabaninda hesaplatir; onceden okunan bir degeri geri yazmadigi
        // icin es zamanli girislerde kayip guncelleme olusmaz.
        update: {
          miktar: { increment: dto.miktar },
          // rafKodu gonderilmediyse Prisma bu alani atlar, mevcut deger korunur.
          rafKodu: dto.rafKodu,
        },
        create: {
          parcaId: dto.parcaId,
          depoId: dto.depoId,
          miktar: dto.miktar,
          rafKodu: dto.rafKodu,
        },
        include: KALEM_INCLUDE,
      });

      await tx.stokHareketi.create({
        data: {
          parcaId: dto.parcaId,
          depoId: dto.depoId,
          tip: HareketTipi.GIRIS,
          miktar: dto.miktar,
          aciklama: dto.aciklama,
          kullaniciId,
        },
      });

      return kalem;
    });
  }

  /**
   * Depodan stok cikisi.
   *
   * Giristeki gibi tek transaction: stok dusumu ile hareket kaydi ya birlikte
   * yazilir ya da hicbiri yazilmaz. Yetersiz stokta transaction bastan
   * geri alinir, stok oldugu gibi kalir.
   */
  async cikis(dto: StokCikisDto, kullaniciId: number): Promise<StokKalemDetay> {
    return this.prisma.$transaction(async (tx) => {
      const mevcut = await tx.stokKalem.findUnique({
        where: { parcaId_depoId: { parcaId: dto.parcaId, depoId: dto.depoId } },
      });

      if (!mevcut) {
        throw new BadRequestException(
          `${dto.parcaId} numarali parca ${dto.depoId} numarali depoda yok, cikis yapilamaz.`,
        );
      }

      if (dto.miktar > mevcut.miktar) {
        throw new BadRequestException(
          `Yetersiz stok: mevcut ${mevcut.miktar}, istenen ${dto.miktar}.`,
        );
      }

      // Dusumu kosullu updateMany ile yapiyoruz: `miktar >= istenen` sarti
      // guncellemenin kendisinde oldugu icin, yukaridaki okuma ile bu yazma
      // arasina baska bir cikis girse bile stok eksiye dusemez.
      const sonuc = await tx.stokKalem.updateMany({
        where: {
          parcaId: dto.parcaId,
          depoId: dto.depoId,
          miktar: { gte: dto.miktar },
        },
        data: { miktar: { decrement: dto.miktar } },
      });

      if (sonuc.count === 0) {
        throw new ConflictException(
          'Stok bu islem sirasinda baska bir hareketle degisti, lutfen tekrar deneyin.',
        );
      }

      await tx.stokHareketi.create({
        data: {
          parcaId: dto.parcaId,
          depoId: dto.depoId,
          tip: HareketTipi.CIKIS,
          miktar: dto.miktar,
          aciklama: dto.aciklama,
          kullaniciId,
        },
      });

      // updateMany guncellenen satiri dondurmedigi icin guncel hali okunuyor.
      return tx.stokKalem.findUniqueOrThrow({
        where: { parcaId_depoId: { parcaId: dto.parcaId, depoId: dto.depoId } },
        include: KALEM_INCLUDE,
      });
    });
  }

  async findAll(sorgu: StokSorguDto): Promise<StokKalemDetay[]> {
    return this.prisma.stokKalem.findMany({
      where: sorgu.depoId ? { depoId: sorgu.depoId } : {},
      include: KALEM_INCLUDE,
      orderBy: { parca: { kod: 'asc' } },
    });
  }

  async findHareketler(
    sorgu: HareketSorguDto,
  ): Promise<SayfaliSonuc<HareketDetay>> {
    const page = sorgu.page ?? VARSAYILAN_SAYFA;
    const limit = sorgu.limit ?? VARSAYILAN_LIMIT;
    const where: Prisma.StokHareketiWhereInput = {};

    if (sorgu.parcaId) {
      where.parcaId = sorgu.parcaId;
    }

    if (sorgu.depoId) {
      where.depoId = sorgu.depoId;
    }

    if (sorgu.tip) {
      where.tip = sorgu.tip;
    }

    // Toplam ile sayfayi tek turda al ki total ile data ayni anlik goruntuden gelsin.
    const [total, data] = await this.prisma.$transaction([
      this.prisma.stokHareketi.count({ where }),
      this.prisma.stokHareketi.findMany({
        where,
        include: HAREKET_INCLUDE,
        orderBy: { tarih: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  private async parcaVarMi(
    tx: Prisma.TransactionClient,
    parcaId: number,
  ): Promise<void> {
    const parca = await tx.parca.findUnique({
      where: { id: parcaId },
      select: { id: true },
    });

    if (!parca) {
      throw new BadRequestException(
        `${parcaId} numarali parca bulunamadi, stok hareketi olusturulamaz.`,
      );
    }
  }

  private async depoVarMi(
    tx: Prisma.TransactionClient,
    depoId: number,
  ): Promise<void> {
    const depo = await tx.depo.findUnique({
      where: { id: depoId },
      select: { id: true },
    });

    if (!depo) {
      throw new BadRequestException(
        `${depoId} numarali depo bulunamadi, stok hareketi olusturulamaz.`,
      );
    }
  }
}
