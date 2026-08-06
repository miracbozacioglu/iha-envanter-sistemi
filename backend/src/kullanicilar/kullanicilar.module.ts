import { Module } from '@nestjs/common';
import { KullanicilarController } from './kullanicilar.controller';
import { KullanicilarService } from './kullanicilar.service';

@Module({
  controllers: [KullanicilarController],
  providers: [KullanicilarService],
  exports: [KullanicilarService],
})
export class KullanicilarModule {}
