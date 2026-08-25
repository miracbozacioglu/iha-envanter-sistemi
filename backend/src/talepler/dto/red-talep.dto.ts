import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class RedTalepDto {
  @ApiProperty({
    description: 'Talebin neden reddedildigi. Bos birakilamaz.',
    example: 'Stokta yeterli parca var, yeni tedarige gerek yok.',
    minLength: 1,
  })
  @IsString({ message: 'redSebebi metin olmalidir.' })
  @MinLength(1, { message: 'redSebebi bos birakilamaz.' })
  @MaxLength(500, { message: 'Red sebebi en fazla 500 karakter olabilir.' })
  redSebebi: string;
}
