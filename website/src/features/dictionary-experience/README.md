# Dictionary Experience 架构补充

## 流式查询会话（StreamWordSession）
- 角色：承接底层 SSE 流并以状态模式（Idle → Accumulating → Parsing → Merging → Completed）串联“累积 chunk → 解析 metadata → 合并版本 → 生成最终 payload”流程。
- 设计初衷：将 JSON/Markdown 解析、版本整合等纯领域逻辑与 Hook 的编排职责隔离，确保未来扩展新渲染策略时无需触碰状态管理。
- 关键取舍：
  - 状态对象只做纯数据转换，不直接写入 store，避免副作用难以单测；
  - 统一依赖注入入口（streamWordApi、normalize、logger），方便通过策略模式扩展不同渲染管线或日志后端。

## Hook 编排层（useStreamWord）
- 职责：读取治理偏好、准备 cache key、实例化 StreamWordSession，并在会话结束后把 payload 写入词典 store。
- 替代方案对比：若直接在 Hook 中解析字符串，将导致 UI 和领域逻辑耦合，后续无法对单个阶段进行灰度或策略替换。

## 如何扩展新的渲染流派
1. **实现策略**：编写新的 normalizer（或组合现有工具），并在创建 StreamWordSession 时通过 dependencies.normalize 注入；若需要额外上下文，可扩展 request 字段。
2. **插入新状态**：根据阶段需求继承 SessionState（例如新增 FormattingState），在 `stream()` 中按顺序 transition，保持单一职责。
3. **调整 Hook 行为**：仅在参数筹备或最终写入层面扩展（例如增加新缓存 key 维度），禁止在 Hook 中重新解析 payload。
4. **测试保障**：为新状态/策略编写单测，遵循“先策略后编排”的覆盖顺序，确保 JSON、Markdown、混合 metadata 与异常路径均被验证。

> 提示：若未来要并行支持多种渲染形态，可在会话层引入策略注册表，根据 request 中的 flavor 或 feature flag 选择不同的 normalize/persist 流程。
