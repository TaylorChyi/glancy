/**
 * 背景：
 *  - 修饰键与主键的展示逻辑长期耦合在单文件中，难以对不同平台做定制化注入。
 * 目的：
 *  - 以组合方式暴露格式化能力，便于未来扩展不同语言或平台策略。
 * 关键决策与取舍：
 *  - 通过可配置的 detectApplePlatform 与 resolveModifierKey 注入策略，遵循策略模式以支持测试替换；
 *  - 保持输出结构与历史一致，仅在内部完成大小写与文案处理。
 * 影响范围：
 *  - 快捷键模态、提示文案、录入表单的展示效果。
 * 演进与TODO：
 *  - 后续若需支持本地化格式，可在 options 中扩展 labelResolver。
 */

import { getModifierKey } from "@shared/utils/device.js";

import { MODIFIER_SET } from "./constants.js";
import { normalizeKeyToken } from "./normalizers.js";
import { isApplePlatform } from "./platform.js";

const defaultDetectApple = () => isApplePlatform();
const defaultResolveModifierKey = () => getModifierKey();

function formatModifierLabel(token, { applePlatform, resolveModifierKey }) {
  switch (token) {
    case "CONTROL":
      return applePlatform ? "Control" : "Ctrl";
    case "META":
      return applePlatform ? "Command" : "Win";
    case "ALT":
      return applePlatform ? "Option" : "Alt";
    case "SHIFT":
      return "Shift";
    case "MOD":
      return resolveModifierKey();
    default:
      return token;
  }
}

function formatSingleKey(token, context) {
  const normalized = normalizeKeyToken(token);
  if (normalized === "SPACE") {
    return "Space";
  }
  if (MODIFIER_SET.has(normalized)) {
    return formatModifierLabel(normalized, context);
  }
  return normalized.length === 1
    ? normalized.toUpperCase()
    : normalized.replaceAll("_", " ");
}

/**
 * 意图：将快捷键 token 列表格式化为展示文案。
 * 输入：
 *  - keys：原始快捷键 token 列表；
 *  - options.detectApplePlatform：可选，提供平台探测策略，默认读取浏览器信息；
 *  - options.resolveModifierKey：可选，自定义 MOD 键文案来源。
 * 输出：格式化后的字符串数组。
 * 流程：
 *  1) 检测当前平台；
 *  2) 遍历所有 token 并依次格式化；
 *  3) 返回格式化结果。
 * 错误处理：依赖 normalizeKeyToken，自身不抛异常。
 * 复杂度：O(n)。
 */
export function formatShortcutKeys(
  keys,
  {
    detectApplePlatform = defaultDetectApple,
    resolveModifierKey = defaultResolveModifierKey,
  } = {},
) {
  const applePlatform = detectApplePlatform();
  return keys.map((token) =>
    formatSingleKey(token, { applePlatform, resolveModifierKey }),
  );
}
