# Release Notes · RN-20250605-GLD2

| 字段 | 内容 |
| --- | --- |
| Release ID | RN-20250605-GLD2 |
| Version Tag | `glancy.dict.v2`（Beta · CT-04/05） |
| Window | 2025-06-05 01:00–06:00 UTC · REL-B0→REL-B3（Preview 通道） |
| Scope & Modules | `/api/v1/lookup`/`regenerate`/`history` 的契约双轨、Web/H5 BFF、SDK 解析层 |
| Change Type | CT-04/05（非兼容，需双版本并存）；Deprecation 日历：DEP-2025Q2-003 |
| User Impact | 客户端可通过 `Accept: application/vnd.glancy.dict.v2+json` 或 `?contract=preview` 获取 v2 响应；v1 仍为默认 |
| Guardrails | `/lookup` 首屏 P95 ≤2.5 s、`/regenerate` ≤1.0 s、降级率 ≤1%；契约回放≥500（含 v1/v2 双份样本）；Sunset 通知提前 ≥90 天 |
| Deployment Plan | 蓝绿→REL-B0 健康→REL-B1（Pro 1% Beta）→REL-B2（Plus 5%）→REL-B3（Free 15%）；Beta 观察≥90 天，并在 D-60 / D-30 实施棕断 |
| Documentation & SDK | Schema Registry 发布 `glancy.dict.v2.preview.json`；`doc/需求说明文档/第 22 章` 更新时间线；SDK（JS/Java v0.12.0-beta）提供新模型 |
| Next Steps | 收集兼容性反馈、完善 Sunset/Link 公告，准备 2025-09-30 Sunset v1 某字段的棕断脚本 |
| Approvals | 产品 ✅ · 架构 ✅ · SRE ✅ · 合规 ✅ |

## 新功能

### `glancy.dict.v2` 契约 Beta
- `/api/v1/lookup` 与 `/lookup/{id}` 支持通过 `Accept: application/vnd.glancy.dict.v2+json`（或在非生产加 `?contract=preview`）获取 v2 响应，`schemaVersion` 与 `contract` 字段返回 `glancy.dict.v2`，供客户端测试新的模块结构与度量字段。
- v2 响应包含扩展的模块预算、统一的 `meta.performance` 统计与更严格的错误枚举，便于未来引入多语输入与可组合模块。
- **关联用例**： [UC-01 查询词条](<../需求说明文档/第 4 章 业务流程与用例.md#uc-01-查询词条>), [UC-02 再生成例句](<../需求说明文档/第 4 章 业务流程与用例.md#uc-02-再生成例句>)
- **关联验收**： [AC-UC-01](<../需求说明文档/第 20 章 验收标准与测试方案（UC 对齐）.md#ac-uc-01>), [AC-UC-02](<../需求说明文档/第 20 章 验收标准与测试方案（UC 对齐）.md#ac-uc-02>)

### Sunset 信号与双版本守护
- v1 响应开始附带 `Link: <https://status.glancy.app/sunset/glancy.dict.v2>; rel="deprecation"` 与 `Sunset: Wed, 30 Sep 2025 00:00:00 GMT` 头，提醒客户端完成升级；错误预算钩子 HK-02/HK-06 已纳入 Beta 看板。
- 熔断与降级逻辑在 v1/v2 双轨下保持一致，若 Beta 出现结构回归会自动回落到 v1 并记录 incident。
- **关联用例**： [UC-14 降级与熔断回退](<../需求说明文档/第 4 章 业务流程与用例.md#uc-14-降级与熔断回退>)
- **关联验收**： [AC-UC-14](<../需求说明文档/第 20 章 验收标准与测试方案（UC 对齐）.md#ac-uc-14>)

## 修复

- 无额外缺陷修复；该版本聚焦契约双轨与 Sunset 信号。

## 兼容性变更

- v2 为非兼容版本：字段/必填项/错误模型发生变更，仅在明确协商（`Accept` 或 `?contract=preview`）后返回。未协商的请求仍收到 v1 响应。
- v1 响应新增 `Sunset` 与 `Link` 头（见[22.10](<../需求说明文档/第 22 章 变更管理与版本策略（契约弃用期）.md#2210-对外信号与错误模型扩展>))；客户端需忽略未知头但记录 Sunset 信息。

## 升级影响

- 所有客户端/SDK 需在 2025-09-30 以前完成 `glancy.dict.v2` 解析器与回放样本构建，CI 需要扩展到 v1/v2 双份契约（≥500 条）。
- 若使用 API Gateway 缓存，需要把 `Accept` 头纳入缓存键，防止 v1/v2 缓存串流；同时确认日志/指标按 `contract` 维度打点。
- 文档/FAQ/客服脚本需引用本发布说明与 Deprecation 日历，提醒用户 Beta 期仅覆盖 15% 流量与 Pro/Plus 优先。

## 回滚步骤

1. 通过 release 配置移除 v2 `Accept` 白名单（仅允许内部测试租户），并在 API 层临时屏蔽 `?contract=preview`，以确保所有请求均回退至 v1。
2. 撤销 `Sunset`/`Link` 头并更新状态页，记录 incident ID；按[21.12](<../需求说明文档/第 21 章 发布计划与灰度策略.md#2112-上线步骤清单（运行级）>) 回放 v1 样本确认回滚成功。
3. 若数据存储已写入 v2 专属字段，执行双写回退脚本（见 `Schema Registry · GLD2`）将新增字段清理或映射回 v1 结构，再恢复灰度。

## 已知问题

- **ISSUE#T03-API-05**：历史、导出与删除契约仍基于 v1，尚未支持 `glancy.dict.v2`（参见[第 8 章](<../需求说明文档/第 8 章 接口与数据契约（APISchema）.md>)），因此 Beta 仅覆盖查词/再生成链路。
- `/exports` 接口仍只输出 v1（见[22.15](<../需求说明文档/第 22 章 变更管理与版本策略（契约弃用期）.md#2215-exports-变更兼容策略与迁移指导>))，需要客户端暂时回退到 v1 导出来保持一致。
