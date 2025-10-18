/**
 * 背景：
 *  - 剪贴板相关提示需独立管理，避免与搜索或分享逻辑耦合。
 * 目的：
 *  - 集中维护复制动作的提示语，以便统一体验。
 * 关键决策与取舍：
 *  - 仍以纯对象导出，保持取值方式简单直观；
 *  - 未在此封装逻辑，遵循 i18n 模块“数据即配置”的原则。
 * 影响范围：
 *  - 复制、粘贴反馈组件。
 * 演进与TODO：
 *  - 可在后续加入多态提示（例如区分移动端与桌面端）。
 */
const clipboard = {
  copyAction: "Copy",
  copySuccess: "Copied to clipboard",
  copyFailed: "Copy failed",
  copyUnavailable: "Copy not available",
  copyEmpty: "Nothing to copy",
};

export default clipboard;
