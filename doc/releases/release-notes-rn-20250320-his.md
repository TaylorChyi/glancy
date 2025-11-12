# Release Notes · RN-20250320-HIS

| 字段 | 内容 |
| --- | --- |
| Release ID | RN-20250320-HIS |
| Version Tag | `glancy.history.v1`（CT-02 · 功能扩展） |
| Window | 2025-03-20 01:00–05:00 UTC · REL-B0→REL-B3 |
| Scope & Modules | 搜索历史 API、查词版本回顾、日配额守护 |
| Change Type | CT-02（默认行为可通过特性开关回退）；Deprecation 日历：N/A |
| User Impact | 登录用户可以分页浏览、收藏与清理查词历史，并查看过往版本细节；非会员超出每日 10 次查词时得到即时反馈 |
| Guardrails | 契约回放 ≥500、/lookup P95 ≤2.5 s、429 ≤3%、成本燃率 ≤1.2×（参照 21.3 门禁与 21.5 阈值） |
| Deployment Plan | 蓝绿→REL-B0 健康→REL-B1 1%→REL-B2 5%→REL-B3 15%；命中红灯即按 21.6 回滚 |
| Documentation & SDK | `doc/需求说明文档/第 4 章` UC-04/05 流程、`第 20 章` AC-UC-04/05 验收脚本已对齐；前端 SDK 保持 `GET/POST /api/search-records` 适配 |
| Next Steps | 迭代导出与按语言清理（ISSUE#T03-DATA-04）、补齐历史/导出任务表；在 Beta 阶段收集分页游标与 favorites 易用性反馈 |
| Approvals | 产品 ✅ · 架构 ✅ · SRE ✅ · 合规 ✅ |

## 新功能

### 搜索历史管理 API
- `/api/search-records` 现支持创建、分页查询、清空、收藏/取消收藏与按记录删除，所有操作均要求登录用户上下文。非会员用户每天仅允许 10 次查词，超限即返回友好的错误信息。【F:backend/src/main/java/com/glancy/backend/controller/SearchRecordController.java†L22-L104】【F:backend/src/main/java/com/glancy/backend/service/SearchRecordCommandService.java†L45-L198】
- 保存记录时会归一化最近 20 条以避免重复、刷新最近一次的更新时间，并在逻辑删除时同步清理结果版本，确保历史视图稳定。【F:backend/src/main/java/com/glancy/backend/service/SearchRecordCommandService.java†L34-L142】
- **关联用例**： [UC-04 查看与筛选历史](<../需求说明文档/第 4 章 业务流程与用例.md#uc-04-查看与筛选历史>), [UC-05 清理历史](<../需求说明文档/第 4 章 业务流程与用例.md#uc-05-清理历史按语言全部>)
- **关联验收**： [AC-UC-04](<../需求说明文档/第 20 章 验收标准与测试方案（UC 对齐）.md#ac-uc-04>), [AC-UC-05](<../需求说明文档/第 20 章 验收标准与测试方案（UC 对齐）.md#ac-uc-05>)

### 查词版本回顾
- 新增 `/api/words/{recordId}/versions` 列表与详情接口，可在登录上下文内枚举每次生成的版本，并返回模型、预览与完整内容，支持学习者对比释义演进。【F:backend/src/main/java/com/glancy/backend/controller/SearchResultVersionController.java†L16-L70】
- 版本接口使用同一 `SearchResultService` 校验归属，确保仅能访问自己的记录，符合历史留存安全要求。【F:backend/src/main/java/com/glancy/backend/controller/SearchResultVersionController.java†L30-L69】
- **关联用例**： [UC-04 查看与筛选历史](<../需求说明文档/第 4 章 业务流程与用例.md#uc-04-查看与筛选历史>)
- **关联验收**： [AC-UC-04](<../需求说明文档/第 20 章 验收标准与测试方案（UC 对齐）.md#ac-uc-04>)

## 修复

- 无新的用户可见缺陷修复；该版本聚焦历史管理能力建设。

## 兼容性变更

- 新增历史管理与版本回顾端点均位于 `/api/search-records` 与 `/api/words/{recordId}/versions`，仅在带 `Authorization` 头的登录请求中可用，对既有匿名查词流程无影响。【F:backend/src/main/java/com/glancy/backend/controller/SearchRecordController.java†L41-L104】【F:backend/src/main/java/com/glancy/backend/controller/SearchResultVersionController.java†L30-L69】
- 返回结构沿用现有 DTO，不改变 `glancy.dict.v1` 主契约；客户端可逐步接入 favorites 与版本列表 UI，无需一次性升级所有端。【F:backend/src/main/java/com/glancy/backend/controller/SearchRecordController.java†L22-L104】

## 升级影响

- Web/H5 与 SDK 需调用新的历史 API 以呈现收藏、分页与删除能力，并在非会员超过每日上限时展示「非会员每天只能搜索 10 次」的提示文案。【F:backend/src/main/java/com/glancy/backend/service/SearchRecordCommandService.java†L183-L196】
- 历史视图应缓存版本列表以减少重复请求，同时保留回溯入口，确保与 UC-04/05 流程一致。【F:backend/src/main/java/com/glancy/backend/controller/SearchResultVersionController.java†L30-L69】【F:doc/需求说明文档/第 4 章 业务流程与用例.md†L172-L183】
- 发布前请按照 21.3 门禁完成契约回放、性能与 429 守门，并在 21.4 阶梯中逐步放量，观察历史列表延迟与错误率。【F:doc/需求说明文档/第 21 章 发布计划与灰度策略.md†L61-L133】

## 回滚步骤

1. 若监控触发红灯，立即冻结放量并执行 `rollback_stage.sh --batch REL-Bx`，翻转至旧版本蓝绿池，同时关闭相关特性开关。【F:doc/需求说明文档/第 21 章 发布计划与灰度策略.md†L141-L155】
2. 回退后回放历史查询与版本接口的契约样本，确认 `/api/search-records` 与 `/api/words/{recordId}/versions` 恢复旧行为，再根据 21.12 清单完成复盘与公告。【F:doc/需求说明文档/第 21 章 发布计划与灰度策略.md†L197-L205】
3. 保留回滚证据与观测截图于 `release_batches`，并在 15 分钟内依照公告模板对外沟通。【F:doc/需求说明文档/第 21 章 发布计划与灰度策略.md†L249-L276】

## 已知问题

- **ISSUE#T03-DATA-04**：历史导出/物理清理编排仍缺失，尚无法在 API 层返回导出回执与按语言批量清理，需在后续引入 `export_jobs` 与 `deletion_tasks` 表补齐能力。【F:doc/需求说明文档/第 9 章 数据模型与数据治理.md†L155-L167】
- **ISSUE#T03-API-01/04/05**：`/api/v1` 契约前缀、再生成与导出链路仍待统一；本次变更仍沿用 legacy `/api` 路径并缺少游标分页及按语言过滤能力，需在未来契约升级中解决。【F:doc/需求说明文档/第 8 章 接口与数据契约（APISchema）.md†L28-L45】
