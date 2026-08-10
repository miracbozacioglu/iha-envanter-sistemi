import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDepoDto {
  @ApiProperty({
    description: 'Depo adi (ayni ad ikinci kez kullanilamaz)',
    example: 'Ana Depo',
  })
  @IsString()
  @IsNotEmpty({ message: 'Depo adi bos birakilamaz.' })
  ad: string;

  @ApiPropertyOptional({
    description: 'Deponun bulundugu lokasyon',
    example: 'Merkez',
  })
  @IsOptional()
  @IsString()
  lokasyon?: string;
}
