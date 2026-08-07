import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class StokSorguDto {
  @ApiPropertyOptional({
    description: 'Sadece bu depodaki stok kalemlerini getir',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'depoId tam sayi olmalidir.' })
  @Min(1, { message: 'depoId 1 veya daha buyuk olmalidir.' })
  depoId?: number;
}
