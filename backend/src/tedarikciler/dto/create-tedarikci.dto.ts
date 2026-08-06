import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTedarikciDto {
  @ApiProperty({
    description: 'Tedarikci adi (benzersiz olmali)',
    example: 'Baykar Teknoloji',
  })
  @IsString()
  @IsNotEmpty({ message: 'Tedarikci adi bos birakilamaz.' })
  ad: string;

  @ApiPropertyOptional({ description: 'Telefon', example: '+90 212 000 00 00' })
  @IsOptional()
  @IsString()
  telefon?: string;

  @ApiPropertyOptional({
    description: 'E-posta adresi',
    example: 'satis@baykar.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Gecerli bir e-posta adresi giriniz.' })
  email?: string;
}
