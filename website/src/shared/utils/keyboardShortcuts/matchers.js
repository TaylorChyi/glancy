import { MODIFIER_SET } from "./constants.js";
import { normalizeKeyToken } from "./normalizers.js";

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
  return [
    !needsCtrl && !needsMod && event.ctrlKey,
    !needsMeta && !needsMod && event.metaKey,
    !needsAlt && event.altKey,
    !needsShift && event.shiftKey,
  ].some(Boolean);
}

/**
 * 意图：判断传入事件是否与快捷键绑定匹配。
 * 输入：
 *  - bindingKeys：快捷键 token 列表；
 *  - event：浏览器 KeyboardEvent 或兼容对象。
 * 输出：布尔值，表示是否匹配。
 * 流程：
 *  1) 规范化绑定键列表并拆分修饰键与主键；
 *  2) 若缺少主键或包含多余修饰键则返回 false；
 *  3) 逐个校验修饰键状态；
 *  4) 校验事件主键是否一致。
 * 错误处理：对不完整输入返回 false。
 * 复杂度：O(n)。
 */
export function doesEventMatchShortcut(bindingKeys, event) {
  if (!bindingKeys || bindingKeys.length === 0 || !event) {
    return false;
  }
  const normalizedKeys = bindingKeys.map(normalizeKeyToken).filter(Boolean);
  const requiredModifiers = new Set(
    normalizedKeys.filter((key) => MODIFIER_SET.has(key)),
  );
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
