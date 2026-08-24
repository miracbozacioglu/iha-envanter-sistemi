# İHA Envanter Sistemi

İnsansız hava aracı (İHA) filoları için parça, stok ve bakım envanteri yönetim
sistemi. Teknisyenler sahadaki araçlara taktıkları/tamir ettikleri parçaları
kaydeder ve eksik parça için talep açar; yöneticiler bu talepleri onaylar,
tedarikçiye sipariş verir, teslim alınan malı stoğa işler ve depo mevcudunu
yönetir. Sistemin çözdüğü asıl problem, "hangi parçadan kaç adet var",
"bu parça hangi araca takıldı" ve "talep hangi aşamada" sorularının birbirinden
kopuk Excel dosyalarında takip edilmesidir: envanter miktarı, stok hareket
geçmişi ve araç bakım kayıtları tek veritabanında, birbirini doğrulayacak
şekilde tutulur.

- **Backend:** NestJS 11 + Prisma 7 + PostgreSQL (Supabase veya yerel)
- **Frontend:** Vite + React 19 + TypeScript
- **Dağıtım:** Docker + Docker Compose (backend imajı + nginx ile statik frontend)
- **API dokümantasyonu:** Swagger UI — backend çalışırken `http://localhost:3000/api`

---

## 1. Özellikler

### Tanım ve katalog yönetimi
- **Parça yönetimi:** benzersiz parça kodu, ad, açıklama, birim, kritik stok
  seviyesi, arızalı işareti; kod/ad üzerinde arama, kategori ve İHA modeline
  göre filtreleme, sayfalama (`GET /parcalar?search=&kategoriId=&ihaModeliId=&page=&limit=`).
- **Kategori yönetimi:** parçaların gruplandığı benzersiz adlı kategoriler.
- **İHA modeli yönetimi:** model adı + üretici; her modele uyumlu parçalar
  `ParcaUyumluluk` üzerinden çoktan-çoğa bağlanır.
- **Parça–model uyumluluğu:** bir parçanın hangi İHA modellerine takılabileceği
  tek tek eklenip kaldırılabilir (`POST /parcalar/:id/uyumluluk`,
  `DELETE /parcalar/:id/uyumluluk/:ihaModeliId`).
- **Araç yönetimi:** benzersiz kuyruk numarasıyla fiziksel araç kaydı, bağlı
  olduğu model ve durum bilgisi (varsayılan `AKTIF`).
- **Tedarikçi ve depo yönetimi:** siparişlerin verildiği tedarikçiler ve stoğun
  tutulduğu depolar.

### Stok
- **Stok girişi / çıkışı:** parça + depo bazında miktar artırma/azaltma
  (`POST /stok/giris`, `POST /stok/cikis`), isteğe bağlı raf kodu ve açıklama.
- **Hareket geçmişi:** her giriş/çıkış `StokHareketi` olarak kim tarafından, ne
  zaman, hangi açıklamayla yapıldığı bilgisiyle saklanır; parça, depo ve hareket
  tipine göre filtrelenip sayfalanır (`GET /stok/hareketler`).
- **Negatif stok koruması:** çıkış, mevcut miktarı aşamaz; eşzamanlı çıkışlarda
  koşullu güncelleme sayesinde stok eksiye düşmez, çakışma 409 ile bildirilir.
- **Kritik stok uyarısı:** toplam stoğu kendi `kritikSeviye` değerinin altına
  düşen parçalar ayrı uçtan listelenir (`GET /parcalar/kritik`).

### Talep → onay → sipariş → teslim akışı
- **Talep açma:** teknisyen parça ve miktar belirterek talep açar; talep
  `BEKLIYOR` durumunda başlar.
- **Onay / red:** yönetici bekleyen talebi onaylar (`ONAYLANDI`) veya zorunlu
  red sebebiyle reddeder (`REDDEDILDI`). Sadece `BEKLIYOR` durumundaki talepler
  bu geçişi yapabilir.
- **Sipariş:** yalnızca onaylanmış talepten, tedarikçi ve birim fiyatla sipariş
  açılır; talep `SIPARIS_VERILDI` olur. Bir talepten yalnızca bir sipariş
  açılabilir (`talepId` benzersiz).
- **Teslim alma:** sipariş teslim alındığında sipariş kapanır, miktar stoğa
  eklenir, `GIRIS` hareketi yazılır ve talep `TESLIM_ALINDI` durumuna geçer —
  dördü de tek transaction içinde.
- **Görünürlük kısıtı:** teknisyen yalnızca kendi taleplerini görür; bu kısıt
  istemciden gelen parametreye değil, token'daki role bağlıdır.

### Araç bakımı
- **Parça değiştirme (`DEGISTIRILDI`):** araca yeni parça takılır; parça
  stoktan düşülür, `CIKIS` hareketi ve bakım kaydı aynı transaction içinde yazılır.
- **Yerinde tamir (`TAMIR_EDILDI`):** parça sökülüp değiştirilmediği için stoğa
  dokunulmaz, yalnızca bakım kaydı yazılır.
- **Bakım geçmişi:** tüm kayıtlar araç ve tipe göre filtrelenip sayfalanır;
  tek bir aracın geçmişi ayrı uçtan alınır (`GET /bakim/arac/:ihaAraciId`).

