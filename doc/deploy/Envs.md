# Envs

> 目标：把任何一台“空白”机器或集群节点变成可以运行 Glancy 的环境，确保配置可复制、密钥可审计、上线可回滚。

## 1. 环境矩阵
| 环境 | 用途 | 基础设施 | 入口/域名 | 关联分支/版本 |
| --- | --- | --- | --- | --- |
| `local` | 单兵调试、录制回归脚本 | Docker Compose + 本机 Node/Maven | `http://localhost:5173`, `http://localhost:8080` | 任意 `feature/*` |
| `dev` | CI 自测、集成校验 | 共享 ECS + systemd，镜像拉取自 ACR `registry.glancy.xyz/dev` | `https://dev.api.glancy.xyz` | `develop` + 自动构建号 |
| `staging` | 上线前完整演练，含真实依赖与监控 | ACK/K8s 命名空间 `glancy-staging`，镜像仓库 `registry.glancy.xyz/staging` | `https://staging.api.glancy.xyz`、CDN 预发域 | `release/vX.Y.Z` 或 `vX.Y.Z-rc.N` |
| `prod` | 面向用户的正式环境 | ACK/K8s 命名空间 `glancy-prod`，多可用区 MySQL/OSS/TTS | `https://api.glancy.xyz`, `https://www.glancy.xyz` | `main` + 已发布 tag `vX.Y.Z` |

> 所有环境必须显式设置 `SPRING_PROFILES_ACTIVE` 并从 Secrets Manager 读取密钥；禁止将明文凭证写入 Git 或镜像。

## 2. 前置依赖（通用）
1. **JDK 17**：需在 PATH 中暴露 `java` 与 `keytool`，与 `backend/pom.xml` 的 `<java.version>` 保持一致。
2. **Node.js 20 LTS + npm 10**：用于构建 `website`、运维脚本与 Storybook。
3. **Maven Wrapper**：仓库已提供 `./mvnw`；如安装全局 Maven，请保证 3.9+。
4. **数据库**：MySQL 8.0，库名 `glancy_db`，字符集 `utf8mb4`。初始化命令：
   ```sql
   CREATE DATABASE IF NOT EXISTS glancy_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'glancy_user'@'%' IDENTIFIED BY '<password>';
   GRANT ALL ON glancy_db.* TO 'glancy_user'@'%';
   FLUSH PRIVILEGES;
   ```
5. **对象存储**：阿里云 OSS 桶 `glancy-avatar-bucket`（多环境可使用不同前缀），需具备可读写 STS 角色。
6. **第三方服务**：已申请火山引擎 TTS、豆包 LLM 账号并具备 API Key；演示环境需配置独立配额。
7. **操作系统依赖**：`apt-get install openjdk-17-jre-headless nodejs npm mysql-client unzip`。

## 3. 环境变量与密钥清单
表格中 `Secret 路径` 采用阿里云 Secrets Manager 约定：`sm://glancy/<env>/<service>/<key>`，CI/CD 通过 RAM 角色读取。

### 3.1 Backend（`backend` 模块）
| 变量/属性 | 描述 | 示例值 | Secret 路径/来源 |
| --- | --- | --- | --- |
| `SPRING_PROFILES_ACTIVE` | Spring Profile，决定使用的配置文件 | `prod` | CI/CD 注入 |
| `SPRING_DATASOURCE_URL` | MySQL 连接串 | `jdbc:mysql://mysql.internal:3306/glancy_db?useSSL=true&serverTimezone=Asia/Shanghai&characterEncoding=utf8` | ConfigMap（按环境区分） |
| `SPRING_DATASOURCE_USERNAME` | MySQL 用户名 | `glancy_user` | ConfigMap |
| `DB_PASSWORD` / `SPRING_DATASOURCE_PASSWORD` | MySQL 密码 | `********` | `sm://glancy/<env>/backend/db_password` |
| `GLANCY_SMTP_PASSWORD` | 发信邮箱密码 | `********` | `sm://glancy/<env>/backend/smtp_password` |
| `THIRDPARTY_DOUBAO_API_KEY` | 豆包模型访问密钥（映射至 `thirdparty.doubao.api-key`） | `volces-***` | `sm://glancy/<env>/backend/doubao_api_key` |
| `OSS_ACCESS_KEY_ID` / `OSS_ACCESS_KEY_SECRET` / `OSS_SECURITY_TOKEN` | OSS STS 凭证 | 按 STS 生成 | `sm://glancy/<env>/shared/oss` |
| `VOLCENGINE_APP_ID` / `VOLCENGINE_ACCESS_TOKEN` | 火山引擎 TTS 凭证（映射至 `tts.volcengine`） | `tts-***` | `sm://glancy/<env>/backend/tts` |
| `TTS_CONFIG_PATH` | 可选，指向外部 `tts-config.yml` 以支持热更新 | `/etc/glancy/tts/tts-config.yml` | ConfigMap/挂载 |
| `LOG_PATH` | 日志目录供 `logback-spring.xml` 使用 | `/var/log/glancy` | 节点预先创建 |
| `SERVER_PORT` | HTTP 监听端口 | `8080` | ConfigMap |
| `JAVA_TOOL_OPTIONS` | JVM 内存/诊断参数 | `-XX:+UseG1GC -Xms512m -Xmx1024m` | ConfigMap |

