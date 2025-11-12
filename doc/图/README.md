# 图谱中心（T29）

> 该目录集中维护 FigJam 白板与 Mermaid 源，所有图可在线协作（FigJam）与离线渲染（Mermaid/SVG）。复用 `glancy-sdd-figjam` 白板，节点 ID 见下表；Mermaid 源位于 `./src/`，`./export/` 内为离线 SVG，用于附录/报告快照。

| 图类 | 用途（对应章节） | FigJam 节点 | Mermaid 源 | 导出 SVG |
| --- | --- | --- | --- | --- |
| 系统上下文 | 第 4/7 章、HLD 2.2 | [node 230-1](https://www.figma.com/file/glancy-sdd-figjam?type=whiteboard&node-id=230-1#SystemContext) | [`src/context.mmd`](./src/context.mmd) | [`export/context.svg`](./export/context.svg) |
| 时序 — 查词 | FR-001/004/050、UC-01 | [node 230-20](https://www.figma.com/file/glancy-sdd-figjam?type=whiteboard&node-id=230-20#LookupSequence) | [`src/sequence-lookup.mmd`](./src/sequence-lookup.mmd) | [`export/sequence-lookup.svg`](./export/sequence-lookup.svg) |
| 时序 — 导出 | UC-06、FR-070/071、NFR-016 | [node 230-40](https://www.figma.com/file/glancy-sdd-figjam?type=whiteboard&node-id=230-40#ExportSequence) | [`src/sequence-export.mmd`](./src/sequence-export.mmd) | [`export/sequence-export.svg`](./export/sequence-export.svg) |
| 时序 — 订阅 | FR-041/042、11 章状态机 | [node 230-60](https://www.figma.com/file/glancy-sdd-figjam?type=whiteboard&node-id=230-60#SubscriptionSequence) | [`src/sequence-subscription.mmd`](./src/sequence-subscription.mmd) | [`export/sequence-subscription.svg`](./export/sequence-subscription.svg) |
| ER — 核心数据域 | 第 9 章、Appendix ER | [node 230-80](https://www.figma.com/file/glancy-sdd-figjam?type=whiteboard&node-id=230-80#ERCore) | [`src/er-core.mmd`](./src/er-core.mmd) | [`export/er-core.svg`](./export/er-core.svg) |
| 部署拓扑 | 第 7 章、HLD 3.2 | [node 230-100](https://www.figma.com/file/glancy-sdd-figjam?type=whiteboard&node-id=230-100#Deployment) | [`src/deployment.mmd`](./src/deployment.mmd) | [`export/deployment.svg`](./export/deployment.svg) |
| 甘特 — T29 | 第 21 章（发布计划） | [node 230-140](https://www.figma.com/file/glancy-sdd-figjam?type=whiteboard&node-id=230-140#T29Gantt) | [`src/gantt-t29.mmd`](./src/gantt-t29.mmd) | [`export/gantt-t29.svg`](./export/gantt-t29.svg) |

## 维护指引

1. **FigJam 编辑**：在共享白板新增/更新节点，保持与表格中的编号一致，并开启“Anyone with the link → can view/comment”。
2. **Mermaid 更新**：修改 `./src/*.mmd` 后运行 `npm exec -- @mermaid-js/mermaid-cli -i src/<file>.mmd -o export/<file>.svg --scale 1.2` 重新导出离线 SVG。
3. **文档引用**：SRS/HLD/LLD 在正文中链接至 FigJam（协作）与 `export/*.svg`（静态快照），附录/README 内可直接 `![...]` 嵌入。
4. **版本留痕**：每次修改需在相关章节（例：第 9 章、HLD 3.2）更新“最后同步”时间，确保图文一致。
5. **审计与可访问性**：SVG 文件命名统一，便于在可观测性演示、演练报告及无障碍阅读器中复用；若需 PNG，请使用同一 Mermaid 源另行导出。
