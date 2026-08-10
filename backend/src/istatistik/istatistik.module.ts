import { Module } from '@nestjs/common';
import { ParcalarModule } from '../parcalar/parcalar.module';
import { IstatistikController } from './istatistik.controller';
import { IstatistikService } from './istatistik.service';

@Module({
  // Kritik stok hesabi ParcalarService uzerinden geliyor.
  imports: [ParcalarModule],
  controllers: [IstatistikController],
  providers: [IstatistikService],
})
export class IstatistikModule {}
