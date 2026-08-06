import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateKategoriDto {
  @ApiProperty({
    description: 'Kategori adi (benzersiz olmali)',
    example: 'Motor Parcalari',
  })
  @IsString()
  @IsNotEmpty({ message: 'Kategori adi bos birakilamaz.' })
  ad: string;

  @ApiPropertyOptional({
    description: 'Aciklama',
    example: 'Motor ve tahrik sistemine ait parcalar',
  })
  @IsOptional()
  @IsString()
  aciklama?: string;
}
