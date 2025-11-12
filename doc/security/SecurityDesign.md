# Glancy 安全设计文档

## 1. 目的与范围

- 描述 Glancy Web/H5 词典、再生成、历史、导出与订阅后台的安全基线，涵盖身份与会话、访问控制、数据保护、密钥管理、依赖供应链与威胁缓解策略。
- 与《系统高层设计（HLD）》保持一致，对 BFF/API 网关、LLM 适配层、RDBMS、Redis、对象存储、任务编排、第三方（登录/支付）等组件提出最低安全要求。

## 2. 身份与会话

### 2.1 身份来源

| 场景 | 入口 | 流程 |
| ---- | ---- | ---- |
| 最终用户登录 | Web/H5 客户端 → API 网关 `/auth/login` | 使用第三方 OAuth2/OIDC（支持短信二次校验），BFF 仅接受带 PKCE 的 ID Token 换取 Access Token。 |
| 运营/客服后台 | `/admin` | 公司 IdP（OIDC + MFA），经 API 网关签发短 TTL Session，需绑定硬件密钥。 |
| 服务到服务 | Mesh mTLS | 使用 SPIFFE/SPIRE 证书 + Kubernetes SA 映射，Gateway 验证 SAN 与 SPIFFE ID。 |

### 2.2 会话管理

- BFF 将 Access Token 交换为加密 Session（JWT + EdDSA），并将会话上下文（role、feature flag、订阅状态、节流计数）缓存于 Redis L1，TTL ≤ 60 分钟，Sliding Window 续期。
- Session 中仅保存 `sub`, `session_id`, `role`, `entitlements`, `nonce`；用户主档字段实时查询 `profiles` 表，避免冗余敏感数据。
- 重要操作（导出、订阅变更）要求 `session_nonce` + 一次性 CSRF Token 双重校验；若检测 IP/UA/地理信息突变则吊销 Redis 会话并触发风险告警。

## 3. RBAC / 权限模型

| 角色 | 描述 | 可访问域 | 核心约束 |
| ---- | ---- | -------- | -------- |
| `user` | 付费或试用终端用户 | 查词、再生成、历史、导出（授权范围内） | 导出额度/订阅权益写入 `subscriptions` 表；仅允许访问自身资源。 |
| `support` | 客服/运营 | 只读 `profiles`, `subscriptions`, 导出审计 | 仅可通过后台界面调用受限 API；所有操作写入审计日志。 |
| `admin` | 安全/运维 | 配置 feature flag、限流策略、任务回放 | 需要 MFA + Just-In-Time elevation（<2h），所有 API 需签名并记录审批工单编号。 |
| `service-*` | 内部服务账号 | 特定微服务间调用 | 绑定最小权限 IAM 角色，禁止交叉环境凭证。 |

RBAC 策略存放于 `rbac_policies` 表，部署时通过 Flyway/Migration Seed 下发；业务代码通过统一 PEP（Policy Enforcement Point）加载策略，避免散布式鉴权逻辑。

## 4. 关键数据流与保护措施

| 数据流 | 涉及数据 | 威胁 | 保护措施 |
| ------ | -------- | ---- | -------- |
| A. 登录 + 订阅权益同步（用户 → API 网关 → BFF → `profiles/subscriptions`） | PII、订阅计划、支付凭证引用 | 凭证重放、越权读取、同步延迟导致权益失效 | 强制 TLS1.3 + mTLS 到 BFF、JWT audience 与 nonce 校验；写路径使用数据库行级锁，订阅更新通过 Outbox + 任务编排重放保证顺序，所有写操作附带 `request_id` 与幂等键。 |
| B. 查词/再生成（用户 → BFF → LLM 适配层 → 第三方 Doubao） | 查询语句、上下文、LLM 输出 | Prompt 注入、敏感信息泄露、DoS | BFF 对用户输入做 token 限制与敏感词脱敏；LLM 适配层调用前裁剪上下文并注入安全提示；对第三方调用使用独立 API Key + QPS 上限，响应进入 SSE 前需通过内容净化策略。 |
| C. 导出/下载（BFF → 任务编排 → 对象存储 → CDN/WAF → 客户端） | 导出文件（含自定义例句、订阅状态） | URL 泄露、篡改、过期控制失败 | 导出任务使用短期访问令牌写对象存储，生成一次性签名 URL（TTL 10 分钟）并绑定 IP；CDN 配置强制 HTTPS + HSTS；下载前校验 `export_id` 属于当前 `sub` 并写安全审计。 |

所有关键链路均要求注入 TraceID，并在 SIEM 中配置异常告警（如导出失败率 >5% 或 LLM 拒绝率异常）。

## 5. 数据保护与最小化

### 5.1 静态数据

- RDBMS：开启 AES-256 TDE；`profiles.email`, `profiles.phone`, `subscriptions.billing_token` 使用列级加密 + 应用层 envelope；密码哈希采用 Argon2id（memory ≥ 256 MB）。
- Redis：仅缓存非 PII 与已加密 Session；开启 ACL + TLS，禁用 swap 与匿名访问。
- 对象存储：采用 KMS 管理密钥，Bucket 默认私有，导出产物启用版本化与 Object Lock（7 天）。

### 5.2 传输中数据

- 外部：边缘/WAF 强制 TLS1.3 + HSTS + TLS 报文指纹监控，拒绝降级到 TLS1.2 以下。
- 内部：Service Mesh mTLS（SPIFFE ID），证书轮换 ≤ 24h；LLM 适配层与第三方 API 使用独立 VPC egress + IP allowlist。

