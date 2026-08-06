import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AuthUser } from '../../common/types/auth-user';
import { PrismaService } from '../../prisma/prisma.service';
import type { JwtPayload } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = config.get<string>('JWT_SECRET');

    if (!secret) {
      throw new Error(
        'JWT_SECRET tanimli degil. backend/.env dosyasini kontrol edin.',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  /** Dondurulen deger request.user olarak set edilir. */
  async validate(payload: JwtPayload): Promise<AuthUser> {
    const kullanici = await this.prisma.kullanici.findUnique({
      where: { id: payload.sub },
      omit: { sifreHash: true },
    });

    if (!kullanici || !kullanici.aktif) {
      throw new UnauthorizedException('Oturum gecersiz veya hesap pasif.');
    }

    return kullanici;
  }
}
