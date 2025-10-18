/**
 * 背景：
 *  - 事件捕获逻辑与格式化、匹配等职责混杂，导致维护成本高。
 * 目的：
 *  - 将事件转 token 的流程独立出来，便于单独测试与未来扩展组合键序列。
 * 关键决策与取舍：
 *  - 延续原有修饰键排序策略，通过 MODIFIER_ORDER 保证输出稳定；
 *  - 遇到无效主键时返回 null，交由调用方决定是否吞掉事件。
 * 影响范围：
 *  - 快捷键录入表单、监听器捕获流程。
 * 演进与TODO：
 *  - 若未来支持 chord，可在此返回二维数组并由上层决定序列化策略。
 */

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
