import { useMemo } from "react";
import BaseModal from "./BaseModal.jsx";
import styles from "./ShortcutsModal.module.css";
import { getModifierKey } from "@/utils/device.js";
import { useLanguage } from "@/context";
import { SettingsSurface } from "@/components";

function ShortcutsModal({ open, onClose }) {
  const { t } = useLanguage();
  const mod = getModifierKey();

  const shortcuts = useMemo(
    () => [
      { keys: [mod, "Shift", "F"], action: t.shortcutsFocusSearch },
      { keys: [mod, "Shift", "L"], action: t.shortcutsSwitchLanguage },
      { keys: [mod, "Shift", "M"], action: t.shortcutsToggleTheme },
      { keys: [mod, "Shift", "B"], action: t.shortcutsToggleFavorite },
    ],
    [mod, t],
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
              <span className={styles.action}>{shortcut.action}</span>
            </li>
          ))}
        </ul>
      </SettingsSurface>
    </BaseModal>
  );
}

export default ShortcutsModal;
