import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateKategoriDto {
  @ApiProperty({
    description: 'Kategori adi (benzersiz olmali)',
    example: 'Motor Parcalari',
  })
  @IsString()
  @IsNotEmpty({ message: 'Kategori adi bos birakilamaz.' })
  @MaxLength(100, { message: 'Kategori adi en fazla 100 karakter olabilir.' })
  ad: string;

  @ApiPropertyOptional({
    description: 'Aciklama',
    example: 'Motor ve tahrik sistemine ait parcalar',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Aciklama en fazla 500 karakter olabilir.' })
  aciklama?: string;
}
