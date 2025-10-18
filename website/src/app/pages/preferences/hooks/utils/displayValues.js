/**
 * 背景：
 *  - 偏好设置页面存在大量展示值归一化逻辑（空值占位、手机号格式化等），
 *    之前散落在 usePreferenceSections.js 中导致主 Hook 体积庞大。
 * 目的：
 *  - 提供一组纯函数工具，专注于展示层所需的文本规约，便于复用与测试。
 * 关键决策与取舍：
 *  - 采用纯函数+具名导出，确保函数既可单独测试也便于 tree-shaking；
 *  - 保持输入宽容（支持 null/undefined/空串），避免调用方重复做防御式判断。
 * 影响范围：
 *  - 偏好设置页面及潜在的账户信息展示模块。
 * 演进与TODO：
 *  - 后续可在此扩展国际化敏感的格式化策略（如日期、货币）。
 */

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
export const pickFirstMeaningfulString = (
  candidates,
  fallbackValue = "",
) => {
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
