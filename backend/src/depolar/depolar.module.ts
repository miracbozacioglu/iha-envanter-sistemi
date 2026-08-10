import { Module } from '@nestjs/common';
import { DepolarController } from './depolar.controller';
import { DepolarService } from './depolar.service';

@Module({
  controllers: [DepolarController],
  providers: [DepolarService],
  exports: [DepolarService],
})
export class DepolarModule {}
