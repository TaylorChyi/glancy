import { resolveLanguageBadge } from "@shared/utils/language.js";

/**
 * 意图：解析调用方的 normalizeValue 策略，将输入值转换为组件内部统一对比的语言代码。
 * 输入：
 *  - value: 原始语言取值，可能为字符串、symbol 或 undefined。
 *  - normalizeValue: 可选策略函数，用于承载调用方的枚举映射。
 * 输出：
 *  - 策略返回的值，若策略缺省则返回原值。
 * 流程：
 *  1) 若提供 normalizeValue，则直接调用。
 *  2) 否则回退原值。
 * 错误处理：normalizeValue 内部异常由调用方负责，上层不吞并异常以避免静默失败。
 * 复杂度：O(1)。
 */
export function resolveNormalizedValue(value, normalizeValue) {
  if (typeof normalizeValue === "function") {
    return normalizeValue(value);
  }
  return value;
}

function normalizeOption({ value, label, description }, normalizeValue) {
  if (typeof label !== "string") {
    return null;
  }

  const normalized = resolveNormalizedValue(value, normalizeValue);
  const resolved = normalized ?? value;
  const stringValue =
    resolved != null ? String(resolved).toUpperCase() : undefined;

  if (!stringValue) {
    return null;
  }

  const badge = resolveLanguageBadge(stringValue);

  if (!badge) {
    return null;
  }

  const normalizedDescription =
    typeof description === "string" && description.trim().length > 0
      ? description.trim()
      : undefined;

  return {
    value: stringValue,
    badge,
    label,
    description: normalizedDescription,
  };
}

/**
 * 意图：将调用方提供的原始语言选项转化为菜单渲染所需的结构化数据。
 * 输入：
 *  - options: 原始选项数组。
 *  - normalizeValue: 用于对齐调用方取值的策略函数。
 * 输出：
 *  - 过滤并归一化后的选项数组，每项包含 value/badge/label/description。
 * 流程：
 *  1) 忽略非数组输入以保证调用方异常不会污染 UI。
 *  2) 逐项校验 label，并利用策略函数获取归一化值。
 *  3) 调用 resolveLanguageBadge 生成展示用徽章，过滤无效条目。
 * 错误处理：
 *  - 统一跳过非法项，保证剩余项稳定渲染；徽章解析失败同样过滤该项。
 * 复杂度：O(n)，n 为 options 长度。
 */
export function toNormalizedOptions(options, normalizeValue) {
  if (!Array.isArray(options)) {
    return [];
  }

  return options.map((option) => normalizeOption(option, normalizeValue)).filter(Boolean);
}

/**
 * 意图：根据当前值解析实际展示项，若无匹配则退回首个可用项。
 * 输入：
 *  - normalizedOptions: 已归一化的选项列表。
 *  - resolvedValue: 转换后的当前取值。
 * 输出：
 *  - 可展示的当前选项或 undefined。
 * 流程：
 *  1) 从列表中寻找匹配值。
 *  2) 找不到时返回首个条目作为兜底。
 * 错误处理：
 *  - 传入空数组时直接返回 undefined，交由上层处理。
 * 复杂度：O(n)。
 */
export function resolveCurrentOption(normalizedOptions, resolvedValue) {
  if (!Array.isArray(normalizedOptions) || normalizedOptions.length === 0) {
    return undefined;
  }

  return (
    normalizedOptions.find((option) => option.value === resolvedValue) ||
    normalizedOptions[0]
  );
}

/**
 * 意图：将原始值统一转换为对比使用的字符串大写形式。
 * 输入：
 *  - value: 原始当前值。
 *  - normalizeValue: 归一化策略。
 * 输出：
 *  - 用于匹配的字符串，若无法解析则为 undefined。
 * 流程：
 *  1) 使用策略解析值。
 *  2) 将结果转为大写字符串。
 * 错误处理：undefined 值由上层兜底。
 * 复杂度：O(1)。
 */
export function resolveComparableValue(value, normalizeValue) {
  const normalized = resolveNormalizedValue(value, normalizeValue);
  if (normalized == null) {
    return undefined;
  }
  return String(normalized).toUpperCase();
}
