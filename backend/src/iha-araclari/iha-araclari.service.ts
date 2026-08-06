import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { IhaAraci, IhaModeli } from '../../generated/prisma/client';
import { iliskiHatasiniCevir } from '../common/utils/prisma-hata.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIhaAraciDto } from './dto/create-iha-araci.dto';
import { UpdateIhaAraciDto } from './dto/update-iha-araci.dto';

/** Arac yanitlarinda bagli oldugu model de yer alir. */
export type IhaAraciDetay = IhaAraci & { ihaModeli: IhaModeli };

@Injectable()
export class IhaAraclariService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateIhaAraciDto): Promise<IhaAraciDetay> {
    await this.kuyrukNoBenzersizMi(dto.kuyrukNo);
    await this.modelVarMi(dto.ihaModeliId);

    return this.prisma.ihaAraci.create({
      data: {
        kuyrukNo: dto.kuyrukNo,
        ihaModeliId: dto.ihaModeliId,
        // durum gonderilmezse semadaki @default("AKTIF") devreye girer.
        durum: dto.durum,
        aciklama: dto.aciklama,
      },
      include: { ihaModeli: true },
    });
  }

  async findAll(): Promise<IhaAraciDetay[]> {
    return this.prisma.ihaAraci.findMany({
      orderBy: { kuyrukNo: 'asc' },
      include: { ihaModeli: true },
    });
  }

  async findOne(id: number): Promise<IhaAraciDetay> {
    const arac = await this.prisma.ihaAraci.findUnique({
      where: { id },
      include: { ihaModeli: true },
    });

    if (!arac) {
      throw new NotFoundException(`${id} numarali IHA araci bulunamadi.`);
    }

    return arac;
  }

  async update(id: number, dto: UpdateIhaAraciDto): Promise<IhaAraciDetay> {
    const arac = await this.findOne(id);

    if (dto.kuyrukNo && dto.kuyrukNo !== arac.kuyrukNo) {
      await this.kuyrukNoBenzersizMi(dto.kuyrukNo);
    }

    if (dto.ihaModeliId && dto.ihaModeliId !== arac.ihaModeliId) {
      await this.modelVarMi(dto.ihaModeliId);
    }

    return this.prisma.ihaAraci.update({
      where: { id },
      data: {
        kuyrukNo: dto.kuyrukNo,
        ihaModeliId: dto.ihaModeliId,
        durum: dto.durum,
        aciklama: dto.aciklama,
      },
      include: { ihaModeli: true },
    });
  }

  async remove(id: number): Promise<IhaAraci> {
    await this.findOne(id);

    try {
      return await this.prisma.ihaAraci.delete({ where: { id } });
    } catch (e) {
      iliskiHatasiniCevir(
        e,
        'Bu araca ait bakim kayitlari var, silinemez. Once bakim kayitlarini kaldirin.',
      );
    }
  }

  private async kuyrukNoBenzersizMi(kuyrukNo: string): Promise<void> {
    const mevcut = await this.prisma.ihaAraci.findUnique({
      where: { kuyrukNo },
      select: { id: true },
    });

    if (mevcut) {
      throw new ConflictException(
        `"${kuyrukNo}" kuyruk numarali bir arac zaten kayitli.`,
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
        `${ihaModeliId} numarali IHA modeli bulunamadi, arac bu modele baglanamaz.`,
      );
    }
  }
}
