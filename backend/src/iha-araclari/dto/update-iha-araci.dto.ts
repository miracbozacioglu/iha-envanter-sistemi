import { PartialType } from '@nestjs/swagger';
import { CreateIhaAraciDto } from './create-iha-araci.dto';

export class UpdateIhaAraciDto extends PartialType(CreateIhaAraciDto) {}
