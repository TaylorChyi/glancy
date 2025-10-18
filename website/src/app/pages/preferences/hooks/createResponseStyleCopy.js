/**
 * 背景：
 *  - 响应风格分区的文案与选项较多，原本内联在主 Hook 中，
 *    造成滚动距离长且难以维护。
 * 目的：
 *  - 提供纯函数根据翻译生成响应风格分区的 copy 配置，保持结构一致。
 * 关键决策与取舍：
 *  - 通过蓝图驱动选项与字段构造，避免在主逻辑中出现大量 `??` 嵌套。
 * 影响范围：
 *  - ResponseStyleSection 的展示文案。
 * 演进与TODO：
 *  - 后续可将蓝图迁移至远程配置，实现运营动态调整。
 */
const OPTION_BLUEPRINTS = [
  {
    value: "default",
    labelKey: "responseStyleOptionDefault",
    descriptionKey: "responseStyleOptionDefaultDescription",
    fallbackLabel: "Default",
    fallbackDescription: "Cheerful and adaptive",
  },
  {
    value: "cynic",
    labelKey: "responseStyleOptionCynic",
    descriptionKey: "responseStyleOptionCynicDescription",
    fallbackLabel: "Cynic",
    fallbackDescription: "Critical and sarcastic",
  },
  {
    value: "robot",
    labelKey: "responseStyleOptionRobot",
    descriptionKey: "responseStyleOptionRobotDescription",
    fallbackLabel: "Robot",
    fallbackDescription: "Efficient and blunt",
  },
  {
    value: "listener",
    labelKey: "responseStyleOptionListener",
    descriptionKey: "responseStyleOptionListenerDescription",
    fallbackLabel: "Listener",
    fallbackDescription: "Thoughtful and supportive",
  },
  {
    value: "nerd",
    labelKey: "responseStyleOptionNerd",
    descriptionKey: "responseStyleOptionNerdDescription",
    fallbackLabel: "Nerd",
    fallbackDescription: "Exploratory and enthusiastic",
  },
];

const FIELD_BLUEPRINTS = [
  {
    id: "job",
    labelKey: "responseStyleFieldJobLabel",
    fallbackLabelKey: "jobLabel",
    fallbackLabel: "Occupation",
    placeholderKey: "responseStyleFieldJobPlaceholder",
    multiline: false,
  },
  {
    id: "education",
    labelKey: "responseStyleFieldEducationLabel",
    fallbackLabelKey: "educationLabel",
    fallbackLabel: "Education",
    placeholderKey: "responseStyleFieldEducationPlaceholder",
    multiline: false,
  },
  {
    id: "currentAbility",
    labelKey: "responseStyleFieldAbilityLabel",
    fallbackLabelKey: "currentAbilityLabel",
    fallbackLabel: "Current Ability",
    placeholderKey: "responseStyleFieldAbilityPlaceholder",
    multiline: false,
  },
  {
    id: "goal",
    labelKey: "responseStyleFieldGoalLabel",
    fallbackLabelKey: "goalLabel",
    fallbackLabel: "Goal",
    placeholderKey: "responseStyleFieldGoalPlaceholder",
    multiline: true,
  },
  {
    id: "interests",
    labelKey: "responseStyleFieldInterestsLabel",
    fallbackLabelKey: "interestsLabel",
    fallbackLabel: "Interests",
    placeholderKey: "responseStyleFieldInterestsPlaceholder",
    multiline: true,
  },
];

const resolveTranslation = (translations, primaryKey, fallbackKey, fallback) => {
  if (primaryKey && typeof translations[primaryKey] === "string") {
    return translations[primaryKey];
  }
  if (fallbackKey && typeof translations[fallbackKey] === "string") {
    return translations[fallbackKey];
  }
  return fallback;
};

const createOptions = (translations) =>
  OPTION_BLUEPRINTS.map(({
    value,
    labelKey,
    descriptionKey,
    fallbackLabel,
    fallbackDescription,
  }) => ({
    value,
    label: resolveTranslation(translations, labelKey, null, fallbackLabel),
    description: resolveTranslation(
      translations,
      descriptionKey,
      null,
      fallbackDescription,
    ),
  }));

const createFields = (translations) =>
  FIELD_BLUEPRINTS.map(
    ({
      id,
      labelKey,
      fallbackLabelKey,
      fallbackLabel,
      placeholderKey,
      multiline,
    }) => ({
      id,
      label: resolveTranslation(
        translations,
        labelKey,
        fallbackLabelKey,
        fallbackLabel,
      ),
      placeholder:
        typeof translations[placeholderKey] === "string"
          ? translations[placeholderKey]
          : "",
      ...(multiline ? { multiline: true, rows: 3 } : {}),
    }),
  );

export const createResponseStyleCopy = (translations) => ({
  loadingLabel: resolveTranslation(translations, "loading", "saving", "Loading..."),
  savingLabel: resolveTranslation(translations, "saving", null, "Saving..."),
  errorLabel: resolveTranslation(
    translations,
    "settingsResponseStyleError",
    "fail",
    "Unable to load response preferences",
  ),
  retryLabel: resolveTranslation(translations, "refresh", null, "Refresh"),
  dropdownLabel: resolveTranslation(
    translations,
    "responseStyleSelectLabel",
    null,
    "Response Tone",
  ),
  options: createOptions(translations),
  fields: createFields(translations),
});
