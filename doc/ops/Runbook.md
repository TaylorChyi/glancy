# Glancy 运维 Runbook

> 依据《需求说明文档》第 13/14/16/21 章、`doc/dr/DRPlan.md` 以及 `backend/scripts/glancy-backend.service` 制定，目标是让值班人员在没有上下文的情况下也能完成日常巡检、告警处置、扩缩容、灰度/回滚与演练。所有命令默认在 Bastion 主机执行，未注明环境时以生产（Prod）为准。

## 0. 范围与成功标准
- 覆盖 Web/H5 客户端、API 网关、BFF/应用层、Doubao 适配层、Redis(L1/L2)、RDBMS、任务/导出队列、订阅与计费域。
- SLA：关键接口月度可用性 ≥99.9%（第 13 章）；SLO：`/lookup` 成功率 ≥99.9%、P95 ≤2.5 s；`/regenerate` 成功率 ≥99.5%、P95 ≤3.0 s；导出回执 P95 ≤5 s；订阅权益同步 ≤5 s。
- 错误预算与成本护栏参照第 14、16 章；演练与回滚动作必须留痕于 `release_batches` 工单与 `audit_events`。

## 1. 值班组织与沟通

### 1.1 角色表
| 角色 | 职责 | 常用工具 | 升级路径 |
| --- | --- | --- | --- |
| 值班 SRE（Primary） | 7x24 监控、执行 Runbook、拉桥接入 | Grafana (`obs-slo`,`queues-cost`)、Loki、Tempo、`configctl`、`kubectl --context=prod`、`releasectl`、`ops/bin/rollback_stage.sh` | -> Release Manager（RM） |
| Release Manager | 灰度放量、回滚决策、公告 | `release_batches` 工单、`status.glancy.dev`、CI 报告 | -> 产品 Owner + Incident Commander |
| 平台/DBA 值守 | 数据库/Redis/导出链路、备份演练 | `pg_basebackup`、`psql`、`redis-cli`、`aws s3`、`dr/bin/restore.sh` | -> SRE/RM |
| 客服/运营 | 状态页、客户沟通、配额手动调整 | CRM、Status Page、`quota_inspector` 后台 | -> RM |

### 1.2 沟通与工单
- IM/工单：`release_batches` 中记录每个批次（REL-Bx）的指标、截图、告警 ID；实时沟通走 #glancy-ops（IM）+ Incident Bridge（Zoom/语音）。
- Pager：Sev‑1/Sev‑2 由 PagerDuty 服务 `glancy-prod` 自动呼叫 Primary->Secondary->RM。
- 交接：每班结束在 `ops-handover` 表单更新状态、HK 钩子、在途变更与 TODO。

## 2. 平台概览与服务控制

### 2.1 拓扑
用户 -> CDN/WAF -> API 网关 -> BFF/应用（本仓库 Java 服务）-> LLM 适配层 ↔ Doubao -> RDBMS（PostgreSQL）/Redis L1+L2 -> 导出/清理队列 -> 对象存储（CRR）。无状态层（网关/BFF/适配层）Active‑Active；有状态层（RDBMS/Redis/OSS）Active-Standby + 跨 Region Warm-Standby（DR Plan §2）。

### 2.2 环境与发布形态
| 环境 | 形态 | 特性 | 发布/回滚入口 |
| --- | --- | --- | --- |
| Dev | 本地/单机（`./mvnw spring-boot:run`） | 合并验证、契约样本收集 | GitHub Actions -> 开发者 |
| Staging | K8s（与 Prod 同栈）、100% 合成流量 | 门禁：契约回放≥500、SLO 达标、DR 脚本演练 | `releasectl stage promote --env staging` |
| Prod | 蓝绿 + 小流量灰度（Step0–5） | 蓝绿切换 0.5%->100%，旧版本保留 30–60 min | `releasectl` + `ops/bin/rollback_stage.sh` |

