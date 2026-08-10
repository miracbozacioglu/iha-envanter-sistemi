import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { BakimTipi } from '../../../generated/prisma/enums';

/**
 * Bakim listesinin filtre + sayfalama parametreleri.
 * ValidationPipe'ta implicit conversion kapali oldugu icin @Type ile
 * string -> number donusumu elle yapiliyor.
 */
export class BakimSorguDto {
  @ApiPropertyOptional({
    description: 'Sadece bu araca ait bakim kayitlarini getir',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'ihaAraciId tam sayi olmalidir.' })
  @Min(1, { message: 'ihaAraciId 1 veya daha buyuk olmalidir.' })
  ihaAraciId?: number;

  @ApiPropertyOptional({
    description: 'Bakim tipi filtresi',
    enum: BakimTipi,
    example: BakimTipi.DEGISTIRILDI,
  })
  @IsOptional()
  @IsEnum(BakimTipi, {
    message: 'tip DEGISTIRILDI veya TAMIR_EDILDI olmalidir.',
  })
  tip?: BakimTipi;

  @ApiPropertyOptional({
    description: 'Kacinci sayfa (1 den baslar)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page tam sayi olmalidir.' })
  @Min(1, { message: 'page 1 veya daha buyuk olmalidir.' })
  page?: number;

  @ApiPropertyOptional({
    description: 'Sayfa basina kayit sayisi',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit tam sayi olmalidir.' })
  @Min(1, { message: 'limit 1 veya daha buyuk olmalidir.' })
  @Max(100, { message: 'limit en fazla 100 olabilir.' })
  limit?: number;
}
