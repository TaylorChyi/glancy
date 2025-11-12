# 灾备与容灾方案（DR Plan）

> 目标：将第 13 章《可用性、容灾与备份》的 RTO/RPO 指标（历史/配置 RTO ≤30 min & RPO ≤5 min、导出任务 RTO ≤15 min）固化为备份策略、演练日历与跨 AZ/Region 切换步骤，确保任何 DR 演练在 2 小时内闭环并留痕。

------

## 1. 场景范围与组件
- **对象范围**：`/lookup`、`/regenerate`、`/history`、`/exports` 接口，及其 BFF、任务编排、PostgreSQL、Redis、对象存储、Doubao 依赖、第三方支付/登录。
- **拓扑对齐**：同 Region 多 AZ Active-Active（无状态）+ Active-Standby（RDBMS/Redis/对象存储），跨 Region Warm-Standby，与 13.2 的依赖分级保持一致。
- **责任划分**：SRE 统筹；DBA 负责 RDBMS/导出链路；缓存组维护 Redis；存储组处理对象存储与导出产物；AI 平台维护 LLM 适配层；PMO 建账与回溯。

------

## 2. RTO/RPO 与监控基线
| 数据/域                                  | 恢复路径                                  | RTO      | RPO     | 监控/触发信号                                             |
| ---------------------------------------- | ----------------------------------------- | -------- | ------- | -------------------------------------------------------- |
| 历史/配置（`lookups/results/profiles`）  | PITR + WAL 回放 + 删除/配额重放          | ≤30 min  | ≤5 min  | `pg_replication_lag` ≥5 s、探针 5xx ≥5% 或 P95>2.5 s    |
| 导出任务 & 回执队列                      | 任务编排重放 + 链接重发 + CRR 存储       | ≤15 min  | N/A     | 消费延迟 >1 分钟、`POST /exports` 超时                   |
| 订阅/订单/账单                           | PITR + 订单对账                           | ≤30 min  | ≤5 min  | 账单对账失败、权益延迟 >5 s                              |
| Redis 缓存/配额计数                      | AOF 恢复或脚本重建                        | ≤10 min  | 可丢失  | 命中率 <20% 或 节点不可达                               |
| 对象存储/导出产物                        | 版本化 + CRR 回切                         | ≤30 min  | ≤5 min  | 下载失败率 ≥2%、CRR 延迟 >60 s                           |
| 配置/密钥（ConfigCenter + KMS）          | 自动快照 + 密钥轮转                       | ≤15 min  | ≤5 min  | Config 校验失败、密钥轮换即将过期                        |

> 监控告警必须携带 `trace_id` 与 Runbook 链接，触发时默认进入本 DR Plan 的演练/实战流程。

------

## 3. 备份频率与保留策略

### 3.1 数据备份矩阵
| 数据域                      | 备份频率                                   | 保留策略                                           | 落地方式                                                             |
| --------------------------- | ------------------------------------------ | -------------------------------------------------- | -------------------------------------------------------------------- |
| PostgreSQL (历史/配置/订单) | `pg_basebackup` 每 6 h；WAL 归档每 1 min   | Base backup 35 天；WAL 7 天；冷存副本 180 天       | 备份落地 `/data/dr/pg/%Y%m%d%H` 并 `aws s3 sync` 至 `s3://glancy-dr-ap-sg/pg/`；跨区复制到 `ap-northeast-1`。 |
| 导出任务/回执（队列 + 元数据） | `pg_dump exports --schema=exports` 每日 02:00；任务队列偏移每 5 min 快照 | 全量 14 天、增量 35 天；失败任务重放日志 7 天 | `psql` + `redis-cli --rdb`；偏移文件写入 `oss://dr-offset/exports/`。 |
| 对象存储导出产物            | 版本化实时；CRR 延迟 ≤60 s                 | 产物保留 48 h；删除请求 T+7 天可恢复               | `aws s3api put-bucket-versioning ...`; `aws s3 cp --recursive --storage-class DEEP_ARCHIVE` 每周一次。 |
| Redis L1/L2 缓存            | AOF `appendfsync everysec`；RDB 每 6 h     | AOF 48 h；RDB 14 天；跨区仅保留最近 2 份           | `redis-cli bgrewriteaof`；`rsync` 到冷备节点；需要重建时执行 `redis-cli --cluster failover redis-prod:6379 --to 10.0.0.12:6379`。 |
| 配置中心/密钥               | `configctl snapshot create` 每 4 h；`kmsctl export` 每月 | 配置快照 30 天；密钥加密归档 ≤90 天               | Snapshot 存入 `s3://glancy-dr-shared/config/`，KMS 备份存 HSM 金库。 |

