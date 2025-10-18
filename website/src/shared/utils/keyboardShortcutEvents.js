/**
 * 背景：
 *  - 事件捕获与匹配逻辑与归一化、翻译等职责耦合导致文件臃肿。
 * 目的：
 *  - 将快捷键事件判断拆分为独立模块，统一管理修饰键判定策略。
 * 关键决策与取舍：
 *  - 使用数据驱动表描述事件属性与修饰键的映射，降低圈复杂度；
 *  - 通过纯函数暴露接口，避免持久化副作用，便于测试。
 * 影响范围：
 *  - 被上下文 Provider 及 hooks 调用以判断快捷键触发。
 * 演进与TODO：
 *  - 后续支持多键序列时，可新增状态机式匹配器并在此注入策略。
 */
import { MODIFIER_ORDER, MODIFIER_SET } from "./keyboardShortcutConstants.js";
import { normalizeKeyToken } from "./keyboardShortcutNormalization.js";

const EVENT_MODIFIER_PROJECTIONS = [
  { key: "CONTROL", flag: "ctrlKey", respectsMod: true },
  { key: "META", flag: "metaKey", respectsMod: true },
  { key: "ALT", flag: "altKey", respectsMod: false },
  { key: "SHIFT", flag: "shiftKey", respectsMod: false },
];

const MODIFIER_MATCHERS = new Map([
  ["CONTROL", (event) => Boolean(event?.ctrlKey)],
  ["META", (event) => Boolean(event?.metaKey)],
  ["ALT", (event) => Boolean(event?.altKey)],
  ["SHIFT", (event) => Boolean(event?.shiftKey)],
  ["MOD", (event) => Boolean(event?.ctrlKey || event?.metaKey)],
]);

function eventHasUnwantedModifiers(required, event) {
  const requiresMod = required.has("MOD");
  return EVENT_MODIFIER_PROJECTIONS.some(({ key, flag, respectsMod }) => {
    if (!event?.[flag]) {
      return false;
    }
    if (required.has(key)) {
      return false;
    }
    if (respectsMod && requiresMod) {
      return false;
    }
    return true;
  });
}

function eventMatchesModifier(modifier, event) {
  const matcher = MODIFIER_MATCHERS.get(modifier);
  return matcher ? matcher(event) : false;
}

export function captureKeysFromEvent(event) {
  if (!event) {
    return null;
  }
  const activeModifiers = EVENT_MODIFIER_PROJECTIONS.filter(({ flag }) =>
    Boolean(event[flag]),
  ).map(({ key }) => key);
  const mainKey = normalizeKeyToken(event.key === " " ? "SPACE" : event.key);
  if (!mainKey || MODIFIER_SET.has(mainKey)) {
    return null;
  }
  return MODIFIER_ORDER.filter((modifier) => activeModifiers.includes(modifier)).concat(
    mainKey,
  );
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
