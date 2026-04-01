# Docker 本地测试

在 Docker 环境中构建并运行 AIOS，用于本地测试。

## 快速开始

```bash
# 从项目根目录执行
docker compose -f dev/docker/docker-compose.yml up --build -d
```

访问 http://localhost:9700

## 常用命令

```bash
# 启动（已构建过则跳过 --build）
docker compose -f dev/docker/docker-compose.yml up -d

# 查看日志
docker compose -f dev/docker/docker-compose.yml logs -f

# 停止
docker compose -f dev/docker/docker-compose.yml down

# 清空数据
docker compose -f dev/docker/docker-compose.yml down -v
```

## 改代码后重新构建

```bash
docker compose -f dev/docker/docker-compose.yml up --build -d
```

## 注意

- 数据存在 Docker volume 里，`down` 不会清除，`down -v` 才会
- 语言替换（`__T_XXX__`）在安装流程里自动完成，不需要手动处理
- apps 服务（端口 9701）只监听容器内部，外部不可直接访问
