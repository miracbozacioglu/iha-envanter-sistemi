import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDepoDto {
  @ApiProperty({
    description: 'Depo adi (ayni ad ikinci kez kullanilamaz)',
    example: 'Ana Depo',
  })
  @IsString()
  @IsNotEmpty({ message: 'Depo adi bos birakilamaz.' })
  @MaxLength(100, { message: 'Depo adi en fazla 100 karakter olabilir.' })
  ad: string;

  @ApiPropertyOptional({
    description: 'Deponun bulundugu lokasyon',
    example: 'Merkez',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Lokasyon en fazla 200 karakter olabilir.' })
  lokasyon?: string;
}
