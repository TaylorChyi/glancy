# 数据库 ER 设计

## 1. 范围与约束
- 订阅域是权益的单一事实源，需在 5 s 内驱动配额一致（`doc/需求说明文档/第 11 章 订阅、计费与账单.md:7-34`、`doc/需求说明文档/第 11 章 订阅、计费与账单.md:121-189`）。
- 配额域需保存本地自然日、时区与活动配额桶等证据，以满足 SRS 第 10 章的计量与补偿策略（`doc/需求说明文档/第 10 章 配额、限流与成本控制.md:60-95`、`doc/需求说明文档/第 10 章 配额、限流与成本控制.md:222-235`）。
- 幂等、回放与审计可追溯是计费域的刚性要求（`doc/需求说明文档/第 11 章 订阅、计费与账单.md:13-34`、`doc/需求说明文档/第 11 章 订阅、计费与账单.md:180-201`）。
- 所有时间字段统一存 UTC，并保留 `time_zone` 以支撑“用户本地日”配额与导出/账单展示；敏感字段加密或脱敏后落库，与 SRS 第 11 章最小数据采集原则一致。

## 2. 实体关系概览

| 实体 | 关键字段/约束 | 主要关系 |
| ---- | ------------- | -------- |
| `users` | `id`(PK)、`email`(UQ)、`time_zone`、`status` | 被 `subscriptions`、`quota_daily`、`lexicon_records`、`export_jobs`、`audit_logs`、`billing_transactions` 引用 |
| `subscription_plans` | `plan_id`(PK)、`level`、`entitlements` | 1:N → `subscriptions`；引用自 `subscription_prices`、`entitlement_events` |
| `subscriptions` | `sub_id`(PK)、`user_id`(FK)、`plan_id`、`status`、`grace_until` | 1:N ← `billing_transactions`；触发 `entitlement_events` |
| `quota_daily` | 复合 UQ `(user_id, quota_date_local, metric)` | 1:N ← `quota_ledger`；N:1 → `users` |
| `quota_ledger` | `entry_id`(PK)、`idempotency_key`(UQ) | 记录查词/再生成消耗与赠送；N:1 → `quota_daily` |
| `lexicon_records` | `record_id`(PK)、`entry_hash` | N:1 → `users`；可被导出任务引用 |
| `export_jobs` | `job_id`(PK)、`job_type`、`status` | N:1 → `users`；关联 `lexicon_records` 快照 |
| `audit_logs` | `log_id`(PK)、`actor_id`、`scope` | 记录敏感动作；引用 `users` |
| `billing_transactions` | `txn_id`(PK)、`order_id`、`platform_txn_id`(UQ)、`idem_key`(UQ) | N:1 → `subscriptions`；触发 `entitlement_events` |
| `entitlement_events` | `event_id`(PK)、`subscription_id`、`payload` | 供配额域消费，保障 ≤5 s 同步 |

## 3. 实体细节

### 3.1 用户（`users`）
- 字段：`id UUID`、`external_id`、`email`、`locale`、`time_zone`、`status`、`deleted_at`、`created_at/updated_at`。
- 约束：`email`、`external_id` 唯一；软删除靠 `deleted_at`，满足“逻辑删即时”要求。
- 关系：1:N 指向订阅、配额、记录、任务、计费、日志。`time_zone` 直接为配额计数提供依据（`doc/需求说明文档/第 10 章 配额、限流与成本控制.md:60-78`）。

### 3.2 订阅（`subscription_plans`、`subscription_prices`、`subscriptions`）
- `subscription_plans` 存档位与权益 JSON；`subscription_prices` 记录周期/币种价，便于 Web/H5 与未来商店价映射（`doc/需求说明文档/第 11 章 订阅、计费与账单.md:21-44`）。
- `subscriptions`：包含 `status`（枚举 11.5 所列）、`start_at`、`end_at`、`grace_until`、`cancel_at_period_end`、`source_channel`、`version` 字段。
- 约束：`sub_id` 主键；`user_id+status` 建部分唯一索引以限制同时最多 1 条 `ACTIVE|TRIALING|GRACE`（符合 11.5 自动降级规则）。
- 同步：状态改变触发 `entitlement_events`，配额域消费后 ≤5 s 更新 `quota_daily` 限额（`doc/需求说明文档/第 11 章 订阅、计费与账单.md:121-134`）。

### 3.3 配额账本（`quota_daily`、`quota_ledger`、`entitlement_events`）
- `quota_daily`：`user_id`、`metric`（`lookup|regenerate`）、`quota_date_local`、`time_zone`、`limit_value`、`promo_value`、`used_value`、`reset_at_local`。
- `quota_ledger`：每次查词/再生成、赠送、扣减都落条目，字段含 `idempotency_key`（30 s 唯一，避免重复计费，符合 10.3.2）、`delta`、`reason`、`trace_id`。
- `entitlement_events`：`event_id`、`subscription_id`、`plan_snapshot`、`limits_snapshot`、`status`、`delivered_at`，支撑“事件 → 配额”链路（`doc/需求说明文档/第 10 章 配额、限流与成本控制.md:222-235`）。
- 约束：`quota_daily` 复合唯一；`quota_ledger.idempotency_key` 唯一；`entitlement_events` 以 `subscription_id+version` 唯一避免重放。

