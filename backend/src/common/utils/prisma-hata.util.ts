import { BadRequestException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';

/**
 * Silme sirasinda foreign key kisiti patlarsa anlamli bir 400'e cevirir.
 * Baska her hatayi oldugu gibi yeniden firlatir.
 *
 * Kullanim: catch (e) { iliskiHatasiniCevir(e, '... silinemez'); }
 */
export function iliskiHatasiniCevir(e: unknown, mesaj: string): never {
  if (
    e instanceof Prisma.PrismaClientKnownRequestError &&
    (e.code === 'P2003' || e.code === 'P2014')
  ) {
    throw new BadRequestException(mesaj);
  }

  throw e;
}
