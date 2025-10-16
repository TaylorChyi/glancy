/**
 * 背景：
 *  - 现有 icon 令牌直接沿用 Heroicons 文件名（如 arrow-left、cog-6-tooth），
 *    命名与业务语义脱节，难以判断资源用途；
 *  - 多个特性共享同一字符串常量，缺乏统一出口，重构与审计成本高。
 * 目的：
 *  - 以领域语义重新命名 SVG 资源，并集中导出枚举常量，
 *    让 ThemeIcon 调用方可以通过具名 token 明确表达意图；
 *  - 为 iconSourceResolver 提供映射锚点，支撑旧 token 的兼容与未来扩展。
 * 关键决策与取舍：
 *  - 采用 `Object.freeze` 固定常量，确保运行时不可变；
 *  - 同时导出联合类型，提升 TypeScript 场景的静态校验能力；
 *  - 暂未引入命名空间或 class，保持调用端接入成本最低。
 * 影响范围：
 *  - 所有通过 ThemeIcon 渲染的组件与测试；
 *  - iconSourceResolver 解析逻辑与静态 manifest；
 *  - 依赖旧 token 的遗留调用将通过别名表过渡。
 * 演进与TODO：
 *  - 可进一步拆分为分层常量（如 BRAND/SETTINGS/CHAT），
 *    或在未来引入 codegen 自动对齐设计稿资产。
 */

export const ICON_TOKEN = Object.freeze({
  BRAND_WORDMARK: "brand-wordmark",
  BRAND_GLYPH: "brand-glyph",
  BRAND_APPLE: "brand-apple",
  BRAND_GOOGLE: "brand-google",
  BRAND_WECHAT: "brand-wechat",
  AUTH_EMAIL: "auth-email",
  AUTH_PHONE: "auth-phone",
  IDENTITY_USER: "identity-user",
  AVATAR_DEFAULT: "avatar-default",
  ACCOUNT_SIGN_OUT: "account-sign-out",
  SETTINGS_GENERAL: "settings-general",
  SETTINGS_SHORTCUTS: "settings-shortcuts",
  SETTINGS_RESPONSE_STYLE: "settings-response-style",
  SETTINGS_SECURITY: "settings-security",
  SETTINGS_SUBSCRIPTION: "settings-subscription",
  FEATURE_LIBRARY: "feature-library",
  ACTION_SEARCH: "action-search",
  ACTION_COPY: "action-copy",
  ACTION_COPY_SUCCESS: "feedback-copy-success",
  ACTION_LINK: "action-link",
  ACTION_DELETE: "action-delete",
  ACTION_OVERFLOW: "action-overflow",
  ACTION_CLOSE: "action-close",
  ACTION_FLAG: "action-flag",
  ACTION_REFRESH: "action-refresh",
  CHAT_SEND: "chat-send",
  CHAT_VOICE: "chat-voice",
  INPUT_VISIBILITY_ON: "input-visibility-on",
  INPUT_VISIBILITY_OFF: "input-visibility-off",
  FAVORITE_SOLID: "favorite-solid",
  FAVORITE_OUTLINE: "favorite-outline",
  NAVIGATION_PREVIOUS: "navigation-previous",
  NAVIGATION_NEXT: "navigation-next",
  LOADER_FRAMES: "loader-frames",
} as const);

export type IconToken = (typeof ICON_TOKEN)[keyof typeof ICON_TOKEN];
