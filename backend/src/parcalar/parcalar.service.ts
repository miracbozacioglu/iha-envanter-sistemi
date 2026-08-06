import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  Depo,
  IhaModeli,
  Kategori,
  Parca,
  ParcaUyumluluk,
  Prisma,
  StokKalem,
} from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateParcaDto } from './dto/create-parca.dto';
import { ParcaSorguDto } from './dto/parca-sorgu.dto';
import { SayfalamaDto } from './dto/sayfalama.dto';
import { UpdateParcaDto } from './dto/update-parca.dto';

/** Sayfalanan tum listeler bu zarfla doner. */
export type SayfaliSonuc<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

/** Liste ve kritik listesi kategorisiyle birlikte doner. */
export type ParcaOzet = Parca & { kategori: Kategori };

/** Detayda uyumlu modeller ve depo bazli stok da yer alir. */
export type ParcaDetay = ParcaOzet & {
  uyumluluklar: (ParcaUyumluluk & { ihaModeli: IhaModeli })[];
  stokKalemler: (StokKalem & { depo: Depo })[];
};

const VARSAYILAN_SAYFA = 1;
const VARSAYILAN_LIMIT = 20;

@Injectable()
export class ParcalarService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(sorgu: ParcaSorguDto): Promise<SayfaliSonuc<ParcaOzet>> {
    const { page, limit, skip } = this.sayfalamaCoz(sorgu);
    const where = this.listeFiltresiKur(sorgu);

    // Toplam ile sayfayi tek turda al ki total ile data ayni anlik goruntuden gelsin.
    const [total, data] = await this.prisma.$transaction([
      this.prisma.parca.count({ where }),
      this.prisma.parca.findMany({
        where,
        include: { kategori: true },
        orderBy: { kod: 'asc' },
        skip,
        take: limit,
      }),
    ]);

