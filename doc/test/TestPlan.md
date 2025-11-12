# 测试计划（Test Plan）

- **项目**：Glancy T19（流式查词与知识库套件）
- **版本 / 日期**：v1.0 / 2024-05-08
- **文档所有人**：QA Owner（@qa-owner），备份：@release-captain
- **关联文档**：SRS 第 4、8、16、20 章；`doc/用例说明书` UC 列表；`scripts/perf/README.md`；`scripts/ops/runbook.md`；`doc/需求说明文档/AC 汇总`

---

## 1. 目标与范围

### 1.1 测试目标
1. 覆盖单元 → 集成 → 端到端 → 性能 → 容灾 → 安全的全链路测试，保证各层级 AC/SLA/SLO 可追溯。
2. 通过自动化流水线将测试门禁嵌入发布流程，门禁指标与灰度观察指标一致（成功率 ≥ 99.3%，P95 ≤ 1.2s，错误预算消耗 ≤ 25%）。
3. 完成资源、排期与进度可视化，向发布委员会提供可审计凭证。

### 1.2 测试范围（需求领域 × 策略）

| 领域 | 功能/场景 | 业务目标 | 对应策略 |
| --- | --- | --- | --- |
| F1 多语言查词 | 请求路由、缓存、流式响应 | SLA：P99 1.5s，成功率 99.5% | 单元（缓存命中）、集成（BFF↔LLM）、E2E（L10N UI） |
| F2 再生成 / 历史 | 再生成、导出、归档 | SLA：导出 RPO ≤ 5min | 单元（状态机）、集成（作业队列）、性能（RTO 场景 P5） |
| F3 订阅与配额 | 订阅矩阵、配额扣减、计费 | SLA：扣减一致性 100% | 集成（计费服务）、安全（权限）、E2E（控制台） |
| F4 控制台 & API | Web 控制台、公开 API | SLA：错误预算 2%/月 | E2E（Playwright）、安全（OWASP），性能（突发 P2） |
| F5 运营配置 | Feature Flag、灰度 | SLA：灰度窗口 ≤ 30min | 集成（配置同步）、容灾（回滚演练） |

### 1.3 不在范围
- 线下培训材料与第三方 SDK（单独文档负责）；  
- 非生产渠道（如 PoC 实验室）的兼容性测试；  
- 第三方支付系统性能调优（由支付团队测试计划覆盖）。

---

## 2. SLA / SLO 对齐

| 服务/接口 | SLA | SLO（观测指标） | 监控/灰度指标来源 | 触发动作 |
| --- | --- | --- | --- | --- |
| Lookup API `/api/v1/lookup` | 99.90% 成功率 | P95 ≤ 1.2s，错误预算 ≤ 5min/天 | APM：`sr_lookup_success`, `latency_p95`; 灰度看板：`gray_lookup_health` | 门禁失败 → 停止发布，进入回滚剧本 |
| Export Worker | RTO ≤ 15min | RPO ≤ 5min，失败率 ≤ 0.5% | Prometheus Job：`export_job_delay`, `retry_rate` | 阶段性验收 & 容灾演练 |
| Subscription Service | 配额扣减准确率 100% | 延迟 ≤ 800ms，重复账单 0 | 计费审计日志 + CDC 校验 | 计费对账门禁 |
| Control Center UI | 可用性 99.5% | JS 错误率 ≤ 1%，Core Web Vitals (LCP ≤ 2.5s) | 前端 RUM、Playwright 报告 | UI 回归门禁 |

---

## 3. 环境、数据与工具

### 3.1 测试环境

| 环境 | 组成 | 用途 | SLA/SLO 对齐点 |
| --- | --- | --- | --- |
| DEV | `backend` Maven profile `dev`, `website` Vite dev server，mock LLM | 单元/组件、开发自检 | 无强 SLA，速率与可观测性验证 |
| SIT | K8s 多服务集群，Testcontainers 管理依赖 | 集成、API 契约、部分 E2E | 与生产同配置（Feature Flag 关闭），复用错误预算告警 |
| PERF | 独立白名单租户 + `scripts/perf` 工具链 | P1–P6 压测、容量回归 | 复制生产限速，SLO 指标与 SLA 相同 |
| DRY-RUN | 双 AZ + 断链注入 | 容灾演练、混沌测试 | 验证 RTO/RPO：15min/5min |
| STAGE / 灰度 | 与生产同规模，Feature Flag -> 5% 流量 | 发布前 E2E、灰度指标对齐 | 门禁指标与生产一致 |

### 3.2 测试数据与依赖
- 数据分层：匿名合成数据（DEV）、遮蔽生产快照（SIT）、专用白名单租户（PERF/STAGE）。  
- 依赖：LLM 服务（Docker stub + 灰度真实接口）、Redis 集群、计费服务（使用 contract stub + nightly 真链路对齐）、对象存储。  
- 数据刷新：SIT 每周一凌晨，由 `scripts/db/refresh.sh` 执行；Perf 数据由 `scripts/perf/templates/seed_*` 初始化。  
- 日志/观测：OpenTelemetry Trace，APM 指标入库至 `ops/glancy-observability`。

