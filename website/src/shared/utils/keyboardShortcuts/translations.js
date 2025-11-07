const ACTION_TRANSLATORS = new Map([
  ["FOCUS_SEARCH", (t) => t?.shortcutsFocusSearch ?? "Focus search input"],
  ["SWITCH_LANGUAGE", (t) => t?.shortcutsSwitchLanguage ?? "Switch language"],
  ["TOGGLE_THEME", (t) => t?.shortcutsToggleTheme ?? "Toggle theme"],
  [
    "OPEN_SHORTCUTS",
    (t) => t?.settingsKeyboardOpenPalette ?? "Open shortcut guide",
  ],
]);

/**
 * 意图：根据动作 key 获取对应的国际化文案。
 * 输入：
 *  - t：翻译对象，可缺省；
 *  - action：快捷键动作标识。
 * 输出：字符串文案。
 * 流程：
 *  1) 根据动作 key 选择对应字段；
 *  2) 若翻译对象缺失则返回英文 fallback。
 * 错误处理：未知动作返回 action 本身，便于调试。
 * 复杂度：O(1)。
 */
export function translateShortcutAction(t, action) {
  const translator = ACTION_TRANSLATORS.get(action);
  return translator ? translator(t) : action;
}
