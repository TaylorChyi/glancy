/**
 * 背景：
 *  - 快捷键需要在多个模块间共享解析、规范化和显示逻辑。
 * 目的：
 *  - 提供统一的工具函数，将事件、字符串与展示层之间的差异抽象掉。
 * 关键决策与取舍：
 *  - 以纯函数返回不可变结果，确保在测试与组件中易于复用；保留 MOD 占位符以兼容跨平台体验。
 * 影响范围：
 *  - Settings 的快捷键编辑、快捷键模态与全局监听均可依赖此工具。
 * 演进与TODO：
 *  - TODO: 若未来支持多按键序列（chord），需扩展为二维数组结构。
 */
import { getModifierKey } from "@/utils/device.js";

const MODIFIER_SET = new Set(["MOD", "CONTROL", "META", "ALT", "SHIFT"]);
const MODIFIER_ORDER = ["MOD", "CONTROL", "META", "ALT", "SHIFT"];

const BLUEPRINT = [
  ["FOCUS_SEARCH", ["MOD", "SHIFT", "F"]],
  ["SWITCH_LANGUAGE", ["MOD", "SHIFT", "L"]],
  ["TOGGLE_THEME", ["MOD", "SHIFT", "M"]],
  ["TOGGLE_FAVORITE", ["MOD", "SHIFT", "B"]],
  ["OPEN_SHORTCUTS", ["MOD", "SHIFT", "K"]],
];

export const DEFAULT_SHORTCUTS = BLUEPRINT.map(([action, keys]) => ({
  action,
  keys: [...keys],
  defaultKeys: [...keys],
}));

const APPLE_PLATFORM = /Mac|iPhone|iPad|iPod/i;

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
  switch (sanitized) {
    case "CMD":
    case "COMMAND":
      return "META";
    case "CTRL":
      return "CONTROL";
    case "OPTION":
      return "ALT";
    case "RETURN":
      return "ENTER";
    case "ESC":
      return "ESCAPE";
    case "SPACEBAR":
      return "SPACE";
    case "ARROWDOWN":
      return "ARROW_DOWN";
    case "ARROWUP":
      return "ARROW_UP";
    case "ARROWLEFT":
      return "ARROW_LEFT";
    case "ARROWRIGHT":
      return "ARROW_RIGHT";
    default:
      if (sanitized === "_") {
        return "";
      }
      if (sanitized === "") {
        return "";
      }
      return sanitized;
  }
}

export function captureKeysFromEvent(event) {
  if (!event) {
    return null;
  }
  const keys = [];
  if (event.ctrlKey) {
    keys.push("CONTROL");
  }
  if (event.metaKey) {
    keys.push("META");
  }
  if (event.altKey) {
    keys.push("ALT");
  }
  if (event.shiftKey) {
    keys.push("SHIFT");
  }
  const mainKey = normalizeKeyToken(event.key === " " ? "SPACE" : event.key);
  if (!mainKey) {
    return null;
  }
  if (MODIFIER_SET.has(mainKey)) {
    return null;
  }
  const ordered = MODIFIER_ORDER.filter((modifier) => keys.includes(modifier)).concat(mainKey);
  return ordered;
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
    return normalized.length === 1 ? normalized.toUpperCase() : normalized.replaceAll("_", " ");
  });
}

function eventMatchesModifier(modifier, event) {
  switch (modifier) {
    case "CONTROL":
      return event.ctrlKey;
    case "META":
      return event.metaKey;
    case "ALT":
      return event.altKey;
    case "SHIFT":
      return event.shiftKey;
    case "MOD":
      return event.ctrlKey || event.metaKey;
    default:
      return false;
  }
}

function eventHasUnwantedModifiers(required, event) {
  const needsCtrl = required.has("CONTROL");
  const needsMeta = required.has("META");
  const needsAlt = required.has("ALT");
  const needsShift = required.has("SHIFT");
  const needsMod = required.has("MOD");
  if (!needsCtrl && !needsMod && event.ctrlKey) return true;
  if (!needsMeta && !needsMod && event.metaKey) return true;
  if (!needsAlt && event.altKey) return true;
  if (!needsShift && event.shiftKey) return true;
  return false;
}

export function doesEventMatchShortcut(bindingKeys, event) {
  if (!bindingKeys || bindingKeys.length === 0 || !event) {
    return false;
  }
  const normalizedKeys = bindingKeys.map(normalizeKeyToken).filter(Boolean);
  const requiredModifiers = new Set(normalizedKeys.filter((key) => MODIFIER_SET.has(key)));
  const mainKey = normalizedKeys.find((key) => !MODIFIER_SET.has(key));
  if (!mainKey) {
    return false;
  }
  if (eventHasUnwantedModifiers(requiredModifiers, event)) {
    return false;
  }
  for (const modifier of requiredModifiers) {
    if (!eventMatchesModifier(modifier, event)) {
      return false;
    }
  }
  const eventKey = normalizeKeyToken(event.key === " " ? "SPACE" : event.key);
  return eventKey === mainKey;
}

export function mergeShortcutLists(nextShortcuts) {
  const registry = new Map(
    DEFAULT_SHORTCUTS.map((shortcut) => [shortcut.action, { ...shortcut }]),
  );
  if (!Array.isArray(nextShortcuts)) {
    return Array.from(registry.values());
  }
  for (const shortcut of nextShortcuts) {
    const actionKey = String(shortcut?.action ?? "").trim().toUpperCase();
    if (!actionKey) {
      continue;
    }
    const base = registry.get(actionKey) ?? {
      action: actionKey,
      keys: [],
      defaultKeys: [],
    };
    const keys = shortcut?.keys?.map(normalizeKeyToken).filter(Boolean) ?? [];
    const defaultKeys =
      shortcut?.defaultKeys?.map(normalizeKeyToken).filter(Boolean) ?? base.defaultKeys;
    registry.set(actionKey, {
      action: actionKey,
      keys: keys.length > 0 ? keys : defaultKeys,
      defaultKeys: defaultKeys.length > 0 ? defaultKeys : base.defaultKeys,
    });
  }
  return Array.from(registry.values());
}

export function translateShortcutAction(t, action) {
  switch (action) {
    case "FOCUS_SEARCH":
      return t?.shortcutsFocusSearch ?? "Focus search input";
    case "SWITCH_LANGUAGE":
      return t?.shortcutsSwitchLanguage ?? "Switch language";
    case "TOGGLE_THEME":
      return t?.shortcutsToggleTheme ?? "Toggle theme";
    case "TOGGLE_FAVORITE":
      return t?.shortcutsToggleFavorite ?? "Toggle favorite";
    case "OPEN_SHORTCUTS":
      return t?.settingsKeyboardOpenPalette ?? "Open shortcut guide";
    default:
      return action;
  }
}
