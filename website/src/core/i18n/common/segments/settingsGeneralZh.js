/**
 * 背景：
 *  - 通用设置段落的文案与其他偏好项混在一起，维护成本高。
 * 目的：
 *  - 聚合通用设置相关键值，确保未来扩展主题与语言选项时便于定位。
 * 关键决策与取舍：
 *  - 依旧保持平铺键，透过常量导出实现逻辑分层；
 *  - 暂不引入动态拼装逻辑，降低对现有消费端的影响。
 * 影响范围：
 *  - 偏好设置中“通用”与语音预览相关文案。
 * 演进与TODO：
 *  - 如需支持更多语音采样，可在此模块增加结构化定义并引入校验。
 */
export const SETTINGS_GENERAL_TRANSLATIONS_ZH = {
  settingsVoicePreviewPlay: "播放",
  settingsVoicePreviewStop: "停止",
  settingsVoicePreviewTextEn: "Hi, I'm Glancy.",
  settingsVoicePreviewTextZh: "你好，我是 Glancy。",
  settingsTabGeneral: "通用",
  settingsGeneralDescription: "协调界面语言、主题与默认发音。",
  settingsGeneralThemeLabel: "界面主题",
  settingsGeneralThemeLight: "浅色",
  settingsGeneralThemeDark: "深色",
  settingsGeneralThemeSystem: "跟随系统",
  settingsGeneralLanguageLabel: "系统语言",
  settingsGeneralLanguageOption_en: "英语（English）",
  settingsGeneralLanguageOption_zh: "中文（简体）",
  settingsGeneralMarkdownLabel: "Markdown 渲染",
  settingsGeneralMarkdownDynamic: "动态渲染",
  settingsGeneralMarkdownPlain: "显示原文",
  settingsGeneralChatOutputLabel: "助手回复方式",
  settingsGeneralChatOutputStream: "流式输出",
  settingsGeneralChatOutputSync: "完整生成后输出",
};
