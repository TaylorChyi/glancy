/**
 * 背景：
 *  - normalizeKeyToken 与格式化逻辑先前集中在单文件导致复杂度与行数超标。
 * 目的：
 *  - 负责快捷键文案归一化与展示格式转换，供其他模块复用。
 * 关键决策与取舍：
 *  - 以映射表维护别名映射，避免冗长 switch；
 *  - 通过纯函数暴露能力，保持易测性与可组合性。
 * 影响范围：
 *  - 被 captureKeysFromEvent、formatShortcutKeys 等调用。
 * 演进与TODO：
 *  - 后续支持多按键序列时，可将映射表升级为读取配置的工厂函数。
 */
import { getModifierKey } from "@shared/utils/device.js";
import { MODIFIER_SET } from "./keyboardShortcutConstants.js";

const APPLE_PLATFORM = /Mac|iPhone|iPad|iPod/i;

const NORMALIZED_KEY_ALIAS_MAP = new Map([
  ["CMD", "META"],
  ["COMMAND", "META"],
  ["CTRL", "CONTROL"],
  ["OPTION", "ALT"],
  ["RETURN", "ENTER"],
  ["ESC", "ESCAPE"],
  ["SPACEBAR", "SPACE"],
  ["ARROWDOWN", "ARROW_DOWN"],
  ["ARROWUP", "ARROW_UP"],
  ["ARROWLEFT", "ARROW_LEFT"],
  ["ARROWRIGHT", "ARROW_RIGHT"],
]);

const INVALID_SANITIZED_TOKENS = new Set(["", "_"]);

function isApple() {
  if (typeof navigator === "undefined") {
    return false;
  }
  const platform = navigator.userAgentData?.platform || navigator.platform || "";
  return APPLE_PLATFORM.test(platform);
}

export function normalizeKeyToken(raw) {
  if (typeof raw !== "string") {
    return "";
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return "";
  }
  const upper = trimmed.replace(/\s+/g, "_").toUpperCase();
  const sanitized = upper.replaceAll(/[^A-Z0-9_]/g, "");
  if (INVALID_SANITIZED_TOKENS.has(sanitized)) {
    return "";
  }
  return NORMALIZED_KEY_ALIAS_MAP.get(sanitized) ?? sanitized;
}

function formatModifier(key) {
  const apple = isApple();
  switch (key) {
    case "CONTROL":
      return apple ? "Control" : "Ctrl";
    case "META":
      return apple ? "Command" : "Win";
    case "ALT":
      return apple ? "Option" : "Alt";
    case "SHIFT":
      return "Shift";
    case "MOD":
      return getModifierKey();
    default:
      return key;
  }
}

export function formatShortcutKeys(keys) {
  return keys.map((key) => {
    const normalized = normalizeKeyToken(key);
    if (normalized === "SPACE") {
      return "Space";
    }
    if (MODIFIER_SET.has(normalized)) {
      return formatModifier(normalized);
    }
    return normalized.length === 1
      ? normalized.toUpperCase()
      : normalized.replaceAll("_", " ");
  });
}
