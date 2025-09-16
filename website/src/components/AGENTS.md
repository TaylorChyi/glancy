# website/src/components 指南

> 这些约束仅适用于 `website/src/components/` 目录及其子目录，并在不与上层规范冲突的前提下生效。

- **目录与命名**
  - 组件文件夹使用帕斯卡命名（例如 `UserMenu`），并包含单一入口 `index.(jsx|tsx)` 负责集中导出。
  - 若组件拆分为子部分，子目录放在同级 `parts/` 或功能性文件夹内，并保持命名一致性（如 `UserMenu/parts/UserMenuButton.jsx`）。
  - 原子 UI 元素收纳到 `ui/`，复合业务组件放入专属文件夹，避免在根目录堆叠零散文件。
- **设计与模式**
  - 组件采用组合优先设计，拆分出可复用的无状态展示组件；状态逻辑放入 `hooks/` 或 `context/`，并只向外暴露必要的 props。
  - 必须使用主题中已有的色板、阴影、圆角与排版 token，禁止内联硬编码颜色或尺寸；如需新增 token，请先在 `src/theme/` 中扩展。
  - 布局需遵循“奢侈品陈列”原则：精简层级、间距使用 4 的倍数体系，确保对齐、阴影、圆角在同一视觉语系内，通过 CSS 模块或类名组合而非内联样式实现。
- **技术实践**
  - 每个文件默认导出具名组件（例如 `export default function UserMenu() { ... }`），并在必要时提供具名导出以复用内部单元。
  - 使用 `propTypes` 或 TypeScript 类型标注组件接口；跨模块引用时经由当前目录的 `index.js` 汇总，避免深层相对路径。
  - 修改后至少运行 `npm run lint` 与 `npm run lint:css`，并按照项目格式化规范处理相关文件。

