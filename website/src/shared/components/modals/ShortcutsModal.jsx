import BaseModal from "./BaseModal.jsx";
import ShortcutList from "./ShortcutList.jsx";
import styles from "./ShortcutsModal.module.css";
import { useLanguage, useKeyboardShortcutContext } from "@core/context";
import { SettingsSurface } from "@shared/components";
import useResolvedShortcuts from "./useResolvedShortcuts.js";

function ShortcutsModal({ open, onClose }) {
  const { t } = useLanguage();
  const { shortcuts: shortcutList } = useKeyboardShortcutContext();

  const shortcuts = useResolvedShortcuts(shortcutList, t);

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
        <ShortcutList shortcuts={shortcuts} />
      </SettingsSurface>
    </BaseModal>
  );
}

export default ShortcutsModal;
