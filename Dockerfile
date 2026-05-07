FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci

RUN npx prisma generate

COPY . .
RUN npm run build

# ---- Production image ----
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV TZ=Asia/Ho_Chi_Minh

COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci --omit=dev
COPY --from=builder /app/src/generated ./src/generated

COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Run migrations then start the app
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
