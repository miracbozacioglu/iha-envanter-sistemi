import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { TalepDurumu } from '../../../generated/prisma/enums';

export class TalepSorguDto {
  @ApiPropertyOptional({
    description: 'Sadece bu durumdaki talepleri getir',
    enum: TalepDurumu,
    example: TalepDurumu.BEKLIYOR,
  })
  @IsOptional()
  @IsEnum(TalepDurumu, {
    message:
      'durum BEKLIYOR, ONAYLANDI, REDDEDILDI, SIPARIS_VERILDI veya TESLIM_ALINDI olmalidir.',
  })
  durum?: TalepDurumu;
}
