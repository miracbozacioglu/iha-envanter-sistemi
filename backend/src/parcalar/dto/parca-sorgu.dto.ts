import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { SayfalamaDto } from './sayfalama.dto';

export class ParcaSorguDto extends SayfalamaDto {
  @ApiPropertyOptional({
    description: 'Kod veya ad icinde arama (buyuk/kucuk harf duyarsiz)',
    example: 'motor',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Sadece bu kategoriye ait parcalari getir',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'kategoriId tam sayi olmalidir.' })
  @Min(1, { message: 'kategoriId 1 veya daha buyuk olmalidir.' })
  kategoriId?: number;

  @ApiPropertyOptional({
    description: 'Sadece bu IHA modeliyle uyumlu parcalari getir',
    example: 2,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'ihaModeliId tam sayi olmalidir.' })
  @Min(1, { message: 'ihaModeliId 1 veya daha buyuk olmalidir.' })
  ihaModeliId?: number;
}
