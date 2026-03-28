FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY README.md README_en.md ./
COPY apps ./apps
COPY memory ./memory
COPY scripts ./scripts
COPY server ./server
COPY shared ./shared
COPY skills ./skills
COPY ui ./ui
COPY tsconfig.backend.json ./

RUN mkdir -p /app/database /app/files

ARG LOCALE=zh
RUN npx tsx scripts/apply-locale.ts ${LOCALE}
RUN npm run build

FROM node:22-bookworm-slim AS runtime

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY README.md README_en.md ./
COPY apps ./apps
COPY memory ./memory
COPY scripts ./scripts
COPY server ./server
COPY shared ./shared
COPY skills ./skills
COPY tsconfig.backend.json ./
COPY ui ./ui
COPY --from=build /app/ui/dist ./ui/dist

RUN mkdir -p /app/database /app/files

EXPOSE 9700

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD ["node", "-e", "fetch('http://127.0.0.1:9700/aios/apps/health').then((res)=>process.exit(res.ok?0:1)).catch(()=>process.exit(1))"]

CMD ["bash", "scripts/start-prod.sh"]
