/**
 * 背景：
 *  - 个性化与画像相关的翻译词条需要单独治理，以支持长期画像能力演进。
 * 目的：
 *  - 将个性化相关文案集中至同一模块，方便未来扩展字段与差异化体验。
 * 关键决策与取舍：
 *  - 继续沿用原有键名以避免调用侧改动；
 *  - 将画像标签与输入提示一并收敛，保障语义一致。
 * 影响范围：
 *  - 偏好设置个性化页签、画像输入与响应风格配置。
 * 演进与TODO：
 *  - 若后续引入多 persona 模板，可在此处加入结构化元数据以驱动渲染。
 */
export const SETTINGS_PERSONALIZATION_TRANSLATIONS_ZH = {
  settingsTabPersonalization: "个性化",
  settingsPersonalizationDescription:
    "描述你的身份与期待，生成更贴合的回答语气。",
  settingsPersonalizationEmpty: "完善画像信息以便回答更贴近你。",
  settingsPersonalizationLoadError: "个性化详情暂时无法加载，请稍后再试。",
  settingsResponseStyleError: "响应风格配置暂时无法保存，请稍后重试。",
  settingsResponseStyleSaved: "已保存",
  responseStyleSelectLabel: "响应风格",
  responseStyleOptionDefault: "默认",
  responseStyleOptionDefaultDescription: "轻快且灵活应对场景",
  responseStyleOptionCynic: "冷冽吐槽",
  responseStyleOptionCynicDescription: "尖锐、冷幽默的解读",
  responseStyleOptionRobot: "效率至上",
  responseStyleOptionRobotDescription: "直接给出重点与要点",
  responseStyleOptionListener: "共情倾听",
  responseStyleOptionListenerDescription: "沉稳细腻、善于鼓励",
  responseStyleOptionNerd: "知识控",
  responseStyleOptionNerdDescription: "探索式、充满好奇心",
  responseStyleFieldGoalLabel: "个人目标",
  responseStyleFieldGoalPlaceholder: "例如：半年内获得托福 110 分",
  responseStyleFieldJobLabel: "专业角色",
  responseStyleFieldJobPlaceholder: "例如：产品经理 / 词汇讲师",
  responseStyleFieldEducationLabel: "教育背景",
  responseStyleFieldEducationPlaceholder: "例如：北京大学外国语学院",
  responseStyleFieldInterestsLabel: "兴趣",
  responseStyleFieldInterestsPlaceholder: "可分行填写：金融研究、设计史等",
  responseStyleFieldAbilityLabel: "当前能力",
  responseStyleFieldAbilityPlaceholder: "例如：CEFR B2",
  settingsEnableCustomization: "启用个性化",
  settingsOccupation: "业身份",
  settingsOccupationPlaceholder: "例如 学生",
  settingsAboutYou: "更多关于你",
  settingsAboutYouPlaceholder: "介绍你的领域、经历或兴趣方向。",
  settingsLearningGoal: "学习目标",
  settingsLearningGoalPlaceholder: "写下你期望达成的结果。",
  interestsLabel: "日常兴趣",
  interestsPlaceholder: "请输入日常兴趣",
  interestsHelp: "根据您的日常兴趣和知识背景提供相关示例",
  goalLabel: "目标",
  goalPlaceholder: "请输入目标",
  goalHelp: "按照考试、旅游或商务等目标调整例句",
};
