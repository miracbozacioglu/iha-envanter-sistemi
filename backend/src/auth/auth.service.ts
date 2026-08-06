import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { Rol } from '../../generated/prisma/enums';
import type { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';

export interface JwtPayload {
  /** Kullanici id'si (JWT standardi geregi "sub"). */
  sub: number;
  email: string;
  rol: Rol;
}

export interface LoginSonucu {
  access_token: string;
  user: AuthUser;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /** E-posta + sifre dogrular; basarili ise sifreHash'siz kullaniciyi doner. */
  async validateUser(email: string, sifre: string): Promise<AuthUser> {
    const kullanici = await this.prisma.kullanici.findUnique({
      where: { email },
    });

    // Kullanici yoksa da sifre yanlissa da ayni mesaj: hesap sizdirmayalim.
    if (!kullanici) {
      throw new UnauthorizedException('E-posta veya sifre hatali.');
    }

    if (!kullanici.aktif) {
      throw new UnauthorizedException('Hesabiniz pasif durumda.');
    }

    const sifreDogru = await bcrypt.compare(sifre, kullanici.sifreHash);

    if (!sifreDogru) {
      throw new UnauthorizedException('E-posta veya sifre hatali.');
    }

    const { sifreHash, ...guvenliKullanici } = kullanici;
    void sifreHash;

    return guvenliKullanici;
  }

  async login(user: AuthUser): Promise<LoginSonucu> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      rol: user.rol,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user,
    };
  }
}