### Kimlik doğrulama ve yetkilendirme
- **JWT tabanlı oturum:** `POST /auth/login` ile token alınır, korumalı uçlara
  `Authorization: Bearer <token>` başlığıyla erişilir. Şifreler bcrypt ile
  hash'lenir; pasif hesaplar giriş yapamaz.
- **Rol bazlı yetki:** `TEKNISYEN` ve `YONETICI` rolleri; yetki hem backend'de
  `RolesGuard` ile hem frontend'de `ProtectedRoute` ile uygulanır.
- **Kullanıcı yönetimi:** yönetici hesap açar, günceller, pasife alır. Kalıcı
  silme yalnızca ilişkili kaydı olmayan kullanıcılar için mümkündür.

### Dashboard ve istatistik
- Toplam parça / araç / kategori sayısı, bekleyen talep sayısı, kritik stok
  sayısı, son 5 stok hareketi, kritik seviyedeki 5 parça ve talep durum dağılımı
  tek uçtan gelir (`GET /istatistik/ozet`); frontend bunu Recharts grafikleriyle
  gösterir.
- Açık/koyu tema desteği; tema tercihi ilk boyamadan önce uygulanır.

---

## 2. Teknoloji Yığını

### Backend (`backend/package.json`)

| Paket | Sürüm | Kullanım |
|---|---|---|
| `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express` | ^11.0.1 | Uygulama çatısı, modül/DI sistemi |
| `@nestjs/config` | ^4.0.4 | `.env` tabanlı yapılandırma (global `ConfigModule`) |
| `@nestjs/swagger` | ^11.4.6 | `/api` altında OpenAPI dokümantasyonu |
| `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt` | 11.x / 0.7 / 4.0 | JWT üretimi ve Bearer token doğrulama |
| `bcrypt` | ^6.0.0 | Şifre hash'leme (10 tur salt) |
| `@prisma/client`, `prisma` | ^7.9.1 | ORM, migration ve tip üretimi |
| `@prisma/adapter-pg`, `pg` | ^7.9.1 / ^8.22.0 | PostgreSQL driver adapter (Prisma 7 driver adapters) |
| `class-validator`, `class-transformer` | ^0.15.1 / ^0.5.1 | DTO doğrulama ve dönüşüm |
| `dotenv` | ^17.4.2 | `main.ts` ve `seed.ts` içinde erken `.env` yüklemesi |
| `jest`, `supertest` (dev) | ^30 / ^7 | Birim ve e2e test altyapısı |

**Veritabanı:** PostgreSQL. Bağlantı `DATABASE_URL` üzerinden `PrismaPg`
adapter'ı ile kurulur; migration'lar ayrı bir `DIRECT_URL` kullanır.

### Frontend (`frontend/package.json`)

| Paket | Sürüm | Kullanım |
|---|---|---|
| `react`, `react-dom` | ^19.2.8 | UI kütüphanesi |
| `vite`, `@vitejs/plugin-react` | ^8.2.0 / ^6.0.4 | Geliştirme sunucusu ve derleme |
| `typescript` | ~6.0.2 | Tip sistemi (`tsc -b` derlemede zorunlu) |
| `react-router-dom` | ^7.18.2 | Sayfa yönlendirme, korumalı rotalar |
| `@tanstack/react-query` | ^5.101.4 | Sunucu durumu, önbellek, mutasyonlar |
| `react-hook-form`, `@hookform/resolvers`, `zod` | ^7.85 / ^5.7 / ^4.4 | Form yönetimi ve şema doğrulama |
| `axios` | ^1.19.0 | HTTP istemcisi; token ekleme ve 401 yakalama interceptor'ları |
| `tailwindcss`, `@tailwindcss/vite` | ^4.3.3 | Tailwind CSS v4 (Vite eklentisi ile; ayrı PostCSS yapılandırması yok) |
| `recharts` | ^3.10.1 | Dashboard grafikleri |
| `lucide-react` | ^1.31.0 | İkon seti |

---

## 3. Mimari

### Monorepo yapısı

```
iha-envanter/
├── backend/            # NestJS API
│   ├── prisma/         # schema.prisma, migrations/, seed.ts
│   ├── src/            # modüller (her biri controller + service + dto)
│   ├── generated/      # Prisma'nın ürettiği istemci (git'e girmez)
│   ├── prisma.config.ts
│   └── Dockerfile
├── frontend/           # Vite + React SPA
│   ├── src/            # pages/, components/, hooks/, lib/, context/, types/
│   ├── nginx.conf      # üretimde SPA fallback + güvenlik başlıkları
│   └── Dockerfile
├── docker-compose.yml  # backend + frontend servisleri
└── .env.example        # YALNIZCA docker-compose değişkenleri
```

İki uygulama bağımsız `package.json` dosyalarına sahiptir; kökte bir workspace
tanımı **yoktur**, bağımlılıklar her klasörde ayrı ayrı kurulur.

### Katmanlı backend

Her özellik kendi NestJS modülüdür (`auth`, `kullanicilar`, `kategoriler`,
`iha-modelleri`, `iha-araclari`, `tedarikciler`, `depolar`, `parcalar`, `stok`,
`talepler`, `siparisler`, `bakim`, `istatistik`) ve hepsi aynı akışı izler:

