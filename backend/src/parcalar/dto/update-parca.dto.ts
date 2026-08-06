import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateParcaDto } from './create-parca.dto';

export class UpdateParcaDto extends PartialType(CreateParcaDto) {
  @ApiPropertyOptional({
    description: 'Parca arizali olarak isaretlensin mi',
    example: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'arizali true veya false olmalidir.' })
  arizali?: boolean;
}
