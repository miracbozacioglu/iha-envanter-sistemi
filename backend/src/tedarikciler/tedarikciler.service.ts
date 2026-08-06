import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Tedarikci } from '../../generated/prisma/client';
import { iliskiHatasiniCevir } from '../common/utils/prisma-hata.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTedarikciDto } from './dto/create-tedarikci.dto';
import { UpdateTedarikciDto } from './dto/update-tedarikci.dto';

@Injectable()
export class TedarikcilerService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTedarikciDto): Promise<Tedarikci> {
    await this.adBenzersizMi(dto.ad);

    return this.prisma.tedarikci.create({
      data: { ad: dto.ad, telefon: dto.telefon, email: dto.email },
    });
  }

  async findAll(): Promise<Tedarikci[]> {
    return this.prisma.tedarikci.findMany({ orderBy: { ad: 'asc' } });
  }

  async findOne(id: number): Promise<Tedarikci> {
    const tedarikci = await this.prisma.tedarikci.findUnique({ where: { id } });

    if (!tedarikci) {
      throw new NotFoundException(`${id} numarali tedarikci bulunamadi.`);
    }

    return tedarikci;
  }

  async update(id: number, dto: UpdateTedarikciDto): Promise<Tedarikci> {
    const tedarikci = await this.findOne(id);

    if (dto.ad && dto.ad !== tedarikci.ad) {
      await this.adBenzersizMi(dto.ad);
    }

    return this.prisma.tedarikci.update({
      where: { id },
      data: { ad: dto.ad, telefon: dto.telefon, email: dto.email },
    });
  }

  async remove(id: number): Promise<Tedarikci> {
    await this.findOne(id);

    try {
      return await this.prisma.tedarikci.delete({ where: { id } });
    } catch (e) {
      iliskiHatasiniCevir(
        e,
        'Bu tedarikciye bagli siparisler var, silinemez. Once siparis kayitlarini kaldirin.',
      );
    }
  }

  private async adBenzersizMi(ad: string): Promise<void> {
    const mevcut = await this.prisma.tedarikci.findUnique({
      where: { ad },
      select: { id: true },
    });

    if (mevcut) {
      throw new ConflictException(`"${ad}" adinda bir tedarikci zaten var.`);
    }
  }
}
