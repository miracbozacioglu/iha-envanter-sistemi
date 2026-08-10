import { Module } from '@nestjs/common';
import { SiparislerController } from './siparisler.controller';
import { SiparislerService } from './siparisler.service';

@Module({
  controllers: [SiparislerController],
  providers: [SiparislerService],
  exports: [SiparislerService],
})
export class SiparislerModule {}
