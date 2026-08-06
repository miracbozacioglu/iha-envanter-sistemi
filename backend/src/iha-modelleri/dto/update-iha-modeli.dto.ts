import { PartialType } from '@nestjs/swagger';
import { CreateIhaModeliDto } from './create-iha-modeli.dto';

export class UpdateIhaModeliDto extends PartialType(CreateIhaModeliDto) {}
