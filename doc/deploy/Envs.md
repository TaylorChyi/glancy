# Envs

> 目标：从零环境开始，按照本文档即可准备全量依赖、注入密钥并让所有服务在目标环境可复制、可回滚地上线。

## 1. 环境矩阵
| 环境 | 用途 | 基础设施 | 入口/域名 | 关联分支 |
| --- | --- | --- | --- | --- |
| `local` | 单兵调试、回归用例录制 | Docker Compose + 本机 Node/Maven | `http://localhost:5173`, `http://localhost:8080` | 任意 feature/* |
| `dev` | CI 自测、机器人回归 | 共享 ECS + systemd，Docker 镜像从 ACR `registry.glancy.xyz/dev` 拉取 | `https://dev.api.glancy.xyz` | `develop` |
| `staging` | 上线前完整演练，带全量依赖与监控 | K8s `glancy-staging` 命名空间，ACR `registry.glancy.xyz/staging` | `https://staging.api.glancy.xyz`, CDN 预发域 | `release/vX.Y.Z` |
| `prod` | 面向用户的正式环境 | K8s `glancy-prod` + 多可用区 MySQL/OSS/TTS | `https://api.glancy.xyz`, `https://www.glancy.xyz` | `main` + 已发布 tag |

> 统一要求：所有环境都必须设置 `SPRING_PROFILES_ACTIVE`，并使用 Secrets Manager 提供的密钥拉起容器/进程，禁止将敏感信息写入 Git。

## 2. 前置依赖
1. JDK 17（与 `backend/pom.xml` 的 `<java.version>` 保持一致），并在 PATH 中暴露 `java` 和 `keytool`。
2. Node.js 20 LTS + npm 10，用于构建 `website` 与运维脚本。
3. Maven Wrapper（仓库已内置 `./mvnw`）。如需全局 Maven，请保持 3.9+。
4. MySQL 8.0：创建数据库 `glancy_db`，字符集 `utf8mb4`, 排序规则 `utf8mb4_unicode_ci`。执行：
   ```sql
   CREATE DATABASE IF NOT EXISTS glancy_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'glancy_user'@'%' IDENTIFIED BY '<password>';
   GRANT ALL ON glancy_db.* TO 'glancy_user'@'%';
   FLUSH PRIVILEGES;
   ```
5. 对象存储（Aliyun OSS）桶 `glancy-avatar-bucket` 需要在目标环境存在，并提供可读/写的 STS。
6. Volcengine TTS 与 Doubao LLM 账号已申请完成，具备 API Key 与额度。

## 3. 环境变量与密钥清单
所有变量均可通过 Spring/Shell 环境注入。表格中 `Secret 路径` 采用约定：`sm://glancy/<env>/<service>/<key>`（存储在阿里云 Secrets Manager，上层再通过 RAM 角色解密）。

### 3.1 Backend（`backend` 模块）
| 变量/属性 | 描述 | 示例值 | Secret 路径/来源 |
| --- | --- | --- | --- |
| `SPRING_PROFILES_ACTIVE` | Spring Profile，`local/dev/staging/prod` | `prod` | CI/CD 直接注入 |
| `SPRING_DATASOURCE_URL` | MySQL 连接串 | `jdbc:mysql://mysql.internal:3306/glancy_db?useSSL=true&serverTimezone=Asia/Shanghai&characterEncoding=utf8` | ConfigMap（非密钥，但按 env 管理） |
| `SPRING_DATASOURCE_USERNAME` | MySQL 账号 | `glancy_user` | ConfigMap |
| `DB_PASSWORD` 或 `SPRING_DATASOURCE_PASSWORD` | MySQL 密码，`application.yml` 默认读取 `DB_PASSWORD` | `********` | `sm://glancy/<env>/backend/db_password` |
| `GLANCY_SMTP_PASSWORD` | 发信邮箱凭据（`spring.mail.password`） | `********` | `sm://glancy/<env>/backend/smtp_password` |
| `THIRDPARTY_DOUBAO_API_KEY` | Doubao 模型访问密钥（映射 `thirdparty.doubao.api-key`） | `volces-...` | `sm://glancy/<env>/backend/doubao_api_key` |
| `OSS_ACCESS_KEY_ID`/`OSS_ACCESS_KEY_SECRET`/`OSS_SECURITY_TOKEN` | OSS STS 凭证 | 根据 RAM 角色生成 | `sm://glancy/<env>/shared/oss` |
| `VOLCENGINE_APP_ID` / `VOLCENGINE_ACCESS_TOKEN` | TTS 凭证（`application.yml` 的 `tts.volcengine`） | `ttsa-...` | `sm://glancy/<env>/backend/tts` |
| `TTS_CONFIG_PATH` | 可选，指向外部 `tts-config.yml`，启用热更新 | `/etc/glancy/tts/tts-config.yml` | ConfigMap/挂载 |
| `LOG_PATH` | 供 `logback-spring.xml` 使用的目录 | `/var/log/glancy` | Node init script 创建 |
| `SERVER_PORT` | 默认 8080，如需旁路代理可改 | `8080` | ConfigMap |
| `JAVA_TOOL_OPTIONS` | 诊断、GC、内存限制 | `-XX:+UseG1GC -Xms512m -Xmx1024m` | ConfigMap |

### 3.2 Website（`website` 模块）
| 变量 | 作用 | 示例值 | Secret/配置位置 |
| --- | --- | --- | --- |
| `VITE_SHARE_BASE_URL` | 生成可分享链接时的前缀 | `https://www.glancy.xyz/share` | ConfigMap（随前端部署） |
| `VITE_REPORT_FORM_URL` | 问题反馈/举报表单 | `https://forms.glancy.xyz/report` | ConfigMap |
| `VITE_SUPPORT_EMAIL` | 客服邮箱在 UI 中展示 | `support@glancy.xyz` | ConfigMap |
| `PORT`（运行时） | `website/ops/server/index.js` 使用的监听端口 | `4173` | 容器环境 |

### 3.3 观测、系统层变量
| 变量 | 说明 |
| --- | --- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`、`OTEL_SERVICE_NAME` | 如需上报追踪/指标，在容器启动脚本中注入。
| `MANAGEMENT_SERVER_PORT` | 独立暴露 actuator 端口（可选），缺省时与 `SERVER_PORT` 共用。
| `TRACE_ID_HEADER`、`LOG_PATH` | 与 logback 中的结构化日志匹配。

## 4. 密钥管理与分发
1. **中央仓库**：在阿里云 Secrets Manager 中为每个环境创建前缀 `glancy/<env>/backend/*` 与 `glancy/<env>/frontend/*`。通过 RAM 策略仅授予相应命名空间的访问权。
2. **同步流程**：
   - CI 任务（GitHub Actions/GitLab CI/自建）在拉取代码后，调用 `secretsmanager:GetSecretValue`，写入临时文件 `.env.runtime`。
   - systemd/容器启动脚本使用 `EnvironmentFile`（参见 `backend/scripts/glancy-backend.service`）或 `envFrom` Secret 自动挂载。
3. **轮转**：每 90 天滚动更新 SMTP、DB、API Key；更新顺序：创建新密钥 → 在 Secrets Manager 中写入新值 → 先在 `staging` 验证 → `prod` 滚动发布。
4. **审计**：Secrets 的创建、读取事件写入操作日志，CI 只使用临时凭据（STS 或 OIDC）。

## 5. 从空白主机到服务上线
1. **准备主机**：
   - 安装操作系统依赖：`apt-get install openjdk-17-jre-headless nodejs npm mysql-client unzip`。
   - 创建运行用户 `ecs-user`，并赋予 `/home/ecs-user/glancy-*` 目录所有权。
2. **拉取代码 & 构建**：
   ```bash
   # Backend
   cd backend
   ./mvnw clean package -DskipTests
   # Website
   cd ../website
   npm ci
   npm run build
   ```
3. **准备配置**：
   - 在 Secrets Manager 中填充上一节所有变量；本地环境可根据本节表格自建 `backend/.env.local`。
   - 将 `website/dist` 上传到对象存储或容器镜像。
4. **启动 Backend（systemd 示例）**：
   - 上传 `backend/scripts/glancy-backend.service` 至 `/etc/systemd/system/`。
   - 将 `.env`（包含变量清单）放到 `WorkingDirectory`，运行 `sudo systemctl daemon-reload && sudo systemctl enable --now glancy-backend`。
   - Health 检查：`curl http://localhost:8080/actuator/health` 应返回 `"status":"UP"`。
5. **启动 Website**：
   - 若走静态托管，将 `dist/` 推送至 CDN；若使用 Node Server，执行 `node ops/server/index.js` 或制作容器。
6. **验证外部依赖**：
   - 上传/下载：调用 `/api/avatar/upload` 观察 OSS 写入；
   - 邮件：触发验证码接口，确认 SMTP 正常；
   - TTS：调用相关 API，需持有 `VOLCENGINE_*`。

## 6. 更新与回滚动作
1. 所有变量改动先在 `staging` 验证；若需回滚，直接把 Secrets Manager 中的版本回切到上一版本并重新发布。
2. 镜像版本与变量版本绑定：镜像 tag `glancy-backend:vX.Y.Z` 仅与 Secrets 版本 `X.Y.Z` 组合，避免“半升级”。
3. 发布 checklist：
   - ✅ CI 绿色（单元 + Lint + 前端 e2e）
   - ✅ `staging` 运行 30 分钟无异常、actuator 健康
   - ✅ 观测系统已更新服务版本标签 `service.version=vX.Y.Z`
4. 回滚：
   - `systemd`：`sudo systemctl stop glancy-backend` → 替换为上一版 JAR/配置 → `start`。
   - K8s：参见 `doc/deploy/K8s.md` 的 `kubectl rollout undo` 步骤。

> 以上流程覆盖了环境初始化、密钥管理、变量注入与验证路径，配合 `Docker.md` / `K8s.md` 可完成从空环境到上线与回滚。
