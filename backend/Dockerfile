# syntax=docker/dockerfile:1

###############################################################################
# Stage 1 — builder
###############################################################################
FROM node:20-alpine AS builder

# bcrypt yerel (native) bir modul: alpine/musl icin hazir binary yayinlanmadigi
# icin kaynaktan derleniyor, bu da python3 + derleyici istiyor.
# openssl Prisma CLI icin gerekli.
RUN apk add --no-cache python3 make g++ openssl

WORKDIR /app

# Once yalnizca manifest'ler: kaynak degisince npm ci katmani tekrar calismasin.
COPY package*.json ./
RUN npm ci

# Prisma istemcisi generated/prisma altina uretiliyor (schema'daki output).
# generate icin semaya ve config dosyasina ihtiyac var.
COPY prisma ./prisma
COPY prisma.config.ts ./

# prisma.config.ts, datasource url'ini DIRECT_URL'den okuyor. `generate`
# veritabanina baglanmaz ama degisken tanimsizken config yuklenmesi patlayabilir;
# derleme asamasina zararsiz bir yer tutucu veriyoruz.
ENV DIRECT_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN npx prisma generate

COPY . .
RUN npm run build

###############################################################################
# Stage 2 — production
###############################################################################
FROM node:20-alpine AS production

# Prisma CLI ve native modullerin calisma zamani bagimliliklari.
RUN apk add --no-cache openssl

ENV NODE_ENV=production
WORKDIR /app

# node_modules builder'dan oldugu gibi aliniyor. Iki sebep:
#  1) bcrypt'in derlenmis .node binary'si tasinsin (ayni alpine tabani, ayni mimari),
#  2) `prisma migrate deploy` icin Prisma CLI + prisma.config.ts'i yukleyecek
#     typescript/tsx gerekiyor; bunlar devDependencies altinda.
# Bu yuzden bilerek `--omit=dev` kullanmiyoruz.
COPY --from=builder /app/node_modules ./node_modules

# node_modules devDependencies'i de tasidigi icin yalnizca DERLEME ve TEST
# araclarini atiyoruz. Prisma CLI, typescript ve tsx bilerek birakiliyor:
# `prisma migrate deploy` ve prisma.config.ts'in yuklenmesi bunlara bagli.
RUN rm -rf \
      node_modules/@nestjs/cli \
      node_modules/@angular-devkit \
      node_modules/webpack \
      node_modules/jest \
      node_modules/@jest \
      node_modules/ts-jest \
      node_modules/eslint \
      node_modules/@eslint \
      node_modules/typescript-eslint \
      node_modules/@typescript-eslint \
      node_modules/prettier \
      node_modules/supertest

# Calisma anindaki Prisma istemcisi dist/generated altinda (nest build uretiyor);
# kokteki generated/ yalnizca .ts kaynagi oldugu icin imaja alinmiyor.
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/package.json ./

EXPOSE 3000

# Once bekleyen migration'lar uygulanir, sonra uygulama baslar.
# Dikkat: nest build ciktisi dist/src/main.js (prisma.config.ts kokte oldugu
# icin derleme ciktisi src/ altinda nested kaliyor) — package.json'daki
# start:prod scripti de ayni yolu kullaniyor.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]
