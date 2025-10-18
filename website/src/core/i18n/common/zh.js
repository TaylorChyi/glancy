/**
 * 背景：
 *  - 单一翻译文件行数庞大导致结构化 ESLint 规则被豁免，难以持续演进。
 * 目的：
 *  - 采用组合模式将翻译按领域拆分，恢复质量守卫并提升定位效率。
 * 关键决策与取舍：
 *  - 通过具名模块聚合（类似组合模式的装配层）保持键名兼容，避免侵入式重构；
 *  - 采用纯对象合并，确保调用侧仍然获取平铺结构。
 * 影响范围：
 *  - 所有引用 zh 翻译的 UI 组件，最终得到与既有实现一致的键集合。
 * 演进与TODO：
 *  - 后续可引入自动校验，确保各模块与 en 对应键集保持同步。
 */
import { CORE_INTERFACE_TRANSLATIONS_ZH } from "./segments/coreInterfaceZh";
import { PREFERENCES_OVERVIEW_TRANSLATIONS_ZH } from "./segments/preferencesOverviewZh";
import { SETTINGS_GENERAL_TRANSLATIONS_ZH } from "./segments/settingsGeneralZh";
import { SETTINGS_PERSONALIZATION_TRANSLATIONS_ZH } from "./segments/settingsPersonalizationZh";
import { SETTINGS_KEYBOARD_TRANSLATIONS_ZH } from "./segments/settingsKeyboardZh";
import { SETTINGS_DATA_TRANSLATIONS_ZH } from "./segments/settingsDataZh";
import { SETTINGS_ACCOUNT_TRANSLATIONS_ZH } from "./segments/settingsAccountZh";
import { SETTINGS_SUBSCRIPTION_TRANSLATIONS_ZH } from "./segments/settingsSubscriptionZh";
import { DICTIONARY_EXPERIENCE_TRANSLATIONS_ZH } from "./segments/dictionaryExperienceZh";
import { ENGAGEMENT_SHARING_TRANSLATIONS_ZH } from "./segments/engagementSharingZh";
import { INTERACTION_CONTROLS_TRANSLATIONS_ZH } from "./segments/interactionControlsZh";
import { PRIVACY_CONSENT_TRANSLATIONS_ZH } from "./segments/privacyConsentZh";

const ZH_TRANSLATIONS = {
  ...CORE_INTERFACE_TRANSLATIONS_ZH,
  ...PREFERENCES_OVERVIEW_TRANSLATIONS_ZH,
  ...SETTINGS_GENERAL_TRANSLATIONS_ZH,
  ...SETTINGS_PERSONALIZATION_TRANSLATIONS_ZH,
  ...SETTINGS_KEYBOARD_TRANSLATIONS_ZH,
  ...SETTINGS_DATA_TRANSLATIONS_ZH,
  ...SETTINGS_ACCOUNT_TRANSLATIONS_ZH,
  ...SETTINGS_SUBSCRIPTION_TRANSLATIONS_ZH,
  ...DICTIONARY_EXPERIENCE_TRANSLATIONS_ZH,
  ...ENGAGEMENT_SHARING_TRANSLATIONS_ZH,
  ...INTERACTION_CONTROLS_TRANSLATIONS_ZH,
  ...PRIVACY_CONSENT_TRANSLATIONS_ZH,
};

export default ZH_TRANSLATIONS;
