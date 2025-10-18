/**
 * 背景：
 *  - 客户端需将服务端返回的个性化快捷键与默认蓝本合并，旧实现圈复杂度偏高。
 * 目的：
 *  - 提供纯函数式合并流程，确保多端一致性并易于单测覆盖。
 * 关键决策与取舍：
 *  - 通过辅助函数拆分 action/keys 归一化，降低主逻辑复杂度；
 *  - 维持 Map 结构以保持覆盖顺序与 O(1) 查询性能。
 * 影响范围：
 *  - Preferences 页面与全局快捷键上下文使用该能力。
 * 演进与TODO：
 *  - 若未来支持多快捷键序列，可在此扩展为数组并保持工厂函数形式。
 */
import { DEFAULT_SHORTCUTS } from "./keyboardShortcutRegistry.js";
import { normalizeKeyToken } from "./keyboardShortcutNormalization.js";

function createShortcutRegistry() {
  return new Map(
    DEFAULT_SHORTCUTS.map((shortcut) => [shortcut.action, { ...shortcut }]),
  );
}

function toActionKey(rawAction) {
  return String(rawAction ?? "").trim().toUpperCase();
}

function deriveKeys(source, fallback) {
  if (!Array.isArray(source)) {
    return fallback;
  }
  const normalized = source.map(normalizeKeyToken).filter(Boolean);
  return normalized.length > 0 ? normalized : fallback;
}

export function mergeShortcutLists(nextShortcuts) {
  const registry = createShortcutRegistry();
  if (!Array.isArray(nextShortcuts)) {
    return Array.from(registry.values());
  }
  for (const shortcut of nextShortcuts) {
    const actionKey = toActionKey(shortcut?.action);
    if (!actionKey) {
      continue;
    }
    const base =
      registry.get(actionKey) ?? {
        action: actionKey,
        keys: [],
        defaultKeys: [],
      };
    const defaultKeys = deriveKeys(shortcut?.defaultKeys, base.defaultKeys);
    const keys = deriveKeys(shortcut?.keys, defaultKeys);
    registry.set(actionKey, {
      action: actionKey,
      keys,
      defaultKeys,
    });
  }
  return Array.from(registry.values());
}
