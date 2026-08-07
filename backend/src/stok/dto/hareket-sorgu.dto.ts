import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { HareketTipi } from '../../../generated/prisma/enums';

/**
 * Hareket listesinin filtre + sayfalama parametreleri.
 * ValidationPipe'ta implicit conversion kapali oldugu icin @Type ile
 * string -> number donusumu elle yapiliyor.
 */
export class HareketSorguDto {
  @ApiPropertyOptional({
    description: 'Sadece bu parcaya ait hareketleri getir',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'parcaId tam sayi olmalidir.' })
  @Min(1, { message: 'parcaId 1 veya daha buyuk olmalidir.' })
  parcaId?: number;

  @ApiPropertyOptional({
    description: 'Sadece bu depoya ait hareketleri getir',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'depoId tam sayi olmalidir.' })
  @Min(1, { message: 'depoId 1 veya daha buyuk olmalidir.' })
  depoId?: number;

  @ApiPropertyOptional({
    description: 'Hareket tipi filtresi',
    enum: HareketTipi,
    example: HareketTipi.GIRIS,
  })
  @IsOptional()
  @IsEnum(HareketTipi, { message: 'tip GIRIS veya CIKIS olmalidir.' })
  tip?: HareketTipi;

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
