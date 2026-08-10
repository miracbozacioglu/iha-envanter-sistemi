import { Module } from '@nestjs/common';
import { StokModule } from '../stok/stok.module';
import { BakimController } from './bakim.controller';
import { BakimService } from './bakim.service';

@Module({
  // Parca degisimindeki stok dusumu ve depo cozumu StokService uzerinden geliyor.
  imports: [StokModule],
  controllers: [BakimController],
  providers: [BakimService],
  exports: [BakimService],
})
export class BakimModule {}
