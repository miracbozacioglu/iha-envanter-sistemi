import {
  BadRequestException,
  ConflictException,
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
import { HareketTipi, TalepDurumu } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSiparisDto } from './dto/create-siparis.dto';
import { TeslimAlDto } from './dto/teslim-al.dto';

/** Siparis her zaman dayandigi talep ve tedarikcisiyle birlikte doner. */
export type SiparisDetay = Siparis & {
  talep: ParcaTalebi & { parca: Parca };
  tedarikci: Tedarikci;
};

const SIPARIS_INCLUDE = {
  talep: { include: { parca: true } },
  tedarikci: true,
} as const;

@Injectable()
export class SiparislerService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<SiparisDetay[]> {
    return this.prisma.siparis.findMany({
      include: SIPARIS_INCLUDE,
      orderBy: { siparisTarihi: 'desc' },
    });
  }

  /**
   * Onaylanmis bir talepten siparis acar.
   *
   * Siparis kaydi ile talebin SIPARIS_VERILDI'ye gecmesi tek transaction icinde:
   * siparis olusup talep BEKLIYOR/ONAYLANDI kalirsa ayni talepten ikinci bir
   * siparis acilabilir hale gelirdi.
   */
  async create(dto: CreateSiparisDto): Promise<SiparisDetay> {
    return this.prisma.$transaction(async (tx) => {
      const talep = await tx.parcaTalebi.findUnique({
        where: { id: dto.talepId },
        select: { id: true, durum: true, siparis: { select: { id: true } } },
      });

      if (!talep) {
        throw new NotFoundException(
          `${dto.talepId} numarali talep bulunamadi.`,
        );
      }

      if (talep.siparis) {
        throw new ConflictException(
          `Bu talep icin zaten ${talep.siparis.id} numarali siparis olusturulmus.`,
        );
      }

      if (talep.durum !== TalepDurumu.ONAYLANDI) {
        throw new BadRequestException(
          `Sadece onaylanmis talepten siparis olusturulabilir. Bu talebin durumu: ${talep.durum}.`,
        );
      }

      const tedarikci = await tx.tedarikci.findUnique({
        where: { id: dto.tedarikciId },
        select: { id: true },
      });

      if (!tedarikci) {
        throw new BadRequestException(
          `${dto.tedarikciId} numarali tedarikci bulunamadi.`,
        );
      }

      // Durum gecisi kosullu yapiliyor: ONAYLANDI sarti guncellemenin
      // kendisinde oldugu icin, ayni talep icin es zamanli iki siparis
      // denemesinden ikincisi burada takilir (talepId unique kisitina
      // dayanmadan once, temiz bir 409 ile).
      const sonuc = await tx.parcaTalebi.updateMany({
        where: { id: dto.talepId, durum: TalepDurumu.ONAYLANDI },
        data: { durum: TalepDurumu.SIPARIS_VERILDI },
      });

      if (sonuc.count === 0) {
        throw new ConflictException(
          'Talebin durumu bu sirada degisti, siparis olusturulamadi.',
        );
      }

      return tx.siparis.create({
        data: {
          talepId: dto.talepId,
          tedarikciId: dto.tedarikciId,
          miktar: dto.miktar,
          birimFiyat: dto.birimFiyat,
        },
        include: SIPARIS_INCLUDE,
      });
    });
  }

  /**
   * Siparisi teslim alir ve mali stoga isler.
   *
   * Dort yazma da (siparis kapanisi, stok artisi, GIRIS hareketi, talep durumu)
   * tek bir transaction icinde. Biri patlarsa hicbiri kalici olmaz; aksi halde
   * stok artip siparis acik kalabilir ya da tersi olabilirdi.
   */
  async teslimAl(
    id: number,
    dto: TeslimAlDto,
    kullaniciId: number,
  ): Promise<SiparisDetay> {
    return this.prisma.$transaction(async (tx) => {
      const siparis = await tx.siparis.findUnique({
        where: { id },
        select: {
          id: true,
          miktar: true,
          teslimAlindi: true,
          talepId: true,
          talep: { select: { parcaId: true } },
        },
      });

      if (!siparis) {
        throw new NotFoundException(`${id} numarali siparis bulunamadi.`);
      }

      if (siparis.teslimAlindi) {
        throw new BadRequestException(
          `${id} numarali siparis zaten teslim alindi.`,
        );
      }

      const depoId = await this.depoyuCoz(tx, dto.depoId);

      // Siparisi ilk iste kapatiyoruz: kosul "teslimAlindi = false" oldugu icin
      // ayni siparise es zamanli gelen ikinci teslim istegi bu satirda takilir
      // ve stogu iki kez artiramaz.
      const kapanis = await tx.siparis.updateMany({
        where: { id, teslimAlindi: false },
        data: { teslimAlindi: true, teslimTarihi: new Date() },
      });

      if (kapanis.count === 0) {
        throw new ConflictException(
          'Siparis bu sirada baska bir istekle teslim alindi.',
        );
      }

      const parcaId = siparis.talep.parcaId;

      await tx.stokKalem.upsert({
        where: { parcaId_depoId: { parcaId, depoId } },
        // increment toplami veritabaninda hesaplatir; onceden okunan bir degeri
        // geri yazmadigi icin es zamanli girislerde kayip guncelleme olusmaz.
        update: { miktar: { increment: siparis.miktar } },
        create: { parcaId, depoId, miktar: siparis.miktar },
      });

      await tx.stokHareketi.create({
        data: {
          parcaId,
          depoId,
          tip: HareketTipi.GIRIS,
          miktar: siparis.miktar,
          aciklama: `Siparis teslim alindi (Siparis #${id})`,
          kullaniciId,
        },
      });

      await tx.parcaTalebi.update({
        where: { id: siparis.talepId },
        data: { durum: TalepDurumu.TESLIM_ALINDI },
      });

      return tx.siparis.findUniqueOrThrow({
        where: { id },
        include: SIPARIS_INCLUDE,
      });
    });
  }

  /**
   * Teslimatin gidecegi depoyu belirler. Envanterde tek "Ana Depo" oldugu icin
   * depoId gonderilmesi zorunlu degil; ama ileride ikinci bir depo acilirsa
   * sessizce yanlis depoya yazmak yerine alanin doldurulmasini istiyoruz.
   */
  private async depoyuCoz(
    tx: Prisma.TransactionClient,
    depoId?: number,
  ): Promise<number> {
    if (depoId !== undefined) {
      const depo = await tx.depo.findUnique({
        where: { id: depoId },
        select: { id: true },
      });

      if (!depo) {
        throw new BadRequestException(`${depoId} numarali depo bulunamadi.`);
      }

      return depo.id;
    }

    const depolar = await tx.depo.findMany({ select: { id: true }, take: 2 });

    if (depolar.length === 0) {
      throw new BadRequestException(
        'Sistemde kayitli depo yok, teslim alinamaz.',
      );
    }

    if (depolar.length > 1) {
      throw new BadRequestException(
        'Birden fazla depo kayitli, teslimatin yapilacagi depoId gonderilmelidir.',
      );
    }

    return depolar[0].id;
  }
}