### 2.3 服务/脚本速查
| 操作 | 命令 / 脚本 | 说明 |
| --- | --- | --- |
| 构建/打包 | `./mvnw -pl backend -am package -DskipTests` | 产出 `backend/target/glancy-backend.jar`，由 CI 上传制品库。 |
| 启动生产 BFF | `sudo systemctl start glancy-backend` | Unit 模版见 `backend/scripts/glancy-backend.service`；运行目录 `/home/ecs-user/glancy-backend`，读取 `.env`。 |
| 停止/刷新 | `sudo systemctl stop|restart glancy-backend` | 停止前需将流量权重切到另一颜色并关闭特性开关。 |
| 服务状态/日志 | `sudo systemctl status glancy-backend`；`journalctl -u glancy-backend -S -5m` | systemd 输出同时追加至 `/home/ecs-user/glancy-backend/backend.log`。 |
| 灰度放量 | `releasectl stage promote --env prod --batch REL-Bx --weight <0.5|1|5|15|50|100>` | 与 21.4 阶梯一致，必须在 `release_batches` 留痕。 |
| 自动回滚 | `ops/bin/rollback_stage.sh --batch REL-Bx` | 蓝绿切回旧版本，并触发 Kill Switch + DR-05（21.6.1）。脚本日志 `/var/log/rollback_stage.log`。 |
| Kill switch / 特性开关 | `configctl feature set glancy.lookup.force_basic true --env prod`；`configctl feature set glancy.regenerate.enabled false`；`configctl feature set glancy.exports.enabled false` | 配置中心保留快照（`configctl snapshot create`）。所有更改写 `audit_events`。 |
| Doubao 适配层扩容 | `kubectl --context=prod scale deploy/llm-adapter -n prod --replicas=<N>` | 并发许可 & 线程池按线性比例调整（16.9）。 |
| 导出 worker 扩容 | `kubectl --context=prod scale deploy/export-worker -n prod --replicas=<24->36->48>` | 队列深度 >2000 或 RTO>10 min 时触发；恢复后 30 min 内回收。 |
| 队列/任务观察 | `kubectl logs deploy/export-worker -n prod -c worker | tail -n 200`；`redis-cli -h redis-export.internal -n 5 llen exports:pending` | 监控导出任务积压、死信。 |
| 备份脚本 | `PGPASSFILE=/secure/glancy.pgpass pg_basebackup ...`；`configctl snapshot create`；`redis-cli --rdb ...` | 详见 `doc/dr/DRPlan.md §3`。 |

### 2.4 日志与追踪
| 信号 | 位置 / 命令 | 说明 |
| --- | --- | --- |
| 应用日志 | `backend/logs/glancy.log`（Logback）或 `/home/ecs-user/glancy-backend/backend.log` | JSON/文本混合，按 Logback 滚动 10 MB ×30 份。 |
| Systemd | `journalctl -u glancy-backend -f` | 与 `StandardOutput/StandardError` 追加文件同步。 |
| 指标 | Grafana `obs-slo`、`queues-cost`、`streaming-quality` | Prometheus -> Grafana，5 分钟窗口。 |
| 日志聚合 | Grafana Loki `loki-glancy`：`{app="glancy-backend", env="prod"}` | 搜索 trace_id、error_code、degraded。 |
| Trace | Grafana Tempo（Explore->tempo-glancy） | 与 `X-Trace-Id`、`trace_id` 字段一致；合成探针写 incident。 |
| Sentry | `glancy-web` 项目 | 前端 JS/崩溃，按 GDPR 脱敏。 |

### 2.5 数据与备份要点
- PostgreSQL：`pg_basebackup` 每 6 h、WAL 每 1 min，复制至 `s3://glancy-dr-ap-sg/pg/`；恢复脚本见 DR Plan §3.2。
- 导出任务/队列：`pg_dump exports` 每日；`redis-cli --rdb` 导出偏移并同步 OSS。
- 对象存储：版本化 + CRR（≤60 s），导出产物保留 48 h。
- Config/KMS：`configctl snapshot create` 每 4 h；`kmsctl export` 每月。
- 备份/演练结果需在 24 h 内上传 `dr-runbooks` 库与 `audit_events`。