```
HTTP isteği
   ↓
Controller    → yönlendirme, ValidationPipe ile DTO doğrulama,
                JwtAuthGuard + RolesGuard ile yetki, Swagger açıklamaları
   ↓
Service       → iş kuralları, durum geçişleri, transaction sınırları
   ↓
PrismaService → tek merkezden yönetilen Prisma istemcisi (PrismaPg adapter)
   ↓
PostgreSQL
```

Kesişen sorumluluklar `src/common/` altında toplanır: `JwtAuthGuard`,
`RolesGuard`, `@Roles()` ve `@CurrentUser()` dekoratörleri, `AuthUser` tipi ve
Prisma hatalarını HTTP hatasına çeviren yardımcı. `ValidationPipe` global olarak
`whitelist` + `forbidNonWhitelisted` ile çalışır: DTO'da tanımlı olmayan alanlar
sessizce kırpılmaz, 400 ile reddedilir.

Frontend tarafında da aynı ayrım vardır: [`lib/api.ts`](frontend/src/lib/api.ts)
tek axios örneğini ve hata mesajı çeviricilerini barındırır, `hooks/` altındaki
hook'lar React Query sorgularını kapsüller, `pages/` yalnızca görünümü kurar.

### Veri modeli özeti

**Tanım tabloları**

| Model | Açıklama |
|---|---|
| `Kategori` | Parçaların gruplandığı benzersiz adlı sınıflandırma. |
| `IhaModeli` | Bir İHA **tipi** (ad + üretici); fiziksel bir araç değildir. |
| `IhaAraci` | Kuyruk numarasıyla tanımlı **tekil fiziksel araç**; bir modele bağlıdır. |
| `Parca` | Envanterdeki parça tanımı: kod, ad, birim, kritik seviye, arızalı işareti. |
| `ParcaUyumluluk` | Parça ile İHA modeli arasındaki çoktan-çoğa bağ (bileşik birincil anahtar). |
| `Tedarikci` | Siparişlerin verildiği firma. |
| `Depo` | Stoğun fiziksel olarak tutulduğu lokasyon. |

**Stok tabloları**

| Model | Açıklama |
|---|---|
| `StokKalem` | Bir parçanın bir depodaki **anlık miktarı** ve raf kodu; `(parcaId, depoId)` benzersizdir. |
| `StokHareketi` | Miktarı değiştiren her `GIRIS`/`CIKIS` olayının kim–ne zaman–neden kaydı. |

**Akış tabloları**

| Model | Açıklama |
|---|---|
| `ParcaTalebi` | Teknisyenin parça talebi; `BEKLIYOR → ONAYLANDI/REDDEDILDI → SIPARIS_VERILDI → TESLIM_ALINDI` durumlarını taşır. |
| `Siparis` | Onaylanmış bir talebe karşılık tedarikçiye verilen sipariş; talep başına en fazla bir tane. |
| `BakimKaydi` | Bir araçta bir parçanın değiştirilmesi (`DEGISTIRILDI`) veya yerinde tamiri (`TAMIR_EDILDI`). |
| `Kullanici` | `TEKNISYEN` veya `YONETICI` rolündeki hesap; şifre `sifreHash` alanında bcrypt ile saklanır. |

```mermaid
erDiagram
    Kategori     ||--o{ Parca          : icerir
    IhaModeli    ||--o{ IhaAraci       : tipi
    Parca        ||--o{ ParcaUyumluluk : uyumlu
    IhaModeli    ||--o{ ParcaUyumluluk : uyumlu
    Parca        ||--o{ StokKalem      : stok
    Depo         ||--o{ StokKalem      : tutar
    Parca        ||--o{ StokHareketi   : hareket
    Depo         ||--o{ StokHareketi   : hareket
    Kullanici    ||--o{ StokHareketi   : yapar
    Parca        ||--o{ ParcaTalebi    : talep
    Kullanici    ||--o{ ParcaTalebi    : acar
    ParcaTalebi  ||--o| Siparis        : dogurur
    Tedarikci    ||--o{ Siparis        : karsilar
    IhaAraci     ||--o{ BakimKaydi     : gecmis
    Parca        ||--o{ BakimKaydi     : kullanilir
    Kullanici    ||--o{ BakimKaydi     : yapar
```

### Kritik tasarım kararı 1 — `StokKalem` + `StokHareketi` her zaman tek transaction

Stok iki tabloda birden yaşar: `StokKalem` **şimdiki durumu** (miktar),
`StokHareketi` ise **nasıl buraya gelindiğini** (geçmiş) tutar. Bu ikisi
ayrışırsa envanter güvenilirliğini tamamen kaybeder: miktar 8 görünürken
hareket geçmişinin toplamı 10 çıkarsa hangisinin doğru olduğu bilinemez.

Bu yüzden miktarı değiştiren **her** işlem `prisma.$transaction` içinde, kalem
güncellemesi ve hareket kaydı birlikte yazılacak şekilde yapılır
([`stok.service.ts`](backend/src/stok/stok.service.ts)):

- `POST /stok/giris` → `stokKalem.upsert` + `stokHareketi.create`
- `POST /stok/cikis` → koşullu `stokKalem.updateMany` + `stokHareketi.create`
- `POST /bakim/degistir` → aynı düşüm + `CIKIS` hareketi + `BakimKaydi`
- `PATCH /siparisler/:id/teslim-al` → sipariş kapanışı + stok artışı + `GIRIS`
  hareketi + talep durumu güncellemesi

