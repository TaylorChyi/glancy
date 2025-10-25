/**
 * 背景：
 *  - 快捷键提示散落在通用词条中，影响查阅效率。
 * 目的：
 *  - 将快捷键总览文案集中，方便跨端共用与后续扩展。
 * 关键决策与取舍：
 *  - 与偏好设置内的快捷键映射（shortcut* 键）区分，保持职责单一；
 *  - 使用简单对象导出，避免与渲染层产生耦合。
 * 影响范围：
 *  - 快捷键总览面板。
 * 演进与TODO：
 *  - 若新增分组展示，可在此模块追加结构化描述信息。
 */
const shortcuts = {
  shortcutsTitle: "Keyboard Shortcuts",
  shortcutsFocusSearch: "Focus search input",
  shortcutsSwitchLanguage: "Switch language",
  shortcutsToggleTheme: "Toggle theme",
};

export default shortcuts;
