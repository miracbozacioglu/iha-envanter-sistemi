import { SetMetadata } from '@nestjs/common';
import type { Rol } from '../../../generated/prisma/enums';

export const ROLES_KEY = 'roles';

/** Endpoint'e erisebilecek rolleri isaretler. Ornek: @Roles(Rol.YONETICI) */
export const Roles = (...roller: Rol[]) => SetMetadata(ROLES_KEY, roller);
