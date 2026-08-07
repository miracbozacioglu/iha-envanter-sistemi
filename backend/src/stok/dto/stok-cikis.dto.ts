import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class StokCikisDto {
  @ApiProperty({
    description: 'Cikisi yapilan parcanin id si',
    example: 1,
  })
  @IsInt({ message: 'parcaId tam sayi olmalidir.' })
  @Min(1, { message: 'parcaId 1 veya daha buyuk olmalidir.' })
  parcaId: number;

  @ApiProperty({
    description: 'Parcanin cikildigi deponun id si',
    example: 1,
  })
  @IsInt({ message: 'depoId tam sayi olmalidir.' })
  @Min(1, { message: 'depoId 1 veya daha buyuk olmalidir.' })
  depoId: number;

  @ApiProperty({
    description: 'Cikan miktar. Mevcut stoktan dusulur, stogu asamaz.',
    example: 2,
    minimum: 1,
  })
  @IsInt({ message: 'miktar tam sayi olmalidir.' })
  @Min(1, { message: 'miktar en az 1 olmalidir.' })
  miktar: number;

  @ApiPropertyOptional({
    description: 'Hareket aciklamasi',
    example: 'Fire / hurdaya ayrildi',
  })
  @IsOptional()
  @IsString()
  aciklama?: string;
}
