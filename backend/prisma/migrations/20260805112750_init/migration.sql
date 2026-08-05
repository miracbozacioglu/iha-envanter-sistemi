-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('TEKNISYEN', 'YONETICI');

-- CreateEnum
CREATE TYPE "HareketTipi" AS ENUM ('GIRIS', 'CIKIS');

-- CreateEnum
CREATE TYPE "TalepDurumu" AS ENUM ('BEKLIYOR', 'ONAYLANDI', 'REDDEDILDI', 'SIPARIS_VERILDI', 'TESLIM_ALINDI');

-- CreateEnum
CREATE TYPE "BakimTipi" AS ENUM ('DEGISTIRILDI', 'TAMIR_EDILDI');

-- CreateTable
CREATE TABLE "Kullanici" (
    "id" SERIAL NOT NULL,
    "ad" TEXT NOT NULL,
    "soyad" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "sifreHash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'TEKNISYEN',
    "unvan" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "olusturma" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Kullanici_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kategori" (
    "id" SERIAL NOT NULL,
    "ad" TEXT NOT NULL,
    "aciklama" TEXT,

    CONSTRAINT "Kategori_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IhaModeli" (
    "id" SERIAL NOT NULL,
    "ad" TEXT NOT NULL,
    "uretici" TEXT NOT NULL,
    "aciklama" TEXT,

    CONSTRAINT "IhaModeli_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IhaAraci" (
    "id" SERIAL NOT NULL,
    "kuyrukNo" TEXT NOT NULL,
    "ihaModeliId" INTEGER NOT NULL,
    "durum" TEXT NOT NULL DEFAULT 'AKTIF',
    "aciklama" TEXT,
    "olusturma" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IhaAraci_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Parca" (
    "id" SERIAL NOT NULL,
    "kod" TEXT NOT NULL,
    "ad" TEXT NOT NULL,
    "aciklama" TEXT,
    "birim" TEXT NOT NULL DEFAULT 'adet',
    "kritikSeviye" INTEGER NOT NULL DEFAULT 5,
    "arizali" BOOLEAN NOT NULL DEFAULT false,
    "kategoriId" INTEGER NOT NULL,
    "olusturma" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncelleme" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Parca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParcaUyumluluk" (
    "parcaId" INTEGER NOT NULL,
    "ihaModeliId" INTEGER NOT NULL,

    CONSTRAINT "ParcaUyumluluk_pkey" PRIMARY KEY ("parcaId","ihaModeliId")
);

-- CreateTable
CREATE TABLE "Depo" (
    "id" SERIAL NOT NULL,
    "ad" TEXT NOT NULL,
    "lokasyon" TEXT,

    CONSTRAINT "Depo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StokKalem" (
    "id" SERIAL NOT NULL,
    "parcaId" INTEGER NOT NULL,
    "depoId" INTEGER NOT NULL,
    "miktar" INTEGER NOT NULL DEFAULT 0,
    "rafKodu" TEXT,

    CONSTRAINT "StokKalem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StokHareketi" (
    "id" SERIAL NOT NULL,
    "parcaId" INTEGER NOT NULL,
    "depoId" INTEGER NOT NULL,
    "tip" "HareketTipi" NOT NULL,
    "miktar" INTEGER NOT NULL,
    "aciklama" TEXT,
    "kullaniciId" INTEGER NOT NULL,
    "tarih" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StokHareketi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParcaTalebi" (
    "id" SERIAL NOT NULL,
    "parcaId" INTEGER NOT NULL,
    "miktar" INTEGER NOT NULL,
    "aciklama" TEXT,
    "durum" "TalepDurumu" NOT NULL DEFAULT 'BEKLIYOR',
    "teknisyenId" INTEGER NOT NULL,
    "onaylayanId" INTEGER,
    "redSebebi" TEXT,
    "olusturma" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncelleme" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParcaTalebi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tedarikci" (
    "id" SERIAL NOT NULL,
    "ad" TEXT NOT NULL,
    "telefon" TEXT,
    "email" TEXT,

    CONSTRAINT "Tedarikci_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Siparis" (
    "id" SERIAL NOT NULL,
    "talepId" INTEGER NOT NULL,
    "tedarikciId" INTEGER NOT NULL,
    "miktar" INTEGER NOT NULL,
    "birimFiyat" DECIMAL(10,2),
    "siparisTarihi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "teslimTarihi" TIMESTAMP(3),
    "teslimAlindi" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Siparis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BakimKaydi" (
    "id" SERIAL NOT NULL,
    "ihaAraciId" INTEGER NOT NULL,
    "parcaId" INTEGER NOT NULL,
    "kullaniciId" INTEGER NOT NULL,
    "tip" "BakimTipi" NOT NULL,
    "aciklama" TEXT,
    "tarih" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BakimKaydi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Kullanici_email_key" ON "Kullanici"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Kategori_ad_key" ON "Kategori"("ad");

-- CreateIndex
CREATE UNIQUE INDEX "IhaAraci_kuyrukNo_key" ON "IhaAraci"("kuyrukNo");

-- CreateIndex
CREATE UNIQUE INDEX "Parca_kod_key" ON "Parca"("kod");

-- CreateIndex
CREATE UNIQUE INDEX "StokKalem_parcaId_depoId_key" ON "StokKalem"("parcaId", "depoId");

-- CreateIndex
CREATE UNIQUE INDEX "Tedarikci_ad_key" ON "Tedarikci"("ad");

-- CreateIndex
CREATE UNIQUE INDEX "Siparis_talepId_key" ON "Siparis"("talepId");

-- AddForeignKey
ALTER TABLE "IhaAraci" ADD CONSTRAINT "IhaAraci_ihaModeliId_fkey" FOREIGN KEY ("ihaModeliId") REFERENCES "IhaModeli"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parca" ADD CONSTRAINT "Parca_kategoriId_fkey" FOREIGN KEY ("kategoriId") REFERENCES "Kategori"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParcaUyumluluk" ADD CONSTRAINT "ParcaUyumluluk_parcaId_fkey" FOREIGN KEY ("parcaId") REFERENCES "Parca"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParcaUyumluluk" ADD CONSTRAINT "ParcaUyumluluk_ihaModeliId_fkey" FOREIGN KEY ("ihaModeliId") REFERENCES "IhaModeli"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StokKalem" ADD CONSTRAINT "StokKalem_parcaId_fkey" FOREIGN KEY ("parcaId") REFERENCES "Parca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StokKalem" ADD CONSTRAINT "StokKalem_depoId_fkey" FOREIGN KEY ("depoId") REFERENCES "Depo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StokHareketi" ADD CONSTRAINT "StokHareketi_parcaId_fkey" FOREIGN KEY ("parcaId") REFERENCES "Parca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StokHareketi" ADD CONSTRAINT "StokHareketi_depoId_fkey" FOREIGN KEY ("depoId") REFERENCES "Depo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StokHareketi" ADD CONSTRAINT "StokHareketi_kullaniciId_fkey" FOREIGN KEY ("kullaniciId") REFERENCES "Kullanici"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParcaTalebi" ADD CONSTRAINT "ParcaTalebi_parcaId_fkey" FOREIGN KEY ("parcaId") REFERENCES "Parca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParcaTalebi" ADD CONSTRAINT "ParcaTalebi_teknisyenId_fkey" FOREIGN KEY ("teknisyenId") REFERENCES "Kullanici"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParcaTalebi" ADD CONSTRAINT "ParcaTalebi_onaylayanId_fkey" FOREIGN KEY ("onaylayanId") REFERENCES "Kullanici"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Siparis" ADD CONSTRAINT "Siparis_talepId_fkey" FOREIGN KEY ("talepId") REFERENCES "ParcaTalebi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Siparis" ADD CONSTRAINT "Siparis_tedarikciId_fkey" FOREIGN KEY ("tedarikciId") REFERENCES "Tedarikci"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BakimKaydi" ADD CONSTRAINT "BakimKaydi_ihaAraciId_fkey" FOREIGN KEY ("ihaAraciId") REFERENCES "IhaAraci"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BakimKaydi" ADD CONSTRAINT "BakimKaydi_parcaId_fkey" FOREIGN KEY ("parcaId") REFERENCES "Parca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BakimKaydi" ADD CONSTRAINT "BakimKaydi_kullaniciId_fkey" FOREIGN KEY ("kullaniciId") REFERENCES "Kullanici"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
