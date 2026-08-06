import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';
import { CreateKullaniciDto } from './create-kullanici.dto';

/**
 * sifre alanini CreateKullaniciDto'dan cikarip burada yeniden tanimliyoruz:
 * guncellemede sifre opsiyonel ve gonderilirse yeniden hash'lenir.
 */
export class UpdateKullaniciDto extends PartialType(
  OmitType(CreateKullaniciDto, ['sifre'] as const),
) {
  @ApiPropertyOptional({
    description:
      'Yeni sifre (en az 6 karakter). Gonderilmezse mevcut sifre korunur.',
    example: 'YeniSifre123!',
    minLength: 6,
  })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Sifre en az 6 karakter olmalidir.' })
  sifre?: string;

  @ApiPropertyOptional({
    description: 'Hesap aktif mi. Pasife almak icin false gonderin.',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  aktif?: boolean;
}
