import { Module } from '@nestjs/common';
import { KategorilerController } from './kategoriler.controller';
import { KategorilerService } from './kategoriler.service';

@Module({
  controllers: [KategorilerController],
  providers: [KategorilerService],
  exports: [KategorilerService],
})
export class KategorilerModule {}
