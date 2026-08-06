import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UyumlulukEkleDto {
  @ApiProperty({
    description: 'Parcanin uyumlu oldugu IHA modelinin id si',
    example: 2,
  })
  @IsInt({ message: 'ihaModeliId tam sayi olmalidir.' })
  @Min(1, { message: 'ihaModeliId 1 veya daha buyuk olmalidir.' })
  ihaModeliId: number;
}
