<div align="center">

<h1>🛩️ İHA Envanter Sistemi</h1>

<p><b>İnsansız hava aracı filoları için parça, stok ve bakım envanteri yönetim sistemi</b></p>

<p>
  <img src="https://img.shields.io/badge/NestJS-11-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS 11" />
  <img src="https://img.shields.io/badge/Prisma-7-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma 7" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 19" />
</p>
<p>
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite 8" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-4-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
</p>

<p>
  <sub>
    <b>Backend</b> NestJS + Prisma + PostgreSQL &nbsp;·&nbsp;
    <b>Frontend</b> Vite + React + TypeScript &nbsp;·&nbsp;
    <b>Dağıtım</b> Docker Compose (nginx + Node) &nbsp;·&nbsp;
    <b>API</b> Swagger UI → <code>/api</code>
  </sub>
</p>

</div>

---

<p align="center">
Teknisyenler sahadaki araçlara taktıkları veya tamir ettikleri parçaları kaydeder ve eksik parça için talep açar;<br />
yöneticiler bu talepleri onaylar, tedarikçiye sipariş verir, teslim alınan malı stoğa işler ve depo mevcudunu yönetir.<br />
Sistemin çözdüğü asıl problem, <b>"hangi parçadan kaç adet var"</b>, <b>"bu parça hangi araca takıldı"</b> ve
<b>"talep hangi aşamada"</b> sorularının<br />birbirinden kopuk Excel dosyalarında takip edilmesidir: envanter miktarı,
stok hareket geçmişi ve araç bakım kayıtları<br />tek veritabanında, birbirini doğrulayacak şekilde tutulur.
</p>

---

<a id="icindekiler"></a>

<div align="center">

### 📑 İçindekiler

</div>

<table>
<tr>
<td width="33%" valign="top">

**Genel bakış**

