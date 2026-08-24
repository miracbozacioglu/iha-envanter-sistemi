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

export class CreateParcaDto {
  @ApiProperty({
    description: 'Parca kodu (benzersiz olmali)',
    example: 'MTR-4212',
  })
  @IsString()
  @IsNotEmpty({ message: 'Parca kodu bos birakilamaz.' })
  @MaxLength(50, { message: 'Parca kodu en fazla 50 karakter olabilir.' })
  kod: string;

  @ApiProperty({
    description: 'Parca adi',
    example: 'Firca siz motor 4212',
  })
  @IsString()
  @IsNotEmpty({ message: 'Parca adi bos birakilamaz.' })
  @MaxLength(150, { message: 'Parca adi en fazla 150 karakter olabilir.' })
  ad: string;

  @ApiPropertyOptional({
    description: 'Aciklama',
    example: 'Ana govde itki motoru',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Aciklama en fazla 500 karakter olabilir.' })
  aciklama?: string;

  @ApiPropertyOptional({
    description: 'Stok birimi. Gonderilmezse "adet" atanir.',
    example: 'adet',
    default: 'adet',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Birim bos birakilamaz.' })
  @MaxLength(20, { message: 'Birim en fazla 20 karakter olabilir.' })
  birim?: string;

  @ApiPropertyOptional({
    description:
      'Kritik stok esigi. Toplam stok bu degerin altina duserse parca kritik sayilir. Gonderilmezse 5 atanir.',
    example: 5,
    default: 5,
  })
  @IsOptional()
  @IsInt({ message: 'kritikSeviye tam sayi olmalidir.' })
  @Min(0, { message: 'kritikSeviye 0 veya daha buyuk olmalidir.' })
  @Max(1000000, { message: 'kritikSeviye en fazla 1000000 olabilir.' })
  kritikSeviye?: number;

  @ApiProperty({
    description: 'Bagli oldugu kategorinin id si',
    example: 1,
  })
  @IsInt({ message: 'kategoriId tam sayi olmalidir.' })
  @Min(1, { message: 'kategoriId 1 veya daha buyuk olmalidir.' })
  kategoriId: number;
}