İkinci fayda eşzamanlılıktadır. Düşüm, önce okunup sonra geri yazılan bir
değerle değil, `miktar >= istenen` koşulunu **güncellemenin içinde** taşıyan
`updateMany` ile yapılır; artışlar da `increment` ile veritabanında hesaplanır.
Böylece iki istek aynı anda geldiğinde ne kayıp güncelleme olur ne de stok
eksiye düşer — koşulu tutturamayan istek 409 alır. "Yetersiz stok" kuralı tek
bir yerde (`StokService.stoktanDus`) durduğu için serbest stok çıkışı ile bakım
kaynaklı çıkış aynı kurala tabidir; `BakimService` bu metodu kendi
transaction'ına bağlayarak çağırır.

### Kritik tasarım kararı 2 — `IhaModeli` (tip) ile `IhaAraci` (fiziksel araç) ayrımı

`IhaModeli` bir **model tipidir** ("Bayraktar TB2"), `IhaAraci` ise o tipten
üretilmiş **tekil bir kuyruk numarasıdır** ("TB2-001"). Tek bir tabloyla da
çalışılabilirdi; ayrıştırmak iki şeyi mümkün kılar:

1. **Uyumluluk model seviyesinde tanımlanır, bakım araç seviyesinde tutulur.**
   Bir parçanın hangi İHA'lara takılabileceği tipin özelliğidir; bu yüzden
   `ParcaUyumluluk` `IhaModeli`'ne bağlıdır ve model başına bir kez tanımlanır.
   Buna karşılık "bu motor hangi kuyruk numarasına takıldı" sorusu ancak fiziksel
   araç kaydı varsa cevaplanabilir; `BakimKaydi` bu yüzden `IhaAraci`'na bağlıdır.
2. **Araç bazlı bakım geçmişi.** `GET /bakim/arac/:ihaAraciId` tek bir aracın tüm
   parça değişim ve tamir kayıtlarını kronolojik olarak verir. Aynı modelden 20
   araç varsa, birinde tekrar eden bir arıza diğerlerinden bağımsız izlenebilir;
   tek tablolu bir tasarımda bu ayrım kaybolur, bakım geçmişi "model geçmişine"
   dönüşürdü.

---

## 4. Kurulum — Ön Gereksinimler

| Gereksinim | Sürüm | Not |
|---|---|---|
| **Node.js** | **20.19+ / 22.12+ / 24.x** | `package.json` dosyalarında `engines` alanı yoktur; alt sınırı bağımlılıklar belirler: Vite 8 → `^20.19.0 \|\| >=22.12.0`, Prisma 7 → `^20.19 \|\| ^22.12 \|\| >=24.0`. Docker imajları `node:20-alpine` kullanır. |
| **npm** | 10+ | Node ile birlikte gelir. Her iki pakette de `package-lock.json` mevcut, `npm ci` çalışır. |
| **PostgreSQL** | 14+ | Supabase projesi veya yerel bir sunucu. Uygulama harici bir veritabanı bekler; `docker-compose.yml` içinde postgres servisi **yoktur**. |
| **Docker + Docker Compose** | Docker 24+, Compose v2 | Yalnızca konteynerli kurulum için (opsiyonel). |
| **Derleme araçları** (yalnızca yerel kurulum) | — | `bcrypt` yerel (native) bir modüldür; hazır binary bulunamazsa kaynaktan derlenir. Linux'ta `python3`, `make`, `g++` gerekebilir. |

---

## 5. Kurulum — Yerel Geliştirme (Docker'sız)

### 5.1 Depoyu klonlayın

```bash
git clone <repo-url> iha-envanter
cd iha-envanter
```

### 5.2 Backend

```bash
cd backend
npm install
```

Ortam dosyasını şablondan oluşturun:

```bash
cp .env.example .env
# Windows PowerShell: Copy-Item .env.example .env
```

