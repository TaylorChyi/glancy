import { useMemo } from "react";
import BaseModal from "./BaseModal.jsx";
import styles from "./ShortcutsModal.module.css";
import { useLanguage } from "@/context";
import { SettingsSurface } from "@/components";
import { useKeyboardShortcutContext } from "@/context/KeyboardShortcutContext.jsx";
import {
  DEFAULT_SHORTCUTS,
  formatShortcutKeys,
  translateShortcutAction,
} from "@/utils/keyboardShortcuts.js";

function ShortcutsModal({ open, onClose }) {
  const { t } = useLanguage();
  const { shortcuts: shortcutList } = useKeyboardShortcutContext();

  const shortcuts = useMemo(
    () => {
      const resolved = new Map(DEFAULT_SHORTCUTS.map((item) => [item.action, item.keys]));
      (shortcutList ?? []).forEach((item) => {
        resolved.set(item.action, item.keys);
      });
      return Array.from(resolved.entries()).map(([action, keys]) => ({
        action,
        keys: formatShortcutKeys(keys),
        label: translateShortcutAction(t, action),
      }));
    },
    [shortcutList, t],
  );

  return (
    <BaseModal open={open} onClose={onClose} className="modal-content">
      <SettingsSurface
        title={t.shortcutsTitle}
        actions={
          <button
            type="button"
            onClick={onClose}
            className={styles["close-button"]}
          >
            {t.close}
          </button>
        }
      >
        <ul className={styles.list}>
          {shortcuts.map((shortcut) => (
            <li key={shortcut.action} className={styles.item}>
              <div className={styles.keys}>
                {shortcut.keys.map((key) => (
                  <kbd key={`${shortcut.action}-${key}`} className={styles.key}>
                    {key}
                  </kbd>
                ))}
              </div>
              <span className={styles.action}>{shortcut.label}</span>
            </li>
          ))}
        </ul>
      </SettingsSurface>
    </BaseModal>
  );
}

export default ShortcutsModal;
