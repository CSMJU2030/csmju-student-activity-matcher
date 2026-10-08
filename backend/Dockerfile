# ---------- build stage ----------
# build context คือ "รากของ repo" เพราะ pnpm workspace เก็บ lockfile ไว้ที่ราก
#   docker build -f backend/Dockerfile .
FROM node:22-alpine AS builder

WORKDIR /app
RUN corepack enable pnpm

# `prisma generate` (postinstall) โหลด prisma.config.ts ซึ่งต้องมี DATABASE_URL
# การ generate ไม่ได้ต่อฐานข้อมูล ค่านี้จึงเป็นแค่ placeholder ตอน build
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build_only

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY backend/package.json backend/
# the postinstall hook runs `prisma generate`, which needs the schema and config
COPY backend/prisma backend/prisma
COPY backend/prisma.config.ts backend/prisma.config.ts
RUN pnpm install --frozen-lockfile --filter backend...

COPY backend/ backend/
RUN pnpm --filter backend exec prisma generate \
 && pnpm --filter backend build

# ---------- runtime stage ----------
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production     COREPACK_ENABLE_DOWNLOAD_PROMPT=0     PORT=4000
RUN corepack enable pnpm

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
# postinstall ของ backend คือ `prisma generate` ซึ่งต้องเห็น schema ตั้งแต่ตอน install
COPY backend/package.json backend/prisma.config.ts backend/
COPY backend/prisma backend/prisma
# ต้องรัน install script (ห้าม --ignore-scripts): @prisma/engines ดาวน์โหลด schema-engine
# ที่ `prisma migrate deploy` ใช้ตอนนี้ — ข้ามไปแล้ว container บน server (read-only)
# จะพยายามดาวน์โหลดตอนสตาร์ตและล้มด้วย "Could not find schema-engine binary"
# store ของ pnpm ลบทิ้งใน RUN เดียวกัน ไม่งั้นติดไปใน image อีกหลายร้อย MB
RUN pnpm install --frozen-lockfile --prod --filter backend...       --store-dir /tmp/pnpm-store  && rm -rf /tmp/pnpm-store /root/.cache/pnpm

# dist/ มีทั้งโค้ดที่ compile แล้ว (dist/src) และ Prisma client (dist/generated/prisma)
# ไฟล์เป็นของ root แต่ทุกคนอ่านได้ — user node ไม่ต้องเขียนอะไรใน /app
# (ไม่ chown -R ทั้ง /app: Docker จะเก็บทุกไฟล์ซ้ำอีกชั้น image โตขึ้นเท่าตัว)
COPY --from=builder /app/backend/dist ./backend/dist
COPY --chmod=755 backend/docker/entrypoint.sh ./backend/docker/entrypoint.sh

USER node
WORKDIR /app/backend

EXPOSE 4000

# compose บน server รอ api healthy ก่อนเปิด web (deployment.md ข้อ 7.2)
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5   CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["./docker/entrypoint.sh"]
CMD ["node", "dist/src/main.js"]
