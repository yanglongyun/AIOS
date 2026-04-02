FROM node:22-alpine
RUN apk add --no-cache bash

WORKDIR /app

COPY . .

# 安装依赖（含 better-sqlite3 native rebuild）
RUN npm install

# 编译前端
RUN npm run build

EXPOSE 9700

CMD ["sh", "-c", "node apps/index.js & node server/index.js"]
