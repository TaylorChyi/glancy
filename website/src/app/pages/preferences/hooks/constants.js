/**
 * 背景：
 *  - 原先 usePreferenceSections.js 内同时承担“结构蓝图定义 + 状态管理”职责，
 *    常量散落导致文件难以拆分与复用。
 * 目的：
 *  - 沉淀偏好设置页面通用常量，确保分区装配可在多处共享且便于未来主题扩展。
 * 关键决策与取舍：
 *  - 采用冻结对象承载图标元数据，避免运行时被意外修改；
 *  - 将模态兜底 heading ID 统一定义，保障无论页面或模态均能复用一致的可访问性 id。
 * 影响范围：
 *  - 偏好设置页面及 SettingsModal 共享的图标/heading 标识。
 * 演进与TODO：
 *  - 若后续需要按主题切换图标，可扩展 createIconConfig 支持令牌化尺寸。
 */
const createIconConfig = (name) =>
  Object.freeze({
    name,
    roleClass: "inherit",
    decorative: true,
    width: 20,
    height: 20,
  });

export const SECTION_ICON_REGISTRY = Object.freeze({
  general: createIconConfig("cog-6-tooth"),
  responseStyle: createIconConfig("personalization"),
  data: createIconConfig("shield-check"),
  keyboard: createIconConfig("command-line"),
  account: createIconConfig("user"),
  subscription: createIconConfig("subscription"),
});

export const FALLBACK_MODAL_HEADING_ID = "settings-modal-fallback-heading";
