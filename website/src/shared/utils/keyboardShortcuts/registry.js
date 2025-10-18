/**
 * 背景：
 *  - 快捷键合并逻辑与常量定义混杂，难以扩展自定义策略。
 * 目的：
 *  - 提供可复用的注册中心合并方法，确保默认快捷键与用户配置能够安全合成。
 * 关键决策与取舍：
 *  - 采用 Map 聚合策略保持 O(1) 更新，并延续默认值优先原则；
 *  - 对输入做健壮性处理，避免意外的 null/undefined 破坏结果。
 * 影响范围：
 *  - 偏好设置与全局快捷键加载流程。
 * 演进与TODO：
 *  - 未来可在此加入校验钩子以支持自定义冲突提示。
 */

import { DEFAULT_SHORTCUTS } from "./constants.js";
import { normalizeKeyToken } from "./normalizers.js";

const EMPTY_SHORTCUT = Object.freeze({ action: "", keys: [], defaultKeys: [] });

const normalizeKeys = (keys, fallback) => {
  const normalized = (keys ?? []).map(normalizeKeyToken).filter(Boolean);
  return normalized.length > 0 ? normalized : fallback;
};

const parseActionKey = (rawAction) => String(rawAction ?? "").trim().toUpperCase();

/**
 * 意图：合并外部快捷键列表与默认蓝图。
 * 输入：nextShortcuts —— 外部提供的快捷键数组，可为空。
 * 输出：与默认结构一致的快捷键数组。
 * 流程：
 *  1) 将默认蓝本放入 Map，键为 action；
 *  2) 遍历外部列表并规范化 action 与键位；
 *  3) 以外部配置覆盖默认值，缺省时回退至默认键位；
 *  4) 返回 Map 的 values。
 * 错误处理：遇到非法 action/keys 会跳过该项。
 * 复杂度：O(n)。
 */
export function mergeShortcutLists(nextShortcuts) {
  const registry = new Map(
    DEFAULT_SHORTCUTS.map((shortcut) => [shortcut.action, { ...shortcut }]),
  );
  if (!Array.isArray(nextShortcuts)) {
    return Array.from(registry.values());
  }
  for (const shortcut of nextShortcuts) {
    const actionKey = parseActionKey(shortcut?.action);
    if (!actionKey) {
      continue;
    }
    const base = registry.get(actionKey) ?? { ...EMPTY_SHORTCUT, action: actionKey };
    const keys = normalizeKeys(shortcut?.keys, base.keys);
    const defaultKeys = normalizeKeys(shortcut?.defaultKeys, base.defaultKeys);
    registry.set(actionKey, {
      action: actionKey,
      keys,
      defaultKeys,
    });
  }
  return Array.from(registry.values());
}
