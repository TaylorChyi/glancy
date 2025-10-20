# website/src/shared/assets 指南

> 此规范覆盖 `website/src/shared/assets` 及其子目录，约束素材归档、命名与引用方式。

## 目录分层

- `actions/`
  - 行为触发类 UI 图标（如关闭、刷新、搜索、删除）。
- `brand/`
  - `glancy/`：品牌识别相关资产（应用、站点徽标等）。
- `communication/`
  - `channels/`：沟通触点，如邮箱、电话、社交账号。
  - `sharing/`：链路与外部分享入口。
- `domain/`
  - 按业务语义拆分（automation、knowledge、personalization 等），收录场景特定插画或图标。
- `identity/`
  - 用户身份、头像等资产，继续细分 avatars、users。
- `integrations/`
  - 第三方接入、认证相关图标，例如 Apple、Google。
- `interface/`
  - `controls/`：交互控件（发送、语音、等待帧）。
  - `inputs/`：表单与输入状态。
  - `layout/`：结构辅助，例如省略号菜单。
  - `navigation/`：箭头、跳转相关元素。
- `status/`
  - 状态反馈、成就或订阅等语义化图标。
- `system/`
  - 系统级设定、配置或工具类图标。

`icon-manifest.generated.js` 与 `icons.js` 位于根目录，用于集中暴露 SVG registry；`__tests__/` 覆盖动态注册器逻辑。

## 资产命名

- 采用 `kebab-case`，并在文件名前缀体现业务语义（如 `brand-glancy-website.svg`）。
- 同一语义的多变体以 `-light`、`-dark` 后缀区分，确保生成脚本可推断主题。
- 新增子目录前需在本文件补充职责描述，防止目录漂移。

## 引用约定

- 通过 `@assets/...` 别名引用，路径需显式包含子目录以体现使用场景。
- 若资产需暴露给 Icon Registry，仅需放置于相应目录；生成脚本会自动递归收集。
- 更新资产后务必执行 `npm run generate:icons` 以同步静态清单。

## 质量守则

- 禁止提交临时或未使用的素材，新增文件需在 PR 描述中注明来源与用途。
- 资产体积超过 50 KB 时需提供压缩方案或设计说明。
- 一切导入测试中引用的路径须与此目录结构一致，避免隐藏式相对路径。
