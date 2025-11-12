# Docker 部署指引

> 目标：提供可复现的 Docker 镜像构建、推送、上线与回滚流程，使任意环境能够在最少人工干预的情况下完成发布。

## 1. 镜像分层与标签策略
1. **命名规范**：
   - Backend：`registry.glancy.xyz/glancy/backend:<version>`
   - Website：`registry.glancy.xyz/glancy/website:<version>`
2. **版本来源**：遵循 `doc/deploy/Versioning.md` 中的 SemVer；CI 在 tag 时写入 `VERSION` 文件并作为 `--build-arg GIT_SHA`。
3. **标签**：同一个镜像同时推送 `vX.Y.Z` 与 `latest`（仅供 `dev` 使用），`prod` 永远使用显式版本标签。
4. **回滚策略**：保留最近 5 个 `vX.Y.Z` 镜像；`docker rollout` 或 Compose 通过 `docker compose pull backend:vX.Y.(Z-1)` + `up -d` 完成回滚。

## 2. Backend 镜像
### 2.1 Dockerfile（示例）
```dockerfile
# backend/Dockerfile
FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:17-jre
ENV JAVA_TOOL_OPTIONS="-XX:+UseG1GC -XX:MaxRAMPercentage=75"
WORKDIR /opt/glancy
COPY --from=build /app/target/glancy-*.jar app.jar
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD curl -f http://localhost:8080/actuator/health || exit 1
ENTRYPOINT ["java","-jar","/opt/glancy/app.jar"]
```
> 说明：`logback-spring.xml` 读取 `LOG_PATH`，容器启动前请 `docker run -v /var/log/glancy:/var/log/glancy` 或在 K8s 中使用持久卷。

### 2.2 构建与推送
```bash
cd backend
export VERSION=v1.3.0
docker buildx build --platform linux/amd64 -t registry.glancy.xyz/glancy/backend:$VERSION .
docker push registry.glancy.xyz/glancy/backend:$VERSION
```

### 2.3 环境变量注入
- `docker run`：
  ```bash
  docker run -d --name glancy-backend \
    --env-file ./env/prod-backend.env \
    -p 8080:8080 \
    -v /var/log/glancy:/var/log/glancy \
    registry.glancy.xyz/glancy/backend:$VERSION
  ```
- `docker compose`：使用 `secrets` 字段挂载，示例见第 4 节。

## 3. Website 镜像
### 3.1 Dockerfile（静态 + Nginx）
```dockerfile
# website/Dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY ops/server/config/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
HEALTHCHECK --interval=30s --timeout=5s CMD wget -q -O- http://localhost/ || exit 1
```
> 若需服务端渲染，可改为 `node ops/server/index.js`，并将 `PORT` 暴露出来。
>
> 若 `ops/server/config/nginx.conf` 尚未创建，可删除 `COPY ops/server/config/nginx.conf ...` 行或根据环境自行添加配置文件。

### 3.2 构建与推送
```bash
cd website
export VERSION=v1.3.0
docker buildx build --platform linux/amd64 -t registry.glancy.xyz/glancy/website:$VERSION .
docker push registry.glancy.xyz/glancy/website:$VERSION
```

## 4. Compose 协调运行（local/dev）
```yaml
# deploy/compose/docker-compose.yml
version: "3.9"
services:
  db:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: glancy_db
      MYSQL_USER: glancy_user
      MYSQL_PASSWORD: ${DB_PASSWORD}
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
    volumes:
      - db-data:/var/lib/mysql
  backend:
    image: registry.glancy.xyz/glancy/backend:${BACKEND_VERSION}
    depends_on:
      db:
        condition: service_healthy
    env_file:
      - ./env/backend.env
    ports:
      - "8080:8080"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
    restart: unless-stopped
  website:
    image: registry.glancy.xyz/glancy/website:${WEB_VERSION}
    env_file:
      - ./env/website.env
    ports:
      - "5173:80"
volumes:
  db-data:
```
运行：
```bash
BACKEND_VERSION=v1.3.0 WEB_VERSION=v1.3.0 docker compose up -d
```

## 5. 零停机发布（Docker 环境）
1. **蓝绿策略**：
   - 以 `backend-blue`、`backend-green` 两个容器实例并行运行，前置反向代理 (Nginx/Traefik) 通过标签路由。
   - 发布时启动新版本容器（例如 `backend-green`，使用新 tag），通过 `/actuator/health` 与业务探活验收后切换负载均衡到新版本，再下线旧实例。
2. **Rolling 策略**（Swarm/K3s 单节点）：
   - `docker service update --image registry.../backend:v1.3.1 --update-parallelism 1 --update-delay 30s glancy-backend`。
   - 设置 `--update-failure-action rollback` 保证探活失败自动回滚。
3. **健康检查**：
   - HTTP：`/actuator/health`（活跃探针），`/actuator/health/liveness`、`/actuator/health/readiness` 由 Spring Actuator 自动暴露（若未开启分级，可在 `management.endpoint.health.group` 配置）。
   - 前端静态站点可使用 `curl -sf http://127.0.0.1/healthz`（由 Nginx `stub_status` 或自定义 location 提供）。

## 6. 回滚流程
1. **选择旧镜像**：`docker images | grep glancy-backend`，确认目标版本存在。
2. **Compose 环境**：
   ```bash
   BACKEND_VERSION=v1.3.0 WEB_VERSION=v1.3.0 docker compose up -d --force-recreate
   ```
3. **单容器**：`docker stop glancy-backend && docker rm glancy-backend && docker run ...registry/glancy/backend:v1.3.0`
4. **验证**：
   - `curl http://localhost:8080/actuator/info` 确认 `git.commit.id` 为旧版本。
   - 检查业务日志无新的错误堆栈。

## 7. 与 CI/CD 集成
1. 在 CI 中生成镜像：`docker buildx build --push` + `--provenance=false`（如不需要 attestation）。
2. 使用 `cosign` 或 ACR 原生签名对镜像 Tag 进行签名并记录在发布单中。
3. 在部署流水线中传入 `VERSION`，并在 `deploy` 作业中执行：
   ```bash
   docker compose pull backend website
   docker compose up -d --no-deps backend website
   docker compose ps
   ```
4. 若流水线包含验证步骤，可使用 `scripts/check-doc-links.mjs`、`npm test` 和 `./mvnw test` 作为质量闸门。

以上步骤可确保 Docker 层面的构建、配置、健康检查与回滚全流程闭环，为更高级的 K8s 发布提供基础镜像与探活能力。
