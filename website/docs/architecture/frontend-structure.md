# website 前端目录分层说明

## 背景

- 既有 `src` 根目录直接堆叠 `components`、`hooks`、`routes` 等文件夹，工程边界缺乏分层语义，导致引用路径分散（`@/components`、`@/routes` 等）且难以约束依赖走向。
- 伴随业务扩展，新老模块共存下的耦合愈加明显，例如应用级 Provider 与通用 UI 组件混放，核心状态与特性功能目录交叉引用，团队对“哪些文件可被谁依赖”没有统一共识。

## 设计目标

1. **分层清晰**：建立 `app / core / shared / features` 四层语义，限制跨层依赖方向，方便后续再细分域模型或迁移到微前端。
2. **可演进**：通过路径别名、集中路由与 Provider 装配，降低未来迁移或拆包时的影响面。
3. **最小割裂**：迁移过程中保持原有模块的代码与测试结构不变，仅调整物理位置与引用路径，确保功能回归成本可控。

## 新目录结构

```
src/
├── app/               # 应用编排层：路由、Provider、页面入口
│   ├── navigation/    # 路由蓝图与装配
│   ├── pages/         # 页面组件（维持原有懒加载与模块划分）
│   └── providers/     # 根节点 Provider 组合（AppProviders 等）
├── core/              # 核心能力层：配置、上下文、状态、国际化
│   ├── config/
│   ├── context/
│   ├── i18n/
│   ├── session/
│   └── store/
├── features/          # 业务特性层：如 chat、dictionary-experience 等
└── shared/            # 共享资产层：UI、hooks、api、utils、theme 等
    ├── api/
    ├── assets/
    ├── components/
    ├── hooks/
    ├── styles/
    ├── theme/
    └── utils/
```

## 依赖约束

- `app` 可依赖 `core`、`shared`、`features`，禁止反向依赖，保持入口层的单向编排职责。
- `core` 仅可依赖 `shared`，避免核心能力引用业务代码；`core` 对外以 Context/Store/Config 的形式暴露。
- `features` 可依赖 `core` 与 `shared`，但不应直接调用 `app` 层资源，确保特性模块可被多入口复用。
- `shared` 作为最底层，仅允许依赖同层内部资源，禁止向上引用，以免形成环状依赖。

## 别名策略

- `@app` → `src/app`
- `@core` → `src/core`
- `@features` → `src/features`
- `@shared` → `src/shared`
- `@assets` → `src/shared/assets`

所有路径在 Vite、TypeScript、Jest 及 PostCSS 中保持一致，避免环境差异导致的构建/测试失败。

## 迁移影响

- **入口文件**：`src/main.jsx` 仅依赖 `@app/providers` 与 `@app/navigation`，明确入口组装职责。
- **路由配置**：`ROUTES_BLUEPRINT` 迁至 `app/navigation` 并继续通过懒加载引用页面，减少路径硬编码。
- **全局样式**：`index.css` 与 `tailwind.css` 仍位于根目录，但所有 token、组件样式集中在 `shared/styles`，便于统一管理。
- **上下文/Store**：全部迁入 `core`，配合别名确保 Hook 调用语义稳定，未来可在 `core` 层引入 adapter/persistence 机制。

## 后续演进建议

- 结合领域模型拆分 `features` 子目录，引入 `domain` 层沉淀实体/值对象；必要时通过 Port-Adapter 模式隔离远端 API。
- 在 `shared` 内新增 `ui` 设计令牌说明文档，保证多团队协同时的视觉一致性。
- 为 `app` 层补充运行时特性开关或配置注入机制，支持多环境差异化装配。
