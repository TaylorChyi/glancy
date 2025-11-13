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
const NOISE_TOKENS = new Set([
  "",
  "redeem-auth-missing",
  "redeem-api-unavailable",
  "network error",
  "request failed",
]);

const extractErrorCandidates = (error) => {
  if (typeof error === "string") {
    return [error];
  }

  if (!error || typeof error !== "object") {
    return [];
  }

  const fields = [error.message, error.reason, error.detail];
  return fields.filter((candidate) => typeof candidate === "string");
};

const pickMeaningfulReason = (candidates) =>
  candidates
    .map((candidate) => (typeof candidate === "string" ? candidate.trim() : ""))
    .find((candidate) => candidate && !NOISE_TOKENS.has(candidate.toLowerCase()));

export const composeRedeemFailureMessage = (error, fallbackMessage) => {
  const fallback = typeof fallbackMessage === "string" ? fallbackMessage : "";
  const reason = pickMeaningfulReason(extractErrorCandidates(error));

  if (!reason) {
    return fallback;
  }

  return fallback ? `${fallback} (${reason})` : reason;
};
