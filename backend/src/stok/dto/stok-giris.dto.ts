import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class StokGirisDto {
  @ApiProperty({
    description: 'Girisi yapilan parcanin id si',
    example: 1,
  })
  @IsInt({ message: 'parcaId tam sayi olmalidir.' })
  @Min(1, { message: 'parcaId 1 veya daha buyuk olmalidir.' })
  parcaId: number;

  @ApiProperty({
    description: 'Parcanin girdigi deponun id si',
    example: 1,
  })
  @IsInt({ message: 'depoId tam sayi olmalidir.' })
  @Min(1, { message: 'depoId 1 veya daha buyuk olmalidir.' })
  depoId: number;

  @ApiProperty({
    description: 'Giren miktar. Mevcut stogun uzerine eklenir.',
    example: 10,
    minimum: 1,
  })
  @IsInt({ message: 'miktar tam sayi olmalidir.' })
  @Min(1, { message: 'miktar en az 1 olmalidir.' })
  @Max(1000000, { message: 'miktar en fazla 1000000 olabilir.' })
  miktar: number;

  @ApiPropertyOptional({
    description: 'Hareket aciklamasi',
    example: 'Tedarikci teslimati - irsaliye 2024/118',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Aciklama en fazla 500 karakter olabilir.' })
  aciklama?: string;

  @ApiPropertyOptional({
    description:
      'Raf kodu. Gonderilirse stok kaleminin raf bilgisi bu degerle guncellenir; ' +
      'gonderilmezse mevcut raf kodu korunur.',
    example: 'A-03-2',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'rafKodu bos birakilamaz.' })
  @MaxLength(50, { message: 'rafKodu en fazla 50 karakter olabilir.' })
  rafKodu?: string;
}
