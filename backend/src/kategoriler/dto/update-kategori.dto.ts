import { PartialType } from '@nestjs/swagger';
import { CreateKategoriDto } from './create-kategori.dto';

export class UpdateKategoriDto extends PartialType(CreateKategoriDto) {}
