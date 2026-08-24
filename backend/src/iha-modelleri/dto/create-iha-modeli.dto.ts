import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateIhaModeliDto {
  @ApiProperty({ description: 'Model adi', example: 'Bayraktar TB2' })
  @IsString()
  @IsNotEmpty({ message: 'Model adi bos birakilamaz.' })
  @MaxLength(100, { message: 'Model adi en fazla 100 karakter olabilir.' })
  ad: string;

  @ApiProperty({ description: 'Uretici firma', example: 'Baykar' })
  @IsString()
  @IsNotEmpty({ message: 'Uretici bos birakilamaz.' })
  @MaxLength(100, { message: 'Uretici en fazla 100 karakter olabilir.' })
  uretici: string;

  @ApiPropertyOptional({
    description: 'Aciklama',
    example: 'Taktik sinifi insansiz hava araci',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Aciklama en fazla 500 karakter olabilir.' })
  aciklama?: string;
}
