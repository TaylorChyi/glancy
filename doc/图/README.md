# 图谱中心（T29）

> 该目录集中维护 FigJam 白板与文本化的图源。所有图统一使用 Mermaid 或 PlantUML 源文件，并在 Markdown 中通过代码块直接渲染，杜绝 SVG 快照的重复维护。

## 推荐工具速查

| 图类型 | 推荐工具 | 原因 | 范例章节 |
| :------------------------------------- | :------------------------------------ | :---------------------------------------------- | :------------- |
| **系统上下文图 (System Context Diagram)** | Mermaid (`graph TD` / `flowchart TD`) | 逻辑简单、节点关系清晰；Markdown 内可直接渲染 | SRS 第 3~4 章 |
| **功能分解图 (Functional Decomposition)** | Mermaid (`graph TD`) | 树状结构一眼明了，文本可读 | SRS 功能需求章节 |
| **用例图 (Use Case Diagram)** | PlantUML (`@startuml usecase`) | Mermaid 不支持参与者与关系标签语义 | 用例说明书 |
| **流程图 / 业务逻辑流 (Flowchart)** | Mermaid (`flowchart TD`) | 对逻辑判断、分支支持好；轻量可直接改 | 业务流程说明 |
| **时序图 (Sequence Diagram)** | PlantUML | 语义完整：激活条、循环、alt 分支、消息异步等；Mermaid 在复杂场景下语义损失 | 系统设计文档、接口设计章节 |
| **状态机图 (State Machine Diagram)** | PlantUML | Mermaid 无状态进入/退出动作语义，难描述嵌套状态 | 系统设计文档（组件状态行为） |
| **组件图 (Component Diagram)** | Mermaid | 组件间调用可用 flowchart 模式表达即可 | 架构章节 |
| **部署图 (Deployment Diagram)** | PlantUML (`@startuml deployment`) | 支持节点、artifact、数据库等类型 | 部署说明章节 |
| **ER 图 (Entity Relationship Diagram)** | Mermaid 或 PlantUML 均可，建议用 Mermaid | Mermaid 的 `erDiagram` 模块足够；产物清晰易 diff | 数据库设计文档 |
| **类图 (Class Diagram)** | PlantUML | Mermaid 目前不支持 class inheritance/association 多类型 | 系统设计文档 |
| **时序 + 组件混合图（多参与者协作）** | PlantUML | 可混合分层 lifeline，Mermaid 表达力不足 | 高层交互设计 |
| **配置拓扑图 / 网络拓扑** | Mermaid (`graph LR`) | 无需语义，仅表达节点和连接 | 部署章节 |

## 图谱目录

| ID | 图示 | 源文件 | 推荐渲染方式 | FigJam 节点 |
| --- | --- | --- | --- | --- |
| HLD-CTX | 系统上下文 | `doc/图/src/context.mmd` | 在 Markdown 中使用 <code>```mermaid</code> 直接嵌入 | `node-id=230-1` |
| HLD-DEP | 部署拓扑与容灾 | `doc/图/src/deployment.puml` | 在 Markdown 中使用 <code>```plantuml</code> 并 `!include` 源文件 | `node-id=230-100` |
| SEQ-LK | 查词与流式渲染主时序 | `doc/图/src/sequence-lookup.puml` | 在 Markdown 中使用 <code>```plantuml</code> 并 `!include` 源文件 | `node-id=230-20` |
| SEQ-EX | 历史导出与一次性链接时序 | `doc/图/src/sequence-export.puml` | 在 Markdown 中使用 <code>```plantuml</code> 并 `!include` 源文件 | `node-id=230-40` |
| SEQ-SB | 订阅购买/回调/权益同步时序 | `doc/图/src/sequence-subscription.puml` | 在 Markdown 中使用 <code>```plantuml</code> 并 `!include` 源文件 | `node-id=230-60` |
| ER-CORE | 核心数据域 ER | `doc/图/src/er-core.mmd` | 在 Markdown 中使用 <code>```mermaid</code> 直接嵌入 | `node-id=230-80` |
| T29-GT | T29 制图交付甘特图 | `doc/图/src/gantt-t29.mmd` | 在 Markdown 中使用 <code>```mermaid</code> 直接嵌入 | `node-id=230-140` |

## 维护指引

1. **统一存储**：所有图源均保存在 `doc/图/src/`，按类型选择 Mermaid (`*.mmd`) 或 PlantUML (`*.puml`)。严禁再提交导出的 SVG/PNG 快照。
2. **编辑与预览**：
   - Mermaid：可借助 VS Code Mermaid Preview、`npx @mermaid-js/mermaid-cli -i <src> -o <out>.png` 等工具本地校稿，预览产物无需入库。
   - PlantUML：使用 PlantUML 插件或 `plantuml -tsvg <src>` 预览；生成文件仅用于本地校对。
3. **文档引用**：各文档内通过代码块直接渲染——Mermaid 使用 ` ```mermaid`，PlantUML 使用 ` ```plantuml`，并可使用 `!include` 复用 `src` 内的源文件。
4. **同步 FigJam**：若在 FigJam 中调整布局/标注，请同步更新对应的文本源文件与文档中的代码块，保持三方一致。
5. **版本留痕**：每次更新需在相关章节备注“最后同步”时间，确保读者了解图源的更新时间。
6. **审计与可访问性**：文本化图源更便于 diff 与代码审计；如需导出静态图片请在本地生成，严禁将图片加入仓库。
