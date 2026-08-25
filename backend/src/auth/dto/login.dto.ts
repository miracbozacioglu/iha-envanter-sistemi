import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Kullanici e-posta adresi',
    example: 'admin@iha.com',
  })
  @IsEmail({}, { message: 'Gecerli bir e-posta adresi giriniz.' })
  @MaxLength(255, { message: 'E-posta en fazla 255 karakter olabilir.' })
  email: string;

  @ApiProperty({
    // Swagger dokumani /api adresinde acik duruyor. Buraya gercek bir
    // hesabin sifresini ornek diye yazmak, dokumana ulasan herkese o sifreyi
    // vermek demek — bilerek yer tutucu birakildi.
    description: 'Kullanici sifresi (en az 6, en fazla 72 karakter)',
    example: 'sifreniz',
    minLength: 6,
    maxLength: 72,
  })
  @IsString()
  @MinLength(6, { message: 'Sifre en az 6 karakter olmalidir.' })
  @MaxLength(72, { message: 'Sifre en fazla 72 karakter olabilir.' })
  sifre: string;
}
