import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
<<<<<<< HEAD
import { KullanicilarModule } from './kullanicilar/kullanicilar.module';
=======
import { IhaAraclariModule } from './iha-araclari/iha-araclari.module';
import { IhaModelleriModule } from './iha-modelleri/iha-modelleri.module';
import { KategorilerModule } from './kategoriler/kategoriler.module';
import { KullanicilarModule } from './kullanicilar/kullanicilar.module';
import { ParcalarModule } from './parcalar/parcalar.module';
>>>>>>> 85fc1ad10153bd07300a2abe9ed9894f4a2c1a6e
import { PrismaModule } from './prisma/prisma.module';
import { TedarikcilerModule } from './tedarikciler/tedarikciler.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    KullanicilarModule,
<<<<<<< HEAD
=======
    KategorilerModule,
    IhaModelleriModule,
    IhaAraclariModule,
    TedarikcilerModule,
    ParcalarModule,
>>>>>>> 85fc1ad10153bd07300a2abe9ed9894f4a2c1a6e
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
