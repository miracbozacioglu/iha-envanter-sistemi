import { Module } from '@nestjs/common';
import { IhaModelleriController } from './iha-modelleri.controller';
import { IhaModelleriService } from './iha-modelleri.service';

@Module({
  controllers: [IhaModelleriController],
  providers: [IhaModelleriService],
  exports: [IhaModelleriService],
})
export class IhaModelleriModule {}
