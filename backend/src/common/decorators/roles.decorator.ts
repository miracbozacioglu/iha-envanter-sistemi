import { SetMetadata } from '@nestjs/common';
import type { Rol } from '../../../generated/prisma/enums';

export const ROLES_KEY = 'roles';

<<<<<<< HEAD
/** Endpoint'e erisebilecek rolleri isaretler. Ornek: @Roles('YONETICI') */
=======
/** Endpoint'e erisebilecek rolleri isaretler. Ornek: @Roles(Rol.YONETICI) */
>>>>>>> 85fc1ad10153bd07300a2abe9ed9894f4a2c1a6e
export const Roles = (...roller: Rol[]) => SetMetadata(ROLES_KEY, roller);