### 3.3 工具与自动化流水线

| 层级 | 工具 / 命令 | 自动化入口 |
| --- | --- | --- |
| 单元 | Maven Surefire (`backend/mvnw test`)，Vitest/Jest (`website pnpm test`) | GitHub Actions `backend-unit.yml`、`website-unit.yml` |
| 集成 | Testcontainers、WireMock、Contract Test (`mvn verify -Pintegration`) | GitHub Actions `backend-integration.yml` |
| E2E | Playwright (`website/tests`), Postman/Newman for API | `website-e2e.yml`，Nightly `post-deploy-e2e.yml` |
| 性能 | JMeter/Gatling/Locust/k6，参见 `scripts/perf/README.md` | Jenkins `perf-regression` job（触发 P1–P6 场景） |
| 容灾 | Chaos Mesh、自研断链脚本 `scripts/ops/failover.sh` | 每双周 `dr-drill.yml` 流水线 |
| 安全 | OWASP ZAP、Snyk/Trivy、依赖审计脚本 `scripts/security/sbom.sh` | `security-gate.yml` |

所有流水线测试结果同步至 Release Dashboard（Datasource：GitHub Checks + Jenkins + Grafana Loki），失败将阻断 `main` 分支合并或生产部署。

---

## 4. 分层测试策略

### 4.1 总览

| 层级 | 目标 | 覆盖范围 | 负责人 | 自动化程度 |
| --- | --- | --- | --- | --- |
| 单元（Unit） | 捕获逻辑/边界错误 | Service/Repo/Hook | 开发 (Dev) | ≥ 85% 覆盖，PR 必跑 |
| 集成（Integration） | 契约/依赖行为正确 | BFF↔LLM、计费、队列 | QA + Dev | Nightly + MR 关键路径 |
| 端到端（E2E） | 用户旅程/AC 通过 | UC-01/04/12/15 | QA | SIT 每日 + 灰度阻断 |
| 性能（Perf） | SLA/SLO 维持 | P1–P6 场景 | Perf Eng | 每次主要变更、月度回归 |
| 容灾（DR） | RTO/RPO 可达 | 双 AZ、上游断链 | SRE | 双周演练 + 发布前演练 |
| 安全（Security） | 门禁合规 | OWASP Top 10、依赖 | AppSec | 周期审计 + 发布前阻断 |

### 4.2 单元测试
- 覆盖：业务规则、配额计算、缓存策略、前端状态机、工具函数。  
- 标准：语句覆盖 ≥ 85%，关键类（配额、扣减、LLM 适配器）分支覆盖 ≥ 90%。  
- 工具：JUnit5 + Mockito、Vitest；通过 `backend/mvnw test`、`pnpm test --runInBand` 执行。  
- 阻断条件：覆盖率下降 >2%，或关键模块失败。

### 4.3 集成测试
- 场景：BFF ↔ LLM（流式与非流式）、计费扣减、导出任务/消息队列、配置中心同步。  
- 方法：Testcontainers 启动 PostgreSQL/Redis，WireMock 模拟 LLM 降级，CDC 校验保证扣减一致性。  
- 验收：接口契约版本与 `doc/系统设计文档` 对齐；契约破坏会阻断合并。  
- 频率：每个 MR 自动运行，Nightly 跑完整组合。

### 4.4 端到端测试（E2E）
- 旅程：UC-01 查词、UC-04 再生成、UC-12 订阅升级、UC-15 控制台配额开关。  
- 工具：Playwright（前端），Newman（API 回归），结合灰度环境 5% 流量观测。  
- 验收：AC Given/When/Then 与 `doc/需求说明文档` 中 AC-ID 对齐；失败将阻断 `stage → prod`。  
- 数据：使用遮蔽租户 + Feature Flag 组合矩阵。

### 4.5 性能测试
- 场景：`scripts/perf/README.md` 的 P1–P6 全量。  
- 指标：P50/P95 延迟、吞吐、错误率、缓存命中率、上游限速。  
- 触发：每次发布前 + 每月基线；若变更涉及缓存/LLM 接入，需 rerun P1/P2。  
- 输出：Grafana Dashboard 导出的 CSV + Jenkins 报告，作为发布门禁输入。

### 4.6 容灾演练（DR / Chaos）
- 演练：区域故障、依赖断链、慢查询、消息积压（Chaos Mesh + 自研脚本）。  
- 目标：验证 RTO 15min、RPO 5min，Failover 流程符合 Runbook。  
- 频率：双周演练；重大版本前加压演练一次。  
- 验收：事件线、回执、观察指标（`error_budget_burn`）归档。

