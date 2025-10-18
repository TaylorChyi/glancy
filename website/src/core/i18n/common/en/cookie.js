/**
 * 背景：
 *  - 隐私与 Cookie 通知需独立维护以符合合规策略。
 * 目的：
 *  - 提供 Cookie 同意流程的专用词条，便于跨页面复用。
 * 关键决策与取舍：
 *  - 使用对象导出并保持纯文本，避免引入环境依赖；
 *  - 未嵌套场景层级，保持消费端读取方式简单。
 * 影响范围：
 *  - Cookie 通知与隐私确认交互。
 * 演进与TODO：
 *  - 后续若支持多档隐私模式，可在此模块扩展枚举描述。
 */
const cookie = {
  cookieConsentTitle: "Your privacy, elevated",
  cookieConsentDescription:
    "We use cookies to remember trusted devices and tailor your sign-in journey.",
  cookieConsentRequired:
    "This feature needs cookies to recall your previous visits. Allow cookies to continue with your saved experience.",
  cookieConsentNotice:
    "You can revisit this choice whenever you need. We only use cookies to secure and refine your experience.",
  cookieConsentAccept: "Allow cookies",
  cookieConsentDecline: "Maybe later",
};

export default cookie;