## 3. 日常操作清单
| 频率 | 检查项 | 指标 / 工具 | 动作 |
| --- | --- | --- | --- |
| 每班开始 (07:00 / 19:00) | 核查 SLO/SLA 与 HK 钩子 | Grafana `Core SLO Overview`、`Availability Guardrail`、`release_batches` | 若任一 SLI 逼近阈值 <10% 余量，标记为黄灯并在 handover 记录。 |
| 每 30 分钟 | 队列/导出 | `Queue Health` 看板、`redis-cli llen exports:pending` | `queue_depth`>500 或 `oldest_age`>120 s：准备扩容或限流导出。 |
| 每小时 | 成本/429/缓存命中 | `Cost Burn`、`RateLimit`、`Cache Hit` 卡片 | 80%->启动 L2 优先；95%->停再生成（16.9）。 |
| 每日 10:00 | Doubao/适配层健康 | `kubectl get deploy/llm-adapter`, `Grafana Doubao SLA` | 若 5xx>5% 或超时>3 s，提前触发降级演练。 |
| 每日 11:00 | 备份状态 | `aws s3 ls glancy-dr-ap-sg/pg/$(date +%Y%m%d)`、`configctl snapshot list --recent` | 缺份额立即补跑，并在 DR 台账登记。 |
| 每次 release | 灰度批次同步 | `releasectl stage status`, `release_batches` | 更新当前 REL-Bx、阈值截图、守门结论。 |
| 班次结束 | 交接、未决事项 | handover 模板 | 列出 HK/告警/变更/待办，确认无 Sev 未关单。 |

### 3.1 交接模板
| 字段 | 填写内容 |
| --- | --- |
| 班次 / 日期 | 例：Day 2025-04-18 07:00–19:00 |
| 值班人 | Primary / Secondary |
| 当前灰度批次 | 例：REL-B3（15% Free 开放） |
| HK 状态 | HK‑01=Green, HK‑03=Yellow (0.78×), HK‑05=Green |
| 进行中事件/工单 | Incident #INC-2025-0418-01（导出延迟） |
| Kill switch / 特性开关变更 | `glancy.regenerate.enabled=false` 自 09:32 起 |
| 需跟进事项 | 例：23:00 重新开放再生成；导出演练截图未上传 |

## 4. 灰度、SLO 绑定与回滚

### 4.1 REL-Bx 阶梯与守门指标
| 批次 | 流量 (Step) | 必须满足的 SLO/SLA（Hook） | 超阈动作 |
| --- | --- | --- | --- |
| REL-B0 | 0.5% 蓝绿 + 合成流量 | 合成 `/lookup` P95 ≤2.5 s；契约回放≥500；HK‑01/02 全绿；DR-01/DR-05 打勾 | 留在 Staging，禁止生产放量 |
| REL-B1 | 1%（Pro + L2/L3） | `/lookup` P95 ≤2.5 s；429≤1%；成本燃率≤0.8×（HK‑03）；订阅开通成功率≥99%（HK‑05=0） | 任一红灯->翻回旧版本，记录 incident |
| REL-B2 | 5%（Plus + L1/L4） | 增量语言对成功率≥99.5%；再生成配额正确；限流≤2%（HK‑04）；导出/历史无回退 | 超阈即回滚一阶，自动校验配额/账单镜像 |
| REL-B3 | 15%（含 Free + 历史/导出） | Free P95 ≤2.8 s；导出回执≤5 s；逻辑删≤5 s；HK‑03 仍绿 | 触发红灯->退回 REL-B2 并暂停 Free |
| REL-B4 | 50%（观察 ≥30 min） | 错误预算≤20%；降级率≤1%（HK‑06）；成本≤1.2×；日志/抑制策略生效 | 任意破线->回滚 Step3，重新观察 |
| REL-B5 | 100%（旧版本保留 30–60 min） | 24 h 内 SLO 稳定；HK‑01～06 全绿；公告/复盘材料齐备 | 自动回滚脚本 30 min 内可复原，否则触发 DR-05 |