### 3.2 Website（`website` 模块）
| 变量 | 作用 | 示例值 | Secret/配置位置 |
| --- | --- | --- | --- |
| `VITE_SHARE_BASE_URL` | 生成分享链接的前缀 | `https://www.glancy.xyz/share` | ConfigMap（随前端部署） |
| `VITE_REPORT_FORM_URL` | 问题反馈表单地址 | `https://forms.glancy.xyz/report` | ConfigMap |
| `VITE_SUPPORT_EMAIL` | UI 展示的客服邮箱 | `support@glancy.xyz` | ConfigMap |
| `PORT` | SSR/Node Server 暴露的端口 | `4173` | 容器/运行时环境 |

### 3.3 平台级变量
| 变量 | 说明 |
| --- | --- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`、`OTEL_SERVICE_NAME` | 如需接入 OpenTelemetry，在启动脚本中注入。 |
| `MANAGEMENT_SERVER_PORT` | 可选的独立 Actuator 端口，缺省与应用共享。 |
| `TRACE_ID_HEADER`、`LOG_PATH` | 与日志采集/链路追踪一致。 |

## 4. 密钥管理与轮转
1. **集中存储**：在阿里云 Secrets Manager 中为每个环境创建前缀 `glancy/<env>/backend/*` 与 `glancy/<env>/frontend/*`，并通过 RAM 角色限制访问范围。
2. **分发流程**：
   - CI 任务（GitHub Actions / 自建 Runner）在构建前调用 `secretsmanager:GetSecretValue`，并写入临时文件 `.env.runtime`。
   - systemd 使用 `EnvironmentFile`（参见 `backend/scripts/glancy-backend.service`），K8s 使用 `envFrom` Secret。
   - 本地调试使用 `.env.local`，由开发者手动维护，不可提交到 Git。
3. **轮转节奏**：SMTP、DB、API Key 至少每 90 天轮换一次。流程：生成新密钥 → 更新 Secrets Manager → 在 `staging` 回归 → `prod` 滚动发布。
4. **审计**：开启 Secrets Manager 访问日志；CI 仅使用 OIDC 或 STS 临时凭证，防止长期密钥泄露。

## 5. 从零环境到服务运行
1. **准备主机/节点**：创建运行用户 `ecs-user`，授予 `/home/ecs-user/glancy-*` 所有权；预创建日志目录 `/var/log/glancy`。
2. **拉取代码并构建**：
   ```bash
   git clone git@github.com:glancy/glancy.git && cd glancy
   ./mvnw -pl backend clean package -DskipTests
   cd website && npm ci && npm run build
   ```
3. **配置密钥**：根据第 3 节表格在 Secrets Manager 中写入变量。若为本地环境，可创建 `backend/.env.local` 与 `website/.env.local`。
4. **拉起服务**：
   - systemd：把 `backend/scripts/glancy-backend.service` 拷贝至 `/etc/systemd/system`，并将 `.env.runtime` 放在 `WorkingDirectory`。
   - Docker/K8s：参见 `doc/deploy/Docker.md` 与 `doc/deploy/K8s.md` 的部署步骤。
5. **健康检查**：
   - Backend：`curl http://<host>:8080/actuator/health` 应返回 `"status":"UP"`。
   - Website（静态）：访问 CDN `/_healthz`；若 Node Server 部署，访问 `http://<host>:4173/healthz`。
6. **联调外部依赖**：上传头像验证 OSS 写入、触发验证码邮件确认 SMTP、调用 TTS/LLM 接口确保凭证生效。

## 6. 配置变更与回滚
1. 任何变量或密钥改动先在 `staging` 验证，通过后同步到 `prod`。
2. 镜像版本与 Secrets 绑定：部署 `glancy-backend:vX.Y.Z` 时必须同时加载 `dataVersion=vX.Y.Z` 的 Secret/ConfigMap，避免“半升级”。
3. 回滚步骤：
   - **配置**：在 Secrets Manager 中选择上一版本值并回滚；重新触发部署或 `systemctl restart`。
   - **应用**：参考 `Docker.md`/`K8s.md` 的镜像回滚流程（`docker compose up --force-recreate` 或 `kubectl rollout undo`）。
4. 发布 Checklist：CI 全绿、`staging` 连续运行 ≥30 分钟且探针通过、观测系统已打上 `service.version=vX.Y.Z` 标签。

通过以上步骤，任何环境都可以依据统一的变量清单与密钥管理策略完成部署，同时具备可审计、可回滚的保障。
