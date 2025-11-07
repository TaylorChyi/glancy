import { MODIFIER_ORDER, MODIFIER_SET } from "./constants.js";
import { normalizeKeyToken } from "./normalizers.js";

/**
 * 意图：将键盘事件转换为有序的快捷键 token 列表。
 * 输入：event —— 浏览器 KeyboardEvent 或兼容对象。
 * 输出：若捕获成功返回数组（修饰键在前，主键在后），否则返回 null。
 * 流程：
 *  1) 根据事件修饰键依次记录 CONTROL/META/ALT/SHIFT；
 *  2) 规范化主键，过滤空结果或重复修饰键；
 *  3) 返回有序列表。
 * 错误处理：当事件缺失或主键无效时返回 null。
 * 复杂度：O(1)。
 */
export function captureKeysFromEvent(event) {
  if (!event) {
    return null;
  }
  const modifiers = [];
  if (event.ctrlKey) {
    modifiers.push("CONTROL");
  }
  if (event.metaKey) {
    modifiers.push("META");
  }
  if (event.altKey) {
    modifiers.push("ALT");
  }
  if (event.shiftKey) {
    modifiers.push("SHIFT");
  }
  const mainKey = normalizeKeyToken(event.key === " " ? "SPACE" : event.key);
  if (!mainKey || MODIFIER_SET.has(mainKey)) {
    return null;
  }
  const orderedModifiers = MODIFIER_ORDER.filter((modifier) =>
    modifiers.includes(modifier),
  );
  return orderedModifiers.concat(mainKey);
}
