import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '../generated/prisma/client';
import { Rol } from '../generated/prisma/enums';

const SALT_ROUNDS = 10;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL tanimli degil. backend/.env dosyasini kontrol edin.',
  );
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const yonetici = await prisma.kullanici.upsert({
    where: { email: 'admin@iha.com' },
    update: {},
    create: {
      ad: 'Sistem',
      soyad: 'Yonetici',
      email: 'admin@iha.com',
      sifreHash: await bcrypt.hash('Admin123!', SALT_ROUNDS),
      rol: Rol.YONETICI,
      unvan: 'Depo Sorumlusu',
      aktif: true,
    },
    omit: { sifreHash: true },
  });

  const teknisyen = await prisma.kullanici.upsert({
    where: { email: 'teknisyen@iha.com' },
    update: {},
    create: {
      ad: 'Ahmet',
      soyad: 'Teknisyen',
      email: 'teknisyen@iha.com',
      sifreHash: await bcrypt.hash('Teknisyen123!', SALT_ROUNDS),
      rol: Rol.TEKNISYEN,
      unvan: 'Bakim Teknisyeni',
      aktif: true,
    },
    omit: { sifreHash: true },
  });

  // Depo'da unique alan yok; tekrar calistirildiginda cogalmamasi icin once bakiyoruz.
  const mevcutDepo = await prisma.depo.findFirst({ where: { ad: 'Ana Depo' } });

  const anaDepo =
    mevcutDepo ??
    (await prisma.depo.create({
      data: { ad: 'Ana Depo', lokasyon: 'Merkez' },
    }));

  console.log('Seed tamamlandi.');
  console.log('Yonetici:', yonetici);
  console.log('Teknisyen:', teknisyen);
  console.log(
    `Ana Depo (${mevcutDepo ? 'zaten vardi' : 'olusturuldu'}):`,
    anaDepo,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Seed hatasi:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
