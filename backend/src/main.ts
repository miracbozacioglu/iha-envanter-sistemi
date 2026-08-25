import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS bir BEYAZ LISTEDIR. CORS_ORIGIN virgulle ayrilmis kaynak listesi
  // bekler; bos/whitespace girdiler ayiklanir. '*' bilerek desteklenmiyor:
  // tanimlanirsa asagidaki kontrol acilisi durdurur, sessizce her yere
  // acilmis bir API ile calismayalim.
  const izinliKaynaklar = (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((kaynak) => kaynak.trim())
    .filter(Boolean);

  if (izinliKaynaklar.includes('*')) {
    throw new Error(
      "CORS_ORIGIN '*' olamaz. Izin verilecek kaynaklari tek tek listeleyin.",
    );
  }

  app.enableCors({
    origin:
      izinliKaynaklar.length > 0
        ? izinliKaynaklar
        : ['http://localhost:5174', 'http://127.0.0.1:5174'],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      // DTO'da tanimsiz alanlari kirp...
      whitelist: true,
      // ...ve sessizce yutmak yerine 400 ile reddet. Boylece istemci
      // "aktif", "rol" gibi beklenmeyen alanlari gonderdiginde fark ederiz.
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('İHA Envanter API')
    .setDescription(
      'İHA bakım ve parça envanteri yönetim sistemi REST API dokümantasyonu. ' +
        'Korumalı uç noktalar için önce POST /auth/login ile token alın, ' +
        'ardından sağ üstteki Authorize düğmesinden girin.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
