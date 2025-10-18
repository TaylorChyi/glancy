/**
 * 背景：
 *  - 偏好设置相关文案原本散落在单一文件中，难以按功能演进。
 * 目的：
 *  - 将偏好设置入口与分类文案抽离为独立分组，支撑模块化加载与后续扩展。
 * 关键决策与取舍：
 *  - 保持键名不变，仅做聚合拆分，避免影响既有调用；
 *  - 以常量导出，方便后续与其他语言版本对齐时复用结构。
 * 影响范围：
 *  - 偏好设置页面的入口描述与模块标题。
 * 演进与TODO：
 *  - 可考虑引入层级化命名空间，以便多主题或多角色配置复用。
 */
export const PREFERENCES_OVERVIEW_TRANSLATIONS_ZH = {
  prefTitle: "偏好设置",
  prefDescription: "协调语言、音色与外观，让每次查词都恰到好处。",
  prefDefaultsTitle: "默认使用语言",
  prefDefaultsDescription:
    "进入查词时沿用的源语言与目标语言配置，确保体验连贯。",
  prefInterfaceTitle: "界面体验",
  prefInterfaceDescription: "调整界面语言与主题，让系统表达更贴合你的习惯。",
  prefVoicesTitle: "发音演绎",
  prefVoicesDescription: "挑选英文与中文的播报音色，保持查词时的听感质感。",
  prefPersonalizationTitle: "个性画像",
  prefKeyboardTitle: "指令速查手册",
  prefDataTitle: "数据托管策略",
  prefAccountTitle: "账户",
  prefSystemLanguage: "界面语言",
  prefSystemLanguageAuto: "自动跟随系统",
  prefLanguage: "源语言",
  prefSearchLanguage: "目标语言",
  prefDictionaryModel: "默认模型",
  prefVoiceEn: "英文音色",
  prefVoiceZh: "中文音色",
  prefTheme: "主题",
};
