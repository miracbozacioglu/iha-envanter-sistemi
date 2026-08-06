import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '../../generated/prisma/client';
import type { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { CreateKullaniciDto } from './dto/create-kullanici.dto';
import { UpdateKullaniciDto } from './dto/update-kullanici.dto';

const SALT_ROUNDS = 10;

/** Tum sorgularda sifreHash sonuctan cikarilir. */
const SIFRE_HARIC = { sifreHash: true } as const;

@Injectable()
export class KullanicilarService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateKullaniciDto): Promise<AuthUser> {
    const mevcut = await this.prisma.kullanici.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (mevcut) {
      throw new ConflictException(
        `${dto.email} adresiyle kayitli bir kullanici zaten var.`,
      );
    }

    return this.prisma.kullanici.create({
      data: {
        ad: dto.ad,
        soyad: dto.soyad,
        email: dto.email,
        sifreHash: await bcrypt.hash(dto.sifre, SALT_ROUNDS),
        // rol gonderilmezse semadaki @default(TEKNISYEN) devreye girer.
        rol: dto.rol,
        unvan: dto.unvan,
      },
      omit: SIFRE_HARIC,
    });
  }

  async findAll(): Promise<AuthUser[]> {
    return this.prisma.kullanici.findMany({
      orderBy: { id: 'asc' },
      omit: SIFRE_HARIC,
    });
  }

  async findOne(id: number): Promise<AuthUser> {
    const kullanici = await this.prisma.kullanici.findUnique({
      where: { id },
      omit: SIFRE_HARIC,
    });

    if (!kullanici) {
      throw new NotFoundException(`${id} numarali kullanici bulunamadi.`);
    }

    return kullanici;
  }

  async update(id: number, dto: UpdateKullaniciDto): Promise<AuthUser> {
    const kullanici = await this.prisma.kullanici.findUnique({
      where: { id },
      select: { id: true, email: true },
    });

    if (!kullanici) {
      throw new NotFoundException(`${id} numarali kullanici bulunamadi.`);
    }

    if (dto.email && dto.email !== kullanici.email) {
      const emailSahibi = await this.prisma.kullanici.findUnique({
        where: { email: dto.email },
        select: { id: true },
      });

      if (emailSahibi) {
        throw new ConflictException(
          `${dto.email} adresi baska bir kullanici tarafindan kullaniliyor.`,
        );
      }
    }

    return this.prisma.kullanici.update({
      where: { id },
      data: {
        ad: dto.ad,
        soyad: dto.soyad,
        email: dto.email,
        rol: dto.rol,
        unvan: dto.unvan,
        aktif: dto.aktif,
        // Sifre yalnizca gonderildiginde yeniden hash'lenir.
        ...(dto.sifre
          ? { sifreHash: await bcrypt.hash(dto.sifre, SALT_ROUNDS) }
          : {}),
      },
      omit: SIFRE_HARIC,
    });
  }

  async remove(id: number): Promise<AuthUser> {
    await this.findOne(id);

    try {
      return await this.prisma.kullanici.delete({
        where: { id },
        omit: SIFRE_HARIC,
      });
    } catch (e) {
      // P2003: foreign key kisiti - kullanicinin talep/hareket/bakim kayitlari var.
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        (e.code === 'P2003' || e.code === 'P2014')
      ) {
        throw new BadRequestException(
          'Bu kullanicinin sisteme islenmis kayitlari var, silinemez. ' +
            'Bunun yerine PATCH /kullanicilar/:id ile aktif: false gondererek pasife alin.',
        );
      }

      throw e;
    }
  }
}
