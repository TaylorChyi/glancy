/**
 * 背景：
 *  - 翻译键映射原先采用 switch 语句，新增动作时难以及时发现遗漏且复杂度较高。
 * 目的：
 *  - 以数据驱动的映射表管理动作到文案键的对应关系，统一默认 fallback。
 * 关键决策与取舍：
 *  - 采用 Map 保存结构化元数据，便于未来补充更多字段（如权限、分组）；
 *  - 默认返回动作名，避免无翻译时出现空字符串。
 * 影响范围：
 *  - Shortcuts Modal 与设置页的快捷键文案展示。
 * 演进与TODO：
 *  - 若后续支持多语言动态加载，可在此接入 i18n namespace 前缀策略。
 */
const ACTION_TRANSLATIONS = new Map([
  ["FOCUS_SEARCH", { key: "shortcutsFocusSearch", fallback: "Focus search input" }],
  ["SWITCH_LANGUAGE", { key: "shortcutsSwitchLanguage", fallback: "Switch language" }],
  ["TOGGLE_THEME", { key: "shortcutsToggleTheme", fallback: "Toggle theme" }],
  ["TOGGLE_FAVORITE", { key: "shortcutsToggleFavorite", fallback: "Toggle favorite" }],
  ["OPEN_SHORTCUTS", { key: "settingsKeyboardOpenPalette", fallback: "Open shortcut guide" }],
]);

export function translateShortcutAction(t, action) {
  const translation = ACTION_TRANSLATIONS.get(action);
  if (!translation) {
    return action;
  }
  return t?.[translation.key] ?? translation.fallback;
}