### 4.2 HK 钩子定义（21.5）
| Hook | 监控项 | 阈值 | 数据源 |
| --- | --- | --- | --- |
| HK‑01 | `/lookup` 成功率 / 错误率 | 5 分钟窗口 <99.9% or 错误率>0.1% | `Core SLO Overview`、黑盒探针 |
| HK‑02 | RUM 首屏 P95 | >2.5 s | `Experience SLO` 看板（RUM + APM） |
| HK‑03 | 成本燃率（近 5 分钟/日预算） | ≥0.8×（黄）/≥1.2×（红） | `Cost Burn` 看板、Budget 事件 |
| HK‑04 | 429 / 配额/限流一致性 | 5 分钟窗口 >2–3% 或 header/body 不一致 | `RateLimit` 看板、网关日志 |
| HK‑05 | 订阅/权益同步成功率 | <99% 或 延迟 >5 s | `Subscription Health` 看板、`quota_inspector` |
| HK‑06 | 降级触发率 (`requests_total{degraded}`) | >1%（红）或降级失败 | `Availability Guardrail` 看板、合成降级探针 |

### 4.3 放量绿色/红色条件
- 绿灯（全部满足）：`/lookup` P95 ≤2.5 s、错误率≤0.1%；`/regenerate` P95 ≤3.0 s；429≤3%；成本≤1.2×；L1≥40%/L2≥20%；降级≤1%。
- 红灯（任一触发自动回滚一阶）：关键接口 SLO 不达标；成本>1.5×；Doubao 5xx≥5% 持续 1 分钟；契约解析失败激增；熔断无法在 5 分钟内恢复。
- 黄灯：429 上升或成本≥0.95×但未破 SLO -> 启动强缓存（L2 优先、TTL×2）并调低突发桶。

### 4.4 回滚 Runbook（21.6.1）
1. **判定**：HK 任何一项红灯或错误预算突破->锁定当前 REL-Bx。
2. **冻结**：暂停进一步放量与配置变更；生成 `release_batches` “Rollback Draft”。
3. **执行**：`ops/bin/rollback_stage.sh --batch REL-Bx` 切回旧版本 -> 打开 Kill switch（`configctl feature set ...`）-> 触发 DR-05/DR-01 自动脚本，确保“基础释义 + 模板例句”已启用。
4. **验证**：复跑关联 AC/TC（例如 UC‑01/TC-PERF-001、UC‑14/DR-01），附 trace_id 与看板截图。
5. **公告**：15 分钟内按 21.17 模板发布初稿；在 incident 中记录影响/恢复时间。
6. **复盘与解冻**：旧版本稳定 ≥30 分钟后方可重启灰度；复盘列出触发 Hook、脚本、行动项。

## 5. 告警矩阵与 SOP

### 5.1 告警级别
| 严重度 | 场景 | 响应 & 升级 |
| --- | --- | --- |
| Sev‑1 | SLA 违约、全量不可用、支付/订阅中断 | 5 分钟内拉桥；Primary->RM->产品 Owner；考虑 DR/回滚 |
| Sev‑2 | SLO 接近红线、≥15% 用户受影响、导出/配额/降级异常 | 15 分钟内响应；可能限流/降级/扩容；更新状态页 |
| Sev‑3 | 降级/缓存命中下降、告警噪声 | 30 分钟内确认；需要记录但可待机 |

