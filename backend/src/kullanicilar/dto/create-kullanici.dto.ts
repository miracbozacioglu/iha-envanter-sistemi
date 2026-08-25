import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Rol } from '../../../generated/prisma/enums';

export class CreateKullaniciDto {
  @ApiProperty({ description: 'Ad', example: 'Ayse' })
  @IsString()
  @IsNotEmpty({ message: 'Ad bos birakilamaz.' })
  @MaxLength(60, { message: 'Ad en fazla 60 karakter olabilir.' })
  ad: string;

  @ApiProperty({ description: 'Soyad', example: 'Yilmaz' })
  @IsString()
  @IsNotEmpty({ message: 'Soyad bos birakilamaz.' })
  @MaxLength(60, { message: 'Soyad en fazla 60 karakter olabilir.' })
  soyad: string;

  @ApiProperty({
    description: 'E-posta adresi (benzersiz olmali)',
    example: 'ayse.yilmaz@iha.com',
  })
  @IsEmail({}, { message: 'Gecerli bir e-posta adresi giriniz.' })
  @MaxLength(255, { message: 'E-posta en fazla 255 karakter olabilir.' })
  email: string;

  @ApiProperty({
    description:
      'Sifre (en az 6 karakter). Veritabanina bcrypt ile hash lenerek yazilir.',
    example: 'Gecici123!',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: 'Sifre en az 6 karakter olmalidir.' })
  @MaxLength(72, {
    message: 'Sifre en fazla 72 karakter olabilir (bcrypt siniri).',
  })
  sifre: string;

  @ApiPropertyOptional({
    description: 'Kullanici rolu. Gonderilmezse TEKNISYEN atanir.',
    enum: Rol,
    example: Rol.TEKNISYEN,
  })
  @IsOptional()
  @IsEnum(Rol, { message: 'Rol yalnizca TEKNISYEN veya YONETICI olabilir.' })
  rol?: Rol;

  @ApiPropertyOptional({ description: 'Unvan', example: 'Bakim Teknisyeni' })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Unvan en fazla 100 karakter olabilir.' })
  unvan?: string;
}
