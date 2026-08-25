import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateTalepDto {
  @ApiProperty({
    description: 'Talep edilen parcanin id si',
    example: 1,
  })
  @IsInt({ message: 'parcaId tam sayi olmalidir.' })
  @Min(1, { message: 'parcaId 1 veya daha buyuk olmalidir.' })
  parcaId: number;

  @ApiProperty({
    description: 'Talep edilen miktar',
    example: 2,
    minimum: 1,
  })
  @IsInt({ message: 'miktar tam sayi olmalidir.' })
  @Min(1, { message: 'miktar en az 1 olmalidir.' })
  @Max(1000000, { message: 'miktar en fazla 1000000 olabilir.' })
  miktar: number;

  @ApiPropertyOptional({
    description: 'Talebin gerekcesi',
    example: 'TR-114 kuyruk nolu aracin motor degisimi icin',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Aciklama en fazla 500 karakter olabilir.' })
  aciklama?: string;
}
