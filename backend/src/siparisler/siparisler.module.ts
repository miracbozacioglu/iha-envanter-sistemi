import { Module } from '@nestjs/common';
import { StokModule } from '../stok/stok.module';
import { SiparislerController } from './siparisler.controller';
import { SiparislerService } from './siparisler.service';

@Module({
  // Depo cozumu StokService uzerinden geliyor.
  imports: [StokModule],
  controllers: [SiparislerController],
  providers: [SiparislerService],
  exports: [SiparislerService],
})
export class SiparislerModule {}
