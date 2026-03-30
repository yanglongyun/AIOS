FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY README.md README_en.md ./
COPY apps ./apps
COPY language ./language
COPY memory ./memory
COPY scripts ./scripts
COPY server ./server
COPY shared ./shared
COPY skills ./skills
COPY ui ./ui

RUN mkdir -p /app/database /app/files
RUN npm run build

FROM node:22-bookworm-slim AS runtime

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    wget \
    iputils-ping \
    procps \
    git \
    python3 \
    zip \
    unzip \
    vim-tiny \
    nano \
    && ln -sf /usr/bin/vim.tiny /usr/bin/vim \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY README.md README_en.md ./
COPY apps ./apps
COPY language ./language
COPY memory ./memory
COPY scripts ./scripts
COPY server ./server
COPY shared ./shared
COPY skills ./skills
COPY ui ./ui
COPY --from=build /app/ui/dist ./ui/dist

RUN mkdir -p /app/database /app/files

EXPOSE 9700

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD ["node", "-e", "fetch('http://127.0.0.1:9700/aios/apps/health').then((res)=>process.exit(res.ok?0:1)).catch(()=>process.exit(1))"]

CMD ["bash", "scripts/start-prod.sh"]