### 5.2 常见告警 -> SOP
| 告警 / 症状 | 检测 | 立即动作 | 恢复验证 |
| --- | --- | --- | --- |
| HK‑01/02 触发：`/lookup` 成功率或 RUM P95 异常 | Grafana `Core SLO`、RUM；`kubectl top deploy lookup-bff` | 1) 查看 `journalctl -u glancy-backend` 与 Loki；2) 若为新版本立即执行 `ops/bin/rollback_stage.sh`；3) 若 Doubao 异常，`configctl feature set glancy.lookup.force_basic true` 并记录 incident | 5 分钟窗口恢复 ≥99.9% 且 P95 ≤2.5 s；合成探针绿灯 |
| Doubao 5xx ≥5%（HK‑06）/降级异常 | Grafana `Availability Guardrail`、`kubectl logs deploy/llm-adapter` | 1) 检查 `requests_total{degraded}` 与 `circuit_state`; 2) 手动触发 Kill switch，禁止再生成；3) 若熔断未打开，执行 `configctl feature set glancy.degrade.force_basic true` 并重启适配层 | 降级响应 `degraded=true` + 模板例句；Doubao 恢复后半开探测连续 3 次成功 |
| 成本燃率 >0.8×（HK‑03）或 >1.2× | `Cost Burn`、Budget 事件、`tokens_in/out` 日志 | 1) 80%：启用 L2 优先 + TTL×2（`configctl feature set glancy.cache.mode l2_prio`）；2) 95%：`configctl feature set glancy.regenerate.enabled false` 并降例句条数；3) 记录预算事件 | 成本回到 ≤0.75×，并保持 3 个窗口；撤销临时开关 |
| 429 >2%（HK‑04）或配额回写不一致 | `RateLimit`、`quota_inspector`、API Header 与 body Diff | 1) `kubectl logs api-gateway` 查最新限流策略；2) 调整 Token Bucket（`configctl feature set glancy.ratelimit.user_rpm 150` 等）；3) 检查 `quota_daily` 与 `quota_ledger`，必要时执行快速对账（§5.3.3） | 429 回落 <1.5%，Quota 头与 body 一致；日志 `RATE_LIMITED` trace 降到基线 |
| Subscription Hook（HK‑05）失败 | `Subscription Health` 看板、`psql` 查看 `subscriptions` 延迟 | 1) 开启轮询兜底服务 `kubectl scale deploy/subscription-poller`；2) 检查支付回调队列；3) 若权益同步 >5 s，暂停新放量（REL-Bx-1） | 权益同步 ≤5 s，`subscription.updated` 队列清空 |
| 导出队列积压 / Export RTO >5 s | `Queue Health`、`redis-cli llen exports:pending`、`psql -c "select * from export_jobs ..."` | 详见 §5.3.1：扩容 worker、回滚导出参数、必要时临时关闭导出 API | 队列深度 <300，`oldest_age`<60 s，RTO ≤5 s |
| Streaming 丢段率 >0.5% | `Streaming Quality` 看板、客户端 ACK | 1) 检查 CDN/WSS；2) `kubectl rollout restart deploy/streaming-gateway`; 3) 临时回退到 HTTP polling | 丢段率 ≤0.2% 持续 15 分钟 |

### 5.3 快速处置剧本

#### 5.3.1 导出失败 / RTO 超时
1. **确认指标**：`Queue Health` 中 `queue_depth`、`oldest_age_seconds`；`Core SLO` 导出卡片；`export_jobs` 表失败率。
2. **定位**：
   ```bash
   redis-cli -h redis-export.internal -n 5 llen exports:pending
   kubectl --context=prod get pods -n prod -l app=export-worker
   kubectl --context=prod logs deploy/export-worker -n prod | tail -n 200
   psql "postgresql://export:***@primary.db.internal/exports" \
     -c "select job_id,status,error_message,requested_at from export_jobs where status in ('pending','running') and now()-requested_at > interval '3 minutes' order by requested_at limit 50;"
   ```
3. **缓解**：
   - 队列 >2000 或 `oldest_age`>300 s：`kubectl scale deploy/export-worker -n prod --replicas=48`。
   - Worker 卡死：`kubectl rollout restart deploy/export-worker -n prod`，并检查镜像版本。
   - 批量重试：`psql` 将失败记录标记为 `pending` 并清空错误：
     ```sql
     update export_jobs
        set status='pending', error_message=null, execute_after=now()
      where job_id in (...stuck ids...)
        and status='failed';
     ```
     触发器会重新入队；若需要手动入队，执行 `redis-cli -n 5 lpush exports:pending <job_id>`。
   - 导出仍不稳定：`configctl feature set glancy.exports.enabled false`（告知前端提示“导出延迟中”），并限制在后台手动生成链接。
4. **验证**：Grafana 导出卡片 P95 ≤5 s；`queue_depth`<300；`export_jobs` 失败率 <0.5%。记录 incident + 根因。

#### 5.3.2 降级异常 / Doubao 熔断未生效
1. **检测**：HK‑06 变黄/红、合成降级探针失败、`requests_total{degraded}` 未上升但 Doubao 5xx>5%。
2. **排查**：
   ```bash
   kubectl --context=prod logs deploy/llm-adapter -n prod | tail -n 200
   kubectl --context=prod exec deploy/llm-adapter -n prod -- curl -s localhost:8080/actuator/health
   ```
   查看 BFF 日志中 `degraded=false` 但 `error_code=UPSTREAM_UNAVAILABLE` 的 trace。
