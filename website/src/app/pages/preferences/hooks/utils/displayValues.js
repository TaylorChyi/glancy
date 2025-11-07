/**
 * 意图：统一将候选值映射为用于展示的字符串。
 * 输入：候选值 candidate、兜底文案 fallbackValue。
 * 输出：优先返回非空字符串，否则回退到兜底文案。
 */
export const mapToDisplayValue = (candidate, fallbackValue = "") => {
  if (candidate === null || candidate === undefined) {
    return fallbackValue;
  }
  if (typeof candidate === "string" && candidate.trim().length === 0) {
    return fallbackValue;
  }
  return String(candidate);
};

/**
 * 意图：从多个候选文案中挑选首个有效字符串。
 * 输入：候选字符串数组 candidates，兜底文案 fallbackValue。
 * 输出：首个非空白字符串或兜底文案。
 */
export const pickFirstMeaningfulString = (candidates, fallbackValue = "") => {
  for (const candidate of candidates) {
    if (typeof candidate !== "string") {
      continue;
    }
    const trimmed = candidate.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }
  return typeof fallbackValue === "string" ? fallbackValue.trim() : "";
};

/**
 * 意图：格式化手机号展示，确保区号与本地号码统一。
 * 输入：原始手机号 rawPhone、fallbackValue、defaultCode。
 * 输出：包含国际区号的字符串；若不可解析则回退至 fallbackValue 或原值。
 */
export const formatPhoneDisplay = (
  rawPhone,
  { fallbackValue, defaultCode = "+86" } = {},
) => {
  const normalized = mapToDisplayValue(rawPhone, fallbackValue);
  if (normalized === fallbackValue) {
    return fallbackValue;
  }

  if (typeof normalized !== "string") {
    return normalized;
  }

  const trimmed = normalized.trim();
  if (trimmed.length === 0) {
    return fallbackValue;
  }

  const withCode = trimmed.startsWith("+")
    ? trimmed
    : `${defaultCode} ${trimmed.replace(/\s+/g, " ").trim()}`;

  const match = withCode.match(/^(\+\d{1,4})([\s-]?)(.*)$/);
  if (!match) {
    return withCode;
  }

  const [, code, , numberPart] = match;
  const digits = numberPart.replace(/[^0-9]/g, "");
  if (!digits) {
    return code;
  }
  return `${code} ${digits}`;
};
