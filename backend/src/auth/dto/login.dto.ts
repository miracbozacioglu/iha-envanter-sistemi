import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Kullanici e-posta adresi',
    example: 'admin@iha.com',
  })
  @IsEmail({}, { message: 'Gecerli bir e-posta adresi giriniz.' })
  email: string;

  @ApiProperty({
    description: 'Kullanici sifresi (en az 6 karakter)',
    example: 'Admin123!',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: 'Sifre en az 6 karakter olmalidir.' })
  sifre: string;
}
