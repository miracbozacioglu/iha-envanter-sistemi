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

/**
 * Seed sifreleri ortam degiskeninden gelir. Kaynak koda gomulu bir yonetici
 * sifresi, depoyu goren herkesin uretim veritabanina girebilmesi demektir.
 * Degisken tanimsizsa seed calismaz — sessizce bilinen bir sifre atamaktansa
 * durup uyarmasi tercih edildi.
 */
function sifreOku(degisken: string): string {
  const deger = process.env[degisken];

  if (!deger || deger.length < 8) {
    throw new Error(
      `${degisken} tanimli degil veya 8 karakterden kisa. ` +
        'Seed calistirmadan once backend/.env dosyasina ekleyin.',
    );
  }

  return deger;
}

const YONETICI_SIFRE = sifreOku('SEED_YONETICI_SIFRE');
const TEKNISYEN_SIFRE = sifreOku('SEED_TEKNISYEN_SIFRE');

async function main() {
  const yonetici = await prisma.kullanici.upsert({
    where: { email: 'admin@iha.com' },
    update: {},
    create: {
      ad: 'Sistem',
      soyad: 'Yonetici',
      email: 'admin@iha.com',
      sifreHash: await bcrypt.hash(YONETICI_SIFRE, SALT_ROUNDS),
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
      sifreHash: await bcrypt.hash(TEKNISYEN_SIFRE, SALT_ROUNDS),
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
  .catch(async (e: unknown) => {
    // Ham hata nesnesi stack trace ve baglanti dizesi sizdirabilir; sadece mesaj.
    console.error('Seed hatasi:', e instanceof Error ? e.message : e);
    await prisma.$disconnect();
    process.exit(1);
  });
