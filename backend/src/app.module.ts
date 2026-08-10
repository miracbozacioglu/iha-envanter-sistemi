import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BakimModule } from './bakim/bakim.module';
import { DepolarModule } from './depolar/depolar.module';
import { IhaAraclariModule } from './iha-araclari/iha-araclari.module';
import { IhaModelleriModule } from './iha-modelleri/iha-modelleri.module';
import { IstatistikModule } from './istatistik/istatistik.module';
import { KategorilerModule } from './kategoriler/kategoriler.module';
import { KullanicilarModule } from './kullanicilar/kullanicilar.module';
import { ParcalarModule } from './parcalar/parcalar.module';
import { PrismaModule } from './prisma/prisma.module';
import { SiparislerModule } from './siparisler/siparisler.module';
import { StokModule } from './stok/stok.module';
import { TaleplerModule } from './talepler/talepler.module';
import { TedarikcilerModule } from './tedarikciler/tedarikciler.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    KullanicilarModule,
    KategorilerModule,
    IhaModelleriModule,
    IhaAraclariModule,
    TedarikcilerModule,
    DepolarModule,
    ParcalarModule,
    StokModule,
    TaleplerModule,
    SiparislerModule,
    BakimModule,
    IstatistikModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
