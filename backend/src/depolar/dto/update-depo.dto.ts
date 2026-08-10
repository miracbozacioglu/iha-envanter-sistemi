import { PartialType } from '@nestjs/swagger';
import { CreateDepoDto } from './create-depo.dto';

export class UpdateDepoDto extends PartialType(CreateDepoDto) {}
