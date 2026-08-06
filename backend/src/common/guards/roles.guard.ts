import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Rol } from '../../../generated/prisma/enums';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthUser } from '../types/auth-user';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const gerekliRoller = this.reflector.getAllAndOverride<Rol[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // @Roles kullanilmamissa endpoint rol kisiti tasimaz.
    if (!gerekliRoller || gerekliRoller.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const kullanici = request.user;

    if (!kullanici || !gerekliRoller.includes(kullanici.rol)) {
      throw new ForbiddenException('Bu islem icin yetkiniz yok.');
    }

    return true;
  }
}
