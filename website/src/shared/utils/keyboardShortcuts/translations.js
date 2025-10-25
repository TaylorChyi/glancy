/**
 * 背景：
 *  - 快捷键动作翻译与逻辑处理混杂，无法单独维护国际化策略。
 * 目的：
 *  - 独立抽象动作到展示文案的映射，便于未来接入多语言与自定义文案。
 * 关键决策与取舍：
 *  - 保持默认文案作为后备输出，避免缺失翻译时出现空白；
 *  - 暴露纯函数接口，便于通过依赖注入提升可测试性。
 * 影响范围：
 *  - 快捷键模态、设置面板等依赖文案的界面展示。
 * 演进与TODO：
 *  - 可在未来引入枚举或对象映射，支撑更多快捷键动作。
 */

const ACTION_TRANSLATORS = new Map([
  [
    "FOCUS_SEARCH",
    (t) => t?.shortcutsFocusSearch ?? "Focus search input",
  ],
  [
    "SWITCH_LANGUAGE",
    (t) => t?.shortcutsSwitchLanguage ?? "Switch language",
  ],
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
