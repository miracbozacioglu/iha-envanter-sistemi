import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class DegistirDto {
  @ApiProperty({
    description: 'Bakimi yapilan aracin id si',
    example: 1,
  })
  @IsInt({ message: 'ihaAraciId tam sayi olmalidir.' })
  @Min(1, { message: 'ihaAraciId 1 veya daha buyuk olmalidir.' })
  ihaAraciId: number;

  @ApiProperty({
    description: 'Araca takilan (stoktan dusulen) parcanin id si',
    example: 1,
  })
  @IsInt({ message: 'parcaId tam sayi olmalidir.' })
  @Min(1, { message: 'parcaId 1 veya daha buyuk olmalidir.' })
  parcaId: number;

  @ApiPropertyOptional({
    description:
      'Parcanin dusulecegi depo. Gonderilmezse sistemde kayitli tek depo kullanilir; ' +
      'birden fazla depo varsa bu alan zorunlu hale gelir.',
    example: 1,
  })
  @IsOptional()
  @IsInt({ message: 'depoId tam sayi olmalidir.' })
  @Min(1, { message: 'depoId 1 veya daha buyuk olmalidir.' })
  depoId?: number;

  @ApiPropertyOptional({
    description: 'Degistirilen parca adedi. Gonderilmezse 1 kabul edilir.',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt({ message: 'miktar tam sayi olmalidir.' })
  @Min(1, { message: 'miktar en az 1 olmalidir.' })
  miktar?: number;

  @ApiPropertyOptional({
    description: 'Bakim notu',
    example: 'Sol on motor titresim yaptigi icin degistirildi.',
  })
  @IsOptional()
  @IsString()
  aciklama?: string;
}
