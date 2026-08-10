import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  BakimKaydi,
  IhaAraci,
  Parca,
  Prisma,
} from '../../generated/prisma/client';
import { BakimTipi } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { StokService, type SayfaliSonuc } from '../stok/stok.service';
import { BakimSorguDto } from './dto/bakim-sorgu.dto';
import { DegistirDto } from './dto/degistir.dto';
import { TamirDto } from './dto/tamir.dto';

/** Bakim kayitlarinda kullanici sadece kimlik bilgisiyle doner. */
export type KullaniciOzet = { id: number; ad: string; soyad: string };

/** Genel listede kaydin hangi araca ait oldugu da gorunur. */
export type BakimDetay = BakimKaydi & {
  ihaArac: IhaAraci;
  parca: Parca;
  kullanici: KullaniciOzet;
};

/** Tek aracin gecmisinde arac zaten belli; satirlar aracsiz doner. */
export type BakimGecmisi = BakimKaydi & {
  parca: Parca;
  kullanici: KullaniciOzet;
};

const VARSAYILAN_SAYFA = 1;
const VARSAYILAN_LIMIT = 20;
const VARSAYILAN_MIKTAR = 1;

const KULLANICI_SELECT = {
  select: { id: true, ad: true, soyad: true },
} as const;

const BAKIM_INCLUDE = {
  ihaArac: true,
  parca: true,
  kullanici: KULLANICI_SELECT,
} as const;

const GECMIS_INCLUDE = {
  parca: true,
  kullanici: KULLANICI_SELECT,
} as const;

@Injectable()
export class BakimService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stokService: StokService,
  ) {}

  /**
   * Aracta parca degisimi: stoktan dusum, CIKIS hareketi ve bakim kaydi
   * tek transaction icinde. Stok dususe uygun degilse transaction bastan geri
   * alinir; parca dusulmeden bakim kaydi, ya da bakim kaydi olmadan dusum
   * kalamaz.
   */
  async degistir(dto: DegistirDto, kullaniciId: number): Promise<BakimDetay> {
    const miktar = dto.miktar ?? VARSAYILAN_MIKTAR;

    return this.prisma.$transaction(async (tx) => {
      await this.aracVarMi(tx, dto.ihaAraciId);
      await this.parcaVarMi(tx, dto.parcaId);

      const depoId = await this.stokService.depoyuCoz(tx, dto.depoId);

      // "Yetersiz stok" kurali ve dusum StokService'te tek yerde duruyor;
      // burada sadece ayni transaction'a bagliyoruz.
      await this.stokService.stoktanDus(tx, {
        parcaId: dto.parcaId,
        depoId,
        miktar,
        aciklama: `Arac bakimi - parca degisimi (Arac #${dto.ihaAraciId})`,
        kullaniciId,
      });

      return tx.bakimKaydi.create({
        data: {
          ihaAraciId: dto.ihaAraciId,
          parcaId: dto.parcaId,
          kullaniciId,
          tip: BakimTipi.DEGISTIRILDI,
          aciklama: dto.aciklama,
        },
        include: BAKIM_INCLUDE,
      });
    });
  }

  /**
   * Yerinde tamir: parca aractan sokulup degistirilmedigi icin stoga
   * dokunulmaz, yalnizca bakim kaydi yazilir.
   */
  async tamir(dto: TamirDto, kullaniciId: number): Promise<BakimDetay> {
    await this.aracVarMi(this.prisma, dto.ihaAraciId);
    await this.parcaVarMi(this.prisma, dto.parcaId);

    return this.prisma.bakimKaydi.create({
      data: {
        ihaAraciId: dto.ihaAraciId,
        parcaId: dto.parcaId,
        kullaniciId,
        tip: BakimTipi.TAMIR_EDILDI,
        aciklama: dto.aciklama,
      },
      include: BAKIM_INCLUDE,
    });
  }

  async findAll(sorgu: BakimSorguDto): Promise<SayfaliSonuc<BakimDetay>> {
    const page = sorgu.page ?? VARSAYILAN_SAYFA;
    const limit = sorgu.limit ?? VARSAYILAN_LIMIT;
    const where: Prisma.BakimKaydiWhereInput = {};

    if (sorgu.ihaAraciId) {
      where.ihaAraciId = sorgu.ihaAraciId;
    }

    if (sorgu.tip) {
      where.tip = sorgu.tip;
    }

    // Toplam ile sayfayi tek turda al ki total ile data ayni anlik goruntuden gelsin.
    const [total, data] = await this.prisma.$transaction([
      this.prisma.bakimKaydi.count({ where }),
      this.prisma.bakimKaydi.findMany({
        where,
        include: BAKIM_INCLUDE,
        orderBy: { tarih: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Tek aracin bakim gecmisi, en yeniden eskiye. Ilk satir "bu araca en son
   * kim hangi parcayi yapti" sorusunun cevabi.
   */
  async findByArac(ihaAraciId: number): Promise<BakimGecmisi[]> {
    const arac = await this.prisma.ihaAraci.findUnique({
      where: { id: ihaAraciId },
      select: { id: true },
    });

    if (!arac) {
      throw new NotFoundException(
        `${ihaAraciId} numarali IHA araci bulunamadi.`,
      );
    }

    return this.prisma.bakimKaydi.findMany({
      where: { ihaAraciId },
      include: GECMIS_INCLUDE,
      orderBy: { tarih: 'desc' },
    });
  }

  private async aracVarMi(
    db: Prisma.TransactionClient,
    ihaAraciId: number,
  ): Promise<void> {
    const arac = await db.ihaAraci.findUnique({
      where: { id: ihaAraciId },
      select: { id: true },
    });

    if (!arac) {
      throw new BadRequestException(
        `${ihaAraciId} numarali IHA araci bulunamadi, bakim kaydi olusturulamaz.`,
      );
    }
  }

  private async parcaVarMi(
    db: Prisma.TransactionClient,
    parcaId: number,
  ): Promise<void> {
    const parca = await db.parca.findUnique({
      where: { id: parcaId },
      select: { id: true },
    });

    if (!parca) {
      throw new BadRequestException(
        `${parcaId} numarali parca bulunamadi, bakim kaydi olusturulamaz.`,
      );
    }
  }
}
