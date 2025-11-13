import { useMemo } from "react";
import {
  DEFAULT_SHORTCUTS,
  formatShortcutKeys,
  translateShortcutAction,
} from "@shared/utils/keyboardShortcuts.js";

function useResolvedShortcuts(shortcutList, translate) {
  return useMemo(() => {
    const resolved = new Map(
      DEFAULT_SHORTCUTS.map((item) => [item.action, item.keys]),
    );

    (shortcutList ?? []).forEach((item) => {
      resolved.set(item.action, item.keys);
    });

    return Array.from(resolved.entries()).map(([action, keys]) => ({
      action,
      keys: formatShortcutKeys(keys),
      label: translateShortcutAction(translate, action),
    }));
  }, [shortcutList, translate]);
}

export default useResolvedShortcuts;
