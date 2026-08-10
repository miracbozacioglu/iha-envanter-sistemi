import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  Parca,
  ParcaTalebi,
  Prisma,
  Siparis,
  Tedarikci,
} from '../../generated/prisma/client';
import { Rol, TalepDurumu } from '../../generated/prisma/enums';
import type { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTalepDto } from './dto/create-talep.dto';
import { RedTalepDto } from './dto/red-talep.dto';
import { TalepSorguDto } from './dto/talep-sorgu.dto';

/** Listelerde kullanici sadece kimlik bilgisiyle doner, sifreHash disarida kalir. */
export type KullaniciOzet = { id: number; ad: string; soyad: string };

export type TalepOzet = ParcaTalebi & {
  parca: Parca;
  teknisyen: KullaniciOzet;
  onaylayan: KullaniciOzet | null;
};

/** Detayda talepten dogan siparis de yer alir. */
export type TalepDetay = TalepOzet & {
  siparis: (Siparis & { tedarikci: Tedarikci }) | null;
};

const KULLANICI_SELECT = {
  select: { id: true, ad: true, soyad: true },
} as const;

const TALEP_INCLUDE = {
  parca: true,
  teknisyen: KULLANICI_SELECT,
  onaylayan: KULLANICI_SELECT,
} as const;

const TALEP_DETAY_INCLUDE = {
  ...TALEP_INCLUDE,
  siparis: { include: { tedarikci: true } },
} as const;

@Injectable()
export class TaleplerService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTalepDto, teknisyenId: number): Promise<TalepOzet> {
    await this.parcaVarMi(dto.parcaId);

    return this.prisma.parcaTalebi.create({
      data: {
        parcaId: dto.parcaId,
        miktar: dto.miktar,
        aciklama: dto.aciklama,
        teknisyenId,
        // durum alani semadaki @default(BEKLIYOR) ile geliyor.
      },
      include: TALEP_INCLUDE,
    });
  }

  /**
   * Talep listesi. Teknisyen yalnizca kendi taleplerini gorur; bu kisit
   * istemciden gelen bir parametreye degil, token'daki role bagli.
   */
  async findAll(sorgu: TalepSorguDto, user: AuthUser): Promise<TalepOzet[]> {
    const where: Prisma.ParcaTalebiWhereInput = {};

    if (user.rol === Rol.TEKNISYEN) {
      where.teknisyenId = user.id;
    }

    if (sorgu.durum) {
      where.durum = sorgu.durum;
    }

    return this.prisma.parcaTalebi.findMany({
      where,
      include: TALEP_INCLUDE,
      orderBy: { olusturma: 'desc' },
    });
  }

  async findOne(id: number, user: AuthUser): Promise<TalepDetay> {
    const talep = await this.prisma.parcaTalebi.findUnique({
      where: { id },
      include: TALEP_DETAY_INCLUDE,
    });

    if (!talep) {
      throw new NotFoundException(`${id} numarali talep bulunamadi.`);
    }

    if (user.rol === Rol.TEKNISYEN && talep.teknisyenId !== user.id) {
      throw new ForbiddenException(
        'Sadece kendi taleplerinizi goruntuleyebilirsiniz.',
      );
    }

    return talep;
  }

  async onayla(id: number, onaylayanId: number): Promise<TalepOzet> {
    return this.durumGecisiYap(id, TalepDurumu.ONAYLANDI, {
      durum: TalepDurumu.ONAYLANDI,
      onaylayanId,
    });
  }

  async reddet(
    id: number,
    dto: RedTalepDto,
    onaylayanId: number,
  ): Promise<TalepOzet> {
    return this.durumGecisiYap(id, TalepDurumu.REDDEDILDI, {
      durum: TalepDurumu.REDDEDILDI,
      onaylayanId,
      redSebebi: dto.redSebebi,
    });
  }

  /**
   * BEKLIYOR -> ONAYLANDI | REDDEDILDI gecisi.
   *
   * Guncelleme kosullu updateMany ile yapiliyor: "durum BEKLIYOR" sarti
   * guncellemenin kendisinde oldugu icin, iki yonetici ayni talebi ayni anda
   * karara baglarsa ikincisi sessizce birincinin kararini ezmez.
   */
  private async durumGecisiYap(
    id: number,
    hedef: TalepDurumu,
    data: Prisma.ParcaTalebiUncheckedUpdateManyInput,
  ): Promise<TalepOzet> {
    const talep = await this.prisma.parcaTalebi.findUnique({
      where: { id },
      select: { durum: true },
    });

    if (!talep) {
      throw new NotFoundException(`${id} numarali talep bulunamadi.`);
    }

    if (talep.durum !== TalepDurumu.BEKLIYOR) {
      throw new BadRequestException(
        `Sadece bekleyen talepler ${hedef === TalepDurumu.ONAYLANDI ? 'onaylanabilir' : 'reddedilebilir'}. ` +
          `Bu talebin durumu: ${talep.durum}.`,
      );
    }

    const sonuc = await this.prisma.parcaTalebi.updateMany({
      where: { id, durum: TalepDurumu.BEKLIYOR },
      data,
    });

    if (sonuc.count === 0) {
      throw new ConflictException(
        'Talep bu sirada baska bir yonetici tarafindan karara baglandi.',
      );
    }

    return this.prisma.parcaTalebi.findUniqueOrThrow({
      where: { id },
      include: TALEP_INCLUDE,
    });
  }

  private async parcaVarMi(parcaId: number): Promise<void> {
    const parca = await this.prisma.parca.findUnique({
      where: { id: parcaId },
      select: { id: true },
    });

    if (!parca) {
      throw new BadRequestException(
        `${parcaId} numarali parca bulunamadi, talep olusturulamaz.`,
      );
    }
  }
}