### 4.7 安全测试
- 静态/依赖扫描：Snyk、Trivy、`mvn -Psecurity verify`。  
- 动态扫描：OWASP ZAP 对 Control Center 与公开 API；暴露面覆盖 OAuth、RBAC、速率限制。  
- 合规：日志脱敏、PII 访问审计；满足第 20 章安全 AC。  
- 门禁：`security-gate` 失败 → 阻断发布，需 AppSec 复核豁免。

---

## 5. 入口与退出准则（准入/准出）

### 5.1 阶段性准则

| 阶段 | 准入条件 | 准出条件 | 关联 AC / 门禁 | 灰度指标 |
| --- | --- | --- | --- | --- |
| 需求冻结 | AC 列表锁定；SLA/SLO 复核；冒烟数据可用 | — | AC-ALL-BASE | — |
| 开发完成 → SIT | 单元覆盖达标；静态扫描通过；关键 MR 全绿 | SIT 冒烟通过；集成契约签字 | AC-API-01/03、AC-UI-02、Security-01 | N/A |
| SIT → PERF | 集成报告归档；故障未决缺陷 ≤ P2*1 | P1–P3 指标达标：P95 ≤ 1.2s，错误率 ≤0.5% | Perf-AC-P1/2/3 | `gray_lookup_health`, `perf_export_delay` |
| PERF → STAGE | 性能报告批准；容灾剧本预演 | 灰度 5% 版本上线，E2E 全绿 | DR-AC-01、E2E-AC-UCxx | `error_budget_burn < 25%`, `gray_web_vitals` |
| STAGE → PROD | 灰度指标稳定（24h）；告警 0；监控回传 | 发布委员会签字；Runbook 更新 | Release-Gate-01/02 | 同 Stage（成功率 / P95 / JS 错误率） |

### 5.2 门禁与灰度指标对齐
- 所有性能门槛使用与生产同一 Grafana Dashboard 的变量；灰度阶段以 `gray_lookup_success_rate`, `gray_export_rto`、`gray_ui_js_error_rate` 三个指标为准。  
- 门禁脚本读取同一 Prometheus API，不另外维护独立阈值，避免指标漂移。  
- 若灰度窗口内 Burn Rate > 2，则自动触发 `release halt`，并回滚至上一稳定版本。

---

## 6. 资源、排期与进度跟踪

### 6.1 资源配置

| 角色 | 人员 | 责任 | 可用工时/迭代 |
| --- | --- | --- | --- |
| QA Owner | @qa-owner | 计划维护、SIT/E2E 执行、报告 | 4d |
| Perf Engineer | @perf-eng | 压测脚本、Perf 门禁、容量报告 | 2d |
| SRE | @sre-oncall | 容灾演练、灰度监控、回滚 | 1.5d |
| AppSec | @appsec | 安全扫描、漏洞处置 | 1d |
| Feature Dev | 各模块负责人 | 单元/集成测试、自测修复 | 3d |

### 6.2 排期 & 进度

| 周次 | 里程碑 | 交付物 | 自动化流水线 / 指标 |
| --- | --- | --- | --- |
| W1 | 需求冻结、测试设计 | 用例矩阵、数据准备脚本 | `backend-unit`, `website-unit` |
| W2 | SIT 回归 | 集成报告、缺陷列表 | `backend-integration`, `contract-nightly` |
| W3 | PERF + DR 演练 | 压测报告、DR 报告、指标截图 | `perf-regression`, `dr-drill` |
| W4 | STAGE 灰度 & 发布 | 灰度监控、发布决议 | `website-e2e`, `release-gate`, Grafana 灰度面板 |

进度跟踪：Jira Dashboard「T19-Quality」，字段来自流水线状态（GitHub Checks API）与 Grafana Webhook；缺陷燃尽目标：W4 之前 P1=0、P2≤2、P3≤6。

---

## 7. 风险与应对

| 风险 | 影响 | 缓解/应对 |
| --- | --- | --- |
| 上游 LLM 沙箱限流导致性能基线波动 | 性能指标失真、门禁误判 | 预留本地 stub + 限流补偿，Perf 环境复刻生产白名单；对比双基线 |
| 灰度指标与门禁阈值不一致 | 误放行或误拦截 | 所有阈值从 `metrics-config.yml` 单一源读取，发布流程检查校验 |
| 容灾演练资源不足 | 演练遗漏，RTO 不达标 | 预占双 AZ 资源；演练失败自动创建 Blocker ticket |
| 安全扫描耗时 | 发布节奏延迟 | 与 CI 并行；对已审计依赖使用缓存 SBOM |

---

## 8. 交付与归档
- 所有测试报告（Unit/Int/E2E/Perf/DR/Sec）归档至知识库《Glancy/Test Plan/T19》。  
- Grafana/Prometheus 指标截图、Jenkins/GitHub 流水线日志需附带 run-id，方便追溯。  
- 发布总结复盘包含：门禁结果、灰度指标、缺陷统计、残留风险；用于下一迭代基线。

> 本计划应与 SRS 更新保持同步，如 SLA/SLO、AC、架构图变更需在 1 工作日内更新此文档。

