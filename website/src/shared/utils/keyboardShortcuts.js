/**
 * 背景：
 *  - 原先所有快捷键逻辑集中在单文件中，超过结构化 lint 限制且难以维护。
 * 目的：
 *  - 通过外观模式（Facade）拆分为常量、归一化、捕获、匹配等子模块，并在此暴露稳定 API，确保调用方零改动迁移。
 * 关键决策与取舍：
 *  - 维持既有导出名称，避免破坏历史依赖；
 *  - 将平台探测、格式化等细分模块化，降低圈复杂度并提升测试可控性。
 * 影响范围：
 *  - 所有引用快捷键工具函数的模块（设置页、快捷键面板、输入框拦截等）。
 * 演进与TODO：
 *  - 若未来引入 chord 支持，可在子模块扩展并继续通过本外观暴露统一接口。
 */

export { DEFAULT_SHORTCUTS } from "./keyboardShortcuts/constants.js";
export { captureKeysFromEvent } from "./keyboardShortcuts/eventCapture.js";
export { formatShortcutKeys } from "./keyboardShortcuts/formatters.js";
export { doesEventMatchShortcut } from "./keyboardShortcuts/matchers.js";
export { mergeShortcutLists } from "./keyboardShortcuts/registry.js";
export { normalizeKeyToken } from "./keyboardShortcuts/normalizers.js";
export { translateShortcutAction } from "./keyboardShortcuts/translations.js";
