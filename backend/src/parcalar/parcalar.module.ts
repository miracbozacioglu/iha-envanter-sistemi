import { Module } from '@nestjs/common';
import { ParcalarController } from './parcalar.controller';
import { ParcalarService } from './parcalar.service';

@Module({
  controllers: [ParcalarController],
  providers: [ParcalarService],
  exports: [ParcalarService],
})
export class ParcalarModule {}