1. [Özellikler](#ozellikler)
2. [Teknoloji Yığını](#teknoloji)
3. [Mimari](#mimari)

</td>
<td width="33%" valign="top">

**Kurulum**

4. [Ön Gereksinimler](#gereksinimler)
5. [Yerel Geliştirme](#yerel)
6. [Docker ile Kurulum](#docker)
7. [Ortam Değişkenleri](#env)

</td>
<td width="33%" valign="top">

**Referans**

8. [Komutlar](#komutlar)
9. [API Referansı](#api)
10. [Roller ve Yetkiler](#roller)
11. [Proje Yapısı](#yapi)
12. [Sorun Giderme](#sorun)

</td>
</tr>
</table>

---

<a id="ozellikler"></a>

## 1. ✨ Özellikler

<table>
<tr>
<td width="33%" valign="top">
<h4>📦 Katalog & Tanımlar</h4>
<sub>Parça, kategori, İHA modeli, fiziksel araç, tedarikçi ve depo tanımları; parça–model uyumluluk matrisi.</sub>
</td>
<td width="33%" valign="top">
<h4>🏬 Stok & Hareket</h4>
<sub>Depo bazlı giriş/çıkış, kim–ne zaman–neden bilgisiyle tam hareket geçmişi, negatif stok koruması.</sub>
</td>
<td width="33%" valign="top">
<h4>🧾 Talep Akışı</h4>
<sub>Talep → onay/red → sipariş → teslim; her aşama durum makinesiyle korunur.</sub>
</td>
</tr>
<tr>
<td valign="top">
<h4>🔧 Araç Bakımı</h4>
<sub>Kuyruk numarası bazında parça değişimi (stoktan düşer) ve yerinde tamir (stoğa dokunmaz) kayıtları.</sub>
</td>
<td valign="top">
<h4>🔐 Rol Bazlı Yetki</h4>
<sub>JWT oturumu, bcrypt şifreleme, <code>TEKNISYEN</code> / <code>YONETICI</code> rolleri, guard tabanlı koruma.</sub>
</td>
<td valign="top">
<h4>📊 Dashboard</h4>
<sub>Kritik stok uyarıları, bekleyen talepler, son hareketler ve talep durum dağılımı grafikleri.</sub>
</td>
</tr>
</table>

<details open>
<summary><b>📦 Tanım ve katalog yönetimi</b></summary>

- **Parça yönetimi:** benzersiz parça kodu, ad, açıklama, birim, kritik stok seviyesi, arızalı işareti; kod/ad üzerinde
  arama, kategori ve İHA modeline göre filtreleme, sayfalama
  (`GET /parcalar?search=&kategoriId=&ihaModeliId=&page=&limit=`).
- **Kategori yönetimi:** parçaların gruplandığı benzersiz adlı kategoriler.
- **İHA modeli yönetimi:** model adı + üretici; her modele uyumlu parçalar `ParcaUyumluluk` üzerinden çoktan-çoğa bağlanır.
- **Parça–model uyumluluğu:** bir parçanın hangi İHA modellerine takılabileceği tek tek eklenip kaldırılabilir
  (`POST /parcalar/:id/uyumluluk`, `DELETE /parcalar/:id/uyumluluk/:ihaModeliId`).
- **Araç yönetimi:** benzersiz kuyruk numarasıyla fiziksel araç kaydı, bağlı olduğu model ve durum bilgisi (varsayılan `AKTIF`).
- **Tedarikçi ve depo yönetimi:** siparişlerin verildiği tedarikçiler ve stoğun tutulduğu depolar.

</details>

<details>
<summary><b>🏬 Stok</b></summary>

- **Stok girişi / çıkışı:** parça + depo bazında miktar artırma/azaltma (`POST /stok/giris`, `POST /stok/cikis`),
  isteğe bağlı raf kodu ve açıklama.
- **Hareket geçmişi:** her giriş/çıkış `StokHareketi` olarak kim tarafından, ne zaman, hangi açıklamayla yapıldığı
  bilgisiyle saklanır; parça, depo ve hareket tipine göre filtrelenip sayfalanır (`GET /stok/hareketler`).
- **Negatif stok koruması:** çıkış mevcut miktarı aşamaz; eşzamanlı çıkışlarda koşullu güncelleme sayesinde stok
  eksiye düşmez, çakışma `409` ile bildirilir.
- **Kritik stok uyarısı:** toplam stoğu kendi `kritikSeviye` değerinin altına düşen parçalar ayrı uçtan listelenir
  (`GET /parcalar/kritik`).

</details>

<details>
<summary><b>🧾 Talep → onay → sipariş → teslim akışı</b></summary>

- **Talep açma:** teknisyen parça ve miktar belirterek talep açar; talep `BEKLIYOR` durumunda başlar.
- **Onay / red:** yönetici bekleyen talebi onaylar (`ONAYLANDI`) veya zorunlu red sebebiyle reddeder (`REDDEDILDI`).
  Sadece `BEKLIYOR` durumundaki talepler bu geçişi yapabilir.
- **Sipariş:** yalnızca onaylanmış talepten, tedarikçi ve birim fiyatla sipariş açılır; talep `SIPARIS_VERILDI` olur.
  Bir talepten yalnızca bir sipariş açılabilir (`talepId` benzersiz).
- **Teslim alma:** sipariş teslim alındığında sipariş kapanır, miktar stoğa eklenir, `GIRIS` hareketi yazılır ve talep
  `TESLIM_ALINDI` durumuna geçer — dördü de tek transaction içinde.
- **Görünürlük kısıtı:** teknisyen yalnızca kendi taleplerini görür; bu kısıt istemciden gelen parametreye değil,
  token'daki role bağlıdır.

<div align="center">

```mermaid
flowchart LR
    A["📝 BEKLIYOR"] -->|yönetici onaylar| B["✅ ONAYLANDI"]
    A -->|yönetici reddeder| C["⛔ REDDEDILDI"]
    B -->|sipariş açılır| D["🚚 SIPARIS_VERILDI"]
    D -->|teslim alınır + stoğa işlenir| E["📦 TESLIM_ALINDI"]
```

</div>

</details>

<details>
<summary><b>🔧 Araç bakımı</b></summary>

- **Parça değiştirme (`DEGISTIRILDI`):** araca yeni parça takılır; parça stoktan düşülür, `CIKIS` hareketi ve bakım
  kaydı aynı transaction içinde yazılır.
- **Yerinde tamir (`TAMIR_EDILDI`):** parça sökülüp değiştirilmediği için stoğa dokunulmaz, yalnızca bakım kaydı yazılır.
- **Bakım geçmişi:** tüm kayıtlar araç ve tipe göre filtrelenip sayfalanır; tek bir aracın geçmişi ayrı uçtan alınır
  (`GET /bakim/arac/:ihaAraciId`).

</details>

<details>
<summary><b>🔐 Kimlik doğrulama ve yetkilendirme</b></summary>

- **JWT tabanlı oturum:** `POST /auth/login` ile token alınır, korumalı uçlara `Authorization: Bearer <token>`
  başlığıyla erişilir. Şifreler bcrypt ile hash'lenir; pasif hesaplar giriş yapamaz.
- **Rol bazlı yetki:** `TEKNISYEN` ve `YONETICI` rolleri; yetki hem backend'de `RolesGuard` ile hem frontend'de
  `ProtectedRoute` ile uygulanır.
- **Kullanıcı yönetimi:** yönetici hesap açar, günceller, pasife alır. Kalıcı silme yalnızca ilişkili kaydı olmayan
  kullanıcılar için mümkündür.

</details>

<details>
<summary><b>📊 Dashboard ve istatistik</b></summary>

- Toplam parça / araç / kategori sayısı, bekleyen talep sayısı, kritik stok sayısı, son 5 stok hareketi, kritik
  seviyedeki 5 parça ve talep durum dağılımı tek uçtan gelir (`GET /istatistik/ozet`); frontend bunu Recharts
  grafikleriyle gösterir.
- Açık/koyu tema desteği; tema tercihi ilk boyamadan önce uygulanır.

</details>

<br />

---

<a id="teknoloji"></a>

## 2. 🧰 Teknoloji Yığını

<table>
<tr>
<td width="50%" valign="top">

<div align="center"><h3>⚙️ Backend</h3><sub><code>backend/package.json</code></sub></div>

| Paket | Sürüm | Kullanım |
|---|:---:|---|
| `@nestjs/core` · `common` · `platform-express` | `^11.0.1` | Uygulama çatısı, modül/DI sistemi |
| `@nestjs/config` | `^4.0.4` | `.env` tabanlı yapılandırma (global) |
| `@nestjs/swagger` | `^11.4.6` | `/api` altında OpenAPI dokümantasyonu |
| `@nestjs/jwt` · `passport` · `passport-jwt` | `11.x` · `0.7` · `4.0` | JWT üretimi, Bearer doğrulama |
| `bcrypt` | `^6.0.0` | Şifre hash'leme (10 tur salt) |
| `@prisma/client` · `prisma` | `^7.9.1` | ORM, migration, tip üretimi |
| `@prisma/adapter-pg` · `pg` | `^7.9.1` · `^8.22.0` | PostgreSQL driver adapter |
| `class-validator` · `class-transformer` | `^0.15.1` · `^0.5.1` | DTO doğrulama ve dönüşüm |
| `dotenv` | `^17.4.2` | `main.ts` / `seed.ts` erken `.env` yüklemesi |
| `jest` · `supertest` <sub>(dev)</sub> | `^30` · `^7` | Birim ve e2e test altyapısı |

</td>
<td width="50%" valign="top">

<div align="center"><h3>🖥️ Frontend</h3><sub><code>frontend/package.json</code></sub></div>

| Paket | Sürüm | Kullanım |
|---|:---:|---|
| `react` · `react-dom` | `^19.2.8` | UI kütüphanesi |
| `vite` · `@vitejs/plugin-react` | `^8.2.0` · `^6.0.4` | Geliştirme sunucusu ve derleme |
| `typescript` | `~6.0.2` | Tip sistemi (`tsc -b` derlemede zorunlu) |
| `react-router-dom` | `^7.18.2` | Yönlendirme, korumalı rotalar |
| `@tanstack/react-query` | `^5.101.4` | Sunucu durumu, önbellek, mutasyonlar |
| `react-hook-form` · `zod` · `@hookform/resolvers` | `^7.85` · `^4.4` · `^5.7` | Form yönetimi ve şema doğrulama |
| `axios` | `^1.19.0` | HTTP istemcisi, token & 401 interceptor'ları |
| `tailwindcss` · `@tailwindcss/vite` | `^4.3.3` | Tailwind v4 (Vite eklentisiyle, PostCSS yok) |
| `recharts` | `^3.10.1` | Dashboard grafikleri |
| `lucide-react` | `^1.31.0` | İkon seti |

</td>
</tr>
</table>

> [!NOTE]
> **Veritabanı:** PostgreSQL. Bağlantı `DATABASE_URL` üzerinden `PrismaPg` adapter'ı ile kurulur;
> migration'lar ayrı bir `DIRECT_URL` kullanır.

<br />

---

<a id="mimari"></a>

## 3. 🏗️ Mimari

### Monorepo yapısı

```text
iha-envanter/
├── 📁 backend/            # NestJS API
│   ├── prisma/            # schema.prisma, migrations/, seed.ts
│   ├── src/               # modüller (her biri controller + service + dto)
│   ├── generated/         # Prisma'nın ürettiği istemci (git'e girmez)
│   ├── prisma.config.ts
│   └── Dockerfile
├── 📁 frontend/           # Vite + React SPA
│   ├── src/               # pages/, components/, hooks/, lib/, context/, types/
│   ├── nginx.conf         # üretimde SPA fallback + güvenlik başlıkları
│   └── Dockerfile
├── 🐳 docker-compose.yml  # backend + frontend servisleri
└── 🔑 .env.example        # YALNIZCA docker-compose değişkenleri
```

İki uygulama bağımsız `package.json` dosyalarına sahiptir; kökte bir workspace tanımı **yoktur**, bağımlılıklar her
klasörde ayrı ayrı kurulur.

### Katmanlı backend

Her özellik kendi NestJS modülüdür (`auth`, `kullanicilar`, `kategoriler`, `iha-modelleri`, `iha-araclari`,
`tedarikciler`, `depolar`, `parcalar`, `stok`, `talepler`, `siparisler`, `bakim`, `istatistik`) ve hepsi aynı akışı izler:

<div align="center">

```mermaid
flowchart TD
    R["🌐 HTTP isteği"] --> C
    C["🎯 <b>Controller</b><br/><sub>yönlendirme · ValidationPipe ile DTO doğrulama<br/>JwtAuthGuard + RolesGuard · Swagger açıklamaları</sub>"] --> S
    S["🧠 <b>Service</b><br/><sub>iş kuralları · durum geçişleri · transaction sınırları</sub>"] --> P
    P["🔌 <b>PrismaService</b><br/><sub>tek merkezden yönetilen Prisma istemcisi (PrismaPg adapter)</sub>"] --> DB
    DB[("🐘 PostgreSQL")]
```

</div>

Kesişen sorumluluklar `src/common/` altında toplanır: `JwtAuthGuard`, `RolesGuard`, `@Roles()` ve `@CurrentUser()`
dekoratörleri, `AuthUser` tipi ve Prisma hatalarını HTTP hatasına çeviren yardımcı.

> [!IMPORTANT]
> `ValidationPipe` global olarak `whitelist` + `forbidNonWhitelisted` ile çalışır: DTO'da tanımlı olmayan alanlar
> sessizce kırpılmaz, **400 ile reddedilir**.

Frontend tarafında da aynı ayrım vardır: [`lib/api.ts`](frontend/src/lib/api.ts) tek axios örneğini ve hata mesajı
çeviricilerini barındırır, `hooks/` altındaki hook'lar React Query sorgularını kapsüller, `pages/` yalnızca görünümü kurar.

### Veri modeli özeti

<table>
<tr><th colspan="2" align="left">📚 Tanım tabloları</th></tr>
<tr><td width="22%"><code>Kategori</code></td><td>Parçaların gruplandığı benzersiz adlı sınıflandırma.</td></tr>
<tr><td><code>IhaModeli</code></td><td>Bir İHA <b>tipi</b> (ad + üretici); fiziksel bir araç değildir.</td></tr>
<tr><td><code>IhaAraci</code></td><td>Kuyruk numarasıyla tanımlı <b>tekil fiziksel araç</b>; bir modele bağlıdır.</td></tr>
<tr><td><code>Parca</code></td><td>Envanterdeki parça tanımı: kod, ad, birim, kritik seviye, arızalı işareti.</td></tr>
<tr><td><code>ParcaUyumluluk</code></td><td>Parça ile İHA modeli arasındaki çoktan-çoğa bağ (bileşik birincil anahtar).</td></tr>
<tr><td><code>Tedarikci</code></td><td>Siparişlerin verildiği firma.</td></tr>
<tr><td><code>Depo</code></td><td>Stoğun fiziksel olarak tutulduğu lokasyon.</td></tr>

<tr><th colspan="2" align="left">🏬 Stok tabloları</th></tr>
<tr><td><code>StokKalem</code></td><td>Bir parçanın bir depodaki <b>anlık miktarı</b> ve raf kodu; <code>(parcaId, depoId)</code> benzersizdir.</td></tr>
<tr><td><code>StokHareketi</code></td><td>Miktarı değiştiren her <code>GIRIS</code>/<code>CIKIS</code> olayının kim–ne zaman–neden kaydı.</td></tr>

<tr><th colspan="2" align="left">🔄 Akış tabloları</th></tr>
<tr><td><code>ParcaTalebi</code></td><td>Teknisyenin parça talebi; <code>BEKLIYOR → ONAYLANDI/REDDEDILDI → SIPARIS_VERILDI → TESLIM_ALINDI</code> durumlarını taşır.</td></tr>
<tr><td><code>Siparis</code></td><td>Onaylanmış bir talebe karşılık tedarikçiye verilen sipariş; talep başına en fazla bir tane.</td></tr>
<tr><td><code>BakimKaydi</code></td><td>Bir araçta bir parçanın değiştirilmesi (<code>DEGISTIRILDI</code>) veya yerinde tamiri (<code>TAMIR_EDILDI</code>).</td></tr>
<tr><td><code>Kullanici</code></td><td><code>TEKNISYEN</code> veya <code>YONETICI</code> rolündeki hesap; şifre <code>sifreHash</code> alanında bcrypt ile saklanır.</td></tr>
</table>

<details>
<summary><b>🗺️ İlişki diyagramı (ER)</b></summary>

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

</details>

### 💡 Kritik tasarım kararı 1 — `StokKalem` + `StokHareketi` her zaman tek transaction

Stok iki tabloda birden yaşar: `StokKalem` **şimdiki durumu** (miktar), `StokHareketi` ise **nasıl buraya gelindiğini**
(geçmiş) tutar. Bu ikisi ayrışırsa envanter güvenilirliğini tamamen kaybeder: miktar 8 görünürken hareket geçmişinin
toplamı 10 çıkarsa hangisinin doğru olduğu bilinemez.

Bu yüzden miktarı değiştiren **her** işlem `prisma.$transaction` içinde, kalem güncellemesi ve hareket kaydı birlikte
yazılacak şekilde yapılır ([`stok.service.ts`](backend/src/stok/stok.service.ts)):

<table>
<tr><th align="left">Uç nokta</th><th align="left">Tek transaction içinde yazılanlar</th></tr>
<tr><td><code>POST /stok/giris</code></td><td><code>stokKalem.upsert</code> + <code>stokHareketi.create</code></td></tr>
<tr><td><code>POST /stok/cikis</code></td><td>koşullu <code>stokKalem.updateMany</code> + <code>stokHareketi.create</code></td></tr>
<tr><td><code>POST /bakim/degistir</code></td><td>aynı düşüm + <code>CIKIS</code> hareketi + <code>BakimKaydi</code></td></tr>
<tr><td><code>PATCH /siparisler/:id/teslim-al</code></td><td>sipariş kapanışı + stok artışı + <code>GIRIS</code> hareketi + talep durumu</td></tr>
</table>

> [!TIP]
> **İkinci fayda eşzamanlılıktadır.** Düşüm, önce okunup sonra geri yazılan bir değerle değil, `miktar >= istenen`
> koşulunu *güncellemenin içinde* taşıyan `updateMany` ile yapılır; artışlar da `increment` ile veritabanında hesaplanır.
> Böylece iki istek aynı anda geldiğinde ne kayıp güncelleme olur ne de stok eksiye düşer — koşulu tutturamayan istek
> `409` alır. "Yetersiz stok" kuralı tek bir yerde (`StokService.stoktanDus`) durduğu için serbest stok çıkışı ile bakım
> kaynaklı çıkış aynı kurala tabidir; `BakimService` bu metodu kendi transaction'ına bağlayarak çağırır.

### 💡 Kritik tasarım kararı 2 — `IhaModeli` (tip) ile `IhaAraci` (fiziksel araç) ayrımı

`IhaModeli` bir **model tipidir** ("Bayraktar TB2"), `IhaAraci` ise o tipten üretilmiş **tekil bir kuyruk numarasıdır**
("TB2-001"). Tek bir tabloyla da çalışılabilirdi; ayrıştırmak iki şeyi mümkün kılar:

1. **Uyumluluk model seviyesinde tanımlanır, bakım araç seviyesinde tutulur.** Bir parçanın hangi İHA'lara
   takılabileceği tipin özelliğidir; bu yüzden `ParcaUyumluluk` `IhaModeli`'ne bağlıdır ve model başına bir kez
   tanımlanır. Buna karşılık "bu motor hangi kuyruk numarasına takıldı" sorusu ancak fiziksel araç kaydı varsa
   cevaplanabilir; `BakimKaydi` bu yüzden `IhaAraci`'na bağlıdır.
2. **Araç bazlı bakım geçmişi.** `GET /bakim/arac/:ihaAraciId` tek bir aracın tüm parça değişim ve tamir kayıtlarını
   kronolojik olarak verir. Aynı modelden 20 araç varsa, birinde tekrar eden bir arıza diğerlerinden bağımsız
   izlenebilir; tek tablolu bir tasarımda bu ayrım kaybolur, bakım geçmişi "model geçmişine" dönüşürdü.

<div align="center">

```mermaid
flowchart LR
    M["🛩️ <b>IhaModeli</b><br/><sub>tip: Bayraktar TB2</sub>"]
    A1["🔖 <b>IhaAraci</b><br/><sub>TB2-001</sub>"]
    A2["🔖 <b>IhaAraci</b><br/><sub>TB2-002</sub>"]
    P["⚙️ <b>Parca</b><br/><sub>Fırçasız motor</sub>"]
    U["🔗 ParcaUyumluluk<br/><sub>tip seviyesinde</sub>"]
    B1["🔧 BakimKaydi<br/><sub>araç seviyesinde</sub>"]
    B2["🔧 BakimKaydi<br/><sub>araç seviyesinde</sub>"]

    M --> A1
    M --> A2
    P --- U --- M
    A1 --> B1
    A2 --> B2
    P -.-> B1
    P -.-> B2
```

</div>

<br />

---

<a id="gereksinimler"></a>

## 4. 📋 Kurulum — Ön Gereksinimler

<table>
<tr><th align="left">Gereksinim</th><th align="left">Sürüm</th><th align="left">Not</th></tr>
<tr>
  <td><b>Node.js</b></td>
  <td><b>20.19+ / 22.12+ / 24.x</b></td>
  <td><code>package.json</code> dosyalarında <code>engines</code> alanı yoktur; alt sınırı bağımlılıklar belirler:
      Vite 8 → <code>^20.19.0 || >=22.12.0</code>, Prisma 7 → <code>^20.19 || ^22.12 || >=24.0</code>.
      Docker imajları <code>node:20-alpine</code> kullanır.</td>
</tr>
<tr>
  <td><b>npm</b></td><td>10+</td>
  <td>Node ile birlikte gelir. Her iki pakette de <code>package-lock.json</code> mevcut, <code>npm ci</code> çalışır.</td>
</tr>
<tr>
  <td><b>PostgreSQL</b></td><td>14+</td>
  <td>Supabase projesi veya yerel bir sunucu. Uygulama <b>harici</b> bir veritabanı bekler;
      <code>docker-compose.yml</code> içinde postgres servisi <b>yoktur</b>.</td>
</tr>
<tr>
  <td><b>Docker + Compose</b></td><td>Docker 24+, Compose v2</td>
  <td>Yalnızca konteynerli kurulum için (opsiyonel).</td>
</tr>
<tr>
  <td><b>Derleme araçları</b><br /><sub>yalnızca yerel kurulum</sub></td><td>—</td>
  <td><code>bcrypt</code> yerel (native) bir modüldür; hazır binary bulunamazsa kaynaktan derlenir.
      Linux'ta <code>python3</code>, <code>make</code>, <code>g++</code> gerekebilir.</td>
</tr>
</table>

<br />

---

<a id="yerel"></a>

## 5. 💻 Kurulum — Yerel Geliştirme (Docker'sız)

### 5.1 · Depoyu klonlayın

```bash
git clone <repo-url> iha-envanter
cd iha-envanter
```

### 5.2 · Backend

```bash
cd backend
npm install
```

Ortam dosyasını şablondan oluşturun:

```bash
cp .env.example .env
# Windows PowerShell: Copy-Item .env.example .env
```

`backend/.env` içini doldurun (tüm değişkenler için → [Ortam Değişkenleri](#env)):

```dotenv
DATABASE_URL="postgresql://KULLANICI:SIFRE@HOST:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://KULLANICI:SIFRE@HOST:5432/postgres"
JWT_SECRET="uzun-rastgele-bir-anahtar"
JWT_EXPIRES_IN="1d"
SEED_YONETICI_SIFRE="en-az-8-karakter"
SEED_TEKNISYEN_SIFRE="en-az-8-karakter"
```

> [!NOTE]
> Yerel PostgreSQL kullanıyorsanız pooler ayrımı yoktur; her iki değişkene de aynı adresi yazabilirsiniz, örneğin
> `postgresql://postgres:postgres@localhost:5432/iha_envanter`.

Prisma istemcisini üretin, şemayı veritabanına uygulayın ve başlangıç kayıtlarını ekleyin:

```bash
npx prisma generate        # generated/prisma altına istemciyi üretir (git'e girmez)
npx prisma migrate deploy  # mevcut migration'ları uygular (DIRECT_URL kullanır)
npx prisma db seed         # yönetici + teknisyen hesabı ve "Ana Depo" kaydı
```

> [!WARNING]
> `generated/` klasörü `.gitignore` içindedir; klonladıktan sonra `npx prisma generate` çalıştırılmadan ne derleme
> ne de test başarılı olur. Şema üzerinde geliştirme yapacaksanız `migrate deploy` yerine
> `npx prisma migrate dev --name <degisiklik-adi>` kullanın.

Sunucuyu başlatın:

```bash
npm run start:dev
```

<div align="center">

| | Adres |
|---|---|
| 🔌 **API** | <code>http://localhost:3000</code> |
| 📘 **Swagger UI** | <code>http://localhost:3000/api</code> |

</div>

`PORT` tanımlıysa o port kullanılır, aksi halde `3000`.

### 5.3 · Frontend

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

Tanımlanmazsa [`src/lib/api.ts`](frontend/src/lib/api.ts) zaten `http://localhost:3000` adresine düşer.

Uygulama **`http://localhost:5174`** adresinde açılır. Port [`vite.config.ts`](frontend/vite.config.ts) içinde
`strictPort: true` ile sabitlenmiştir: 5174 meşgulse Vite başka bir porta kaymak yerine hata verir.

> [!TIP]
> **CORS:** backend, `CORS_ORIGIN` tanımlı değilse `http://localhost:5174` ve `http://127.0.0.1:5174` adreslerine izin
> verir; yerel geliştirmede ek ayar gerekmez. Frontend'i farklı bir portta çalıştıracaksanız `backend/.env` içindeki
> `CORS_ORIGIN` satırını açıp o adresi ekleyin.

### 5.4 · Giriş

Seed ile oluşturulan hesaplar — şifreler `backend/.env` içinde sizin belirlediğiniz `SEED_*` değerleridir:

<div align="center">

| E-posta | Rol | Ünvan |
|---|:---:|---|
| `admin@iha.com` | 🟣 **YONETICI** | Depo Sorumlusu |
| `teknisyen@iha.com` | 🔵 **TEKNISYEN** | Bakım Teknisyeni |

</div>

> [!CAUTION]
> Seed betiği şifreleri koda gömmez: `SEED_YONETICI_SIFRE` veya `SEED_TEKNISYEN_SIFRE` tanımsızsa ya da 8 karakterden
> kısaysa **çalışmaz ve hata verir**. Üretimde seed çalıştırdıysanız ilk girişten sonra şifreleri değiştirin.

<br />

---

<a id="docker"></a>

## 6. 🐳 Kurulum — Docker ile

### 6.1 · Ne çalışır, ne çalışmaz

[`docker-compose.yml`](docker-compose.yml) iki servis ayağa kaldırır:

<table>
<tr><th align="left">Servis</th><th align="left">İmaj</th><th align="center">Port</th><th align="left">İçerik</th></tr>
<tr>
  <td>⚙️ <code>backend</code></td><td><code>iha-envanter-backend</code></td><td align="center"><code>3000:3000</code></td>
  <td>Çok aşamalı derleme sonrası Node; açılışta <code>prisma migrate deploy</code> çalıştırıp API'yi başlatır.</td>
</tr>
<tr>
  <td>🖥️ <code>frontend</code></td><td><code>iha-envanter-frontend</code></td><td align="center"><code>8080:80</code></td>
  <td>Vite derlemesi nginx ile sunulur; SPA fallback ve güvenlik başlıkları <a href="frontend/nginx.conf"><code>nginx.conf</code></a> içindedir.</td>
</tr>
</table>

> [!IMPORTANT]
> **Veritabanı konteynerde değildir.** Compose dosyasında postgres servisi yoktur; bağlantı bilgileri `backend/.env`
> dosyasından okunur (Supabase ya da erişilebilir başka bir PostgreSQL).

### 6.2 · Adımlar

**1.** `backend/.env` dosyasını [bölüm 5.2](#52--backend)'deki gibi hazırlayın — compose bu dosyayı `env_file` olarak
okur, **dosya yoksa servis başlamaz.**

**2.** İsteğe bağlı olarak kökteki compose değişkenlerini ayarlayın:

```bash
cp .env.example .env
# Windows PowerShell: Copy-Item .env.example .env
```

Kökteki `.env` yalnızca iki değişken içindir; tanımlanmazsa `docker-compose.yml` içindeki varsayılanlar geçerli olur:

```dotenv
VITE_API_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:8080,http://localhost:5174,http://localhost:5173
```

**3.** Ayağa kaldırın:

```bash
docker compose up --build
```

**4.** Adresler:

<div align="center">

| | Adres |
|---|---|
| 🖥️ **Frontend** | <code>http://localhost:8080</code> |
| 🔌 **API** | <code>http://localhost:3000</code> |
| 📘 **Swagger** | <code>http://localhost:3000/api</code> |

</div>

**5.** **Seed'i host'tan çalıştırın.** Migration'lar konteyner açılışında otomatik uygulanır, seed uygulanmaz: üretim
imajı yalnızca derlenmiş `dist/` klasörünü taşır ve `seed.ts`'in ihtiyaç duyduğu `generated/` kaynağı imaja alınmaz.
Aynı veritabanına bağlı olarak host'tan çalıştırın:

```bash
cd backend && npx prisma db seed
```

Durdurmak için:

```bash
docker compose down
```

### 6.3 · Docker ile ilgili bilinmesi gerekenler

<details open>
<summary><b>🏗️ <code>VITE_API_URL</code> derleme zamanında gömülür</b></summary>

Vite `VITE_` önekli değişkenleri bundle'a yazar; bu yüzden compose bunu `environment` değil `build.args` olarak
geçirir. Adres değişirse frontend **yeniden derlenmelidir**:

```bash
docker compose build frontend && docker compose up -d frontend
```

</details>

<details>
<summary><b>🌐 Adres tarayıcıdan erişilebilir olmalı</b></summary>

İstekleri kullanıcının tarayıcısı atar, konteyner değil: `http://backend:3000` gibi konteyner içi servis adları
burada çalışmaz, `http://localhost:3000` kullanılır.

</details>

<details>
<summary><b>🔒 CORS bir beyaz listedir, <code>*</code> desteklenmez</b></summary>

`CORS_ORIGIN` içinde `*` geçerse [`main.ts`](backend/src/main.ts) açılışta hata fırlatıp durur. Compose, frontend
`:8080` üzerinden sunulduğu için bu kaynağı listeye ekler.

</details>

<details>
<summary><b>🗄️ Migration'lar açılışta uygulanır</b></summary>

Backend konteyneri `npx prisma migrate deploy && node dist/src/main` komutuyla başlar; veritabanına erişilemiyorsa
konteyner ayağa kalkmaz.

</details>

<details>
<summary><b>🧱 <code>bcrypt</code> derlemesi</b></summary>

Alpine/musl için hazır binary yayınlanmadığından imaj içinde kaynaktan derlenir; bu yüzden builder aşamasında
`python3`, `make`, `g++` kurulur ve `node_modules` builder'dan olduğu gibi kopyalanır.

</details>

<br />

---

<a id="env"></a>

## 7. 🔑 Ortam Değişkenleri

<h3><code>backend/.env</code> &nbsp;<sub>şablon: <a href="backend/.env.example"><code>backend/.env.example</code></a></sub></h3>

<table>
<tr><th align="left">Değişken</th><th align="center">Zorunlu</th><th align="left">Açıklama</th></tr>
<tr><td><code>DATABASE_URL</code></td><td align="center">✅</td>
    <td>Uygulamanın çalışma anında kullandığı bağlantı. Supabase'de transaction-mode pooler
        (<code>:6543</code>, <code>?pgbouncer=true</code>). Tanımsızsa <code>PrismaService</code> açılışta hata verir.</td></tr>
<tr><td><code>DIRECT_URL</code></td><td align="center">✅</td>
    <td>Migration'ların kullandığı doğrudan bağlantı (Supabase'de session-mode pooler, <code>:5432</code>).
        <a href="backend/prisma.config.ts"><code>prisma.config.ts</code></a> datasource olarak bunu okur.</td></tr>
<tr><td><code>JWT_SECRET</code></td><td align="center">✅</td>
    <td>Token imzalama anahtarı. Üretimde uzun ve rastgele olmalı: <code>openssl rand -base64 48</code>.</td></tr>
<tr><td><code>JWT_EXPIRES_IN</code></td><td align="center">—</td>
    <td>Token geçerlilik süresi (<code>15m</code>, <code>1h</code>, <code>7d</code>). Varsayılan <code>1d</code>.</td></tr>
<tr><td><code>CORS_ORIGIN</code></td><td align="center">—</td>
    <td>Virgülle ayrılmış izinli tarayıcı kaynakları. Tanımsızsa <code>http://localhost:5174</code> +
        <code>http://127.0.0.1:5174</code>. <code>*</code> <b>desteklenmez</b>.</td></tr>
<tr><td><code>PORT</code></td><td align="center">—</td><td>API portu. Varsayılan <code>3000</code>.</td></tr>
<tr><td><code>NODE_ENV</code></td><td align="center">—</td><td>Compose üretim servisinde <code>production</code> olarak verilir.</td></tr>
<tr><td><code>SEED_YONETICI_SIFRE</code></td><td align="center">🌱</td>
    <td><code>admin@iha.com</code> hesabının şifresi. En az 8 karakter, aksi halde seed durur.</td></tr>
<tr><td><code>SEED_TEKNISYEN_SIFRE</code></td><td align="center">🌱</td>
    <td><code>teknisyen@iha.com</code> hesabının şifresi. En az 8 karakter.</td></tr>
</table>

<sub>✅ zorunlu &nbsp;·&nbsp; 🌱 yalnızca seed için zorunlu &nbsp;·&nbsp; — opsiyonel</sub>

<h3><code>frontend/.env</code> &nbsp;<sub>şablon: <a href="frontend/.env.example"><code>frontend/.env.example</code></a></sub></h3>

<table>
<tr><th align="left">Değişken</th><th align="center">Zorunlu</th><th align="left">Açıklama</th></tr>
<tr><td><code>VITE_API_URL</code></td><td align="center">—</td>
    <td>Backend adresi. Tanımsızsa <code>http://localhost:3000</code>. <b>Derleme zamanında gömülür</b>;
        değişince yeniden derlenmelidir.</td></tr>
</table>

<h3>Kök <code>.env</code> &nbsp;<sub>şablon: <a href=".env.example"><code>.env.example</code></a></sub></h3>

Yalnızca `docker-compose.yml` okur: `VITE_API_URL` (frontend build arg) ve `CORS_ORIGIN` (backend ortam değişkeni).
Uygulamanın gizli bilgileri buraya **yazılmaz**, `backend/.env` içinde durur.

> [!NOTE]
> `.gitignore`, `.env.example` dışındaki tüm `.env` dosyalarını ve `generated/`, `dist/`, `node_modules/` klasörlerini
> versiyon kontrolünün dışında tutar.

<br />

---

<a id="komutlar"></a>

## 8. ⌨️ Komutlar

<table>
<tr>
<td width="50%" valign="top">

<div align="center"><h3>⚙️ Backend</h3><sub><code>cd backend</code></sub></div>

| Komut | Açıklama |
|---|---|
| `npm run start:dev` | Watch modunda geliştirme sunucusu |
| `npm run start` | Tek seferlik başlatma |
| `npm run build` | `dist/` altına derleme (`nest build`) |
| `npm run start:prod` | Derlenmiş çıktıyı çalıştırır |
| `npm run lint` | ESLint + otomatik düzeltme |
| `npm run format` | Prettier |
| `npm test` | Jest birim testleri |
| `npm run test:cov` | Kapsam raporu |
| `npm run test:e2e` | e2e testler |
| `npx prisma generate` | Prisma istemcisini üretir |
| `npx prisma migrate dev --name <ad>` | Yeni migration (geliştirme) |
| `npx prisma migrate deploy` | Bekleyen migration'ları uygular |
| `npx prisma db seed` | `prisma/seed.ts` çalıştırır |
| `npx prisma studio` | Görsel veritabanı tarayıcısı |

</td>
<td width="50%" valign="top">

<div align="center"><h3>🖥️ Frontend</h3><sub><code>cd frontend</code></sub></div>

| Komut | Açıklama |
|---|---|
| `npm run dev` | Vite geliştirme sunucusu (`:5174`) |
| `npm run build` | `tsc -b && vite build` → `dist/` |
| `npm run preview` | Derlenmiş çıktıyı yerel olarak sunar |
| `npm run lint` | ESLint |

<br />

<div align="center"><h3>🐳 Docker</h3><sub>kök dizin</sub></div>

| Komut | Açıklama |
|---|---|
| `docker compose up --build` | İki servisi derleyip başlatır |
| `docker compose up -d` | Arka planda başlatır |
| `docker compose logs -f backend` | Backend loglarını izler |
| `docker compose down` | Servisleri durdurur |

</td>
</tr>
</table>

> [!NOTE]
> Derleme çıktısı `dist/src/main.js`'tir (kökte `prisma.config.ts` bulunduğu için çıktı `src/` altında iç içe kalır);
> `start:prod` ve Dockerfile aynı yolu kullanır.

<br />

---

<a id="api"></a>

## 9. 🔌 API Referansı

<div align="center">

Tam ve güncel dokümantasyon <b>Swagger UI</b>'dadır → <code>http://localhost:3000/api</code><br />
<sub>Korumalı uçlar için önce <code>POST /auth/login</code> ile token alın, sağ üstteki <b>Authorize</b> düğmesine yapıştırın.</sub>

<br />

<b>Yetki:</b> &nbsp;
<code>Genel</code> token gerekmez &nbsp;·&nbsp;
<code>Oturum</code> geçerli token yeterli &nbsp;·&nbsp;
🟣 <code>YONETICI</code> &nbsp;·&nbsp; 🔵 <code>TEKNISYEN</code>

</div>

<details open>
<summary><b>🔐 Kimlik doğrulama</b></summary>

| Metot | Yol | Yetki | Açıklama |
|:---:|---|:---:|---|
| `POST` | `/auth/login` | Genel | `{ email, sifre }` → `{ access_token, user }` |
| `GET` | `/auth/me` | Oturum | Token'dan çözülen kullanıcı |

</details>

<details>
<summary><b>⚙️ Parçalar</b></summary>

| Metot | Yol | Yetki | Açıklama |
|:---:|---|:---:|---|
| `GET` | `/parcalar` | Oturum | Liste; `search`, `kategoriId`, `ihaModeliId`, `page`, `limit` |
| `GET` | `/parcalar/kritik` | Oturum | Toplam stoğu kritik seviyenin altındaki parçalar |
| `GET` | `/parcalar/:id` | Oturum | Detay: kategori, uyumlu modeller, depo bazlı stok |
| `GET` | `/parcalar/:id/hareketler` | Oturum | Parçanın stok hareket geçmişi (sayfalı) |
| `POST` | `/parcalar` | 🟣 | Yeni parça |
| `PATCH` | `/parcalar/:id` | 🟣 | Güncelle |
| `POST` | `/parcalar/:id/uyumluluk` | 🟣 | İHA modeli uyumluluğu ekle |
| `DELETE` | `/parcalar/:id/uyumluluk/:ihaModeliId` | 🟣 | Uyumluluğu kaldır |

</details>

<details>
<summary><b>🏬 Stok</b></summary>

| Metot | Yol | Yetki | Açıklama |
|:---:|---|:---:|---|
| `GET` | `/stok` | 🟣 | Depo bazlı stok kalemleri; `depoId` |
| `GET` | `/stok/hareketler` | 🟣 | Hareket geçmişi; `parcaId`, `depoId`, `tip`, `page`, `limit` |
| `POST` | `/stok/giris` | 🟣 | `{ parcaId, depoId, miktar, aciklama?, rafKodu? }` |
| `POST` | `/stok/cikis` | 🟣 | `{ parcaId, depoId, miktar, aciklama? }` |

</details>

<details>
<summary><b>🧾 Talepler</b></summary>

| Metot | Yol | Yetki | Açıklama |
|:---:|---|:---:|---|
| `GET` | `/talepler` | Oturum | `durum` filtresi; teknisyen yalnızca kendi taleplerini görür |
| `GET` | `/talepler/:id` | Oturum | Detay (teknisyen başkasının talebine erişemez) |
| `POST` | `/talepler` | 🔵 | `{ parcaId, miktar, aciklama? }` |
| `PATCH` | `/talepler/:id/onayla` | 🟣 | Yalnızca `BEKLIYOR` durumundaki talepler |
| `PATCH` | `/talepler/:id/reddet` | 🟣 | `{ redSebebi }` zorunlu |

</details>

<details>
<summary><b>🚚 Siparişler</b></summary>

| Metot | Yol | Yetki | Açıklama |
|:---:|---|:---:|---|
| `GET` | `/siparisler` | 🟣 | Tüm siparişler (talep + tedarikçi ile) |
| `POST` | `/siparisler` | 🟣 | `{ talepId, tedarikciId, miktar, birimFiyat? }`; talep `ONAYLANDI` olmalı |
| `PATCH` | `/siparisler/:id/teslim-al` | 🟣 | `{ depoId? }`; stoğa işler, talebi `TESLIM_ALINDI` yapar |

</details>

<details>
<summary><b>🔧 Bakım</b></summary>

| Metot | Yol | Yetki | Açıklama |
|:---:|---|:---:|---|
| `GET` | `/bakim` | Oturum | `ihaAraciId`, `tip`, `page`, `limit` |
| `GET` | `/bakim/arac/:ihaAraciId` | Oturum | Tek aracın bakım geçmişi |
| `POST` | `/bakim/degistir` | Oturum | `{ ihaAraciId, parcaId, depoId?, miktar?, aciklama? }` — **stoktan düşer** |
| `POST` | `/bakim/tamir` | Oturum | `{ ihaAraciId, parcaId, aciklama? }` — stoğa dokunmaz |

</details>

<details>
<summary><b>📚 Tanımlar — <code>/kategoriler</code> · <code>/iha-modelleri</code> · <code>/iha-araclari</code> · <code>/tedarikciler</code> · <code>/depolar</code></b></summary>

Beşi de aynı deseni izler:

| Metot | Yol | Yetki |
|:---:|---|:---:|
| `GET` | `/<kaynak>` | Oturum |
| `GET` | `/<kaynak>/:id` | Oturum |
| `POST` | `/<kaynak>` | 🟣 |
| `PATCH` | `/<kaynak>/:id` | 🟣 |
| `DELETE` | `/<kaynak>/:id` | 🟣 |

</details>

<details>
<summary><b>👥 Kullanıcılar ve istatistik</b></summary>

| Metot | Yol | Yetki | Açıklama |
|:---:|---|:---:|---|
| `GET` | `/kullanicilar` | 🟣 | Liste |
| `POST` | `/kullanicilar` | 🟣 | Yeni hesap |
| `GET` | `/kullanicilar/:id` | 🟣 | Detay |
| `PATCH` | `/kullanicilar/:id` | 🟣 | Güncelle / `aktif: false` ile pasife al |
| `DELETE` | `/kullanicilar/:id` | 🟣 | Kalıcı silme; ilişkili kaydı varsa `400` |
| `GET` | `/istatistik/ozet` | Oturum | Dashboard özeti |

</details>

<br />

---

<a id="roller"></a>

## 10. 👥 Roller ve Ekran Yetkileri

<div align="center">

| Yetenek | 🔵 TEKNISYEN | 🟣 YONETICI |
|---|:---:|:---:|
| Dashboard, parça kataloğu, parça detayı | ✅ | ✅ |
| Parça ekleme / düzenleme, uyumluluk tanımlama | 🚫 | ✅ |
| Talep açma | ✅ | 🚫 |
| Talep listesi | *yalnızca kendi talepleri* | *tümü* |
| Talep onaylama / reddetme | 🚫 | ✅ |
| Araç listesi, araç detayı, bakım kaydı (değiştir/tamir) | ✅ | ✅ |
| Araç / model / kategori / depo / tedarikçi tanımlama | 🚫 | ✅ |
| Stok mevcudu ve stok hareketleri | 🚫 | ✅ |
| Stok giriş / çıkış | 🚫 | ✅ |
| Sipariş açma ve teslim alma | 🚫 | ✅ |
| Kullanıcı yönetimi | 🚫 | ✅ |

</div>

> [!IMPORTANT]
> Frontend rotaları ([`App.tsx`](frontend/src/App.tsx)) ve yan menü ([`lib/navigation.ts`](frontend/src/lib/navigation.ts))
> bu tabloya göre gizlenir; **asıl kısıt her durumda backend'deki `RolesGuard`'dır.**

<br />

---

<a id="yapi"></a>

## 11. 🗂️ Proje Yapısı

<table>
<tr>
<td width="50%" valign="top">

**⚙️ Backend**

```text
backend/src/
├── main.ts          # CORS beyaz listesi, ValidationPipe, Swagger
├── app.module.ts    # tüm özellik modüllerinin kaydı
├── prisma/          # PrismaService (PrismaPg) + global modül
├── common/
│   ├── decorators/  # @Roles(), @CurrentUser()
│   ├── guards/      # JwtAuthGuard, RolesGuard
│   ├── types/       # AuthUser (sifreHash içermez)
│   └── utils/       # Prisma → HTTP hata çevirici
├── auth/            # login, /me, JWT stratejisi
├── kullanicilar/    # hesap yönetimi (YONETICI)
├── kategoriler/
├── iha-modelleri/
├── iha-araclari/
├── tedarikciler/
├── depolar/
├── parcalar/        # katalog, arama, uyumluluk, kritik liste
├── stok/            # giriş/çıkış, hareket geçmişi, stoktanDus
├── talepler/        # talep akışı ve durum geçişleri
├── siparisler/      # sipariş açma ve teslim alma
├── bakim/           # değiştir / tamir kayıtları
└── istatistik/      # dashboard özeti
```

</td>
<td width="50%" valign="top">

**🖥️ Frontend**

```text
frontend/src/
├── App.tsx          # rotalar, QueryClient, AuthProvider
├── main.tsx         # giriş noktası
├── pages/           # Dashboard, Parçalar, Talepler,
│                    # Araçlar, Stok, Siparişler, ...
├── components/
│   ├── Layout.tsx
│   ├── ProtectedRoute.tsx
│   ├── TalepDurumStepper.tsx
│   ├── tanimlar/    # tanım ekranı form ve bölümleri
│   └── ui/          # Modal, Rozet, Sayfalama,
│                    # ParcaSecici, TemaDugmesi, ...
├── hooks/           # useParcalar, useStok, useTalepler,
│                    # useBakim, useIstatistik, ...
├── context/         # AuthContext, ThemeContext
├── lib/             # api.ts (axios + interceptor),
│                    # navigation.ts, stok.ts, talep.ts
└── types/           # paylaşılan TypeScript tipleri
```

</td>
</tr>
</table>

<br />

---

<a id="sorun"></a>

## 12. 🚑 Sorun Giderme

<table>
<tr><th align="left">Belirti</th><th align="left">Sebep / Çözüm</th></tr>

<tr><td><code>DATABASE_URL tanimli degil</code></td>
    <td><code>backend/.env</code> eksik veya yanlış klasörde. <code>.env.example</code>'dan kopyalayın.</td></tr>

<tr><td><code>CORS_ORIGIN '*' olamaz</code> diyerek backend açılmıyor</td>
    <td><code>main.ts</code> joker kaynağı bilerek reddeder; izinli adresleri tek tek listeleyin.</td></tr>

<tr><td>Tarayıcıda <i>"Sunucuya ulaşılamadı. Backend çalışıyor mu?"</i></td>
    <td>Backend kapalı ya da isteğin geldiği kaynak <code>CORS_ORIGIN</code> listesinde değil.</td></tr>

<tr><td>Derleme/çalıştırma <code>generated/prisma/client</code> bulamıyor</td>
    <td><code>npx prisma generate</code> çalıştırılmamış; <code>generated/</code> git'e girmez.</td></tr>

<tr><td><code>prisma migrate deploy</code> bağlanamıyor ama uygulama çalışıyor</td>
    <td>Migration <code>DIRECT_URL</code>'i kullanır (Supabase'de <code>:5432</code>), uygulama
        <code>DATABASE_URL</code>'i (<code>:6543</code>). İkisini ayrı ayrı doğrulayın.</td></tr>

<tr><td><code>SEED_YONETICI_SIFRE tanimli degil veya 8 karakterden kisa</code></td>
    <td>Seed şifreleri koda gömmez; <code>.env</code> içine en az 8 karakterlik değerler girin.</td></tr>

<tr><td>Vite <code>Port 5174 is already in use</code> deyip çıkıyor</td>
    <td><code>strictPort: true</code> bilinçlidir; portu boşaltın ya da <code>vite.config.ts</code>'te değiştirip
        <code>CORS_ORIGIN</code>'i güncelleyin.</td></tr>

<tr><td>Docker'da frontend eski API adresine gidiyor</td>
    <td><code>VITE_API_URL</code> derleme zamanında gömülür: <code>docker compose build frontend</code> ile yeniden derleyin.</td></tr>

<tr><td>Docker'da sayfa yenilenince 404</td>
    <td>SPA fallback'i nginx <code>try_files ... /index.html</code> ile çözer; özel bir nginx yapılandırması
        kullanıyorsanız aynısını ekleyin.</td></tr>

<tr><td><code>npm install</code> sırasında <code>bcrypt</code> derleme hatası</td>
    <td>Yerel derleme araçları eksik (Linux: <code>python3 make g++</code>); Node sürümünüzün desteklenen aralıkta
        olduğunu doğrulayın.</td></tr>

<tr><td>İstek <code>400</code> ile <code>property X should not exist</code> dönüyor</td>
    <td><code>ValidationPipe</code> <code>forbidNonWhitelisted</code> ile çalışır; DTO'da tanımsız alan gönderilemez.</td></tr>

<tr><td>Stok çıkışında <code>409</code></td>
    <td>Aynı stok kalemine eşzamanlı bir hareket geldi; işlemi tekrarlayın.</td></tr>
</table>

<br />

---

<div align="center">
<sub>
  🛩️ <b>İHA Envanter Sistemi</b> &nbsp;·&nbsp;
  <a href="#icindekiler">İçindekiler</a> &nbsp;·&nbsp;
  <a href="#api">API</a> &nbsp;·&nbsp;
  <a href="#sorun">Sorun Giderme</a>
</sub>
</div>
