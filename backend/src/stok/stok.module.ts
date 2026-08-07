import { Module } from '@nestjs/common';
import { StokController } from './stok.controller';
import { StokService } from './stok.service';

@Module({
  controllers: [StokController],
  providers: [StokService],
  exports: [StokService],
})
export class StokModule {}