    return this.zarfla(data, total, page, limit);
  }

  async findOne(id: number): Promise<ParcaDetay> {
    const parca = await this.prisma.parca.findUnique({
      where: { id },
      include: {
        kategori: true,
        uyumluluklar: { include: { ihaModeli: true } },
        stokKalemler: { include: { depo: true } },
      },
    });

    if (!parca) {
      throw new NotFoundException(`${id} numarali parca bulunamadi.`);
    }

    return parca;
  }

  /**
   * Parcanin stok hareketi gecmisi, en yeniden eskiye dogru.
   * StokHareketi modulu henuz yok; tablo dogrudan sorgulaniyor.
   */
  async findHareketler(id: number, sorgu: SayfalamaDto) {
    await this.parcaVarMi(id);

    const { page, limit, skip } = this.sayfalamaCoz(sorgu);
    const where = { parcaId: id };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.stokHareketi.count({ where }),
      this.prisma.stokHareketi.findMany({
        where,
        include: {
          depo: true,
          // Kullanici modeli sifreHash tasidigi icin alanlar tek tek seciliyor.
          kullanici: { select: { id: true, ad: true, soyad: true, rol: true } },
        },
        orderBy: { tarih: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return this.zarfla(data, total, page, limit);
  }

  /**
   * Toplam stogu kendi kritik seviyesinin altinda kalan parcalar.
   * Iki sutunu (stok toplami ve kritikSeviye) karsilastirmak Prisma filtresiyle
   * ifade edilemedigi icin toplama JS tarafinda yapiliyor; tek depolu envanterde
   * kayit sayisi bunu tasiyacak kadar kucuk.
   */
  async findKritik(): Promise<(ParcaOzet & { toplamStok: number })[]> {
    const parcalar = await this.prisma.parca.findMany({
      include: { kategori: true, stokKalemler: { select: { miktar: true } } },
      orderBy: { kod: 'asc' },
    });

    return parcalar
      .map(({ stokKalemler, ...parca }) => ({
        ...parca,
        toplamStok: stokKalemler.reduce((toplam, k) => toplam + k.miktar, 0),
      }))
      .filter((parca) => parca.toplamStok < parca.kritikSeviye);
  }

  async create(dto: CreateParcaDto): Promise<ParcaOzet> {
    await this.kodBenzersizMi(dto.kod);
    await this.kategoriVarMi(dto.kategoriId);

    return this.prisma.parca.create({
      data: {
        kod: dto.kod,
        ad: dto.ad,
        aciklama: dto.aciklama,
        // birim ve kritikSeviye gonderilmezse semadaki @default degerleri devreye girer.
        birim: dto.birim,
        kritikSeviye: dto.kritikSeviye,
        kategoriId: dto.kategoriId,
      },
      include: { kategori: true },
    });
  }

  async update(id: number, dto: UpdateParcaDto): Promise<ParcaOzet> {
    const parca = await this.parcaVarMi(id);

    if (dto.kod && dto.kod !== parca.kod) {
      await this.kodBenzersizMi(dto.kod);
    }

    if (dto.kategoriId && dto.kategoriId !== parca.kategoriId) {
      await this.kategoriVarMi(dto.kategoriId);
    }

    return this.prisma.parca.update({
      where: { id },
      data: {
        kod: dto.kod,
        ad: dto.ad,
        aciklama: dto.aciklama,
        birim: dto.birim,
        kritikSeviye: dto.kritikSeviye,
        arizali: dto.arizali,
        kategoriId: dto.kategoriId,
      },
      include: { kategori: true },
    });
  }

  async uyumlulukEkle(
    id: number,
    ihaModeliId: number,
  ): Promise<ParcaUyumluluk & { ihaModeli: IhaModeli }> {
    await this.parcaVarMi(id);
    await this.modelVarMi(ihaModeliId);

    const mevcut = await this.prisma.parcaUyumluluk.findUnique({
      where: { parcaId_ihaModeliId: { parcaId: id, ihaModeliId } },
    });

    if (mevcut) {
      throw new ConflictException(
        `Bu parca ${ihaModeliId} numarali model ile zaten uyumlu isaretli.`,
      );
    }

    return this.prisma.parcaUyumluluk.create({
      data: { parcaId: id, ihaModeliId },
      include: { ihaModeli: true },
    });
  }

  async uyumlulukKaldir(
    id: number,
    ihaModeliId: number,
  ): Promise<ParcaUyumluluk> {
    const kayit = await this.prisma.parcaUyumluluk.findUnique({
      where: { parcaId_ihaModeliId: { parcaId: id, ihaModeliId } },
    });

    if (!kayit) {
      throw new NotFoundException(
        `${id} numarali parca ile ${ihaModeliId} numarali model arasinda uyumluluk kaydi yok.`,
      );
    }

    return this.prisma.parcaUyumluluk.delete({
      where: { parcaId_ihaModeliId: { parcaId: id, ihaModeliId } },
    });
  }

  private listeFiltresiKur(sorgu: ParcaSorguDto): Prisma.ParcaWhereInput {
    const where: Prisma.ParcaWhereInput = {};

    if (sorgu.search) {
      where.OR = [
        { kod: { contains: sorgu.search, mode: 'insensitive' } },
        { ad: { contains: sorgu.search, mode: 'insensitive' } },
      ];
    }

    if (sorgu.kategoriId) {
      where.kategoriId = sorgu.kategoriId;
    }

    if (sorgu.ihaModeliId) {
      where.uyumluluklar = { some: { ihaModeliId: sorgu.ihaModeliId } };
    }

    return where;
  }

  private sayfalamaCoz(sorgu: SayfalamaDto): {
    page: number;
    limit: number;
    skip: number;
  } {
    const page = sorgu.page ?? VARSAYILAN_SAYFA;
    const limit = sorgu.limit ?? VARSAYILAN_LIMIT;

    return { page, limit, skip: (page - 1) * limit };
  }

  private zarfla<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
  ): SayfaliSonuc<T> {
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  private async parcaVarMi(id: number): Promise<Parca> {
    const parca = await this.prisma.parca.findUnique({ where: { id } });

    if (!parca) {
      throw new NotFoundException(`${id} numarali parca bulunamadi.`);
    }

    return parca;
  }

  private async kodBenzersizMi(kod: string): Promise<void> {
    const mevcut = await this.prisma.parca.findUnique({
      where: { kod },
      select: { id: true },
    });

    if (mevcut) {
      throw new ConflictException(`"${kod}" kodlu bir parca zaten kayitli.`);
    }
  }

  private async kategoriVarMi(kategoriId: number): Promise<void> {
    const kategori = await this.prisma.kategori.findUnique({
      where: { id: kategoriId },
      select: { id: true },
    });

    if (!kategori) {
      throw new BadRequestException(
        `${kategoriId} numarali kategori bulunamadi, parca bu kategoriye baglanamaz.`,
      );
    }
  }

  private async modelVarMi(ihaModeliId: number): Promise<void> {
    const model = await this.prisma.ihaModeli.findUnique({
      where: { id: ihaModeliId },
      select: { id: true },
    });

    if (!model) {
      throw new BadRequestException(
        `${ihaModeliId} numarali IHA modeli bulunamadi.`,
      );
    }
  }
}
