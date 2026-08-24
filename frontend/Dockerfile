# syntax=docker/dockerfile:1

###############################################################################
# Stage 1 — builder
###############################################################################
FROM node:20-alpine AS builder

WORKDIR /app

# Once manifest'ler: kaynak degisince npm ci katmani tekrar calismasin.
COPY package*.json ./
RUN npm ci

COPY . .

# Vite, VITE_ onekli degiskenleri DERLEME aninda pakete gomer; nginx'e verilen
# calisma zamani degiskenleri hazir bundle'i etkilemez. Bu yuzden adres build
# arg olarak geliyor (docker-compose build.args ile besleniyor).
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

###############################################################################
# Stage 2 — production (statik sunum)
###############################################################################
FROM nginx:alpine AS production

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
