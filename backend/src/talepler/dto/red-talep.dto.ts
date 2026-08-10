import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RedTalepDto {
  @ApiProperty({
    description: 'Talebin neden reddedildigi. Bos birakilamaz.',
    example: 'Stokta yeterli parca var, yeni tedarige gerek yok.',
    minLength: 1,
  })
  @IsString({ message: 'redSebebi metin olmalidir.' })
  @MinLength(1, { message: 'redSebebi bos birakilamaz.' })
  redSebebi: string;
}