### 3.4 词汇记录（`lexicon_records`）
- 用途：记录用户查词与再生成的词条、结果摘要、是否降级、成本指标，供导出/审计。
- 字段：`record_id`、`user_id`、`entry_text`、`entry_hash`、`entry_language`、`result_version`、`result_payload`（JSONB）、`origin`（lookup/regenerate）、`cost_in/out`、`quota_entry_id`、`is_flagged`。
- 约束：`entry_hash`+`user_id` 非唯一但建索引方便去重；`quota_entry_id` FK 回溯配额账本，方便“成功也计数”核验（`doc/需求说明文档/第 10 章 配额、限流与成本控制.md:84-95`）。

### 3.5 导出任务（`export_jobs`）
- 字段：`job_id`、`user_id`、`job_type`（词汇导出/配额对账等）、`status`、`requested_at`、`execute_after`、`expired_at`、`filters`、`result_uri`、`deleted_at`。
- 约束：`user_id+status` 索引用于列队；软删后由 T+7 任务物理清理，满足“逻辑删即时，T+7 清理”。
- 关系：可在 `filters`（JSON）中引用 `lexicon_records` 快照 ID，以满足导出与删除语义在 SRS 中的统一要求。

### 3.6 审计日志（`audit_logs`）
- 字段：`log_id`、`actor_id`（FK → `users` 或系统账号）、`scope`（billing/quota/export 等）、`action`、`resource_id`、`before`/`after`、`ip`、`user_agent`、`created_at`。
- 要求：记录退款、撤销、配额补偿等敏感操作，配合第 11 章 11.11、11.15 的合规条款。
- 存储：写前 append-only，不允许更新；逻辑删除仅对误写记录可见，物理清理由审计任务执行。

### 3.7 计费流水（`billing_orders`、`billing_transactions`、`billing_invoices`）
- `billing_orders`：`order_id`、`user_id`、`price_id`、`channel`、`currency`、`amount`、`status`、`idem_key`、`created_at`。
- `billing_transactions`：`txn_id`、`order_id`、`subscription_id`、`platform_txn_id`、`idem_key`、`status`、`paid_at`、`raw_callback`、`trace_id`。
- `billing_invoices`：`invoice_id`、`order_id`、`amount`、`tax_amount`、`discount_amount`、`receipt_url`（短 TTL）、`expires_at`。
- 约束：`platform_txn_id`、`idem_key` 唯一，满足幂等；`order_id` 外键→`subscriptions` 以便回写权益（`doc/需求说明文档/第 11 章 订阅、计费与账单.md:21-145`）。

## 4. 事务边界与一致性策略
1. **支付/订阅事务**：订单、交易、订阅状态更新在同一数据库事务内提交；提交后写入 `entitlement_events`（outbox）。出队器最多 2 s 内推送事件，确保订阅域 → 配额域总延迟 ≤5 s（`doc/需求说明文档/第 11 章 订阅、计费与账单.md:121-134`）。
2. **配额扣减**：查词/再生成入口以 `quota_ledger` 作为幂等写模型，`quota_daily` 通过 `FOR UPDATE` 聚合，保证“成功或降级均记次数”与幂等 30 s 要求（`doc/需求说明文档/第 10 章 配额、限流与成本控制.md:80-95`）。
3. **导出任务**：创建任务与生成审计记录在同事务，防止用户导出记录没有审计凭据。
4. **审计/补偿**：当监控发现订阅与配额差异 >5 s 时，后台作业回放 `entitlement_events` 并标记审计日志记录补偿动作（`doc/需求说明文档/第 10 章 配额、限流与成本控制.md:222-235`）。

## 5. 数据治理与清理
- **逻辑删除**：`users`、`subscriptions`、`lexicon_records`（合规要求需即时隐藏）、`export_jobs`、`billing_*` 均提供 `deleted_at`；删除即对上层不可见。
- **物理清理 (T+7)**：统一由 `db_cleanup_jobs`（见《迁移策略.md》）在每日 03:00 UTC 执行，将 `deleted_at <= now()-7d` 的记录分批擦除；审计日志与计费流水只归档不物理删，满足 ≥5 年留存（`doc/需求说明文档/第 11 章 订阅、计费与账单.md:137-145`）。
- **字段口径**：配额相关表保存 `time_zone` 与 `quota_date_local` 证据；计费表保留 `trace_id`、`idem_key`、`raw_callback`（加密），与 SRS 第 10/11 章对追溯与纠偏的要求一致。
- **对账作业**：订阅/计费 15 分钟增量、T+1 全量，差异将写入 `audit_logs` 并触发补偿，以固化 SRS 11.11 对账策略。
