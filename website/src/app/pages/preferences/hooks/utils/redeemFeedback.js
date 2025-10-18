/**
 * 背景：
 *  - 兑换流程需要统一的提示语与视觉风格，原实现散落在业务逻辑中难以维护。
 * 目的：
 *  - 将 toast 视觉常量与失败消息生成策略集中管理，便于共享给其他入口（如移动端）。
 * 关键决策与取舍：
 *  - 使用冻结对象定义状态->样式映射，符合策略模式思想，便于未来拓展“处理中”等状态；
 *  - 提供纯函数 composeRedeemFailureMessage，以便单元测试覆盖各类错误输入。
 * 影响范围：
 *  - 偏好设置页面的兑换反馈；后续若 SettingsModal 复用也可直接引入。
 * 演进与TODO：
 *  - 可在此扩展埋点事件描述或多语言兜底策略。
 */

export const DEFAULT_REDEEM_SUCCESS_MESSAGE = "兑换成功，权益已生效。";
export const DEFAULT_REDEEM_FAILURE_MESSAGE = "兑换失败，请稍后重试。";
export const DEFAULT_TOAST_DISMISS_LABEL = "Dismiss notification";

export const REDEEM_TOAST_VARIANTS = Object.freeze({
  success: Object.freeze({
    backgroundColor: "var(--brand-primary)",
    textColor: "var(--text-inverse-light)",
  }),
  failure: Object.freeze({
    backgroundColor: "var(--role-danger)",
    textColor: "var(--role-on-danger)",
  }),
});

export const REDEEM_TOAST_DURATION = 3000;

/**
 * 意图：从错误对象中提取用户可读的失败原因并拼接兜底文案。
 * 输入：错误对象 error、兜底文案 fallbackMessage。
 * 输出：最终 toast 提示字符串。
 */
export const composeRedeemFailureMessage = (error, fallbackMessage) => {
  const fallback = typeof fallbackMessage === "string" ? fallbackMessage : "";
  const candidates = [];
  if (typeof error === "string") {
    candidates.push(error);
  } else if (error && typeof error === "object") {
    if (typeof error.message === "string") {
      candidates.push(error.message);
    }
    if (typeof error.reason === "string") {
      candidates.push(error.reason);
    }
    if (typeof error.detail === "string") {
      candidates.push(error.detail);
    }
  }

  const noiseTokens = new Set([
    "",
    "redeem-auth-missing",
    "redeem-api-unavailable",
    "network error",
    "request failed",
  ]);
  const reason = candidates
    .map((candidate) => (typeof candidate === "string" ? candidate.trim() : ""))
    .find((candidate) => {
      if (!candidate) {
        return false;
      }
      return !noiseTokens.has(candidate.toLowerCase());
    });

  if (!reason) {
    return fallback;
  }

  if (!fallback) {
    return reason;
  }

  return `${fallback} (${reason})`;
};