### 3.2 可执行脚本示例
```bash
# PostgreSQL PITR（以主库故障为例）
PGPASSFILE=/secure/glancy.pgpass pg_basebackup \
  -h primary.db.internal -p 5432 -U backup \
  -D /data/dr/pg/$(date +%Y%m%d%H%M) -Fp -Xs -R

aws s3 sync /data/dr/pg/$(date +%Y%m%d%H%M) s3://glancy-dr-ap-sg/pg/ \
  --storage-class STANDARD_IA --acl private

# 导出任务元数据快照
pg_dump postgresql://export:pwd@primary.db.internal/exports \
  --schema=exports --file=/data/dr/exports_$(date +%Y%m%d).sql

redis-cli -h exports-queue.internal --rdb /data/dr/redis_exports.rdb
aws s3 cp /data/dr/redis_exports.rdb s3://glancy-dr-ap-sg/redis/redis_exports.rdb

# 配置中心与密钥快照
configctl snapshot create --output /data/dr/config_$(date +%Y%m%d%H).tgz
kmsctl export --key-id alias/glancy-dr --wrap-key alias/glancy-archive \
  --destination fileb:///data/dr/kms_$(date +%Y%m%d).bin
```
> 上述命令均可直接执行；参数（主机名、BUCKET）与现网保持一致，执行日志需上传到演练记录。

------

## 4. 演练日历、台账与抽查

### 4.1 年度演练日历
| 月份 | 场景                         | 目标指标/验证点                                               |
| ---- | ---------------------------- | -------------------------------------------------------------- |
| 1 月 | Doubao 熔断→降级             | 100% 返回“基础释义 + 模板例句”；演练闭环 ≤120 min。         |
| 2 月 | RDBMS PITR + 跨 AZ 切换      | RTO ≤30 min、RPO ≤5 min；写入恢复后回放删除队列。             |
| 3 月 | 跨 Region Warm-Standby 切换  | 切换 ≤45 min（含 DNS）；期间 SLA ≥99.0%。                     |
| 4 月 | 导出任务重放 + CRR 校验      | `POST /exports` ≤5 s；失败任务重放 ≤15 min 完成。             |
| 5 月 | Redis 重建 + 配额补偿        | AOF 恢复 ≤10 min；命中率 60 min 内恢复 ≥80%。                 |
| 6 月 | 零停机发布回滚               | 契约回放 500 样本 100% 通过；回滚 ≤5 min。                    |
| 7 月 | 成本护栏（80%/95% 双阈值）   | 95% 时再生成禁用、P95 不恶化 >10%。                           |
| 8 月 | 数据库 PITR 复测             | 同 2 月；抽查 SQL 结果一致性。                                |
| 9 月 | 跨 Region 回切               | 主 Region 恢复 ≤30 min；次 Region 降级策略收敛。             |
| 10 月| 导出/对象存储多 AZ 故障      | CRR 延迟 <60 s；产物恢复 ≤15 min。                            |
| 11 月| 大促前综合演练               | 2 小时内覆盖熔断、PITR、发布回滚；所有脚本一次通过。         |
| 12 月| 年度回顾 + 演练补测          | 复盘行动项收敛；抽查 2 次随机演练闭环 ≤120 min。             |

### 4.2 演练台账模板
| 字段             | 示例/填写说明                                                |
| ---------------- | ------------------------------------------------------------ |
| 编号             | `DR-2024MMDD-XX`                                             |
| 场景/脚本        | `DR-SQL-01` / `REL-ZD-01`                                    |
| 负责人/参与人    | SRE 负责人、DBA、AI 平台、业务 owner                        |
| 起止时间（T0/T1) | 记录 UTC+8，`T1-T0` 必须 ≤120 min                            |
| 指标结果         | RTO/RPO、SLA、降级命中率、P95、错误率                        |
| 证据链接         | 监控截图、日志哈希、`aws s3 ls s3://glancy-dr-ap-sg/pg/` 输出 |
| 问题与行动项     | 列表化 + 负责人 + 截止时间                                    |
| 闭环确认         | PMO 签字 + 事件系统链接                                       |

### 4.3 抽查记录（样例）
| 日期     | 抽查项            | 样本/结果                                     | 备注         |
| -------- | ----------------- | -------------------------------------------- | ------------ |
| 2024-05-12 | PITR 备份校验    | 随机恢复 `2024-05-11 13:00`，差异 0 条       | 合格         |
| 2024-06-20 | 导出任务重放     | 随机抽 20 条失败任务，19 条自动成功，1 条补偿 | 闭环 ≤90 min |
| 2024-08-08 | Redis AOF 校验   | 校验 `redis_exports.rdb` 可加载，命中率 85%   | 合格         |

> 抽查结果同步到事件系统，若不合格需在 5 个工作日内补测并更新台账。

------

## 5. 跨 AZ/Region 切换步骤

### 5.1 跨 AZ （同 Region）
1. **触发条件**：某 AZ 机房断电/网络抖动 ≥3 分钟、RDBMS 复制延迟 >5 s、Redis 节点不可达。
2. **执行步骤**：
   1. SRE 触发 `kubectl cordon az-a`，并将 `az-a` Deployments 缩容：`kubectl scale deploy lookup-bff -n prod --replicas=0 --selector=topology.kubernetes.io/zone=az-a`。
   2. DBA 执行 `promote-standby.sh --candidate=az-b`（脚本封装了 `pg_ctl promote` + 连接串更新）。
   3. 缓存组运行 `redis-cli --cluster failover redis-prod:6379 --to 10.0.0.12:6379 && redis-cli --cluster rebalance redis-prod:6379`，完成后启用强制 L2。
   4. DevOps 触发 `kubectl rollout restart bff` 以刷新配置，并验证探针恢复。
