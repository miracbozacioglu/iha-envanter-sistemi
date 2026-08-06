import { Injectable, NotFoundException } from '@nestjs/common';
import type { IhaAraci, IhaModeli } from '../../generated/prisma/client';
import { iliskiHatasiniCevir } from '../common/utils/prisma-hata.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIhaModeliDto } from './dto/create-iha-modeli.dto';
import { UpdateIhaModeliDto } from './dto/update-iha-modeli.dto';

/** Detay yanitinda modele bagli araclar da yer alir. */
export type IhaModeliDetay = IhaModeli & { araclar: IhaAraci[] };

@Injectable()
export class IhaModelleriService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateIhaModeliDto): Promise<IhaModeli> {
    return this.prisma.ihaModeli.create({
      data: { ad: dto.ad, uretici: dto.uretici, aciklama: dto.aciklama },
    });
  }

  async findAll(): Promise<IhaModeli[]> {
    return this.prisma.ihaModeli.findMany({ orderBy: { ad: 'asc' } });
  }

  async findOne(id: number): Promise<IhaModeliDetay> {
    const model = await this.prisma.ihaModeli.findUnique({
      where: { id },
      include: { araclar: { orderBy: { kuyrukNo: 'asc' } } },
    });

    if (!model) {
      throw new NotFoundException(`${id} numarali IHA modeli bulunamadi.`);
    }

    return model;
  }

  async update(id: number, dto: UpdateIhaModeliDto): Promise<IhaModeli> {
    await this.findOne(id);

    return this.prisma.ihaModeli.update({
      where: { id },
      data: { ad: dto.ad, uretici: dto.uretici, aciklama: dto.aciklama },
    });
  }

  async remove(id: number): Promise<IhaModeli> {
    await this.findOne(id);

    try {
      return await this.prisma.ihaModeli.delete({ where: { id } });
    } catch (e) {
      iliskiHatasiniCevir(
        e,
        'Bu modele bagli araclar veya parca uyumluluklari var, silinemez. Once bagli kayitlari kaldirin.',
      );
    }
  }
}
