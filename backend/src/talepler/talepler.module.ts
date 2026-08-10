import { Module } from '@nestjs/common';
import { TaleplerController } from './talepler.controller';
import { TaleplerService } from './talepler.service';

@Module({
  controllers: [TaleplerController],
  providers: [TaleplerService],
  exports: [TaleplerService],
})
export class TaleplerModule {}
