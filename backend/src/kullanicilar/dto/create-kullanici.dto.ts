import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Rol } from '../../../generated/prisma/enums';

export class CreateKullaniciDto {
  @ApiProperty({ description: 'Ad', example: 'Ayse' })
  @IsString()
  @IsNotEmpty({ message: 'Ad bos birakilamaz.' })
  ad: string;

  @ApiProperty({ description: 'Soyad', example: 'Yilmaz' })
  @IsString()
  @IsNotEmpty({ message: 'Soyad bos birakilamaz.' })
  soyad: string;

  @ApiProperty({
    description: 'E-posta adresi (benzersiz olmali)',
    example: 'ayse.yilmaz@iha.com',
  })
  @IsEmail({}, { message: 'Gecerli bir e-posta adresi giriniz.' })
  email: string;

  @ApiProperty({
    description:
      'Sifre (en az 6 karakter). Veritabanina bcrypt ile hash lenerek yazilir.',
    example: 'Gecici123!',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: 'Sifre en az 6 karakter olmalidir.' })
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
  unvan?: string;
}
