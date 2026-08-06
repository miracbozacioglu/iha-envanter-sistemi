import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateIhaModeliDto {
  @ApiProperty({ description: 'Model adi', example: 'Bayraktar TB2' })
  @IsString()
  @IsNotEmpty({ message: 'Model adi bos birakilamaz.' })
  ad: string;

  @ApiProperty({ description: 'Uretici firma', example: 'Baykar' })
  @IsString()
  @IsNotEmpty({ message: 'Uretici bos birakilamaz.' })
  uretici: string;

  @ApiPropertyOptional({
    description: 'Aciklama',
    example: 'Taktik sinifi insansiz hava araci',
  })
  @IsOptional()
  @IsString()
  aciklama?: string;
}
