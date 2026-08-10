import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class TeslimAlDto {
  @ApiPropertyOptional({
    description:
      'Parcanin girecegi depo. Gonderilmezse sistemde kayitli tek depo kullanilir; ' +
      'birden fazla depo varsa bu alan zorunlu hale gelir.',
    example: 1,
  })
  @IsOptional()
  @IsInt({ message: 'depoId tam sayi olmalidir.' })
  @Min(1, { message: 'depoId 1 veya daha buyuk olmalidir.' })
  depoId?: number;
}