3. **动作**：
   - 立即执行 `configctl feature set glancy.lookup.force_basic true`，确保所有查词走“基础释义+模板例句”。
   - `configctl feature set glancy.regenerate.enabled false`，保护成本。
   - 若熔断未打开，手动设置适配层熔断状态：`kubectl exec deploy/llm-adapter -- bin/circuitctl open doubao`.
   - 升级 Doubao 配额或切换到 Warm-Standby 区域（DR Plan §5）。
4. **恢复**：半开探测连续 3 次成功后自动闭合；记得撤销强行降级、重新开启再生成，并更新 incident。

#### 5.3.3 配额不一致 / `quota` 显示异常
1. **检测**：HK‑04 触发、`quota_inspector` 展示 `used_value`≠`ledger`、客户反馈配额不回补。
2. **对账 SQL**：
   ```sql
   with mismatch as (
     select q.user_id, q.metric, q.quota_date_local,
            q.used_value,
            coalesce(sum(l.delta),0) as ledger_used
       from quota_daily q
       left join quota_ledger l
              on q.user_id = l.user_id
             and q.metric = l.metric
             and q.quota_date_local = l.quota_date_local
      where q.quota_date_local = (current_date at time zone 'Asia/Shanghai')
        and q.deleted_at is null
      group by 1,2,3,4
      having abs(q.used_value - coalesce(sum(l.delta),0)) > 1
   )
   select * from mismatch order by abs(used_value - ledger_used) desc limit 50;
   ```
3. **修复**：
   - 将 `quota_daily.used_value` 调整到账本值，并写入审计：
     ```sql
     update quota_daily q
        set used_value = m.ledger_used,
            last_reconciled_at = now()
       from mismatch m
      where q.user_id = m.user_id
        and q.metric = m.metric
        and q.quota_date_local = m.quota_date_local;
     ```
   - 插入一条 `quota_ledger` 记录（reason=`rollback`，delta=差值，trace_id 使用 incident ID），保持完整溯源。
   - 刷新缓存：`redis-cli -h redis-l1.internal --scan --pattern quota:* | xargs redis-cli -h redis-l1.internal del`（可分批执行）。
4. **验证**：重放 `GET /api/v1/quota` 并比对 `X-Quota-*` 头与 body；监控 HK‑04 回绿；通知客服同步处理过的用户。

## 6. 扩缩容与演练

### 6.1 扩缩容（第 16 章 16.9）
1. **触发**：上游并发 >80% 持续 5 分钟、端到端 P95 超出 10%、队列等待 >500 ms。
2. **步骤**：
   - 横向扩应用 + 适配层：`kubectl scale deploy/lookup-bff --replicas=<N>`、`kubectl scale deploy/llm-adapter --replicas=<N>`。
   - 同步更新连接池/并发许可（env/ConfigCenter），并提高网关路由权重。
   - 打开强缓存护栏：L2 优先 + TTL×2；极端时停再生成。
   - 导出队列：提升 worker 并暂停低优先级导出（`configctl feature set glancy.exports.low_priority false`）。
3. **回收**：30 分钟内负载回落则撤销强缓存、恢复原并发/worker。
4. **记录**：将扩容动作写到 `capacity-events`，供成本/性能复盘。

### 6.2 演练清单
- **降级演练（周）**：人工拉高 Doubao 错误 -> 验证 `degraded=true` UI、Kill switch 生效。
- **配额/限速演练（双周）**：压测至租户/全局阈值，校验 429 文案、`X-RateLimit`/`X-Quota` 一致。
- **订阅域演练（月）**：执行开通/续费/降级->权益 5 s 内一致。
- **DR-01/DR-05（季度）**：跨 AZ/Region 切换（参考 `doc/dr/DRPlan.md`）。
- **发布回滚演练（每次大版本前）**：演练 `rollback_stage.sh` + Kill switch。

