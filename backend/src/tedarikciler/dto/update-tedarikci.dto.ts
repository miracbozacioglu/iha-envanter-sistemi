import { PartialType } from '@nestjs/swagger';
import { CreateTedarikciDto } from './create-tedarikci.dto';

export class UpdateTedarikciDto extends PartialType(CreateTedarikciDto) {}
