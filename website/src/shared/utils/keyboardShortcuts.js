/**
 * 背景：
 *  - 快捷键工具原先集中于单文件，导致结构化 lint 告警与演进成本高。
 * 目的：
 *  - 作为统一出口，组合拆分后的归一化、事件匹配、合并与翻译模块。
 * 关键决策与取舍：
 *  - 采用端口-适配器式拆分，核心逻辑沉淀至子模块，便于未来替换实现；
 *  - 保留向外暴露的函数签名不变，确保调用方无感知迁移。
 * 影响范围：
 *  - Settings、全局快捷键监听与模态窗口均通过此出口引用功能。
 * 演进与TODO：
 *  - 后续若支持快捷键组合序列，可在各子模块内独立扩展状态机实现。
 */
export { DEFAULT_SHORTCUTS } from "./keyboardShortcutRegistry.js";
export { normalizeKeyToken, formatShortcutKeys } from "./keyboardShortcutNormalization.js";
export { captureKeysFromEvent, doesEventMatchShortcut } from "./keyboardShortcutEvents.js";
export { mergeShortcutLists } from "./keyboardShortcutMerging.js";
export { translateShortcutAction } from "./keyboardShortcutTranslations.js";