### 5.3 数据最小化

- BFF 返回 payload 仅包含当前视图所需字段；历史记录默认保留 30 天（用户可自主延长至 90 天）。
- 日志/Tracing 中不写入查询文本或导出内容，只记录哈希 + `request_id`。
- 订阅与支付模块隔离，支付凭证仅保存 tokenized 引用，真实卡号由第三方 PSP 保存。

## 6. 密钥与机密管理

- 所有密钥/凭证（OAuth Client Secret、Doubao API Key、KMS Data Key）集中存储在 AWS KMS + Secrets Manager，通过 GitOps 注入。
- 应用容器以 sidecar 拉取密钥，缓存 ≤ 5 分钟；检测到 Pod 异常或配置变更立即强制轮换。
- 对算子/运维开放的调试密钥使用 JIT 模型（临时 Secret，TTL ≤ 1h），完成后自动吊销并记录审计。

## 7. 依赖与供应链安全

- 后端（Maven）：使用公司私有镜像库，禁止直连 Maven Central；`pom.xml` 锁定版本并启用 `maven-enforcer-plugin` 阻止快照依赖。
- 前端（Node/Vite）：使用 `pnpm-lock.yaml` 作为单一可信源，CI 校验锁文件签名与完整性。
- 容器镜像：基础镜像来自受信任的 `registry/glancy/base-jre`，构建阶段运行 Trivy/Snyk 扫描，禁止以 root 身份运行。
- 构建产物签名：使用 `cosign sign backend:tag`，CD 平台部署前验证签名。

## 8. 威胁模型（STRIDE）

| 资产/链路 | STRIDE 分类 | 攻击链 | 影响 | 缓解 |
| -------- | ----------- | ------ | ---- | ---- |
| 登录 + 会话（API 网关 ↔ BFF ↔ Redis） | Spoofing / Elevation | 攻击者伪造 OAuth Token 或重放 Session，继而调用导出 API 获取他人内容 | 大规模账号接管、数据泄露 | OIDC PKCE + nonce 验证；会话绑定设备指纹 + IP；Redis 中存储 `session_nonce` 并在敏感操作时强制刷新；防重放计数器 + WAF 行为分析封禁。 |
| 查词 → LLM 适配层 → 第三方 | Tampering / Information Disclosure | 恶意用户注入 Prompt，诱导 LLM 回显敏感系统提示或执行高成本任务导致 DoS | 泄露系统信息、资源枯竭 | Prompt 预处理 + 敏感词滤除；LLM 入参 schema 校验；第三方接口 QPS/成本配额；对输出做内容净化和速率限制。 |
| 导出管线（任务编排 → 对象存储 → CDN） | Repudiation / Information Disclosure | 内部或外部攻击者截获导出 URL，借助 CDN 缓存窃取文件或篡改导出结果 | 订阅数据泄露、合规风险 | 一次性签名 URL（短 TTL + IP 绑定）；对象存储启用服务端加密 + 完整性校验；导出任务写入签名摘要，CDN 层要求 Header `X-Export-Token` 并记录审计。 |

## 9. 扫描与修复流程

### 9.1 SCA（Software Composition Analysis）

1. **后端**：在 CI（`backend/.github/workflows/build.yml`）中增加步骤 `./mvnw org.owasp:dependency-check-maven:check -Dformat=JSON -DfailOnCVSS=7`。
   - 结果上传到构建 Artifacts 与安全看板；CVSS ≥ 7 的依赖需在 3 天内修复。
2. **前端**：运行 `pnpm audit --prod --json` 并结合 `npm audit signatures`；对 high/critical 告警在 48h 内升级或替换。
3. **容器镜像**：执行 `trivy image registry/glancy/app:${GIT_SHA}`，对 High/Critical 级别的 CVE 阻断发布。

### 9.2 DAST（Dynamic Application Security Testing）

1. 每次主干合入后自动部署到 `staging-sec` 环境。
2. 运行 `zap-baseline.py -t https://staging-sec.glancy/api -r zap-report.html`，覆盖 `/lookup`, `/regenerate`, `/exports`, `/auth`。
3. 报告推送至安全存储，若存在 High 级别漏洞则阻断发布；需在 5 天内修复并回归测试。

### 9.3 修复与验证

- 建立安全缺陷 Kanban，定义 SLA：高危 3 天、中危 7 天、低危 30 天。
- 修复后需要：单元/集成测试 + 重跑对应 SCA/DAST；发布前由安全值班人员审批。

## 10. 合规清单

- **隐私**：遵循 GDPR/《个人信息保护法》，进行数据分类分级；支持用户导出/删除个人数据；默认 30 天保留策略；跨境传输需完成合规评估。
- **账单/支付**：对接第三方 PSP，Glancy 系统仅保存 token；支付 Webhook 需签名验证 + 重放窗口 ≤ 5 分钟；账单日志保留 7 年并启用访问审计。
- **可观测与审计**：关键操作（登录、导出、订阅变更、RBAC 更新）写入不可篡改审计流（WORM 存储），支持 SIEM 检索。
- **安全训练与应急**：年度安全培训覆盖开发/运维 100%；建立 CSIRT，Runbook 包含会话吊销、密钥轮换、导出渠道熔断与沟通模版。

## 11. 维护与评审

- 本设计文档需与 HLD/LLD 联动维护，所有安全评审或重大架构变更必须在此更新基线。
- 安全章程每半年回顾一次，结合最新攻击态势更新威胁模型与扫描基线。
