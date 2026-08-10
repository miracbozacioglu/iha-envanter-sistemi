import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateSiparisDto {
  @ApiProperty({
    description:
      'Siparisin dayandigi talebin id si. Talep ONAYLANDI durumunda olmali ve baska siparisi bulunmamali.',
    example: 1,
  })
  @IsInt({ message: 'talepId tam sayi olmalidir.' })
  @Min(1, { message: 'talepId 1 veya daha buyuk olmalidir.' })
  talepId: number;

  @ApiProperty({
    description: 'Siparisin verildigi tedarikcinin id si',
    example: 1,
  })
  @IsInt({ message: 'tedarikciId tam sayi olmalidir.' })
  @Min(1, { message: 'tedarikciId 1 veya daha buyuk olmalidir.' })
  tedarikciId: number;

  @ApiProperty({
    description: 'Siparis edilen miktar',
    example: 5,
    minimum: 1,
  })
  @IsInt({ message: 'miktar tam sayi olmalidir.' })
  @Min(1, { message: 'miktar en az 1 olmalidir.' })
  miktar: number;

  @ApiPropertyOptional({
    description: 'Birim fiyat. En fazla 2 ondalik basamak.',
    example: 1250.5,
  })
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'birimFiyat en fazla 2 ondalik basamakli bir sayi olmalidir.' },
  )
  @Min(0, { message: 'birimFiyat negatif olamaz.' })
  birimFiyat?: number;
}
