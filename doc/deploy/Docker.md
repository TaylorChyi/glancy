# Docker 部署指引

> 目标：提供端到端的镜像构建、推送、上线与回滚流程，使任意环境能以 Docker 形式快速复制、零停机发布。

## 1. 镜像与标签策略
1. **命名规范**：
   - Backend：`registry.glancy.xyz/glancy/backend:<version>`
   - Website：`registry.glancy.xyz/glancy/website:<version>`
2. **版本来源**：所有 `<version>` 来自 Git Tag/`VERSION` 文件（见 `Versioning.md`），同时写入 `LABEL org.opencontainers.image.revision` 与 `SERVICE_VERSION` 环境变量。
3. **标签约定**：推送明确的 `vX.Y.Z` 标签，另附带 `latest` 仅用于 `local/dev`；`staging/prod` 只使用显式版本。
4. **保留策略**：每个仓库保留最近 5 个稳定版本和最近 3 个预发布版本，便于快速回滚。
5. **镜像签名**：使用 `cosign` 或 ACR 原生功能对镜像 tag 进行签名，签名摘要记录在发布单中。

## 2. Backend 镜像
### 2.1 Dockerfile
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
> `LOG_PATH` 默认指向 `/var/log/glancy`，运行容器时请挂载宿主机目录或持久卷。

### 2.2 构建与推送
```bash
cd backend
export VERSION=v1.4.0
DOCKER_BUILDKIT=1 docker buildx build --platform linux/amd64 \
  -t registry.glancy.xyz/glancy/backend:$VERSION \
  --build-arg GIT_SHA=$(git rev-parse HEAD) \
  --label org.opencontainers.image.revision=$(git rev-parse HEAD) \
  .
docker push registry.glancy.xyz/glancy/backend:$VERSION
docker tag registry.glancy.xyz/glancy/backend:$VERSION registry.glancy.xyz/glancy/backend:latest
docker push registry.glancy.xyz/glancy/backend:latest  # 仅供 local/dev 使用
```

### 2.3 运行时注入
- 单容器：
  ```bash
  docker run -d --name glancy-backend \
    --env-file ./env/prod-backend.env \
    -p 8080:8080 \
    -v /var/log/glancy:/var/log/glancy \
    registry.glancy.xyz/glancy/backend:$VERSION
  ```
- Compose：通过 `env_file` 与 `secrets` 块加载，示例见第 4 节。

## 3. Website 镜像
### 3.1 Dockerfile（静态发布 + Nginx）
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
> 若采用 SSR，请将第二阶段替换为 `node:20-alpine` 并运行 `node ops/server/index.js`，同时开放 `PORT`。

### 3.2 构建与推送
```bash
cd website
export VERSION=v1.4.0
docker buildx build --platform linux/amd64 \
  -t registry.glancy.xyz/glancy/website:$VERSION \
  --build-arg GIT_SHA=$(git rev-parse HEAD) .
docker push registry.glancy.xyz/glancy/website:$VERSION
```

## 4. Compose 样例（local/dev）
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
BACKEND_VERSION=v1.4.0 WEB_VERSION=v1.4.0 docker compose up -d
```

## 5. 零停机发布
1. **蓝绿策略**：
   - 以 `backend-blue`、`backend-green` 两组容器配合外部负载均衡（Nginx/Traefik）。
   - 发布时启动新颜色容器，待 `/actuator/health/readiness` 返回 `UP` 后切换流量，再下线旧容器。
2. **滚动策略（Swarm/单节点 K8s）**：
   ```bash
   docker service update \
     --image registry.glancy.xyz/glancy/backend:v1.4.1 \
     --update-parallelism 1 \
     --update-delay 30s \
     --update-failure-action rollback \
     glancy-backend
   ```
3. **健康探针**：
   - Backend：`/actuator/health`、`/actuator/health/liveness`、`/actuator/health/readiness`。
   - Website：静态站点可通过 `curl -sf http://127.0.0.1/healthz`（Nginx `location /healthz { return 200 'ok'; }`）。

## 6. 回滚流程
1. **定位镜像**：`docker images | grep glancy-backend`，确认历史 tag 存在。
2. **Compose 环境**：
   ```bash
   BACKEND_VERSION=v1.4.0 WEB_VERSION=v1.4.0 docker compose up -d --force-recreate
   ```
3. **单容器**：`docker stop glancy-backend && docker rm glancy-backend && docker run ... registry.glancy.xyz/glancy/backend:v1.4.0`
4. **验证**：
   - `curl http://localhost:8080/actuator/info` 确认 `git.commit.id`。
   - 监控系统观察错误率恢复，日志无新异常。

## 7. CI/CD 集成
1. 在 CI 中使用 `docker buildx build --push` 生成多架构镜像，可通过 `--platform linux/amd64,linux/arm64`。
2. 发布流水线拉取镜像后执行：
   ```bash
   docker compose pull backend website
   docker compose up -d --no-deps backend website
   docker compose ps
   ```
3. 流水线健康门槛：`./mvnw test`、`npm run lint`、`npm test`、端到端测试脚本。
4. 产出记录：镜像 digest、构建时间、Git 提交、变更链接需写入发布单，确保回滚可追踪。

通过上述流程，Docker 层能提供标准化的构建、探活、零停机发布与回滚能力，为 K8s 等上层部署方式提供稳定基线。
