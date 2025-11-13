export const FALLBACK_VALUE = "—";

/**
 * 意图：提供对潜在空白字符串的兜底处理，确保界面文本稳定。
 * 输入：任意值与兜底字符串。
 * 输出：去除首尾空白后的字符串或 fallback。
 */
export const safeString = (value, fallback = FALLBACK_VALUE) => {
  if (typeof value !== "string") {
    return fallback;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

/**
 * 意图：统一处理展示型数值/文本，兼容 null/undefined 与空串。
 */
export const normalizeDisplayValue = (value, fallback = FALLBACK_VALUE) => {
  if (value === null || value === undefined) {
    return fallback;
  }
  const stringified = `${value}`.trim();
  return stringified.length > 0 ? stringified : fallback;
};

/**
 * 意图：在订阅文案中统一处理 {value}/{amount}/{equivalent} 等占位符，避免组件散落手写替换。
 * 输入：
 *  - template: 允许为空的字符串模板；
 *  - replacements: 需要注入模板的键值对，自动兼容大小写及 value↔amount 同名映射；
 *  - fallbackValue: 占位符缺失或模板无效时的兜底文案。
 * 输出：
 *  - 插值后的最终字符串。
 * 流程：
 *  1) 模板为空或非字符串时直接返回 fallbackValue；
 *  2) 使用单个正则遍历 {token} 占位符；
 *  3) 兼容 token 的原始/大小写形式，并在 value/amount 间互为后备，未命中时回退 fallbackValue。
 * 错误处理：
 *  - 不抛出异常，任何非法输入均退化为 fallbackValue，保障界面稳定。
 * 复杂度：O(n)，其中 n 为模板长度。
 */
const normalizeTemplate = (template) =>
  typeof template === "string" ? template.trim() : "";

const resolveTemplateFallback = (fallbackValue) =>
  normalizeDisplayValue(fallbackValue, FALLBACK_VALUE);

const buildTokenDictionary = (replacements = {}) => {
  const dictionary = new Map();
  Object.entries(replacements).forEach(([key, value]) => {
    if (!key) {
      return;
    }
    dictionary.set(key, value);
    dictionary.set(key.toLowerCase(), value);
    dictionary.set(key.toUpperCase(), value);
  });
  return dictionary;
};

const evaluateToken = (token, dictionary, fallback) => {
  if (dictionary.has(token)) {
    return normalizeDisplayValue(dictionary.get(token), fallback);
  }
  const isValueToken = token === "value" && dictionary.has("amount");
  if (isValueToken) {
    return normalizeDisplayValue(dictionary.get("amount"), fallback);
  }
  const isAmountToken = token === "amount" && dictionary.has("value");
  if (isAmountToken) {
    return normalizeDisplayValue(dictionary.get("value"), fallback);
  }
  return fallback;
};

export const interpolateTemplate = (
  template,
  replacements,
  fallbackValue = FALLBACK_VALUE,
) => {
  const normalizedTemplate = normalizeTemplate(template);
  if (!normalizedTemplate) {
    return resolveTemplateFallback(fallbackValue);
  }

  const resolvedFallback = resolveTemplateFallback(fallbackValue);
  const tokenDictionary = buildTokenDictionary(replacements);

  return normalizedTemplate.replace(/\{(\w+)\}/g, (_match, token) =>
    evaluateToken(token, tokenDictionary, resolvedFallback),
  );
};

export const formatWithTemplate = (template, value) => {
  const fallback = resolveTemplateFallback(value);
  if (!template) {
    return fallback;
  }
  return interpolateTemplate(template, { value, amount: value }, fallback);
};

export const formatTemplateWithPair = (template, amount, equivalent) => {
  const fallback = resolveTemplateFallback(amount);
  if (!template) {
    return fallback;
  }
  return interpolateTemplate(
    template,
    { amount, value: amount, equivalent },
    fallback,
  );
};

/**
 * 意图：在不引入第三方依赖的前提下，将订阅到期日期规范化为稳定可读的格式。
 * 输入：
 *  - value: 可能为字符串或 Date 实例的日期输入；
 * 输出：
 *  - 适合展示的字符串，若无法解析则返回 null。该字符串优先使用本地化格式，退化为 ISO-8601。
 * 流程：
 *  1) 解析形如 YYYY-MM-DD 的字符串并提取年月日；
 *  2) 利用 UTC 正午构建 Date，规避因时区偏移导致的跨日；
 *  3) 使用 Intl.DateTimeFormat 输出本地化日期文本，失败时回退为 ISO 字符串；
 *  4) 对于无法识别的输入直接退化为字符串本身。
 * 错误处理：
 *  - 捕获所有异常并返回 null，确保到期信息缺失时不会破坏界面。
 * 复杂度：O(1)。
 */
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/;

const formatFromDateInstance = (value) => {
  if (Number.isNaN(value.getTime())) {
    return null;
  }
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(value);
  } catch {
    return value.toISOString().slice(0, 10);
  }
};

const isIsoComponentValid = (year, month, day) =>
  Number.isFinite(year) &&
  Number.isFinite(month) &&
  Number.isFinite(day) &&
  month >= 1 &&
  month <= 12 &&
  day >= 1 &&
  day <= 31;

const formatUtcDate = (year, month, day, normalizedIso) => {
  try {
    const safeDate = new Date(Date.UTC(year, month - 1, day, 12));
    const formatted = new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(safeDate);
    return normalizeDisplayValue(formatted, normalizedIso);
  } catch {
    return normalizedIso;
  }
};

const formatFromIsoString = (raw) => {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  const isoMatch = trimmed.match(ISO_DATE_PATTERN);
  if (!isoMatch) {
    return trimmed;
  }

  const [, yearString, monthString, dayString] = isoMatch;
  const year = Number(yearString);
  const month = Number(monthString);
  const day = Number(dayString);
  const normalizedIso = `${yearString}-${monthString}-${dayString}`;

  if (!isIsoComponentValid(year, month, day)) {
    return normalizedIso;
  }

  return formatUtcDate(year, month, day, normalizedIso);
};

/**
 * 意图：在不引入第三方依赖的前提下，将订阅到期日期规范化为稳定可读的格式。
 * 输入：
 *  - value: 可能为字符串或 Date 实例的日期输入；
 * 输出：
 *  - 适合展示的字符串，若无法解析则返回 null。该字符串优先使用本地化格式，退化为 ISO-8601。
 * 流程：
 *  1) 针对 Date 实例直接格式化并兜底至 ISO；
 *  2) 针对字符串仅处理 YYYY-MM-DD 模式，其余原样返回；
 *  3) 通过 UTC 正午规避时区跨日，并借助 normalizeDisplayValue 保障兜底；
 * 错误处理：
 *  - 内部异常均回退为 null 或 ISO 字符串，避免破坏界面；
 * 复杂度：O(1)。
 */
export const formatRenewalDate = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return formatFromDateInstance(value);
  }

  if (typeof value !== "string") {
    return null;
  }

  return formatFromIsoString(value);
};

/**
 * 意图：根据币种配置输出本地化价格字符串，兼容整数与小数。
 */
export const formatCurrency = (amount, { currency, currencySymbol }) => {
  if (amount === null || amount === undefined) {
    return null;
  }
  const numeric = Number(amount);
  if (Number.isNaN(numeric)) {
    return null;
  }
  const maximumFractionDigits = currency === "JPY" ? 0 : 2;
  const isInteger = Number.isInteger(numeric);
  const formatted = numeric.toLocaleString(undefined, {
    minimumFractionDigits: isInteger ? 0 : Math.min(2, maximumFractionDigits),
    maximumFractionDigits,
  });
  return `${currencySymbol ?? ""}${formatted}`.trim();
};

/**
 * 意图：构造限额类文案，统一零值与软上限说明。
 */
export const formatQuota = (
  value,
  template,
  { zeroLabel, softLimitNote } = {},
) => {
  if (value === null || value === undefined) {
    return zeroLabel ?? FALLBACK_VALUE;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return zeroLabel ?? FALLBACK_VALUE;
  }
  const formatted = numeric.toLocaleString();
  const withTemplate = formatWithTemplate(template, formatted);
  return softLimitNote ? `${withTemplate}${softLimitNote}` : withTemplate;
};