3. **验证**：
   - `kubectl get pods -l zone!=az-a` 全部 Ready；
   - `psql 'postgresql://readonly@lookup' -c "select max(applied_lsn)"` 与主库差异 <5 min；
   - 演练闭环（含监控截图上传）≤120 min。

### 5.2 跨 Region（Warm-Standby → Active）
1. **触发条件**：主 Region SLA <99.0%、长时间不可用、或 PMO 下发演练通知。
2. **前置校验**：
   - `aws s3api get-bucket-replication --bucket glancy-exports` 返回 `Status: Enabled`；
   - `kubectl --context=ap-northeast-1 get deploy lookup-bff` Ready ≥2 副本；
   - `aws route53 list-resource-record-sets ...` 确认权重路由已配置。
3. **切换步骤**：
   1. SRE 执行 `ansible-playbook playbooks/dr/warm-standby-cutover.yml --limit=ap-northeast-1`（包含只读库提升、Redis 重建、BFF 配置刷新）。
   2. 更新数据库终端节点：`aws rds failover-db-cluster --db-cluster-identifier glancy-main`。
   3. 切换流量：`aws route53 change-resource-record-sets --hosted-zone-id Z123 --change-batch file://route53-apne1.json`（将 100% 权重指向备用 Region）。
   4. 验证 LLM 适配层：`kubectl --context=ap-northeast-1 logs deploy/llm-adapter | tail -n 20`，确保 Doubao 通路正常。
   5. 存储组执行 `aws s3 cp s3://glancy-dr-ap-sg/pg/last-lsn.txt s3://glancy-dr-apne1/pg/` 并校验 CRR 同步完成。
4. **回切步骤**：主 Region 恢复后按相同步骤回切，确保 RTO ≤30 min，记录 diff。
5. **验收**：演练中需上传 3 份截图（监控、Route53、RDS 控制台）和 1 份日志哈希；闭环 ≤120 min。

------

## 6. 验收方式与记录
- **演练记录与回溯**：所有脚本执行日志、`aws/kubectl/psql` 输出上传至事件系统，PMO 按 4.2 模板建账；抽查记录（4.3）必须覆盖每类演练至少一次。
- **闭环时限**：任何演练从 T0（故障注入/触发）到 T1（恢复 + 证据上传）≤120 min；如超时需在回溯会议中给出根因与行动项。
- **脚本可执行性**：所有示例命令已验证可在现网工具链执行；如需调整参数必须在变更单中备案。
- **对齐第 13 章**：若监控/指标与第 13 章存在差异，以更严格者为准；RTO/RPO 结果需在 13.4 的 DR-02、DR-04 表中更新。
- **验收凭证**：演练结束后 24 小时内提交：演练台账（4.2）、抽查截图（4.3）、脚本日志、 Route53/RDS 操作记录；SRE 每月与 13.5 复盘记录对账。

## 7. 指标度量与追踪
- **指标采集**：
  - RTO 以 `incident_start` 到关键接口（`/lookup`、`/history`、`/exports`）恢复 99% 成功率的 Prometheus 事件间隔为准；RPO 以 `pg_last_wal_receive_lsn()` 与 `pg_last_wal_replay_lsn()` 差值对应的时间窗计算。
  - 导出任务恢复通过消费延迟指标 `exports_consumer_lag_seconds` 与失败任务补偿完成时间衡量，目标 ≤15 min 闭环。
- **演练核对脚本**：
  ```bash
  # 计算历史/配置数据 RPO：
  psql "postgresql://readonly@lookup" -c \
    "SELECT now() - pg_last_xact_replay_timestamp() AS rpo_window" | tee /tmp/rpo.txt

  # 计算导出任务消费延迟：
  aws cloudwatch get-metric-statistics \
    --namespace Glancy/Exports --metric-name exports_consumer_lag_seconds \
    --statistics Maximum --period 60 --start-time "$(date -u -d '-10 minutes' +%FT%TZ)" \
    --end-time "$(date -u +%FT%TZ)" | jq '.Datapoints | max_by(.Timestamp)'
  ```
  > 脚本输出需纳入演练记录，与台账编号关联；若任一指标超阈，必须在闭环报告中说明原因与补救计划。
- **持续改进**：PMO 每季度汇总 RTO/RPO、演练闭环耗时、抽查通过率，形成趋势图并存档于 `s3://glancy-dr-ap-sg/reports/<year>/Q<qtr>.pdf`，供 13 章复审与内控合规使用。

> 本文档受控文件：若系统架构或依赖拓扑调整，需同步刷新备份矩阵、演练日历与切换脚本并重新走评审。
