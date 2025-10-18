/**
 * 背景：
 *  - 键盘快捷键相关翻译需独立维护，便于随着指令体系扩展同步更新。
 * 目的：
 *  - 汇总快捷键配置与提示文案，提升检索效率并减少跨文件查找。
 * 关键决策与取舍：
 *  - 沿用既有平铺键名，保证现有组件无需修改；
 *  - 额外囊括快捷键总览标题，保持语义完整。
 * 影响范围：
 *  - 偏好设置中的快捷键页签及快捷键提示组件。
 * 演进与TODO：
 *  - 若后续支持自定义键盘布局，可在此扩展 metadata 驱动展示顺序。
 */
export const SETTINGS_KEYBOARD_TRANSLATIONS_ZH = {
  settingsTabKeyboard: "键盘快捷键",
  settingsKeyboardDescription: "掌握这些组合键，畅享高效的格律操作。",
  settingsKeyboardHint: "点击任意快捷键并按下新的组合即可更新。",
  settingsKeyboardRecordingHint: "正在录制，按下目标组合或按 Esc 取消。",
  settingsKeyboardRecording: "按下组合键",
  settingsKeyboardSaving: "保存中…",
  settingsKeyboardReset: "恢复默认",
  settingsKeyboardOpenPalette: "打开快捷键速览",
  settingsKeyboardEditLabel: "修改「{label}」的快捷键",
  settingsKeyboardConflict: "该组合已被其他功能占用。",
  shortcutSearch: "全局搜索",
  shortcutSend: "发送当前内容",
  shortcutEdit: "编辑上一条消息",
  shortcutDismiss: "关闭弹窗或菜单",
  shortcutsTitle: "键盘快捷键",
  shortcutsFocusSearch: "聚焦搜索框",
  shortcutsSwitchLanguage: "切换语言",
  shortcutsToggleTheme: "切换主题",
  shortcutsToggleFavorite: "收藏当前词",
};
