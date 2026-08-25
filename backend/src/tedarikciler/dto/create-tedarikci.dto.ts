import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateTedarikciDto {
  @ApiProperty({
    description: 'Tedarikci adi (benzersiz olmali)',
    example: 'Baykar Teknoloji',
  })
  @IsString()
  @IsNotEmpty({ message: 'Tedarikci adi bos birakilamaz.' })
  @MaxLength(150, { message: 'Tedarikci adi en fazla 150 karakter olabilir.' })
  ad: string;

  @ApiPropertyOptional({ description: 'Telefon', example: '+90 212 000 00 00' })
  @IsOptional()
  @IsString()
  @MaxLength(30, { message: 'Telefon en fazla 30 karakter olabilir.' })
  telefon?: string;

  @ApiPropertyOptional({
    description: 'E-posta adresi',
    example: 'satis@baykar.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Gecerli bir e-posta adresi giriniz.' })
  @MaxLength(255, { message: 'E-posta en fazla 255 karakter olabilir.' })
  email?: string;
}
