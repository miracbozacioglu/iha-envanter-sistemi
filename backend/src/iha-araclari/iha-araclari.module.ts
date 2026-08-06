import { Module } from '@nestjs/common';
import { IhaAraclariController } from './iha-araclari.controller';
import { IhaAraclariService } from './iha-araclari.service';

@Module({
  controllers: [IhaAraclariController],
  providers: [IhaAraclariService],
  exports: [IhaAraclariService],
})
export class IhaAraclariModule {}