`backend/.env` içini doldurun (tüm değişkenler için [bölüm 7](#7-ortam-değişkenleri)):

```dotenv
DATABASE_URL="postgresql://KULLANICI:SIFRE@HOST:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://KULLANICI:SIFRE@HOST:5432/postgres"
JWT_SECRET="uzun-rastgele-bir-anahtar"
JWT_EXPIRES_IN="1d"
SEED_YONETICI_SIFRE="en-az-8-karakter"
SEED_TEKNISYEN_SIFRE="en-az-8-karakter"
```

> Yerel PostgreSQL kullanıyorsanız pooler ayrımı yoktur; her iki değişkene de
> aynı adresi yazabilirsiniz, örneğin
> `postgresql://postgres:postgres@localhost:5432/iha_envanter`.

Prisma istemcisini üretin, şemayı veritabanına uygulayın ve başlangıç
kayıtlarını ekleyin:

```bash
npx prisma generate        # generated/prisma altına istemciyi üretir (git'e girmez)
npx prisma migrate deploy  # mevcut migration'ları uygular (DIRECT_URL kullanır)
npx prisma db seed         # yönetici + teknisyen hesabı ve "Ana Depo" kaydı
```

> `generated/` klasörü `.gitignore` içindedir; klonladıktan sonra
> `npx prisma generate` çalıştırılmadan ne derleme ne de test başarılı olur.
>
> Şema üzerinde geliştirme yapacaksanız `migrate deploy` yerine
> `npx prisma migrate dev --name <degisiklik-adi>` kullanın.

Sunucuyu başlatın:

```bash
npm run start:dev
```

- API: `http://localhost:3000`
- Swagger UI: `http://localhost:3000/api`

`PORT` tanımlıysa o port kullanılır, aksi halde 3000.

### 5.3 Frontend

Yeni bir terminalde:

```bash
cd frontend
npm install
cp .env.example .env
# Windows PowerShell: Copy-Item .env.example .env
npm run dev
```

`frontend/.env` içinde tek değişken vardır:

```dotenv
VITE_API_URL=http://localhost:3000
```

Tanımlanmazsa [`src/lib/api.ts`](frontend/src/lib/api.ts) zaten
`http://localhost:3000` adresine düşer.

Uygulama **`http://localhost:5174`** adresinde açılır. Port
[`vite.config.ts`](frontend/vite.config.ts) içinde `strictPort: true` ile
sabitlenmiştir: 5174 meşgulse Vite başka bir porta kaymak yerine hata verir.

> **CORS:** backend, `CORS_ORIGIN` tanımlı değilse `http://localhost:5174` ve
> `http://127.0.0.1:5174` adreslerine izin verir; yerel geliştirmede ek ayar
> gerekmez. Frontend'i farklı bir portta çalıştıracaksanız `backend/.env`
> içindeki `CORS_ORIGIN` satırını açıp o adresi ekleyin.

### 5.4 Giriş

Seed ile oluşturulan hesaplar (şifreler `backend/.env` içinde sizin
belirlediğiniz `SEED_*` değerleridir):

| E-posta | Rol | Ünvan |
|---|---|---|
| `admin@iha.com` | `YONETICI` | Depo Sorumlusu |
| `teknisyen@iha.com` | `TEKNISYEN` | Bakım Teknisyeni |

Seed betiği şifreleri koda gömmez: `SEED_YONETICI_SIFRE` veya
`SEED_TEKNISYEN_SIFRE` tanımsızsa ya da 8 karakterden kısaysa **çalışmaz ve hata
verir**. Üretimde seed çalıştırdıysanız ilk girişten sonra şifreleri değiştirin.

---

## 6. Kurulum — Docker ile

### 6.1 Ne çalışır, ne çalışmaz

[`docker-compose.yml`](docker-compose.yml) iki servis ayağa kaldırır:

| Servis | İmaj | Port | İçerik |
|---|---|---|---|
| `backend` | `iha-envanter-backend` | `3000:3000` | Çok aşamalı derleme sonrası Node; açılışta `prisma migrate deploy` çalıştırıp API'yi başlatır. |
| `frontend` | `iha-envanter-frontend` | `8080:80` | Vite derlemesi nginx ile sunulur; SPA fallback ve güvenlik başlıkları [`nginx.conf`](frontend/nginx.conf) içindedir. |

**Veritabanı konteynerde değildir.** Compose dosyasında postgres servisi yoktur;
bağlantı bilgileri `backend/.env` dosyasından okunur (Supabase ya da erişilebilir
başka bir PostgreSQL).

### 6.2 Adımlar

1. `backend/.env` dosyasını [bölüm 5.2](#52-backend)'deki gibi hazırlayın —
   compose bu dosyayı `env_file` olarak okur, **dosya yoksa servis başlamaz.**

2. İsteğe bağlı olarak kökteki compose değişkenlerini ayarlayın:

   ```bash
   cp .env.example .env
   # Windows PowerShell: Copy-Item .env.example .env
   ```

   Kökteki `.env` yalnızca iki değişken içindir ve tanımlanmazsa
   `docker-compose.yml` içindeki varsayılanlar geçerli olur:

   ```dotenv
   VITE_API_URL=http://localhost:3000
   CORS_ORIGIN=http://localhost:8080,http://localhost:5174,http://localhost:5173
   ```

3. Ayağa kaldırın:

   ```bash
   docker compose up --build
   ```

4. Adresler:
   - Frontend: `http://localhost:8080`
   - API: `http://localhost:3000`
   - Swagger: `http://localhost:3000/api`

5. **Seed'i host'tan çalıştırın.** Migration'lar konteyner açılışında otomatik
   uygulanır, seed uygulanmaz: üretim imajı yalnızca derlenmiş `dist/` klasörünü
   taşır ve `seed.ts`'in ihtiyaç duyduğu `generated/` kaynağı imaja alınmaz.
   Aynı veritabanına bağlı olarak host'tan çalıştırın:

   ```bash
   cd backend && npx prisma db seed
   ```

Durdurmak için:

```bash
docker compose down
```

### 6.3 Docker ile ilgili bilinmesi gerekenler

- **`VITE_API_URL` derleme zamanında gömülür.** Vite `VITE_` önekli değişkenleri
  bundle'a yazar; bu yüzden compose bunu `environment` değil `build.args` olarak
  geçirir. Adres değişirse frontend **yeniden derlenmelidir**:

  ```bash
  docker compose build frontend && docker compose up -d frontend
  ```

- **Adres tarayıcıdan erişilebilir olmalı.** İstekleri kullanıcının tarayıcısı
  atar, konteyner değil: `http://backend:3000` gibi konteyner içi servis adları
  burada çalışmaz, `http://localhost:3000` kullanılır.

- **CORS bir beyaz listedir, `*` desteklenmez.** `CORS_ORIGIN` içinde `*` geçerse
  [`main.ts`](backend/src/main.ts) açılışta hata fırlatıp durur. Compose, frontend
  `:8080` üzerinden sunulduğu için bu kaynağı listeye ekler.

- **Migration'lar açılışta uygulanır.** Backend konteyneri
  `npx prisma migrate deploy && node dist/src/main` komutuyla başlar; veritabanına
  erişilemiyorsa konteyner ayağa kalkmaz.

- **`bcrypt` derlemesi.** Alpine/musl için hazır binary yayınlanmadığından imaj
  içinde kaynaktan derlenir; bu yüzden builder aşamasında `python3`, `make`, `g++`
  kurulur ve `node_modules` builder'dan olduğu gibi kopyalanır.

---

## 7. Ortam Değişkenleri

### `backend/.env` — şablon: [`backend/.env.example`](backend/.env.example)

| Değişken | Zorunlu | Açıklama |
|---|---|---|
| `DATABASE_URL` | ✅ | Uygulamanın çalışma anında kullandığı bağlantı. Supabase'de transaction-mode pooler (`:6543`, `?pgbouncer=true`). Tanımsızsa `PrismaService` açılışta hata verir. |
| `DIRECT_URL` | ✅ | Migration'ların kullandığı doğrudan bağlantı (Supabase'de session-mode pooler, `:5432`). [`prisma.config.ts`](backend/prisma.config.ts) datasource olarak bunu okur. |
| `JWT_SECRET` | ✅ | Token imzalama anahtarı. Üretimde uzun ve rastgele olmalı: `openssl rand -base64 48`. |
| `JWT_EXPIRES_IN` | — | Token geçerlilik süresi (`15m`, `1h`, `7d`). Varsayılan `1d`. |
| `CORS_ORIGIN` | — | Virgülle ayrılmış izinli tarayıcı kaynakları. Tanımsızsa `http://localhost:5174` + `http://127.0.0.1:5174`. `*` **desteklenmez**. |
| `PORT` | — | API portu. Varsayılan `3000`. |
| `NODE_ENV` | — | Compose üretim servisinde `production` olarak verilir. |
| `SEED_YONETICI_SIFRE` | seed için ✅ | `admin@iha.com` hesabının şifresi. En az 8 karakter, aksi halde seed durur. |
| `SEED_TEKNISYEN_SIFRE` | seed için ✅ | `teknisyen@iha.com` hesabının şifresi. En az 8 karakter. |

### `frontend/.env` — şablon: [`frontend/.env.example`](frontend/.env.example)

| Değişken | Zorunlu | Açıklama |
|---|---|---|
| `VITE_API_URL` | — | Backend adresi. Tanımsızsa `http://localhost:3000`. Derleme zamanında gömülür; değişince yeniden derlenmelidir. |

### Kök `.env` — şablon: [`.env.example`](.env.example)

Yalnızca `docker-compose.yml` okur: `VITE_API_URL` (frontend build arg) ve
`CORS_ORIGIN` (backend ortam değişkeni). Uygulamanın gizli bilgileri buraya
**yazılmaz**, `backend/.env` içinde durur.

> `.gitignore`, `.env.example` dışındaki tüm `.env` dosyalarını ve `generated/`,
> `dist/`, `node_modules/` klasörlerini versiyon kontrolünün dışında tutar.

---

## 8. Komutlar

### Backend (`cd backend`)

| Komut | Açıklama |
|---|---|
| `npm run start:dev` | Watch modunda geliştirme sunucusu |
| `npm run start` | Tek seferlik başlatma |
| `npm run build` | `dist/` altına derleme (`nest build`) |
| `npm run start:prod` | Derlenmiş çıktıyı çalıştırır (`node dist/src/main`) |
| `npm run lint` | ESLint + otomatik düzeltme |
| `npm run format` | Prettier |
| `npm test` / `npm run test:watch` / `npm run test:cov` | Jest birim testleri |
| `npm run test:e2e` | `test/jest-e2e.json` ile e2e testler |
| `npx prisma generate` | Prisma istemcisini `generated/prisma` altına üretir |
| `npx prisma migrate dev --name <ad>` | Yeni migration üretip uygular (geliştirme) |
| `npx prisma migrate deploy` | Bekleyen migration'ları uygular (üretim) |
| `npx prisma db seed` | `prisma/seed.ts` çalıştırır (`tsx` ile) |
| `npx prisma studio` | Veritabanı için görsel tarayıcı |

> Derleme çıktısı `dist/src/main.js`'tir (kökte `prisma.config.ts` bulunduğu için
> çıktı `src/` altında iç içe kalır); `start:prod` ve Dockerfile aynı yolu kullanır.

### Frontend (`cd frontend`)

| Komut | Açıklama |
|---|---|
| `npm run dev` | Vite geliştirme sunucusu (`:5174`, strict port) |
| `npm run build` | `tsc -b && vite build` → `dist/` |
| `npm run preview` | Derlenmiş çıktıyı yerel olarak sunar |
| `npm run lint` | ESLint |

---

## 9. API Referansı

Tam ve güncel dokümantasyon Swagger UI'dadır: **`http://localhost:3000/api`**.
Korumalı uçlar için önce `POST /auth/login` ile token alın, sağ üstteki
**Authorize** düğmesine yapıştırın.

**Yetki** sütunu: `Genel` = token gerekmez, `Oturum` = geçerli token yeterli,
`YONETICI` / `TEKNISYEN` = ilgili rol gerekir.

### Kimlik doğrulama

| Metot | Yol | Yetki | Açıklama |
|---|---|---|---|
| `POST` | `/auth/login` | Genel | `{ email, sifre }` → `{ access_token, user }` |
| `GET` | `/auth/me` | Oturum | Token'dan çözülen kullanıcı |

### Parçalar

| Metot | Yol | Yetki | Açıklama |
|---|---|---|---|
| `GET` | `/parcalar` | Oturum | Liste; `search`, `kategoriId`, `ihaModeliId`, `page`, `limit` |
| `GET` | `/parcalar/kritik` | Oturum | Toplam stoğu kritik seviyenin altındaki parçalar |
| `GET` | `/parcalar/:id` | Oturum | Detay: kategori, uyumlu modeller, depo bazlı stok |
| `GET` | `/parcalar/:id/hareketler` | Oturum | Parçanın stok hareket geçmişi (sayfalı) |
| `POST` | `/parcalar` | YONETICI | Yeni parça |
| `PATCH` | `/parcalar/:id` | YONETICI | Güncelle |
| `POST` | `/parcalar/:id/uyumluluk` | YONETICI | İHA modeli uyumluluğu ekle |
| `DELETE` | `/parcalar/:id/uyumluluk/:ihaModeliId` | YONETICI | Uyumluluğu kaldır |

### Stok

| Metot | Yol | Yetki | Açıklama |
|---|---|---|---|
| `GET` | `/stok` | YONETICI | Depo bazlı stok kalemleri; `depoId` |
| `GET` | `/stok/hareketler` | YONETICI | Hareket geçmişi; `parcaId`, `depoId`, `tip`, `page`, `limit` |
| `POST` | `/stok/giris` | YONETICI | `{ parcaId, depoId, miktar, aciklama?, rafKodu? }` |
| `POST` | `/stok/cikis` | YONETICI | `{ parcaId, depoId, miktar, aciklama? }` |

### Talepler

| Metot | Yol | Yetki | Açıklama |
|---|---|---|---|
| `GET` | `/talepler` | Oturum | `durum` filtresi; teknisyen yalnızca kendi taleplerini görür |
| `GET` | `/talepler/:id` | Oturum | Detay (teknisyen başkasının talebine erişemez) |
| `POST` | `/talepler` | TEKNISYEN | `{ parcaId, miktar, aciklama? }` |
| `PATCH` | `/talepler/:id/onayla` | YONETICI | Yalnızca `BEKLIYOR` durumundaki talepler |
| `PATCH` | `/talepler/:id/reddet` | YONETICI | `{ redSebebi }` zorunlu |

### Siparişler

| Metot | Yol | Yetki | Açıklama |
|---|---|---|---|
| `GET` | `/siparisler` | YONETICI | Tüm siparişler (talep + tedarikçi ile) |
| `POST` | `/siparisler` | YONETICI | `{ talepId, tedarikciId, miktar, birimFiyat? }`; talep `ONAYLANDI` olmalı |
| `PATCH` | `/siparisler/:id/teslim-al` | YONETICI | `{ depoId? }`; stoğa işler, talebi `TESLIM_ALINDI` yapar |

### Bakım

| Metot | Yol | Yetki | Açıklama |
|---|---|---|---|
| `GET` | `/bakim` | Oturum | `ihaAraciId`, `tip`, `page`, `limit` |
| `GET` | `/bakim/arac/:ihaAraciId` | Oturum | Tek aracın bakım geçmişi |
| `POST` | `/bakim/degistir` | Oturum | `{ ihaAraciId, parcaId, depoId?, miktar?, aciklama? }` — stoktan düşer |
| `POST` | `/bakim/tamir` | Oturum | `{ ihaAraciId, parcaId, aciklama? }` — stoğa dokunmaz |

### Tanımlar — `/kategoriler`, `/iha-modelleri`, `/iha-araclari`, `/tedarikciler`, `/depolar`

Beşi de aynı deseni izler:

| Metot | Yol | Yetki |
|---|---|---|
| `GET` | `/<kaynak>` | Oturum |
| `GET` | `/<kaynak>/:id` | Oturum |
| `POST` | `/<kaynak>` | YONETICI |
| `PATCH` | `/<kaynak>/:id` | YONETICI |
| `DELETE` | `/<kaynak>/:id` | YONETICI |

### Kullanıcılar ve istatistik

| Metot | Yol | Yetki | Açıklama |
|---|---|---|---|
| `GET` | `/kullanicilar` | YONETICI | Liste |
| `POST` | `/kullanicilar` | YONETICI | Yeni hesap |
| `GET` | `/kullanicilar/:id` | YONETICI | Detay |
| `PATCH` | `/kullanicilar/:id` | YONETICI | Güncelle / `aktif: false` ile pasife al |
| `DELETE` | `/kullanicilar/:id` | YONETICI | Kalıcı silme; ilişkili kaydı varsa 400 |
| `GET` | `/istatistik/ozet` | Oturum | Dashboard özeti |

---

## 10. Roller ve Ekran Yetkileri

| Yetenek | TEKNISYEN | YONETICI |
|---|:---:|:---:|
| Dashboard, parça kataloğu, parça detayı | ✅ | ✅ |
| Parça ekleme / düzenleme, uyumluluk tanımlama | — | ✅ |
| Talep açma | ✅ | — |
| Talep listesi | yalnızca kendi talepleri | tümü |
| Talep onaylama / reddetme | — | ✅ |
| Araç listesi, araç detayı, bakım kaydı (değiştir/tamir) | ✅ | ✅ |
| Araç / model / kategori / depo / tedarikçi tanımlama | — | ✅ |
| Stok mevcudu ve stok hareketleri | — | ✅ |
| Stok giriş / çıkış | — | ✅ |
| Sipariş açma ve teslim alma | — | ✅ |
| Kullanıcı yönetimi | — | ✅ |

Frontend rotaları ([`App.tsx`](frontend/src/App.tsx)) ve yan menü
([`lib/navigation.ts`](frontend/src/lib/navigation.ts)) bu tabloya göre gizlenir;
asıl kısıt her durumda backend'deki `RolesGuard`'dır.

---

## 11. Proje Yapısı

```
backend/src/
├── main.ts                 # bootstrap: CORS beyaz listesi, ValidationPipe, Swagger
├── app.module.ts           # tüm özellik modüllerinin kaydı
├── prisma/                 # PrismaService (PrismaPg adapter) + global PrismaModule
├── common/
│   ├── decorators/         # @Roles(), @CurrentUser()
│   ├── guards/             # JwtAuthGuard, RolesGuard
│   ├── types/              # AuthUser (sifreHash içermez)
│   └── utils/              # Prisma hatalarını HTTP hatasına çeviren yardımcı
├── auth/                   # login, /me, JWT stratejisi
├── kullanicilar/           # hesap yönetimi (YONETICI)
├── kategoriler/  iha-modelleri/  iha-araclari/  tedarikciler/  depolar/
├── parcalar/               # katalog, arama, uyumluluk, kritik liste
├── stok/                   # giriş/çıkış, hareket geçmişi, stoktanDus/depoyuCoz
├── talepler/               # talep akışı ve durum geçişleri
├── siparisler/             # sipariş açma ve teslim alma
├── bakim/                  # değiştir / tamir kayıtları
└── istatistik/             # dashboard özeti

frontend/src/
├── App.tsx                 # rotalar, QueryClient, AuthProvider
├── main.tsx                # giriş noktası
├── pages/                  # Dashboard, Parçalar, Talepler, Araçlar, Stok, ...
├── components/
│   ├── Layout.tsx  ProtectedRoute.tsx  TalepDurumStepper.tsx
│   ├── tanimlar/           # tanım ekranlarının form ve bölümleri
│   └── ui/                 # Modal, Rozet, Sayfalama, ParcaSecici, TemaDugmesi, ...
├── hooks/                  # useParcalar, useStok, useTalepler, useBakim, ...
├── context/                # AuthContext, ThemeContext
├── lib/                    # api.ts (axios + interceptor), navigation.ts, stok.ts, talep.ts
└── types/                  # paylaşılan TypeScript tipleri
```

---

## 12. Sorun Giderme

| Belirti | Sebep / Çözüm |
|---|---|
| `DATABASE_URL tanimli degil` | `backend/.env` eksik veya yanlış klasörde. `.env.example`'dan kopyalayın. |
| `CORS_ORIGIN '*' olamaz` diyerek backend açılmıyor | `main.ts` joker kaynağı bilerek reddeder; izinli adresleri tek tek listeleyin. |
| Tarayıcıda "Sunucuya ulaşılamadı. Backend çalışıyor mu?" | Backend kapalı ya da isteğin geldiği kaynak `CORS_ORIGIN` listesinde değil. |
| Derleme/çalıştırma `generated/prisma/client` bulamıyor | `npx prisma generate` çalıştırılmamış; `generated/` git'e girmez. |
| `prisma migrate deploy` bağlanamıyor ama uygulama çalışıyor | Migration `DIRECT_URL`'i kullanır (Supabase'de `:5432`), uygulama `DATABASE_URL`'i (`:6543`). İkisini ayrı ayrı doğrulayın. |
| `SEED_YONETICI_SIFRE tanimli degil veya 8 karakterden kisa` | Seed şifreleri koda gömmez; `.env` içine en az 8 karakterlik değerler girin. |
| Vite `Port 5174 is already in use` deyip çıkıyor | `strictPort: true` bilinçlidir; portu boşaltın ya da `vite.config.ts`'te değiştirip `CORS_ORIGIN`'i güncelleyin. |
| Docker'da frontend eski API adresine gidiyor | `VITE_API_URL` derleme zamanında gömülür: `docker compose build frontend` ile yeniden derleyin. |
| Docker'da sayfa yenilenince 404 | SPA fallback'i nginx `try_files ... /index.html` ile çözer; özel bir nginx yapılandırması kullanıyorsanız aynısını ekleyin. |
| `npm install` sırasında `bcrypt` derleme hatası | Yerel derleme araçları eksik (Linux: `python3 make g++`); Node sürümünüzün desteklenen aralıkta olduğunu doğrulayın. |
| İstek `400` ile `property X should not exist` dönüyor | `ValidationPipe` `forbidNonWhitelisted` ile çalışır; DTO'da tanımsız alan gönderilemez. |
| Stok çıkışında `409` | Aynı stok kalemine eşzamanlı bir hareket geldi; işlemi tekrarlayın. |
