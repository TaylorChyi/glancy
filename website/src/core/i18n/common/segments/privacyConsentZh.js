/**
 * 背景：
 *  - 隐私与 Cookie 授权文案需遵循合规策略，独立维护更易审计。
 * 目的：
 *  - 拆分 Cookie 授权提示，方便法务与隐私团队快速定位与更新。
 * 关键决策与取舍：
 *  - 保持原键名，避免影响弹窗组件；
 *  - 仅收纳隐私弹窗文案，确保职责单一。
 * 影响范围：
 *  - Cookie 授权弹窗及相关提醒。
 * 演进与TODO：
 *  - 若增加多语言隐私声明版本，可在此扩展映射表与版本号标记。
 */
export const PRIVACY_CONSENT_TRANSLATIONS_ZH = {
  cookieConsentTitle: "尊重隐私的尊奢体验",
  cookieConsentDescription:
    "我们会使用 Cookie 记录已信任的设备，为您定制更顺滑的登录旅程。",
  cookieConsentRequired:
    "此功能需要 Cookie 来识别您曾经的访问，请授权后继续享受专属体验。",
  cookieConsentNotice:
    "您可以随时重新调整选择，我们仅为安全与体验优化使用 Cookie。",
  cookieConsentAccept: "同意并继续",
  cookieConsentDecline: "暂不授权",
};
