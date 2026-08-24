import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateIhaAraciDto {
  @ApiProperty({
    description: 'Kuyruk numarasi (benzersiz olmali)',
    example: 'TB2-001',
  })
  @IsString()
  @IsNotEmpty({ message: 'Kuyruk numarasi bos birakilamaz.' })
  @MaxLength(50, { message: 'Kuyruk numarasi en fazla 50 karakter olabilir.' })
  kuyrukNo: string;

  @ApiProperty({
    description: 'Bagli oldugu IHA modelinin id si',
    example: 1,
  })
  @IsInt({ message: 'ihaModeliId tam sayi olmalidir.' })
  @Min(1, { message: 'ihaModeliId 1 veya daha buyuk olmalidir.' })
  ihaModeliId: number;

  @ApiPropertyOptional({
    description: 'Arac durumu. Gonderilmezse AKTIF atanir.',
    example: 'AKTIF',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Durum en fazla 50 karakter olabilir.' })
  durum?: string;

  @ApiPropertyOptional({
    description: 'Aciklama',
    example: 'Filo 1 e tahsis edildi',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Aciklama en fazla 500 karakter olabilir.' })
  aciklama?: string;
}
