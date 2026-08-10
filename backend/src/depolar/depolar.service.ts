import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Depo } from '../../generated/prisma/client';
import { iliskiHatasiniCevir } from '../common/utils/prisma-hata.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepoDto } from './dto/create-depo.dto';
import { UpdateDepoDto } from './dto/update-depo.dto';

@Injectable()
export class DepolarService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDepoDto): Promise<Depo> {
    await this.adBenzersizMi(dto.ad);

    return this.prisma.depo.create({
      data: { ad: dto.ad, lokasyon: dto.lokasyon },
    });
  }

  async findAll(): Promise<Depo[]> {
    return this.prisma.depo.findMany({ orderBy: { ad: 'asc' } });
  }

  async findOne(id: number): Promise<Depo> {
    const depo = await this.prisma.depo.findUnique({ where: { id } });

    if (!depo) {
      throw new NotFoundException(`${id} numarali depo bulunamadi.`);
    }

    return depo;
  }

  async update(id: number, dto: UpdateDepoDto): Promise<Depo> {
    const depo = await this.findOne(id);

    if (dto.ad && dto.ad !== depo.ad) {
      await this.adBenzersizMi(dto.ad);
    }

    return this.prisma.depo.update({
      where: { id },
      data: { ad: dto.ad, lokasyon: dto.lokasyon },
    });
  }

  async remove(id: number): Promise<Depo> {
    await this.findOne(id);

    try {
      return await this.prisma.depo.delete({ where: { id } });
    } catch (e) {
      iliskiHatasiniCevir(
        e,
        'Bu depoda stok kayitlari var, silinemez. Once stok kalemlerini bosaltin veya baska bir depoya tasiyin.',
      );
    }
  }

  /**
   * Depo.ad semada @unique degil (Kategori/Tedarikci'den farki bu), o yuzden
   * findUnique kullanilamiyor; benzersizlik uygulama katmaninda findFirst ile
   * denetleniyor. Veritabani seviyesinde garanti degildir: es zamanli iki
   * istek ayni adi olusturabilir.
   */
  private async adBenzersizMi(ad: string): Promise<void> {
    const mevcut = await this.prisma.depo.findFirst({
      where: { ad },
      select: { id: true },
    });

    if (mevcut) {
      throw new ConflictException(`"${ad}" adinda bir depo zaten var.`);
    }
  }
}
