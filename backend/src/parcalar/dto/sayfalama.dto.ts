import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Sayfalama query parametreleri.
 * ValidationPipe'ta implicit conversion kapali oldugu icin @Type ile
 * string -> number donusumu elle yapiliyor.
 */
export class SayfalamaDto {
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
