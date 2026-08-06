import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Kategori } from '../../generated/prisma/client';
import { iliskiHatasiniCevir } from '../common/utils/prisma-hata.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateKategoriDto } from './dto/create-kategori.dto';
import { UpdateKategoriDto } from './dto/update-kategori.dto';

@Injectable()
export class KategorilerService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateKategoriDto): Promise<Kategori> {
    await this.adBenzersizMi(dto.ad);

    return this.prisma.kategori.create({
      data: { ad: dto.ad, aciklama: dto.aciklama },
    });
  }

  async findAll(): Promise<Kategori[]> {
    return this.prisma.kategori.findMany({ orderBy: { ad: 'asc' } });
  }

  async findOne(id: number): Promise<Kategori> {
    const kategori = await this.prisma.kategori.findUnique({ where: { id } });

    if (!kategori) {
      throw new NotFoundException(`${id} numarali kategori bulunamadi.`);
    }

    return kategori;
  }

  async update(id: number, dto: UpdateKategoriDto): Promise<Kategori> {
    const kategori = await this.findOne(id);

    if (dto.ad && dto.ad !== kategori.ad) {
      await this.adBenzersizMi(dto.ad);
    }

    return this.prisma.kategori.update({
      where: { id },
      data: { ad: dto.ad, aciklama: dto.aciklama },
    });
  }

  async remove(id: number): Promise<Kategori> {
    await this.findOne(id);

    try {
      return await this.prisma.kategori.delete({ where: { id } });
    } catch (e) {
      iliskiHatasiniCevir(
        e,
        'Bu kategoriye bagli parcalar var, silinemez. Once parcalari baska bir kategoriye tasiyin.',
      );
    }
  }

  private async adBenzersizMi(ad: string): Promise<void> {
    const mevcut = await this.prisma.kategori.findUnique({
      where: { ad },
      select: { id: true },
    });

    if (mevcut) {
      throw new ConflictException(`"${ad}" adinda bir kategori zaten var.`);
    }
  }
}
