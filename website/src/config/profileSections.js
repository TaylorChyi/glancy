/**
 * 背景：
 *  - 个性化资料页需要稳定的配置来描述自定义区块，避免在页面内硬编码字段。
 * 目的：
 *  - 提供可扩展的 Schema，定义区块标识、图标、文案 key 及输入类型，供渲染逻辑复用。
 * 关键决策与取舍：
 *  - 采用配置驱动的方式描述区块，并为每个子项提供占位符与多行输入开关；
 *  - Schema 被 `Object.freeze`，确保运行时不可被意外修改。
 * 影响范围：
 *  - Profile 页面与相关 Hook 依赖该配置渲染自定义区块。
 * 演进与TODO：
 *  - TODO: 如需支持更多输入类型，可在子项上扩展 `inputType` 或 `options` 元数据。
 */
export const PROFILE_CUSTOM_SECTIONS_SCHEMA = Object.freeze([
  Object.freeze({
    id: "learning-plan",
    icon: "flag",
    titleKey: "customSections.learningPlan.title",
    descriptionKey: "customSections.learningPlan.description",
    items: Object.freeze([
      Object.freeze({
        id: "milestone",
        labelKey: "customSections.learningPlan.items.milestone.label",
        placeholderKey:
          "customSections.learningPlan.items.milestone.placeholder",
        multiline: true,
      }),
      Object.freeze({
        id: "cadence",
        labelKey: "customSections.learningPlan.items.cadence.label",
        placeholderKey: "customSections.learningPlan.items.cadence.placeholder",
        multiline: false,
      }),
    ]),
  }),
  Object.freeze({
    id: "resource-preference",
    icon: "library",
    titleKey: "customSections.resourcePreference.title",
    descriptionKey: "customSections.resourcePreference.description",
    items: Object.freeze([
      Object.freeze({
        id: "primary",
        labelKey: "customSections.resourcePreference.items.primary.label",
        placeholderKey:
          "customSections.resourcePreference.items.primary.placeholder",
        multiline: false,
      }),
      Object.freeze({
        id: "secondary",
        labelKey: "customSections.resourcePreference.items.secondary.label",
        placeholderKey:
          "customSections.resourcePreference.items.secondary.placeholder",
        multiline: false,
      }),
    ]),
  }),
  Object.freeze({
    id: "practice-scenarios",
    icon: "command-line",
    titleKey: "customSections.practiceScenarios.title",
    descriptionKey: "customSections.practiceScenarios.description",
    items: Object.freeze([
      Object.freeze({
        id: "real-world",
        labelKey: "customSections.practiceScenarios.items.realWorld.label",
        placeholderKey:
          "customSections.practiceScenarios.items.realWorld.placeholder",
        multiline: true,
      }),
      Object.freeze({
        id: "collaboration",
        labelKey: "customSections.practiceScenarios.items.collaboration.label",
        placeholderKey:
          "customSections.practiceScenarios.items.collaboration.placeholder",
        multiline: true,
      }),
    ]),
  }),
]);
