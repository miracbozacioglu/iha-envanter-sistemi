import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class TamirDto {
  @ApiProperty({
    description: 'Bakimi yapilan aracin id si',
    example: 1,
  })
  @IsInt({ message: 'ihaAraciId tam sayi olmalidir.' })
  @Min(1, { message: 'ihaAraciId 1 veya daha buyuk olmalidir.' })
  ihaAraciId: number;

  @ApiProperty({
    description: 'Yerinde tamir edilen parcanin id si',
    example: 1,
  })
  @IsInt({ message: 'parcaId tam sayi olmalidir.' })
  @Min(1, { message: 'parcaId 1 veya daha buyuk olmalidir.' })
  parcaId: number;

  @ApiPropertyOptional({
    description: 'Bakim notu',
    example: 'Konnektor lehimi yenilendi, parca yerinde tamir edildi.',
  })
  @IsOptional()
  @IsString()
  aciklama?: string;
}
