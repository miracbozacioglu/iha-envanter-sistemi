import type { Kullanici } from '../../../generated/prisma/client';

/** Oturumdaki kullanici: sifre hash'i disarida birakilir. */
export type AuthUser = Omit<Kullanici, 'sifreHash'>;