### 6.3 演练记录模板
| 字段 | 说明 |
| --- | --- |
| 演练编号 | 例：DR-05-2025-04 |
| 类型/脚本 | DR-05 / `rollback_stage.sh`、降级 / `configctl feature set ...` |
| 注入故障 | Doubao 5xx=10% / 主库只读 / Redis 故障 等 |
| 触发指标 / HK | HK‑06 Red / `pg_replication_lag` ≥5 s |
| T0/T1 | 开始/恢复时间（需 ≤120 分钟） |
| 截图/证据 | Grafana、Route53、RDS、命令输出哈希 |
| 差异 & 行动项 | 未达预期、需补的脚本或自动化 |

## 7. 仪表盘与排障树

### 7.1 仪表盘
| 仪表盘 | 链接 | 关键指标 | 说明 |
| --- | --- | --- | --- |
| Core SLO Overview | `https://grafana.glancy.dev/d/obs-slo/core-observability` | `/lookup`/`/regenerate` 成功率、P95、错误预算 | 放量守门与 SLO 追踪 |
| Experience SLO | `https://grafana.glancy.dev/d/obs-slo/experience` | RUM 首屏 P95、JS 错误 | HK‑02 主要来源 |
| Availability Guardrail | `https://grafana.glancy.dev/d/obs-slo/availability-guardrail` | 降级率、熔断状态、合成探针 | 监控 Doubao/降级路径 |
| Queue Health & Cost | `https://grafana.glancy.dev/d/queues-cost/queue-health` | `queue_depth`、`oldest_age`、成本燃率 | 导出、成本护栏 |
| Streaming Quality | `https://grafana.glancy.dev/d/obs-slo/streaming-quality` | 丢段率、客户端 ACK | 语音/流式质量 |
| Release Gate | `https://grafana.glancy.dev/d/release-gate` | REL-Bx 指标、HK 状态 | 发布决策、截图入档 |

### 7.2 排障树（示例）
1. **是否为全链路 SLO/Sev‑1？** 是->进入回滚流程；否->继续。
2. **错误率 vs 429**：5xx/错误↑->查 BFF 日志/trace；429↑->核查限流配置 + Quota。
3. **成本/降级**：成本 >80%->强缓存/停再生成；降级比例异常->检查 Doubao、Kill switch。
4. **功能性告警**：
   - 导出失败->§5.3.1
   - 订阅延迟->HK‑05 SOP
   - 配额不一致->§5.3.3
5. **恢复**：任何临时开关撤销前需满足“指标连续 3 个窗口恢复”，并更新 handover + incident。

### 7.3 命令 / SQL 速查
```bash
# 服务控制
sudo systemctl status glancy-backend
sudo tail -f /home/ecs-user/glancy-backend/backend.log
journalctl -u glancy-backend -S -10m

# K8s
kubectl --context=prod get deploy -n prod
kubectl --context=prod top pods -n prod -l app=lookup-bff
kubectl --context=prod logs deploy/llm-adapter -n prod

# 队列与 Redis
redis-cli -h redis-l1.internal info stats
redis-cli -h redis-export.internal -n 5 llen exports:pending

# 发布/回滚
releasectl stage status --env prod
ops/bin/rollback_stage.sh --batch REL-B3

# Config/Kill switch
configctl feature list glancy.*
configctl feature set glancy.lookup.force_basic true --env prod
```

```sql
-- 导出失败统计
select status, count(*) from export_jobs
 where requested_at > now() - interval '1 hour'
 group by status;

-- 错误预算消耗
select metric, sum(error_minutes) from slo_error_budget
 where window_start > now() - interval '24 hours'
 group by metric;
```

## 8. 记录与审计
- 所有手工操作（configctl/kubectl/SQL）需记入 `audit_events` 与 incident 时间线。
- `release_batches` 附上看板截图、trace 链接、脚本日志；复盘时同步更新本 Runbook（每次大版本至少回顾一次）。
- 若 Runbook 步骤不足以解决问题，必须在 incident 复盘中补充并回写到本文件。

> **提醒**：Runbook 不是静态文档，任何阈值/脚本调整需同时更新此文件与 `release_batches` 模板，以免下次值班无法复现操作。
